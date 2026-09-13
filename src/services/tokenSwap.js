import {
  Transaction,
  SystemProgram,
  Keypair,
  PublicKey,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
  NATIVE_MINT,
  getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
  createInitializeMintInstruction,
  createInitializeAccountInstruction,
  createSyncNativeInstruction,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { TokenSwap, TOKEN_SWAP_PROGRAM_ID, CurveType, TokenSwapLayout } from '@solana/spl-token-swap';
import { connection, explorerUrl, NETWORK } from './solanaConnection';
import { savePoolConfig, getPoolConfig } from '../data/poolConfig';
import { withRetries } from '../utils/retry';

export class WalletNotReadyError extends Error {}
export class PoolProgramMissingError extends Error {}
export class NoPoolError extends Error {}
export class PoolAlreadyExistsError extends Error {}

// Very deliberately NOT Raydium/Orca/Jupiter: those are mainnet-only in
// practice (see docs/tier3-liquidity.md). SPL Token Swap is an older,
// generic Solana Program Library program that's genuinely deployed on
// devnet at a fixed address, which is what makes "buy with your faucet
// SOL" actually possible here — this is a real, working AMM, not a
// simulation, but it's a plain constant-product pool with no price feed
// or aggregator listing anywhere outside this app.
const TRADE_FEE_NUMERATOR = 30n; // 0.30%
const TRADE_FEE_DENOMINATOR = 10000n;
const ZERO_FEE = 0n;
const POOL_MINT_DECIMALS = 9;

async function assertProgramDeployed() {
  const info = await connection.getAccountInfo(TOKEN_SWAP_PROGRAM_ID);
  if (!info) {
    throw new PoolProgramMissingError(
      `The SPL Token Swap program isn't deployed on ${NETWORK} as far as this RPC can see. This program's ` +
      `devnet availability isn't guaranteed long-term — if this keeps happening, it may have been removed from ` +
      `devnet, in which case a demo pool isn't possible until it's redeployed (or you point this app at a ` +
      `cluster where it exists).`
    );
  }
}

function assertWallet(walletProvider) {
  if (!walletProvider?.publicKey) {
    throw new WalletNotReadyError('Connect a Solana wallet (Phantom, Solflare, or OKX) first.');
  }
}

async function signSendConfirm(walletProvider, tx, extraSigners = []) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = walletProvider.publicKey;
  extraSigners.forEach((kp) => tx.partialSign(kp));
  const signed = await walletProvider.signTransaction(tx);
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
  return signature;
}

/**
 * Seeds a brand-new constant-product pool for `tokenMint` paired with
 * wrapped SOL, using the SPL Token Swap program. Only the token's creator
 * should normally do this (they're the one with supply to seed it with),
 * though nothing on-chain enforces that — anyone with enough of the token
 * and some SOL could seed a pool for it.
 *
 * Split across 3 sequential transactions (mint + vaults, funding, pool
 * init) to stay comfortably under Solana's transaction size limit — this
 * involves creating 6 new on-chain accounts in total.
 */
