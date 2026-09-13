import { fetchJson } from './http';
import { BIRDEYE_API_KEY } from '../config/env';

const BASE = 'https://public-api.birdeye.so';

const headers = () => ({
  'X-API-KEY': BIRDEYE_API_KEY,
  'x-chain': 'solana',
  accept: 'application/json',
});

// Birdeye's trending endpoint returns rank, price, 24h change/volume and
// mcap directly — this is the richest single call for the Trending page.
// Docs: https://docs.birdeye.so/reference/get_defi-token-trending
export async function fetchTrendingTokens(limit = 20) {
  const url = `${BASE}/defi/token_trending?sort_by=rank&sort_type=asc&offset=0&limit=${limit}`;
  const json = await fetchJson(url, { headers: headers() });
  const tokens = json?.data?.tokens || [];
  return tokens.map((t, i) => ({
    rank: i + 1,
    ticker: t.symbol,
    name: t.name,
    address: t.address,
    price: t.price ?? 0,
    change: t.price24hChangePercent ?? 0,
    volume: formatUsd(t.volume24hUSD),
    mcap: formatUsd(t.marketcap ?? t.liquidity),
    logo: t.logoURI,
  }));
}

// Per-token overview (used for meme-market cards when we have specific
// mint addresses to feature). Docs: /defi/token_overview
export async function fetchTokenOverview(mintAddress) {
  const url = `${BASE}/defi/token_overview?address=${mintAddress}`;
  const json = await fetchJson(url, { headers: headers() });
  return json?.data ?? null;
}

function formatUsd(n) {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export { formatUsd };
