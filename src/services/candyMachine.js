import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, fetchCollection } from '@metaplex-foundation/mpl-core';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import {
  mplCandyMachine,
  create as createCandyMachineAndGuard,
  mintV1,
  route,
  fetchCandyMachine,
  fetchCandyGuard,
  getMerkleRoot,
  getMerkleProof,
} from '@metaplex-foundation/mpl-core-candy-machine';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { generateSigner, publicKey as toUmiPublicKey, sol, isSome, unwrapOption } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { RPC_URL } from '../config/env';
import { explorerUrl } from './solanaConnection';
import { saveCollectionConfig, getCollectionConfig } from '../data/collectionConfig';

export class WalletNotReadyError extends Error {}
export class NotCollectionAuthorityError extends Error {}
export class NoPublicMintError extends Error {}
export class NotEligibleError extends Error {}

function umiWithCandyMachine(walletProvider) {
  if (!walletProvider?.publicKey) throw new WalletNotReadyError('Connect a Solana wallet first.');
  return createUmi(RPC_URL)
    .use(mplCore())
    .use(mplToolbox())
    .use(mplCandyMachine())
    .use(walletAdapterIdentity(walletProvider));
}

async function sha256Bytes(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest);
}

/**
 * Deploys a real Candy Machine + Candy Guard for an existing Core
 * collection, mapped straight from the price/timing/eligibility/whitelist
 * fields already collected in the Create flow. This is the piece that
 * makes minting genuinely *public*: once deployed, any wallet — not just
 * the creator — can mint against these guards, and the rules (price,
 * start/end time, per-wallet limit, allowlist membership) are enforced
 * on-chain by Metaplex's audited Candy Guard program, not by this app.
 *
 * Stated plainly, one real limitation of this implementation: which Candy
 * Machine belongs to which collection — and the raw allowlist address
 * list needed to build a merkle proof — are recorded in this browser's
 * localStorage, not a shared backend. The on-chain guard enforcement
 * (price/timing/limit/allowlist-root) is fully real and checkable by
 * anyone regardless of that; what's missing for full cross-device
 * discovery is a small shared index (or even a public JSON file per
 * collection) so a buyer on a different device/browser can find the
 * Candy Machine address and, for allowlist drops, the address list to
 * prove membership against. See README for the recommended next step.
 */