export async function createLiquidityPool({ walletProvider, tokenMint, tokenAmount, solAmount, decimals, onProgress }) {
  assertWallet(walletProvider);
  await assertProgramDeployed();

  const existing = await getPoolConfig(tokenMint);
  if (existing?.swapAccount) {
    throw new PoolAlreadyExistsError('A pool already exists for this token — use it instead of creating another.');
  }

  const payer = walletProvider.publicKey;
  const tokenMintPk = new PublicKey(tokenMint);

  const swapAccount = Keypair.generate();
  const poolMint = Keypair.generate();
  const vaultSol = Keypair.generate();
  const vaultToken = Keypair.generate();
  const poolTokenReceiver = Keypair.generate();
  const feeAccount = Keypair.generate();

  const [authority] = PublicKey.findProgramAddressSync(
    [swapAccount.publicKey.toBuffer()],
    TOKEN_SWAP_PROGRAM_ID
  );

  const [mintRent, accountRent, swapRent] = await Promise.all([
    getMinimumBalanceForRentExemptMint(connection),
    getMinimumBalanceForRentExemptAccount(connection),
    connection.getMinimumBalanceForRentExemption(TokenSwapLayout.span),
  ]);

  // --- TX 1: create the pool mint + both vault token accounts ----------
  onProgress?.('creating-pool-accounts');
  const tx1 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: poolMint.publicKey,
      space: MINT_SIZE,
      lamports: mintRent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(poolMint.publicKey, POOL_MINT_DECIMALS, authority, null),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: vaultSol.publicKey,
      space: ACCOUNT_SIZE,
      lamports: accountRent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(vaultSol.publicKey, NATIVE_MINT, authority),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: vaultToken.publicKey,
      space: ACCOUNT_SIZE,
      lamports: accountRent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(vaultToken.publicKey, tokenMintPk, authority)
  );
  await withRetries(() => signSendConfirm(walletProvider, tx1, [poolMint, vaultSol, vaultToken]), { attempts: 3 });

  // --- TX 2: fund both vaults with the initial liquidity ----------------
  onProgress?.('funding-pool');
  const payerTokenAta = await getAssociatedTokenAddress(tokenMintPk, payer);
  const solLamports = BigInt(Math.round(solAmount * 1e9));
  const tokenRaw = BigInt(Math.round(tokenAmount * 10 ** decimals));

  const tx2 = new Transaction().add(
    SystemProgram.transfer({ fromPubkey: payer, toPubkey: vaultSol.publicKey, lamports: solLamports }),
    createSyncNativeInstruction(vaultSol.publicKey),
    createTransferInstruction(payerTokenAta, vaultToken.publicKey, payer, tokenRaw),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: poolTokenReceiver.publicKey,
      space: ACCOUNT_SIZE,
      lamports: accountRent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(poolTokenReceiver.publicKey, poolMint.publicKey, payer),
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: feeAccount.publicKey,
      space: ACCOUNT_SIZE,
      lamports: accountRent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeAccountInstruction(feeAccount.publicKey, poolMint.publicKey, payer)
  );
  await withRetries(() => signSendConfirm(walletProvider, tx2, [poolTokenReceiver, feeAccount]), { attempts: 3 });

  // --- TX 3: create + initialize the swap account itself ----------------
  onProgress?.('initializing-pool');
  const tx3 = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: swapAccount.publicKey,
      space: TokenSwapLayout.span,
      lamports: swapRent,
      programId: TOKEN_SWAP_PROGRAM_ID,
    }),
    TokenSwap.createInitSwapInstruction(
      swapAccount,
      authority,
      vaultSol.publicKey,
      vaultToken.publicKey,
      poolMint.publicKey,
      feeAccount.publicKey,
      poolTokenReceiver.publicKey,
      TOKEN_PROGRAM_ID,
      TOKEN_SWAP_PROGRAM_ID,
      TRADE_FEE_NUMERATOR,
      TRADE_FEE_DENOMINATOR,
      ZERO_FEE,
      TRADE_FEE_DENOMINATOR,
      ZERO_FEE,
      TRADE_FEE_DENOMINATOR,
      ZERO_FEE,
      TRADE_FEE_DENOMINATOR,
      CurveType.ConstantProduct
    )
  );
  const signature = await withRetries(() => signSendConfirm(walletProvider, tx3, [swapAccount]), { attempts: 3 });

  const poolInfo = {
    swapAccount: swapAccount.publicKey.toString(),
    authority: authority.toString(),
    vaultSol: vaultSol.publicKey.toString(),
    vaultToken: vaultToken.publicKey.toString(),
    poolMint: poolMint.publicKey.toString(),
    feeAccount: feeAccount.publicKey.toString(),
    creator: payer.toString(),
  };
  await savePoolConfig(tokenMint, poolInfo);

  return { ...poolInfo, signature, explorerUrl: explorerUrl(swapAccount.publicKey.toString(), 'address') };
}

