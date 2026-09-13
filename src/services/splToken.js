import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplToolbox, createMintWithAssociatedToken, setAuthority, AuthorityType } from '@metaplex-foundation/mpl-toolbox';
import { createMetadataAccountV3, createMplTokenMetadataProgram } from '@metaplex-foundation/mpl-token-metadata';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { generateSigner } from '@metaplex-foundation/umi';
import bs58 from 'bs58';
import { RPC_URL } from '../config/env';
import { explorerUrl } from './solanaConnection';
import { saveTokenLaunchConfig } from '../data/tokenLaunchConfig';
import { withRetries } from '../utils/retry';
import { uploadFileToIrys, uploadJsonToIrys } from './irysUpload';

export class WalletNotReadyError extends Error {}

function umiForToken(walletProvider) {
  if (!walletProvider?.publicKey) {
    throw new WalletNotReadyError('Connect a Solana wallet (Phantom, Solflare, or OKX) before launching.');
  }
  const umi = createUmi(RPC_URL).use(mplToolbox()).use(walletAdapterIdentity(walletProvider));
  // mpl-token-metadata has no mplTokenMetadata() plugin the way mpl-core
  // does — it has to be registered manually, or createMetadataAccountV3
  // throws "program not recognized" the moment it's called, which was
  // silently killing the whole launch (not just the image) before this.
  umi.programs.add(createMplTokenMetadataProgram());
  return umi;
}

/**
 * Real Tier 3 (simple path): creates an actual SPL token mint with a fixed
 * supply, minted entirely to the creator's wallet, then revokes both mint
 * and freeze authority so the supply can never change — no custom program,
 * just composing the standard Token Program the way every fixed-supply SPL
 * token on Solana is created.
 *
 * Also uploads the creator's image + a small JSON metadata file to Arweave
 * (via services/irysUpload.js — a direct Irys client, not the higher-level
 * umi-uploader-irys plugin, which batches uploads through a library that
 * silently swallows the real error when a single file fails) and attaches
 * a real on-chain Token Metadata account to the mint. That's what lets
 * wallets, Solana Explorer, and DEX aggregators actually show a name/
 * symbol/logo for the token — a bare SPL mint has none of that on its own.
 *
 * This does NOT create a bonding curve or a DEX liquidity pool — see
 * docs/tier3-liquidity.md for why that's intentionally left as a manual
 * next step rather than shipped as unverified code.
 */
export async function createFixedSupplyToken({ walletProvider, name, ticker, decimals = 6, supply, imageFile, onProgress }) {
  const umi = umiForToken(walletProvider);
  const mintSigner = generateSigner(umi);
  const totalUnits = BigInt(Math.round(Number(supply))) * BigInt(10 ** decimals);

  let metadataUri = '';
  let imageUri = '';
  if (imageFile) {
    onProgress?.('uploading-image');
    try {
      imageUri = await withRetries(() => uploadFileToIrys(walletProvider, imageFile), { attempts: 5 });
    } catch (err) {
      throw new Error(
        `Couldn't upload the token image to Arweave after retrying. Wait a minute and try again. ` +
        `Original error: ${err?.message || err}`
      );
    }

    onProgress?.('uploading-metadata');
    try {
      metadataUri = await withRetries(
        () =>
          uploadJsonToIrys(walletProvider, {
            name,
            symbol: ticker,
            description: `${name} ($${ticker})`,
            image: imageUri,
          }),
        { attempts: 5 }
      );
    } catch (err) {
      throw new Error(`Couldn't upload token metadata after retrying. Original error: ${err?.message || err}`);
    }
  }

  onProgress?.('awaiting-signature');
  let builder = createMintWithAssociatedToken(umi, {
    mint: mintSigner,
    decimals,
    amount: totalUnits,
    owner: umi.identity.publicKey,
  });

  if (metadataUri) {
    builder = builder.add(
      createMetadataAccountV3(umi, {
        mint: mintSigner.publicKey,
        mintAuthority: umi.identity,
        data: {
          name,
          symbol: ticker.slice(0, 10),
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      })
    );
  }

  // Fixed supply means fixed — lock out any future minting or freezing by
  // handing both authorities to null in the same atomic transaction.
  builder = builder
    .add(setAuthority(umi, { owned: mintSigner.publicKey, owner: umi.identity, authorityType: AuthorityType.MintTokens, newAuthority: null }))
    .add(setAuthority(umi, { owned: mintSigner.publicKey, owner: umi.identity, authorityType: AuthorityType.FreezeAccount, newAuthority: null }));

  onProgress?.('confirming');
  const { signature } = await builder.sendAndConfirm(umi);

  const mintAddress = mintSigner.publicKey.toString();
  const signatureBase58 = bs58.encode(signature);

  await saveTokenLaunchConfig(mintAddress, {
    name,
    ticker,
    decimals,
    supply: Number(supply),
    image: imageUri,
    creator: umi.identity.publicKey.toString(),
  });

  return {
    mintAddress,
    signature: signatureBase58,
    explorerTokenUrl: explorerUrl(mintAddress, 'address'),
    explorerTxUrl: explorerUrl(signatureBase58, 'tx'),
  };
}
