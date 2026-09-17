import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCore } from '@metaplex-foundation/mpl-core';
import { RPC_URL, NETWORK } from '../config/env';

// One shared web3.js Connection for plain reads/writes (balances, sending
// raw transactions for the SPL token launch flow).
export const connection = new Connection(RPC_URL, 'confirmed');

// One shared Umi instance (Metaplex's newer SDK) for NFT collection minting
// via mpl-core, which is a single-account, low-rent-cost NFT standard —
// no separate Token Metadata + Master Edition accounts needed like the
// legacy standard, which keeps devnet testing cheap and fast.
export const umi = createUmi(RPC_URL).use(mplCore());

export const explorerUrl = (signatureOrAddress, kind = 'tx') => {
  const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
  return `https://explorer.solana.com/${kind}/${signatureOrAddress}${cluster}`;
};

export { NETWORK };

// Real balance check against the same RPC this app actually uses to send
// transactions — used as a preflight before deploy/mint/launch, and to
// help diagnose the classic "wallet says insufficient balance but I just
// used the faucet" problem: that almost always means the wallet extension
// itself is set to a different cluster (usually mainnet) than this app
// (VITE_SOLANA_NETWORK, default devnet). Wallets show/check balance against
// whatever network *they're* connected to, independent of what network our
// own RPC calls target.
export async function getSolBalance(publicKeyString) {
  const lamports = await connection.getBalance(new PublicKey(publicKeyString));
  return lamports / 1e9;
}
