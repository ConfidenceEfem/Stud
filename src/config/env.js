// Central place to read runtime configuration from Vite env vars.
// Copy `.env.example` to `.env.local`, fill in your own keys, and restart
// the dev server — Vite only reads `import.meta.env` at boot.
//
// Nothing here is secret-sensitive in the "server secret" sense: these are
// all client-side, publicly-readable-in-the-bundle keys (Birdeye/Helius free
// & pro tiers are designed to be used from a browser with domain restrictions
// turned on in their dashboards). Don't put anything here that would be bad
// to leak, and don't paste a private key into an env var — ever.

const env = import.meta.env;

export const NETWORK = env.VITE_SOLANA_NETWORK || 'devnet'; // 'devnet' | 'mainnet-beta'

export const HELIUS_API_KEY = env.VITE_HELIUS_API_KEY || '';
export const BIRDEYE_API_KEY = env.VITE_BIRDEYE_API_KEY || '';

// Helius gives you one RPC URL that works for both plain JSON-RPC calls
// (getBalance, sendTransaction, etc.) *and* the DAS API (getAssetsByOwner,
// getAssetsByGroup) — same endpoint, different method names.
export const RPC_URL =
  env.VITE_SOLANA_RPC_URL ||
  (HELIUS_API_KEY
    ? `https://${NETWORK === 'mainnet-beta' ? 'mainnet' : 'devnet'}.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : NETWORK === 'mainnet-beta'
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com');

// Comma-separated list of on-chain NFT collection mint/group addresses to
// show real data for on the NFT marketplace page. You normally don't need
// to touch this: anything deployed through this app is discovered
// automatically (locally always, and shared across devices/browsers if
// Supabase is configured below). Use this only to feature a collection you
// didn't deploy yourself.
export const FEATURED_NFT_COLLECTIONS = (env.VITE_FEATURED_NFT_COLLECTIONS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Same idea, for meme tokens — you normally don't need to touch this.
export const FEATURED_MEME_TOKENS = (env.VITE_FEATURED_MEME_TOKENS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const HAS_HELIUS = Boolean(HELIUS_API_KEY);
export const HAS_BIRDEYE = Boolean(BIRDEYE_API_KEY);

// Optional shared backend for "everyone sees everyone's deploys/launches"
// behavior. Without this, launch data (price, whitelist, which collection
// has which Candy Machine, etc) only lives in the deploying browser's
// localStorage — real on one device, invisible everywhere else. With a
// free Supabase project (2 minutes to set up, see README), every deploy/
// launch is written to a shared table instead, so the marketplace pages
// populate for anyone, automatically, with no env var editing required.
export const SUPABASE_URL = env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || '';
export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
