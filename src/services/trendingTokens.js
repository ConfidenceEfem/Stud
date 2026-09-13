import * as birdeye from './birdeye';
import * as dexscreener from './dexscreener';
import { HAS_BIRDEYE } from '../config/env';
import { trendingTokens as MOCK_TRENDING } from '../data/mockData';

// Several parts of the app want trending tokens at once — the ticker rail
// (visible on every page), Discover, and the Trending page itself — each
// polling independently. Without sharing, a single page load can fire 2-3
// simultaneous requests to Birdeye's free-tier rate limit instead of one.
// This cache + in-flight de-dupe means every caller within CACHE_MS of
// each other shares one real network request and one result.
const CACHE_MS = 20000;
let cache = null; // { limit, result, fetchedAt }
let inFlight = null; // { limit, promise }

async function fetchFresh(limit) {
  if (HAS_BIRDEYE) {
    try {
      const data = await birdeye.fetchTrendingTokens(limit);
      if (data.length) return { data, source: 'birdeye', live: true };
    } catch (err) {
      console.warn('[trendingTokens] Birdeye failed, falling back to DexScreener:', err.message);
    }
  }

  try {
    const data = await dexscreener.fetchTrendingTokens(limit);
    if (data.length) return { data, source: 'dexscreener', live: true };
  } catch (err) {
    console.warn('[trendingTokens] DexScreener failed, falling back to demo data:', err.message);
  }

  return { data: MOCK_TRENDING, source: 'demo', live: false };
}

// Tries Birdeye first (if a key is configured — richer data, proper
// trending ranking), falls back to DexScreener (keyless, boosted-tokens
// proxy), and only falls back to bundled mock data if both fail (offline,
// rate-limited, etc) so the page never renders empty.
export async function loadTrendingTokens(limit = 20) {
  const now = Date.now();

  if (cache && cache.limit === limit && now - cache.fetchedAt < CACHE_MS) {
    return cache.result;
  }
  if (inFlight && inFlight.limit === limit) {
    return inFlight.promise;
  }

  const promise = fetchFresh(limit).then((result) => {
    cache = { limit, result, fetchedAt: Date.now() };
    inFlight = null;
    return result;
  }).catch((err) => {
    inFlight = null;
    throw err;
  });

  inFlight = { limit, promise };
  return promise;
}

