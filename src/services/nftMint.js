import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, create, fetchCollection } from '@metaplex-foundation/mpl-core';
import { mplToolbox, transferSol } from '@metaplex-foundation/mpl-toolbox';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { generateSigner, publicKey as toUmiPublicKey, sol } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { RPC_URL } from '../config/env';
import { explorerUrl } from './solanaConnection';

export class WalletNotReadyError extends Error {}
export class NotCollectionAuthorityError extends Error {}

async function withRetries(fn, { attempts = 4, delayMs = 1500 } = {}) {
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

/**
 * Creator-only fallback mint, used automatically by NFTMarket.jsx for
 * collections that were deployed before the Candy Machine integration
 * (services/candyMachine.js) existed and so never got a real public mint
 * configured. For anything deployed now, mintFromCandyMachinePublic in
 * candyMachine.js is what buyers actually hit.
 *
 * Adding an asset to a Core collection requires the collection's actual
 * on-chain UPDATE AUTHORITY to authorize it, which is why this only works
 * for the wallet that created the collection.
 */
export async function mintFromCollection({ walletProvider, collectionAddress, name, uri, price = 0, treasuryWallet }) {
  if (!walletProvider?.publicKey) {
    throw new WalletNotReadyError('Connect a Solana wallet before minting.');
  }

  const umi = createUmi(RPC_URL)
    .use(mplCore())
    .use(mplToolbox())
    .use(walletAdapterIdentity(walletProvider));

  const collectionPk = toUmiPublicKey(collectionAddress);
  // Retried because reading an account immediately after it (or a related
  // transaction) was written can race ahead of RPC replica propagation.
  const collection = await withRetries(() => fetchCollection(umi, collectionPk));

  if (collection.updateAuthority.toString() !== umi.identity.publicKey.toString()) {
    throw new NotCollectionAuthorityError(
      "This collection has no public mint deployed — only its creator wallet can test-mint it right now."
    );
  }

  const assetSigner = generateSigner(umi);
  let builder = create(umi, {
    asset: assetSigner,
    name,
    uri,
    collection,
  });

  if (price > 0 && treasuryWallet) {
    builder = builder.add(transferSol(umi, { destination: toUmiPublicKey(treasuryWallet), amount: sol(price) }));
  }

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
