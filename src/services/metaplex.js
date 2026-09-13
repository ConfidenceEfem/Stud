import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore, createCollection } from '@metaplex-foundation/mpl-core';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { generateSigner } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { RPC_URL } from '../config/env';
import { saveCollectionConfig } from '../data/collectionConfig';
import { withRetries } from '../utils/retry';
import { uploadFileToIrys, uploadJsonToIrys } from './irysUpload';

export class WalletNotReadyError extends Error {}

export class IrysUploadError extends Error {
  constructor(cause) {
    super(
      `Couldn't upload to Arweave via Irys after retrying. Wait a minute and try deploying again — no funds ` +
        `were lost if your wallet never showed a second approval popup. Original error: ${cause?.message || cause}`
    );
    this.cause = cause;
  }
}

// Builds a fresh Umi instance whose "identity" (the account that signs and
// pays for everything) is the person's actual connected browser wallet —
// not a generated keypair, not a backend hot wallet. Every instruction
// built from this instance will pop a real approval prompt in Phantom/
// Solflare/OKX and, once approved, actually lands on-chain.
function umiWithConnectedWallet(walletProvider) {
  if (!walletProvider?.publicKey) {
    throw new WalletNotReadyError('Connect a Solana wallet (Phantom, Solflare, or OKX) before deploying.');
  }
  return createUmi(RPC_URL).use(mplCore()).use(walletAdapterIdentity(walletProvider));
}

/**
 * Real, on-chain NFT collection deployment using Metaplex Core:
 *  1. Uploads the artwork file to Arweave via Irys (paid for by the
 *     connected wallet, in the currency Irys' node accepts — devnet SOL
 *     from a faucet is enough on devnet). Uses services/irysUpload.js
 *     directly rather than the higher-level umi-uploader-irys plugin —
 *     that plugin batches uploads through a library (PromisePool) that
 *     silently swallows the real error when a single file upload fails,
 *     surfacing only "no usable URI" with the actual cause discarded. The
 *     direct client throws real errors instead.
 *  2. Uploads the collection's JSON metadata (name/description/image) the
 *     same way.
 *  3. Builds + sends a `createCollectionV1` transaction that the wallet
 *     must approve — this is the actual on-chain collection account.
 *
 * Returns the real collection address and transaction signature so the UI
 * can link straight to Solana Explorer.
 */
export async function deployNftCollection({
  walletProvider,
  name,
  description,
  imageFile,
  onProgress,
}) {
  const umi = umiWithConnectedWallet(walletProvider);

  onProgress?.('uploading-image');
  // Devnet's Irys bundler node is noticeably less reliable than mainnet's,
  // so a short retry clears most transient failures without making the
  // person re-approve anything in their wallet.
  let imageUri;
  try {
    imageUri = await withRetries(() => uploadFileToIrys(walletProvider, imageFile), { attempts: 5 });
  } catch (err) {
    throw new IrysUploadError(err);
  }

  onProgress?.('uploading-metadata');
  let metadataUri;
  try {
    metadataUri = await withRetries(
      () =>
        uploadJsonToIrys(walletProvider, {
          name,
          description,
          image: imageUri,
          properties: {
            files: [{ uri: imageUri, type: imageFile.type }],
            category: 'image',
          },
        }),
      { attempts: 5 }
    );
  } catch (err) {
    throw new IrysUploadError(err);
  }

  onProgress?.('awaiting-signature');
  const collectionSigner = generateSigner(umi);

  const tx = createCollection(umi, {
    collection: collectionSigner,
    name,
    uri: metadataUri,
    plugins: [
      {
        // Royalty enforcement plugin — 0% by default; wire a form field to
        // this if you want creator royalties on secondary sales.
        type: 'Royalties',
        basisPoints: 0,
        creators: [{ address: umi.identity.publicKey, percentage: 100 }],
        ruleSet: { type: 'None' },
      },
    ],
  });

  onProgress?.('confirming');
  const { signature } = await tx.sendAndConfirm(umi);

  const collectionAddress = collectionSigner.publicKey.toString();
  const signatureBase58 = bs58.encode(signature);

  return { collectionAddress, imageUri, metadataUri, signature: signatureBase58 };
}

// Records the launch-config fields the app itself controls (mint price,
// eligibility, whitelist, timing) against the now-real on-chain collection
// address, so the marketplace/discover pages can display them alongside
// the live on-chain minted/supply counts.
export async function recordCollectionLaunch(collectionAddress, launchConfig) {
  return saveCollectionConfig(collectionAddress, launchConfig);
}
