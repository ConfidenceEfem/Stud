# Tier 3, part 2: seeding a real liquidity pool

**Update:** a real devnet path now exists — see "The devnet path" below.
The original reasoning for not wiring up Raydium/Orca/Jupiter is unchanged
and still applies to mainnet; keeping it here for context.

What's automated (`src/services/splToken.js`, wired into `LaunchMeme.jsx`):
creating a real SPL token with a fixed supply, minted entirely to the
creator's wallet, with mint + freeze authority revoked in the same
transaction so the supply can never change.

## The devnet path: SPL Token Swap (`src/services/tokenSwap.js`)

Real DEX aggregators (Raydium, Orca, Jupiter) are mainnet-focused and
don't run reliably on devnet — see the original reasoning below. But
`spl-token-swap`, an older, generic Solana Program Library program, *is*
deployed at a fixed address on devnet, and is a genuinely working
constant-product AMM. That's what makes "buy this token with your faucet
SOL" possible without real money:

- **Seeding a pool** (`createLiquidityPool`): the token's creator deposits
  both sides of the pool — some of their own token supply, plus SOL —
  across 3 sequential transactions (creating 6 new on-chain accounts:
  a pool mint, two token vaults, an LP-token receiver, a fee account, and
  the swap state account itself). The deposit ratio sets the starting
  price. This is a real transaction; there's no simulation mode.
- **Buying** (`swapSolForToken`): any connected wallet can swap devnet SOL
  for the token against the pool's real reserves, with slippage
  protection computed from the pool's live on-chain balances at call
  time — not trusted from anywhere else.
- **Price/liquidity display**: read directly from the pool's vault
  balances (`getPoolReserves`), not from DexScreener — DexScreener will
  never index this pool, since it only tracks Raydium/Orca/Meteora-style
  mainnet-focused programs. Price is shown in SOL, not USD, since devnet
  SOL has no real dollar value and showing a fabricated $ figure would be
  misleading.

**What this is not:** a production-grade AMM. `spl-token-swap` is old,
lightly maintained, and its devnet availability isn't guaranteed
long-term — the code checks the program actually exists on-chain before
doing anything and fails with a clear message if it doesn't. There's also
no price-impact warning UI beyond a basic slippage tolerance, and pool
creation can't be reversed or resized once created (standard AMM
behavior — additional liquidity would need a `depositAllTokenTypes` call,
which isn't wired up yet).

**A real gotcha worth knowing if you extend this:** the installed
`@solana/spl-token-swap` npm package's own `TokenSwap.swapInstruction()`
targets a newer on-chain program interface (added later for Token-2022
support — separate source/destination/pool token-program accounts) than
what's actually deployed on devnet at the classic `SwapsVeCi...` address,
which only understands one combined token-program account. Using the
package's own helper fails with "the provided token program does not
match the token program expected by the swap." `swapSolForToken` in
`tokenSwap.js` builds the Swap instruction by hand instead, matching the
legacy 10-account layout (confirmed by diffing against `@solana/spl-
token-swap@0.1.4`, which predates the newer layout). Pool creation
(`createInitSwapInstruction`) is unaffected — that instruction's account
shape is identical across all versions of the package. If you add
deposit/withdraw functionality later, check whether `depositAllTokenTypesInstruction`
/ `withdrawAllTokenTypesInstruction` have the same version skew before
assuming the package's built-in helpers will work as-is.

## The original reasoning (mainnet, unchanged)

1. **Real money, immediately.** Seeding a pool means the creator's wallet
   sends real SOL (or USDC) *and* real tokens into a pool contract in one
   shot. A bug here doesn't fail loudly — it can silently create a
   pool with wrong ratios, or send funds to a stale/incorrect pool
   address, which is exactly the kind of mistake that's expensive and
   irreversible on mainnet.
2. **Raydium's SDK doesn't have solid devnet support.** Raydium's AMM v4 /
   CLMM pools are built and tested against mainnet-beta; devnet program
   IDs and market data are inconsistent and frequently stale. That means
   there's no safe, repeatable way to test a "create pool" flow end-to-end
   before pointing it at mainnet — the exact "not officially published,
   verify carefully" situation flagged in the original brief.
3. **Pool creation on Raydium's classic AMM also requires an OpenBook
   market ID** (a separate on-chain orderbook account) as a prerequisite,
   which is its own multi-step, SOL-costing flow with its own failure
   modes. (Raydium's newer CPMM pools relax this requirement — see below.)

Shipping code for this that *looks* like it works but hasn't been run
against a real pool end-to-end would be worse than not shipping it: it
would create a false sense of safety around a flow that moves real funds.

## What to do next for mainnet, concretely

- **Recommended:** use Raydium's own hosted **CPMM (constant-product)
  pool creation SDK** (`@raydium-io/raydium-sdk-v2`), which doesn't require
  an OpenBook market and is the path Raydium actively recommends for new
  tokens. Build and test this against **mainnet with a small, disposable
  amount of SOL first** — there is no reliable devnet equivalent to test
  against.
- Wire it the same way `splToken.js` is wired: pass the connected wallet
  in as the signer, never a backend keypair.
- Add a confirmation step in the UI that shows the exact SOL + token
  amounts about to be deposited before the wallet prompt fires — for a
  flow that moves real money, an extra "are you sure" screen is cheap
  insurance.
- Alternatively, for true pump.fun-style bonding curves instead of an
  upfront DEX pool: that requires either a custom Anchor program (a real
  Rust smart-contract build — realistically weeks, not a follow-up
  feature) or integrating against pump.fun's own program directly, which
  is unaudited/unofficial and carries real protocol-risk if their program
  changes.

