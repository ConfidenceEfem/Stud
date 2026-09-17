import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Droplets, ArrowDownUp, Check, ExternalLink, AlertTriangle, Loader2, X } from 'lucide-react';
import { colors, font, radius } from '../theme';
import { Button } from './Atoms';
import { useWallet } from '../context/WalletContext';
import { createLiquidityPool, swapSolForToken } from '../services/tokenSwap';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(11, 11, 13, 0.72);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: 18px;
  padding: 28px;
  position: relative;
`;

const CloseBtn = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  color: ${colors.faint};
  &:hover { color: ${colors.paper}; }
`;

const IconCircle = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255,204,1,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.stamp};
  margin-bottom: 14px;
`;

const Title = styled.h2`
  font-size: 20px;
  color: ${colors.paper};
`;

const Sub = styled.p`
  font-size: 12.5px;
  color: ${colors.muted};
  margin-top: 6px;
  line-height: 1.5;
`;

const Field = styled.div`
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 11.5px;
  font-weight: 600;
  color: ${colors.muted};
`;

const InputRow = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  background: ${colors.panelRaised};
  border: 1px solid ${colors.stroke};
  border-radius: ${radius.md};
  padding: 12px 52px 12px 14px;
  font-size: 14px;
  font-family: ${font.mono};
  color: ${colors.paper};

  &:focus { border-color: ${colors.stamp}; outline: none; }
`;

const Suffix = styled.span`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-family: ${font.mono};
  font-size: 12.5px;
  color: ${colors.faint};
`;

const Hint = styled.p`
  font-size: 11px;
  color: ${colors.faint};
  margin-top: 4px;
`;

const EstimateBox = styled.div`
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: ${radius.md};
  background: ${colors.panelRaised};
  border: 1px solid ${colors.stroke};
  font-size: 12.5px;
  color: ${colors.muted};
  display: flex;
  justify-content: space-between;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinnerIcon = styled(Loader2)`
  animation: ${spin} 0.8s linear infinite;
`;

const SuccessBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 18px;
  padding: 14px;
  border-radius: ${radius.md};
  border: 1px solid rgba(51,209,122,0.35);
  background: rgba(51,209,122,0.08);

  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: ${font.mono};
    font-size: 11.5px;
    color: ${colors.stamp};
    margin-top: 4px;
  }
`;