// Reads the pool's real on-chain reserves — used both for displaying
// price/liquidity on the Meme Marketplace and for computing a swap's
// minimum-out (slippage) protection. No off-chain price feed involved;
// this is exactly what the pool's balances say right now.
export async function getPoolReserves(tokenMint) {
  const config = await getPoolConfig(tokenMint);
  if (!config?.swapAccount) return null;

  const [solInfo, tokenInfo] = await Promise.all([
    connection.getTokenAccountBalance(new PublicKey(config.vaultSol)),
    connection.getTokenAccountBalance(new PublicKey(config.vaultToken)),
  ]);

  const solReserve = solInfo.value.uiAmount || 0;
  const tokenReserve = tokenInfo.value.uiAmount || 0;
  return {
    solReserve,
    tokenReserve,
    price: tokenReserve > 0 ? solReserve / tokenReserve : 0,
    config,
  };
}

/**
 * Buys `tokenMint` with `solAmountIn` SOL against its devnet pool. Any
 * connected wallet can call this — this is the actual "people can buy it
 * with their faucet SOL" mechanism. Slippage protection is computed from
 * the pool's live reserves at call time, not trusted from anywhere else.
 */
export async function swapSolForToken({ walletProvider, tokenMint, solAmountIn, slippageBps = 100, onProgress }) {
  assertWallet(walletProvider);
  await assertProgramDeployed();

  const reserves = await getPoolReserves(tokenMint);
  if (!reserves) {
    throw new NoPoolError('No liquidity pool exists for this token yet.');
  }

  const payer = walletProvider.publicKey;
  const tokenMintPk = new PublicKey(tokenMint);
  const { config } = reserves;

  const amountIn = BigInt(Math.round(solAmountIn * 1e9));
  // Constant product: outputs = tokenReserve - (k / (solReserve + amountIn)),
  // minus the pool's trade fee, then a slippage tolerance on top.
  const k = reserves.solReserve * reserves.tokenReserve;
  const newSolReserve = reserves.solReserve + solAmountIn;
  const grossOut = reserves.tokenReserve - k / newSolReserve;
  const feeAdjustedOut = grossOut * (1 - Number(TRADE_FEE_NUMERATOR) / Number(TRADE_FEE_DENOMINATOR));
  const minOutUi = feeAdjustedOut * (1 - slippageBps / 10000);
  const decimalsInfo = await connection.getTokenSupply(tokenMintPk);
  const decimals = decimalsInfo.value.decimals;
  const minimumAmountOut = BigInt(Math.max(0, Math.floor(minOutUi * 10 ** decimals)));

  onProgress?.('preparing');
  const userWsolAta = await getAssociatedTokenAddress(NATIVE_MINT, payer);
  const userTokenAta = await getAssociatedTokenAddress(tokenMintPk, payer);
  const [wsolAtaInfo, tokenAtaInfo] = await Promise.all([
    connection.getAccountInfo(userWsolAta),
    connection.getAccountInfo(userTokenAta),
  ]);

  const tx = new Transaction();
  if (!wsolAtaInfo) {
    tx.add(createAssociatedTokenAccountInstruction(payer, userWsolAta, payer, NATIVE_MINT));
  }
  tx.add(
    SystemProgram.transfer({ fromPubkey: payer, toPubkey: userWsolAta, lamports: amountIn }),
    createSyncNativeInstruction(userWsolAta)
  );
  if (!tokenAtaInfo) {
    tx.add(createAssociatedTokenAccountInstruction(payer, userTokenAta, payer, tokenMintPk));
  }
  tx.add(
    TokenSwap.swapInstruction(
      new PublicKey(config.swapAccount),
      new PublicKey(config.authority),
      payer,
      userWsolAta,
      new PublicKey(config.vaultSol),
      new PublicKey(config.vaultToken),
      userTokenAta,
      new PublicKey(config.poolMint),
      new PublicKey(config.feeAccount),
      null,
      NATIVE_MINT,
      tokenMintPk,
      TOKEN_SWAP_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      amountIn,
      minimumAmountOut
    )
  );

  onProgress?.('awaiting-signature');
  const signature = await withRetries(() => signSendConfirm(walletProvider, tx), { attempts: 3 });
  return { signature, explorerTxUrl: explorerUrl(signature, 'tx') };
}
