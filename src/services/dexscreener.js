import { fetchJson } from './http';
import { formatUsd } from './birdeye';

const BASE = 'https://api.dexscreener.com';

// DexScreener needs no API key, which makes it the default fallback when
// VITE_BIRDEYE_API_KEY isn't set. It has no generic "trending Solana"
// endpoint, so we use the boosted-tokens feed (projects that paid to be
// promoted) as a reasonable "what's hot right now" proxy, then hydrate
// each with real pair data (price/volume/mcap/liquidity).
export async function fetchTrendingTokens(limit = 20) {
  const boosts = await fetchJson(`${BASE}/token-boosts/top/v1`);
  const solanaBoosts = (Array.isArray(boosts) ? boosts : []).filter((b) => b.chainId === 'solana');

  const addresses = [...new Set(solanaBoosts.map((b) => b.tokenAddress))].slice(0, limit);
  if (!addresses.length) return [];

  const pairsByToken = await fetchPairsForTokens(addresses);

  return addresses
    .map((addr, i) => {
      const pair = pairsByToken[addr];
      if (!pair) return null;
      return {
        rank: i + 1,
        ticker: pair.baseToken?.symbol,
        name: pair.baseToken?.name,
        address: addr,
        price: Number(pair.priceUsd) || 0,
        change: pair.priceChange?.h24 ?? 0,
        volume: formatUsd(pair.volume?.h24),
        mcap: formatUsd(pair.marketCap ?? pair.fdv),
        logo: pair.info?.imageUrl,
      };
    })
    .filter(Boolean);
}

// Fetch live market data for a specific list of SPL token mint addresses —
// used to hydrate the Meme Marketplace with real price/mcap/liquidity/FDV
// for tokens the app operator wants to feature (VITE_FEATURED_MEME_TOKENS).
export async function fetchTokensByAddress(addresses) {
  if (!addresses.length) return {};
  return fetchPairsForTokens(addresses);
}

async function fetchPairsForTokens(addresses) {
  // DexScreener allows up to 30 comma-separated addresses per call.
  const chunks = [];
  for (let i = 0; i < addresses.length; i += 30) chunks.push(addresses.slice(i, i + 30));

  const result = {};
  for (const chunk of chunks) {
    const json = await fetchJson(`${BASE}/latest/dex/tokens/${chunk.join(',')}`);
    const pairs = json?.pairs || [];
    for (const addr of chunk) {
      // Prefer the highest-liquidity pair for each token (most representative price).
      const candidates = pairs.filter((p) => p.baseToken?.address === addr);
      candidates.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      if (candidates[0]) result[addr] = candidates[0];
    }
  }
  return result;
}
