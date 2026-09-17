# Solana Launchpad

An NFT + meme-token marketplace on Solana: create/mint your own NFT
collections (timed, whitelisted drops) and launch your own meme tokens,
with a live trending-tokens board and wallet profile.

## Status: what's real vs. demo, by tier

**Tier 1 — real reads, no wallet signing required**
- Trending Tokens page, ticker rail, Discover — real market data from
  Birdeye (if you add a key) or DexScreener (works with no key at all).
- Profile page — real wallet holdings (NFTs, tokens, SOL balance, recent
  activity) via Helius's DAS + Enhanced Transactions APIs.
- NFT & Meme marketplaces — real on-chain collection/token data for
  whatever addresses you feature (see `.env.example`).
- Falls back to bundled demo data automatically if a key is missing or a
  fetch fails, with a "Live / Demo data" badge so it's never ambiguous.

**Tier 2 — real NFT minting, now with real public minting**
- "Deploy mint contract" on the Create page does two real, on-chain things
  in sequence: (1) creates a Metaplex Core collection (artwork + metadata
  uploaded to Arweave via Irys), and (2) deploys a Metaplex **Candy
  Machine + Candy Guard** configured from the same price/timing/
  eligibility/whitelist/max-per-wallet fields already in that form.
- That second part is what makes minting genuinely public: any connected
  wallet — not just the creator — can mint from the NFT Marketplace page,
  and price, timing, per-wallet limits, and allowlist membership are
  enforced on-chain by Metaplex's audited Candy Guard program, not by this
  app's own code.
- One real limitation, stated plainly: which Candy Machine belongs to
  which collection, and (for allowlist drops) the raw wallet address list
  needed to build a merkle proof, are recorded locally by default — see
  "Shared discovery across devices" below for making this work everywhere,
  not just the browser that deployed it. The on-chain guard enforcement
  itself is fully real either way.
- Collections deployed before this Candy Machine integration existed fall
  back to a creator-only test-mint (only the connected wallet that IS the
  collection's on-chain update authority can mint) — the app tells you
  clearly which mode you're in.

**Tier 3 — real meme token launch, with a real devnet market**
- "Launch" on the Launch page creates a real, fixed-supply SPL token:
  mints the full supply to your wallet, then revokes mint + freeze
  authority in the same transaction so the supply can never change.
- On the Meme Marketplace, the token's creator can seed a real liquidity
  pool for it using the SPL Token Swap program (`services/tokenSwap.js`)
  — a real constant-product AMM that's actually deployed on devnet,
  unlike Raydium/Orca/Jupiter. Once seeded, any connected wallet can buy
  the token with devnet SOL against that pool, with price/liquidity read
  directly from its on-chain reserves.
- Seeding a Raydium (mainnet) liquidity pool is **not** automated — see
  [`docs/tier3-liquidity.md`](./docs/tier3-liquidity.md) for exactly why
  (it moves real money with no safe devnet test path) and what to do next
  when you're ready to move this from devnet to a real market.

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

- `VITE_HELIUS_API_KEY` — free tier at https://dev.helius.xyz. Powers the
  Profile page and all on-chain reads/writes. Without this, wallet
  holdings won't load (you'll see a clear message telling you why).
- `VITE_BIRDEYE_API_KEY` — optional, https://bds.birdeye.so. Without it,
  Trending Tokens automatically falls back to DexScreener (no key needed).
- `VITE_SOLANA_NETWORK` — `devnet` while testing (default), `mainnet-beta`
  when you're ready.
- `VITE_FEATURED_NFT_COLLECTIONS` / `VITE_FEATURED_MEME_TOKENS` — you
  normally don't need these. Anything deployed/launched through the app is
  discovered automatically (see below). Only set these to feature
  something you didn't deploy yourself.

### Shared discovery across devices (recommended)

By default, "who deployed what" is recorded in the deploying browser's
localStorage. That means a deploy shows up on the marketplace automatically
for that same browser — no env var editing needed — but not for anyone
else, on another device or browser, until you add a free Supabase project:

1. Create a project at https://supabase.com (free tier is plenty).
2. Dashboard → SQL Editor → paste and run
   [`docs/supabase-schema.sql`](./docs/supabase-schema.sql).
3. Dashboard → Project Settings → API → copy the Project URL and the
   `anon` `public` key into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart `npm run dev`.

Once that's set, every deploy/launch writes to a shared table instead of
just localStorage, so the marketplace populates for *anyone* using the
app — that's what makes it "interact everywhere" rather than
per-browser. The schema file has a security note worth reading: this
table is intentionally open to public reads/writes (no backend of its own
to gate it), which is fine for a demo/hackathon app but should get a real
verification layer (a serverless function that checks the on-chain tx
before writing) before handling real users' money.

Then:

```bash
npm run dev
```

To actually deploy an NFT collection or launch a token, connect a Solana
wallet (Phantom, Solflare, or OKX — not an EVM wallet) with a little
devnet SOL in it. Get devnet SOL free from
https://faucet.solana.com.

## Architecture

- `src/config/env.js` — reads all the above env vars in one place.
- `src/services/` — one file per data source (`birdeye.js`,
  `dexscreener.js`, `helius.js`) plus the higher-level services that
  combine them with fallbacks (`trendingTokens.js`, `walletPortfolio.js`,
  `nftCollections.js`, `memeTokens.js`) and the on-chain write paths
  (`metaplex.js` for collection creation, `candyMachine.js` for public
  minting via Candy Machine + Candy Guard, `nftMint.js` for the legacy
  creator-only fallback, `splToken.js` for Tier 3).
- `src/hooks/` — thin polling/loading wrappers around the services above,
  used directly by pages.
- `src/data/collectionConfig.js` / `tokenLaunchConfig.js` — the launch
  parameters (price, eligibility, whitelist, supply) that only exist
  inside this app, keyed by the real on-chain address created in Tier
  2/3. Cached in localStorage always; written through to Supabase (see
  "Shared discovery" above) when configured, so deploys/launches are
  visible to every device, not just the one that made them.