const ErrorText = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: ${colors.down};
`;

/**
 * Two modes:
 *  - "seed": the token's creator deposits the initial token+SOL reserves,
 *    creating a real SPL Token Swap pool (services/tokenSwap.js).
 *  - "swap": any connected wallet buys the token with devnet SOL against
 *    an existing pool.
 * Both are real on-chain actions — this isn't a preview/simulation.
 */
export default function LiquiditySwapModal({ mode, token, reserves, onClose, onDone }) {
  const { connected, getActiveProvider, openPicker } = useWallet();
  const [tokenAmount, setTokenAmount] = useState('');
  const [solAmount, setSolAmount] = useState(mode === 'swap' ? '0.1' : '');
  const [state, setState] = useState('idle'); // idle | working | success | error
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const isSeed = mode === 'seed';

  const progressLabels = isSeed
    ? {
        'creating-pool-accounts': 'Creating pool accounts…',
        'funding-pool': 'Depositing liquidity…',
        'initializing-pool': 'Initializing pool…',
      }
    : {
        preparing: 'Preparing swap…',
        'awaiting-signature': 'Approve in your wallet…',
      };

  const estimatedOut =
    mode === 'swap' && reserves && Number(solAmount) > 0
      ? (() => {
          const sol = Number(solAmount);
          const k = reserves.solReserve * reserves.tokenReserve;
          const out = reserves.tokenReserve - k / (reserves.solReserve + sol);
          return out * 0.997; // rough display estimate, matches pool's ~0.3% fee
        })()
      : null;

  const handleSubmit = async () => {
    if (!connected) {
      openPicker();
      return;
    }
    const provider = getActiveProvider();
    if (!provider) {
      setState('error');
      setError("Connect a Solana wallet (Phantom, Solflare, or OKX) — MetaMask/Rabby can't sign Solana transactions.");
      return;
    }

    setError('');
    setState('working');
    try {
      if (isSeed) {
        const tAmount = Number(tokenAmount);
        const sAmount = Number(solAmount);
        if (!tAmount || !sAmount) throw new Error('Enter both a token amount and a SOL amount to seed.');
        const res = await createLiquidityPool({
          walletProvider: provider,
          tokenMint: token.id,
          tokenAmount: tAmount,
          solAmount: sAmount,
          decimals: token.decimals ?? 6,
          onProgress: (p) => setProgressLabel(progressLabels[p] || p),
        });
        setResult(res);
      } else {
        const sAmount = Number(solAmount);
        if (!sAmount || sAmount <= 0) throw new Error('Enter a SOL amount to spend.');
        const res = await swapSolForToken({
          walletProvider: provider,
          tokenMint: token.id,
          solAmountIn: sAmount,
          onProgress: (p) => setProgressLabel(progressLabels[p] || p),
        });
        setResult(res);
      }
      setState('success');
      onDone?.();
    } catch (err) {
      console.error(`[LiquiditySwapModal:${mode}] failed:`, err);
      setState('error');
      setError(err?.message || 'Something went wrong. Check the console for details.');
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}><X size={18} /></CloseBtn>
        <IconCircle>{isSeed ? <Droplets size={20} /> : <ArrowDownUp size={20} />}</IconCircle>
        <Title>{isSeed ? `Seed liquidity for $${token.ticker}` : `Buy $${token.ticker}`}</Title>
        <Sub>
          {isSeed
            ? 'Deposits both sides of a real devnet pool (SPL Token Swap) using your own token supply and SOL. This sets the starting price — choose the ratio carefully.'
            : 'Swaps real devnet SOL for this token against its live pool. Price moves with each trade, same as any AMM.'}
        </Sub>

        {state === 'success' && result ? (
          <SuccessBox>
            <Check size={17} color={colors.up} />
            <div>
              <div style={{ color: colors.paper, fontWeight: 600 }}>
                {isSeed ? 'Pool created' : 'Swap complete'}
              </div>
              <a href={result.explorerUrl || result.explorerTxUrl} target="_blank" rel="noreferrer">
                View on Explorer <ExternalLink size={11} />
              </a>
            </div>
          </SuccessBox>
        ) : (
          <>
            {isSeed && (
              <Field>
                <Label>Token amount to deposit</Label>
                <InputRow>
                  <Input type="number" min="0" placeholder="e.g. 2000000" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} />
                  <Suffix>${token.ticker}</Suffix>
                </InputRow>
                <Hint>From your own wallet's supply — you minted 100% of it when you launched.</Hint>
              </Field>
            )}

            <Field>
              <Label>{isSeed ? 'SOL amount to deposit' : 'SOL amount to spend'}</Label>
              <InputRow>
                <Input type="number" min="0" step="0.01" placeholder="e.g. 1.0" value={solAmount} onChange={(e) => setSolAmount(e.target.value)} />
                <Suffix>SOL</Suffix>
              </InputRow>
              {isSeed && <Hint>Sets the starting price: (SOL deposited) ÷ (tokens deposited).</Hint>}
            </Field>

            {mode === 'swap' && estimatedOut != null && (
              <EstimateBox>
                <span>You'll receive (est.)</span>
                <span>~{estimatedOut.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.ticker}</span>
              </EstimateBox>
            )}

            <Button
              style={{ width: '100%', marginTop: 20 }}
              onClick={handleSubmit}
              disabled={state === 'working'}
            >
              {state === 'working' && <SpinnerIcon size={14} style={{ marginRight: 6 }} />}
              {state === 'working' ? progressLabel || 'Working…' : isSeed ? 'Create pool' : `Buy $${token.ticker}`}
            </Button>

            {state === 'error' && (
              <ErrorText><AlertTriangle size={13} /> {error}</ErrorText>
            )}
            {!connected && state !== 'working' && (
              <Hint style={{ textAlign: 'center', marginTop: 10 }}>Connect your wallet to continue — it will sign and pay for the on-chain transaction(s).</Hint>
            )}
          </>
        )}
      </Card>
    </Overlay>
  );
}
