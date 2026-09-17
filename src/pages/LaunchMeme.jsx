import { useEffect, useMemo, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { UploadCloud, Rocket, Wallet, X, FileImage, Loader2, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { Page } from '../components/Layout';
import { Button, Eyebrow, Mono } from '../components/Atoms';
import { colors, font, radius } from '../theme';
import { useWallet } from '../context/WalletContext';
import { createFixedSupplyToken, WalletNotReadyError } from '../services/splToken';
import { getSolBalance } from '../services/solanaConnection';
import { NETWORK } from '../config/env';
import NetworkNotice from '../components/NetworkNotice';

const Title = styled.h1`
  font-size: 40px;
  color: ${colors.paper};
  margin-top: 10px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 32px;
  margin-top: 34px;
  align-items: flex-start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: 18px;
  padding: 30px;
`;

const FieldGroup = styled.div`
  display: grid;
  grid-template-columns: ${(p) => p.$cols || '1fr'};
  gap: ${(p) => p.$gap || '18px'};
  margin-bottom: 18px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: ${colors.muted};
`;

const Hint = styled.span`
  font-size: 11.5px;
  color: ${colors.faint};
`;

const inputCSS = `
  width: 100%;
  background: ${colors.panelRaised};
  border: 1px solid ${colors.stroke};
  border-radius: ${radius.md};
  padding: 11px 13px;
  font-size: 13.5px;
  color: ${colors.paper};
  font-family: ${font.body};

  &:focus { border-color: ${colors.stamp}; outline: none; }
  &::placeholder { color: ${colors.faint}; }
`;

const Input = styled.input`
  ${inputCSS}
  border-color: ${(p) => (p.$invalid ? colors.down : colors.stroke)};
`;
const TextArea = styled.textarea`
  ${inputCSS}
  resize: vertical;
  min-height: 80px;
  border-color: ${(p) => (p.$invalid ? colors.down : colors.stroke)};
`;
const ErrorText = styled.span`
  font-size: 11.5px;
  color: ${colors.down};
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinnerIcon = styled(Loader2)`
  animation: ${spin} 0.8s linear infinite;
`;

const LaunchSuccess = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  border-radius: ${radius.md};
  border: 1px solid rgba(51,209,122,0.35);
  background: rgba(51,209,122,0.08);
`;

const LaunchLinks = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 6px;

  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: ${font.mono};
    font-size: 12px;
    color: ${colors.stamp};
  }
  a:hover { text-decoration: underline; }
`;

const LiquidityNote = styled.p`
  margin-top: 10px;
  font-size: 11.5px;
  line-height: 1.5;
  color: ${colors.faint};

  code {
    font-family: ${font.mono};
    color: ${colors.muted};
  }
`;
const Prefix = styled.span`
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: ${colors.faint};
  font-family: ${font.mono};
  font-size: 13.5px;
  pointer-events: none;
`;
const Relative = styled.div`
  position: relative;
  input { padding-left: 26px; }
`;

const UploadBox = styled.div`
  border: 1.5px dashed ${(p) => (p.$active ? colors.stamp : colors.stroke)};
  background: ${(p) => (p.$active ? 'rgba(255,204,1,0.06)' : 'transparent')};
  border-radius: ${radius.md};
  padding: 26px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: ${(p) => (p.$active ? colors.stamp : colors.faint)};
  font-size: 12.5px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;

  &:hover { border-color: ${colors.stamp}; color: ${colors.stamp}; }
`;

const HiddenInput = styled.input`
  display: none;
`;

const PreviewWrap = styled.div`
  position: relative;
  border-radius: ${radius.md};
  overflow: hidden;
  border: 1px solid ${colors.stroke};
`;

const PreviewImg = styled.img`
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: cover;
`;

const PreviewBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 14px;
  background: ${colors.panelRaised};
  font-family: ${font.mono};
  font-size: 11px;
  color: ${colors.muted};
`;

const RemoveBtn = styled.button`
  font-family: ${font.mono};
  font-size: 11px;
  color: ${colors.down};
  &:hover { text-decoration: underline; }
`;

const Preview = styled.div`
  position: sticky;
  top: 90px;
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: 18px;
  overflow: hidden;
`;

const PreviewHead = styled.div`
  padding: 20px;
  background: linear-gradient(135deg, ${colors.stamp}22, ${colors.panelRaised});
  border-bottom: 1.5px dashed ${colors.stroke};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${colors.stamp};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.void};
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PreviewBody = styled.div`
  padding: 18px 20px 20px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${colors.stroke};
  font-size: 13px;

  span:first-child { color: ${colors.faint}; }
  span:last-child { font-family: ${font.mono}; color: ${colors.paper}; }
`;

export default function LaunchMeme() {
  const { connected, address, getActiveProvider, openPicker } = useWallet();
  const [form, setForm] = useState({
    ticker: '',
    name: '',
    description: '',
    wallet: '',
    supply: '1000000000',
    initialPrice: '0.00003',
    initialLiquidity: '6',
  });

  const [image, setImage] = useState(null); // { file, url }
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);
  const MAX_MB = 5;

  // Autofill the creator wallet once a wallet is connected — but never
  // stomp on something the person already typed by hand.
  useEffect(() => {
    if (connected && address) {
      setForm((f) => (f.wallet ? f : { ...f, wallet: address }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, address]);

  const [errors, setErrors] = useState({});
  const [launchState, setLaunchState] = useState('idle'); // idle | building | awaiting-signature | confirming | success | error
  const [launchResult, setLaunchResult] = useState(null); // { mintAddress, signature, explorerTokenUrl, explorerTxUrl }
  const [launchError, setLaunchError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const launchBusy = !['idle', 'success', 'error'].includes(launchState);

  // Accepts an optional override so it can validate against a value that
  // hasn't finished landing in state yet — lets us re-check on every
  // keystroke instead of only when Launch is clicked.
  const validate = (overrides = {}) => {
    const values = { ...form, ...overrides };
    const e = {};
    if (!values.ticker.trim()) {
      e.ticker = 'Ticker is required.';
    } else if (!/^[A-Za-z0-9]{2,10}$/.test(values.ticker.trim())) {
      e.ticker = '2–10 letters/numbers, no symbols.';
    }
    if (!values.name.trim()) e.name = 'Token name is required.';
    if (!values.description.trim()) e.description = 'Add a short description.';

    const supplyNum = Number(values.supply);
    if (values.supply === '' || isNaN(supplyNum) || supplyNum <= 0) e.supply = 'Enter a supply greater than 0.';

    const priceNum = Number(values.initialPrice);
    if (values.initialPrice === '' || isNaN(priceNum) || priceNum <= 0) e.initialPrice = 'Enter a price greater than 0.';

    const liqNum = Number(values.initialLiquidity);
    if (values.initialLiquidity === '' || isNaN(liqNum) || liqNum <= 0) e.initialLiquidity = 'Enter liquidity greater than 0.';

    if (!values.wallet.trim()) e.wallet = 'Creator wallet address is required.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Every field's onChange runs through this. It always updates the form,
  // and — only once the user has tried Launch at least once — it
  // re-validates immediately so red text clears as they type, instead of
  // waiting for the next Launch click.
  const set = (k) => (e) => {
    setLaunchState('idle');
    setLaunchResult(null);
    const value = e.target.value;
    const nextForm = { ...form, [k]: value };
    setForm(nextForm);
    if (attempted) validate(nextForm);
  };

  const launchLabel = {
    idle: `Launch $${form.ticker || 'TOKEN'}`,
    building: 'Preparing transaction…',
    'uploading-image': 'Uploading image to Arweave…',
    'uploading-metadata': 'Uploading metadata…',
    'awaiting-signature': 'Approve in your wallet…',
    confirming: 'Confirming on-chain…',
    success: 'Launched ✓',
    error: 'Retry launch',
  }[launchState];

  const handleLaunch = async () => {
    if (!validate()) {
      setAttempted(true);
      setLaunchState('idle');
      return;
    }
    if (!connected) {
      openPicker();
      return;
    }
    const provider = getActiveProvider();
    if (!provider) {
      setLaunchState('error');
      setLaunchError('Connect a Solana wallet (Phantom, Solflare, or OKX) — MetaMask/Rabby can\'t sign Solana transactions.');
      return;
    }

    setLaunchError('');
    setLaunchState('building');
    try {
      const balance = await getSolBalance(address);
      const ESTIMATED_MIN_SOL = 0.01; // mint account rent + tx fees
      if (balance < ESTIMATED_MIN_SOL) {
        throw new Error(
          `Your wallet has ${balance.toFixed(4)} SOL on ${NETWORK} (checked via this app's RPC), which isn't ` +
          `enough to cover rent + fees (~${ESTIMATED_MIN_SOL} SOL). Get more from ` +
          `${NETWORK === 'devnet' ? 'https://faucet.solana.com' : 'an exchange'} and make sure your wallet ` +
          `extension is set to ${NETWORK} too.`
        );
      }

      const result = await createFixedSupplyToken({
        walletProvider: provider,
        name: form.name,
        ticker: form.ticker.toUpperCase(),
        supply: form.supply,
        decimals: 6,
        imageFile: image?.file,
        onProgress: setLaunchState,
      });
      setLaunchResult(result);
      setLaunchState('success');
    } catch (err) {
      console.error('[LaunchMeme] launch failed:', err);
      setLaunchState('error');
      setLaunchError(
        err instanceof WalletNotReadyError
          ? err.message
          : err?.message?.includes('reject')
            ? 'You rejected the transaction in your wallet.'
            : err?.message || 'Something went wrong creating the token. Check the console for details.'
      );
    }
  };

  const acceptFile = (file) => {
    if (!file) return;
    if (!/^image\/(png|gif|jpeg|webp)$/.test(file.type)) {
      setUploadError('Please upload a PNG, GIF, JPG, or WEBP image.');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`File is too large — keep it under ${MAX_MB}MB.`);
      return;
    }
    setUploadError('');
    setImage({ file, url: URL.createObjectURL(file) });
  };

  const handleInputChange = (e) => {
    acceptFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    if (image?.url) URL.revokeObjectURL(image.url);
    setImage(null);
  };

  useEffect(() => {
    return () => {
      if (image?.url) URL.revokeObjectURL(image.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const { mcap, fdv } = useMemo(() => {
    const supply = Number(form.supply) || 0;
    const price = Number(form.initialPrice) || 0;
    const cap = supply * price;
    return {
      mcap: cap ? `$${cap.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0',
      fdv: cap ? `$${(cap * 1).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0',
    };
  }, [form.supply, form.initialPrice]);

  return (
    <Page>
      <Eyebrow>Launch · Meme token</Eyebrow>
      <Title>Send it to a bonding curve</Title>

      <Layout>
        <Card>
          <FieldGroup $cols="140px 1fr" $gap="24px">
            <Field>
              <Label>Ticker</Label>
              <Relative>
                <Prefix>$</Prefix>
                <Input placeholder="STUB" value={form.ticker} onChange={set('ticker')} style={{ textTransform: 'uppercase' }} $invalid={!!errors.ticker} />
              </Relative>
              {errors.ticker && <ErrorText>{errors.ticker}</ErrorText>}
            </Field>
            <Field>
              <Label>Token name</Label>
              <Input placeholder="e.g. Ticket Stub" value={form.name} onChange={set('name')} $invalid={!!errors.name} />
              {errors.name && <ErrorText>{errors.name}</ErrorText>}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <Label>Description</Label>
              <TextArea placeholder="What's the bit? Tell people why this token exists." value={form.description} onChange={set('description')} $invalid={!!errors.description} />
              {errors.description && <ErrorText>{errors.description}</ErrorText>}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <Label>Token image</Label>
              {image ? (
                <PreviewWrap>
                  <PreviewImg src={image.url} alt="Token artwork preview" />
                  <PreviewBar>
                    <span><FileImage size={12} style={{ verticalAlign: -2, marginRight: 5 }} />{image.file.name} · {fmtSize(image.file.size)}</span>
                    <RemoveBtn onClick={removeImage} type="button">
                      <X size={12} style={{ verticalAlign: -2, marginRight: 3 }} />Remove
                    </RemoveBtn>
                  </PreviewBar>
                </PreviewWrap>
              ) : (
                <UploadBox
                  $active={dragActive}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                >
                  <UploadCloud size={18} />
                  {dragActive ? 'Drop it here' : 'Drop a 512×512 image or click to upload'}
                  <Hint>PNG, GIF, JPG, or WEBP — up to {MAX_MB}MB</Hint>
                </UploadBox>
              )}
              <HiddenInput
                ref={fileInputRef}
                type="file"
                accept="image/png,image/gif,image/jpeg,image/webp"
                onChange={handleInputChange}
              />
              {uploadError && <Hint style={{ color: colors.down }}>{uploadError}</Hint>}
            </Field>
          </FieldGroup>

          <FieldGroup $cols="1fr 1fr">
            <Field>
              <Label>Total supply</Label>
              <Input type="number" value={form.supply} onChange={set('supply')} $invalid={!!errors.supply} />
              {errors.supply && <ErrorText>{errors.supply}</ErrorText>}
            </Field>
            <Field>
              <Label>Initial price (SOL)</Label>
              <Input type="number" step="0.000001" value={form.initialPrice} onChange={set('initialPrice')} $invalid={!!errors.initialPrice} />
              {errors.initialPrice && <ErrorText>{errors.initialPrice}</ErrorText>}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <Label>Initial liquidity (SOL)</Label>
              <Input type="number" step="0.1" value={form.initialLiquidity} onChange={set('initialLiquidity')} $invalid={!!errors.initialLiquidity} />
              {errors.initialLiquidity ? <ErrorText>{errors.initialLiquidity}</ErrorText> : <Hint>Seeds the bonding curve pool at launch.</Hint>}
            </Field>
          </FieldGroup>

          <FieldGroup>
            <Field>
              <Label><Wallet size={12} style={{ verticalAlign: -2 }} /> Creator wallet address</Label>
              <Input value={form.wallet} onChange={set('wallet')} $invalid={!!errors.wallet} placeholder={connected ? undefined : 'Connect your wallet above, or paste an address'} />
              {errors.wallet && <ErrorText>{errors.wallet}</ErrorText>}
            </Field>
          </FieldGroup>

          <NetworkNotice />

          <Button type="button" onClick={handleLaunch} disabled={launchBusy} style={{ width: '100%', marginTop: 6 }}>
            {launchBusy && <SpinnerIcon size={14} style={{ marginRight: 6 }} />}
            {launchState === 'idle' ? <><Rocket size={15} /> {launchLabel}</> : launchLabel}
          </Button>

          {launchState === 'error' && (
            <ErrorText style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'center' }}>
              <AlertTriangle size={13} /> {launchError}
            </ErrorText>
          )}

          {launchState === 'success' && launchResult && (
            <LaunchSuccess>
              <Check size={18} color={colors.up} />
              <div>
                <div style={{ color: colors.paper, fontWeight: 600, fontSize: 13.5 }}>
                  ${form.ticker.toUpperCase()} minted on-chain — {Number(form.supply).toLocaleString()} fixed supply, mint authority revoked
                </div>
                <LaunchLinks>
                  <a href={launchResult.explorerTokenUrl} target="_blank" rel="noreferrer">View token <ExternalLink size={11} /></a>
                  <a href={launchResult.explorerTxUrl} target="_blank" rel="noreferrer">View transaction <ExternalLink size={11} /></a>
                </LaunchLinks>
                <LiquidityNote>
                  This creates the real token — it doesn't seed a Raydium liquidity pool yet. Pool creation needs its
                  own funded transaction (real SOL + the token, deposited as an LP pair) and Raydium's SDK doesn't run
                  reliably on devnet, so it's a deliberate manual next step rather than something faked here. See{' '}
                  <code>docs/tier3-liquidity.md</code> for the exact steps once you're ready to seed a pool for real.
                </LiquidityNote>
              </div>
            </LaunchSuccess>
          )}

          {!connected && launchState === 'idle' && (
            <Hint style={{ display: 'block', marginTop: 10, textAlign: 'center' }}>
              Connect your wallet to launch — it will sign and pay for the on-chain transaction.
            </Hint>
          )}
        </Card>

        <Preview>
          <PreviewHead>
            <IconCircle>{image ? <img src={image.url} alt="" /> : <Rocket size={20} />}</IconCircle>
            <div>
              <div style={{ fontFamily: font.display, fontSize: 22, color: colors.paper }}>
                ${form.ticker || 'TICKER'}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: 11, color: colors.faint }}>
                {form.name || 'Token name'}
              </div>
            </div>
          </PreviewHead>
          <PreviewBody>
            <StatRow><span>Supply</span><span>{Number(form.supply || 0).toLocaleString()}</span></StatRow>
            <StatRow><span>Initial price</span><span>{form.initialPrice} ◎</span></StatRow>
            <StatRow><span>Liquidity</span><span>{form.initialLiquidity} ◎</span></StatRow>
            <StatRow><span>Market cap</span><span>{mcap}</span></StatRow>
            <StatRow style={{ borderBottom: 'none' }}><span>FDV</span><span>{fdv}</span></StatRow>
            <Hint style={{ display: 'block', marginTop: 12 }}>
              Estimates update live as you edit supply and price — final figures are set on-chain at launch.
            </Hint>
          </PreviewBody>
        </Preview>
      </Layout>
    </Page>
  );
}