async function withRetries(fn, { attempts = 5, delayMs = 1500 } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

export async function deployCandyMachine({
  walletProvider,
  collectionAddress,
  name,
  sharedMetadataUri,
  itemsAvailable,
  priceSol = 0,
  treasuryWallet,
  startTime,
  endTime,
  maxPerWallet = 0,
  whitelist = [],
  onProgress,
}) {
  const umi = umiWithCandyMachine(walletProvider);
  const collectionPk = toUmiPublicKey(collectionAddress);

  onProgress?.('checking-authority');
  // Right after creating a collection, reading it straight back can race
  // ahead of RPC replica propagation — a load-balanced provider's next
  // read can land on a node that hasn't seen the write yet. A short retry
  // clears this almost immediately; it's not a sign anything actually
  // failed on-chain.
  const collection = await withRetries(() => fetchCollection(umi, collectionPk), { attempts: 6, delayMs: 1500 });
  if (collection.updateAuthority.toString() !== umi.identity.publicKey.toString()) {
    throw new NotCollectionAuthorityError("Only this collection's creator wallet can deploy its public mint.");
  }

  onProgress?.('configuring-guards');
  const guards = {};
  if (priceSol > 0 && treasuryWallet) {
    guards.solPayment = { destination: toUmiPublicKey(treasuryWallet), lamports: sol(priceSol) };
  }
  if (startTime) guards.startDate = { date: new Date(startTime) };
  if (endTime) guards.endDate = { date: new Date(endTime) };
  if (maxPerWallet > 0) guards.mintLimit = { id: 1, limit: maxPerWallet };

  let merkleRootBytes = null;
  if (whitelist.length) {
    merkleRootBytes = getMerkleRoot(whitelist);
    guards.allowList = { merkleRoot: merkleRootBytes };
  }

  const candyMachineSigner = generateSigner(umi);
  const hash = await sha256Bytes(sharedMetadataUri);
  // Candy Guard names have a short on-chain length cap — keep the prefix
  // safely under it. "$ID+1$" is Metaplex's built-in placeholder for a
  // sequential 1-based mint number, substituted automatically at mint time.
  const namePrefix = `${name.slice(0, 20)} #$ID+1$`;

  onProgress?.('awaiting-signature');
  const builder = await createCandyMachineAndGuard(umi, {
    candyMachine: candyMachineSigner,
    collection: collectionPk,
    collectionUpdateAuthority: umi.identity,
    itemsAvailable,
    isMutable: true,
    hiddenSettings: { name: namePrefix, uri: sharedMetadataUri, hash },
    guards,
    groups: [],
  });

  onProgress?.('confirming');
  const { signature } = await builder.sendAndConfirm(umi);

  const candyMachineAddress = candyMachineSigner.publicKey.toString();
  await saveCollectionConfig(collectionAddress, {
    candyMachineAddress,
    whitelist,
    maxPerWallet,
  });

  return {
    candyMachineAddress,
    signature: bs58.encode(signature),
    explorerCandyMachineUrl: explorerUrl(candyMachineAddress, 'address'),
    explorerTxUrl: explorerUrl(bs58.encode(signature), 'tx'),
  };
}

/**
 * Real public mint: any connected wallet calls this, guard rules are
 * fetched live from chain (not trusted from local config), and Metaplex's
 * Candy Guard program is what actually rejects an ineligible mint — this
 * app just assembles the right accounts/args for whichever guards are on.
 */
export async function mintFromCandyMachinePublic({ walletProvider, collectionAddress, onProgress }) {
  const umi = umiWithCandyMachine(walletProvider);
  const config = (await getCollectionConfig(collectionAddress)) || {};

  if (!config.candyMachineAddress) {
    throw new NoPublicMintError(
      "No public mint has been deployed for this collection yet — it can only be test-minted by its creator right now."
    );
  }

  onProgress?.('checking-eligibility');
  const candyMachinePk = toUmiPublicKey(config.candyMachineAddress);
  const candyMachine = await fetchCandyMachine(umi, candyMachinePk);
  const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);
  const guards = candyGuard.guards;

  const mintArgs = {};

  if (isSome(guards.allowList)) {
    const buyer = umi.identity.publicKey.toString();
    if (!config.whitelist?.length) {
      throw new NotEligibleError(
        "This drop is allowlist-only and the address list isn't available from this browser — mint from the same " +
        'device/browser the creator used, or ask them to publish the allowlist somewhere shared.'
      );
    }
    if (!config.whitelist.includes(buyer)) {
      throw new NotEligibleError('Your wallet address is not on this collection\'s allowlist.');
    }
    onProgress?.('submitting-allowlist-proof');
    const merkleRoot = unwrapOption(guards.allowList).merkleRoot;
    const merkleProof = getMerkleProof(config.whitelist, buyer);
    await route(umi, {
      candyMachine: candyMachinePk,
      guard: 'allowList',
      routeArgs: { path: 'proof', merkleRoot, merkleProof },
    }).sendAndConfirm(umi);
    mintArgs.allowList = { merkleRoot };
  }

  if (isSome(guards.solPayment)) {
    mintArgs.solPayment = { destination: unwrapOption(guards.solPayment).destination };
  }
  if (isSome(guards.mintLimit)) {
    mintArgs.mintLimit = { id: unwrapOption(guards.mintLimit).id };
  }

  onProgress?.('awaiting-signature');
  const assetSigner = generateSigner(umi);
  const builder = mintV1(umi, {
    candyMachine: candyMachinePk,
    collection: toUmiPublicKey(collectionAddress),
    asset: assetSigner,
    mintArgs,
  });

  onProgress?.('confirming');
  const { signature } = await builder.sendAndConfirm(umi);
  const assetAddress = assetSigner.publicKey.toString();
  const signatureBase58 = bs58.encode(signature);

  return {
    assetAddress,
    signature: signatureBase58,
    explorerAssetUrl: explorerUrl(assetAddress, 'address'),
    explorerTxUrl: explorerUrl(signatureBase58, 'tx'),
  };
}
