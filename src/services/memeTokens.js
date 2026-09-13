import * as dexscreener from './dexscreener';
import { formatUsd } from './birdeye';
import { listAllTokenLaunchConfigs } from '../data/tokenLaunchConfig';
import { getPoolReserves } from './tokenSwap';
import { FEATURED_MEME_TOKENS } from '../config/env';
import { memeLaunches as MOCK_MEMES } from '../data/mockData';

// Real market data for every SPL token this app knows about: whatever the
// operator listed in VITE_FEATURED_MEME_TOKENS, PLUS anything anyone has
// launched through this app — no env var editing required. Two possible
// real sources, checked in order per token:
//   1. This app's own devnet liquidity pool (services/tokenSwap.js) — if
//      one exists, price/liquidity are computed directly from its live
//      on-chain reserves. DexScreener will never see this pool; it only
//      indexes Raydium/Orca/Meteora-style mainnet-focused programs.
//   2. DexScreener — for tokens with a real pool on an aggregator-indexed
//      DEX (mainnet, or a well-known devnet pair).
export async function loadMemeTokens() {
  const configs = await listAllTokenLaunchConfigs();
  const addresses = [...new Set([...FEATURED_MEME_TOKENS, ...Object.keys(configs)])];

  if (!addresses.length) return { data: MOCK_MEMES, live: false };

  try {
    const [pairsByToken, poolResults] = await Promise.all([
      dexscreener.fetchTokensByAddress(addresses).catch(() => ({})),
      Promise.allSettled(addresses.map((a) => getPoolReserves(a))),
    ]);
    const poolsByToken = {};
    addresses.forEach((a, i) => {
      const r = poolResults[i];
      if (r.status === 'fulfilled' && r.value) poolsByToken[a] = r.value;
    });

    const data = addresses.map((address) =>
      mapToken(address, pairsByToken[address], poolsByToken[address], configs[address] || {})
    );
    return { data, live: true };
  } catch (err) {
    console.warn('[memeTokens] live fetch failed, falling back to demo data:', err.message);
    return { data: MOCK_MEMES, live: false };
  }
}

function mapToken(address, pair, pool, config) {
  // Own devnet pool takes priority — it's the more precise, directly-read
  // source when it exists, and it's the only source at all for a pool
  // that no aggregator indexes.
  if (pool) {
    const mcap = config.supply ? pool.price * Number(config.supply) : null;
    return {
      id: address,
      ticker: config.ticker || 'TOKEN',
      name: config.name || 'Unnamed token',
      image: config.image || '',
      creator: config.creator || null,
      decimals: config.decimals || 6,
      rawSupply: config.supply || 0,
      price: pool.price,
      priceUnit: 'SOL', // this price is denominated in SOL, not USD — devnet SOL has no real USD value
      mcap: mcap != null ? `${mcap.toFixed(4)} ◎` : '—',
      liquidity: `${pool.solReserve.toFixed(3)} ◎ / ${pool.tokenReserve.toLocaleString()} ${config.ticker || ''}`,
      fdv: mcap != null ? `${mcap.toFixed(4)} ◎` : '—',
      supply: config.supply ? Number(config.supply).toLocaleString() : '—',
      change: 0,
      progress: 100,
      status: 'graduated',
      hasOwnPool: true,
    };
  }

  if (!pair) {
    // Launched but no liquidity pool anywhere yet — still "bonding" in the
    // UI. Expected and correct until someone (usually the creator) seeds
    // one — see the "Seed liquidity" flow.
    return {
      id: address,
      ticker: config.ticker || 'TOKEN',
      name: config.name || 'Unnamed token',
      image: config.image || '',
      creator: config.creator || null,
      decimals: config.decimals || 6,
      rawSupply: config.supply || 0,
      price: 0,
      mcap: '—',
      liquidity: '$0',
      fdv: '—',
      supply: config.supply ? Number(config.supply).toLocaleString() : '—',
      change: 0,
      progress: 0,
      status: 'bonding',
    };
  }

  return {
    id: address,
    ticker: pair.baseToken?.symbol || config.ticker || 'TOKEN',
    name: pair.baseToken?.name || config.name || 'Unnamed token',
    image: pair.info?.imageUrl || config.image || '',
    creator: config.creator || null,
      decimals: config.decimals || 6,
      rawSupply: config.supply || 0,
    price: Number(pair.priceUsd) || 0,
    mcap: formatUsd(pair.marketCap),
    liquidity: formatUsd(pair.liquidity?.usd),
    fdv: formatUsd(pair.fdv),
    supply: config.supply ? Number(config.supply).toLocaleString() : '—',
    change: pair.priceChange?.h24 ?? 0,
    progress: 100,
    status: 'graduated',
    dexUrl: pair.url,
  };
}
