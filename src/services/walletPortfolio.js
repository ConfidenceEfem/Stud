import { getAssetsByOwner, getRecentActivity } from './helius';
import { HAS_HELIUS } from '../config/env';

export class MissingApiKeyError extends Error {}

// Real wallet holdings for the Profile page: what NFTs and tokens does
// this connected wallet actually own, right now, on-chain.
export async function loadWalletPortfolio(ownerAddress) {
  if (!HAS_HELIUS) {
    throw new MissingApiKeyError('Set VITE_HELIUS_API_KEY in .env.local to load real wallet holdings.');
  }
  const [{ nfts, tokens, nativeBalanceLamports, total }, activity] = await Promise.all([
    getAssetsByOwner(ownerAddress, { limit: 100 }),
    getRecentActivity(ownerAddress, 10).catch(() => []),
  ]);
  return {
    nfts,
    tokens,
    activity,
    solBalance: nativeBalanceLamports / 1e9,
    total,
  };
}
