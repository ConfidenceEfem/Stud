import { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { UploadCloud, ChevronLeft, ChevronRight, Check, Wallet, Users2, X, FileImage, ExternalLink, Loader2, AlertTriangle } from 'lucide-react';
import { Page } from '../components/Layout';
import { Button, Mono, Eyebrow } from '../components/Atoms';
import { colors, font, radius } from '../theme';
import { useWallet } from '../context/WalletContext';
import { deployNftCollection, recordCollectionLaunch } from '../services/metaplex';
import { deployCandyMachine } from '../services/candyMachine';
import { explorerUrl, getSolBalance } from '../services/solanaConnection';
import { NETWORK } from '../config/env';
import NetworkNotice from '../components/NetworkNotice';

const Title = styled.h1`
  font-size: 40px;
  color: ${colors.paper};
  margin-top: 10px;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 40px;
  margin-top: 34px;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: 800px) {
    flex-direction: row;
    overflow-x: auto;
  }
`;

const StepItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 10px 12px;
  border-radius: ${radius.md};
  background: ${(p) => (p.$active ? colors.panelRaised : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? colors.stroke : 'transparent')};

  span.num {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${font.mono};
    font-size: 11px;
    background: ${(p) => (p.$done ? colors.stamp : p.$active ? 'transparent' : colors.stroke)};
    color: ${(p) => (p.$done ? colors.void : p.$active ? colors.stamp : colors.faint)};
    border: 1px solid ${(p) => (p.$active ? colors.stamp : 'transparent')};
  }

  span.label {
    font-size: 13px;
    font-weight: 600;
    color: ${(p) => (p.$active ? colors.paper : colors.muted)};
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
  gap: 18px;
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

const ErrorText = styled.span`
  font-size: 11.5px;
  color: ${colors.down};
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
  font-family: ${font.mono};
  resize: vertical;
  min-height: 90px;
  border-color: ${(p) => (p.$invalid ? colors.down : colors.stroke)};
`;

const UploadBox = styled.div`
  border: 1.5px dashed ${(p) => (p.$active ? colors.stamp : colors.stroke)};
  background: ${(p) => (p.$active ? 'rgba(255,204,1,0.06)' : 'transparent')};
  border-radius: ${radius.md};
  padding: 34px 16px;
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
  max-height: 220px;
  object-fit: cover;
`;

const PreviewBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: ${colors.panelRaised};
  font-family: ${font.mono};
  font-size: 11.5px;
  color: ${colors.muted};
`;

const RemoveBtn = styled.button`
  font-family: ${font.mono};
  font-size: 11px;
  color: ${colors.down};
  &:hover { text-decoration: underline; }
`;

const ToggleRow = styled.div`
  display: flex;
  gap: 10px;
`;

const ToggleBtn = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px;
  border-radius: ${radius.md};
  border: 1px solid ${(p) => (p.$active ? colors.stamp : colors.stroke)};
  background: ${(p) => (p.$active ? 'rgba(255,204,1,0.08)' : 'transparent')};
  color: ${(p) => (p.$active ? colors.stamp : colors.muted)};
  font-size: 13px;
  font-weight: 600;
`;

const Foot = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 28px;
`;

const ReviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 11px 0;
  border-bottom: 1px solid ${colors.stroke};
  font-size: 13.5px;

  span:first-child { color: ${colors.faint}; }
  span:last-child { font-family: ${font.mono}; color: ${colors.paper}; }
`;

const DeploySuccess = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
  padding: 16px;
  border-radius: ${radius.md};
  border: 1px solid rgba(51,209,122,0.35);
  background: rgba(51,209,122,0.08);
`;

const DeployLinks = styled.div`
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

const DeployNote = styled.p`
  margin-top: 10px;
  font-size: 11.5px;
  line-height: 1.5;
  color: ${colors.faint};
`;

const DeployError = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12.5px;
  color: ${colors.down};
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const SpinnerIcon = styled(Loader2)`
  animation: ${spin} 0.8s linear infinite;
`;

const steps = ['Basics', 'Mint details', 'Timing', 'Eligibility', 'Review & deploy'];

export default function CreateNFT() {
  const { connected, address, getActiveProvider, openPicker } = useWallet();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    description: '',
    wallet: '',
    supply: '4444',
    price: '1.5',
    startDate: '',
    startTime: '18:00',
    endDate: '',
    endTime: '18:00',
    eligibility: 'whitelist',
    whitelist: '',
    maxPerWallet: '',
  });

  const [artwork, setArtwork] = useState(null); // { file, url }
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [attemptedStep, setAttemptedStep] = useState({});

  // Autofill the creator wallet once a wallet is connected — but never
  // stomp on something the person already typed by hand.
  useEffect(() => {
    if (connected && address) {
      setForm((f) => (f.wallet ? f : { ...f, wallet: address }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, address]);

  const MAX_MB = 10;

  // Local (not UTC) yyyy-mm-dd string — used both as the min="" on date
  // inputs and for the comparisons below, so "today" means the same thing
  // in both places.
  const todayStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  const minEndDate = form.startDate && form.startDate > todayStr ? form.startDate : todayStr;

  // Accepts optional overrides so it can validate against a value that
  // hasn't finished landing in state yet (i.e. re-checking on every
  // keystroke, not just on Continue).
  const validateStep = (i, overrides = {}) => {
    const values = overrides.form ? { ...form, ...overrides.form } : form;
    const art = 'artwork' in overrides ? overrides.artwork : artwork;
    const e = {};

    if (i === 0) {
      if (!values.name.trim()) e.name = 'Give your collection a name.';
      if (!values.description.trim()) e.description = 'Add a short description.';
      if (!art) e.artwork = 'Upload collection artwork before continuing.';
    }

    if (i === 1) {
      const supplyNum = Number(values.supply);
      if (values.supply === '' || isNaN(supplyNum) || supplyNum <= 0) e.supply = 'Enter a supply greater than 0.';
      const priceNum = Number(values.price);
      if (values.price === '' || isNaN(priceNum) || priceNum < 0) e.price = 'Enter a valid mint price.';
      if (!values.wallet.trim()) e.wallet = 'Creator wallet address is required.';
    }

    if (i === 2) {
      if (!values.startDate) {
        e.startDate = 'Pick a date the mint opens.';
      } else if (values.startDate < todayStr) {
        e.startDate = "Mint can't open in the past.";
      }
      if (values.endDate) {
        if (values.endDate < todayStr) {
          e.endDate = "Close date can't be in the past.";
        } else if (values.startDate && values.endDate < values.startDate) {
          e.endDate = 'Close date must be on or after the open date.';
        } else if (values.startDate && values.endDate === values.startDate && values.endTime <= values.startTime) {
          e.endDate = 'Close time must be after the open time.';
        }
      }
    }

    if (i === 3) {
      if (values.eligibility === 'whitelist' && !values.whitelist.split('\n').some((l) => l.trim())) {
        e.whitelist = 'Add at least one wallet address, or switch to a public mint.';
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Every field's onChange runs through this. It always updates the form,
  // and — only once the user has tried to continue at least once on this
  // step — it re-validates immediately so the red text clears (or updates)
  // as they type, instead of waiting for the next Continue click.
  const set = (k) => (e) => {
    const value = e.target.value;
    const nextForm = { ...form, [k]: value };
    setForm(nextForm);
    if (attemptedStep[step]) validateStep(step, { form: nextForm });
  };

  const setEligibility = (value) => {
    const nextForm = { ...form, eligibility: value };
    setForm(nextForm);
    if (attemptedStep[step]) validateStep(step, { form: nextForm });
  };

  const next = () => {
    if (!validateStep(step)) {
      setAttemptedStep((a) => ({ ...a, [step]: true }));
      return;
    }
    const ns = Math.min(step + 1, steps.length - 1);
    setMaxStepReached((m) => Math.max(m, ns));
    setStep(ns);
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const goToStep = (i) => {
    if (i > maxStepReached) return; // can't skip ahead of validated steps
    setStep(i);
  };

  useEffect(() => {
    if (attemptedStep[step]) validateStep(step);
    else setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
    const next = { file, url: URL.createObjectURL(file) };
    setArtwork(next);
    if (attemptedStep[0]) validateStep(0, { artwork: next });
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

  const removeArtwork = (e) => {
    e.stopPropagation();
    if (artwork?.url) URL.revokeObjectURL(artwork.url);
    setArtwork(null);
    if (attemptedStep[0]) validateStep(0, { artwork: null });
  };

  useEffect(() => {
    return () => {
      if (artwork?.url) URL.revokeObjectURL(artwork.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // --- Tier 2: real on-chain deploy -----------------------------------
  const [deployState, setDeployState] = useState('idle'); // idle | uploading-image | uploading-metadata | awaiting-signature | confirming | success | error
  const [deployResult, setDeployResult] = useState(null); // { collectionAddress, signature }
  const [deployError, setDeployError] = useState('');

  const deployBusy = !['idle', 'success', 'error'].includes(deployState);

  const deployLabel = {
    idle: 'Deploy mint contract',
    'uploading-image': 'Uploading artwork to Arweave…',
    'uploading-metadata': 'Uploading metadata…',
    'awaiting-signature': 'Approve in your wallet…',
    confirming: 'Confirming on-chain…',
    'checking-authority': 'Verifying collection authority…',
    'configuring-guards': 'Configuring mint rules…',
    'deploying-candy-machine': 'Deploying public mint…',
    success: 'Deployed ✓',
    error: 'Retry deploy',
  }[deployState];

  const handleDeploy = async () => {
    if (!connected) {
      openPicker();
      return;
    }
    const provider = getActiveProvider();
    if (!provider) {
      setDeployState('error');
      setDeployError('Connect a Solana wallet (Phantom, Solflare, or OKX) — MetaMask/Rabby can\'t sign Solana transactions.');
      return;
    }

    setDeployError('');
    setDeployState('uploading-image');
    try {
      // Preflight: check the wallet's real balance on *this app's* network
      // before spending any time uploading. If this comes back healthy but
      // the wallet still rejects for "insufficient balance" once it pops
      // up, that's a strong signal the wallet extension itself is pointed
      // at a different cluster (see NetworkNotice above).
      const balance = await getSolBalance(address);
      const ESTIMATED_MIN_SOL = 0.02; // rent + Irys funding + collection tx fees, roughly
      if (balance < ESTIMATED_MIN_SOL) {
        throw new Error(
          `Your wallet has ${balance.toFixed(4)} SOL on ${NETWORK} (checked via this app's RPC), which isn't ` +
          `enough to cover rent + upload + transaction fees (~${ESTIMATED_MIN_SOL} SOL). Get more from ` +
          `${NETWORK === 'devnet' ? 'https://faucet.solana.com' : 'an exchange'} and make sure your wallet ` +
          `extension is set to ${NETWORK} too.`
        );
      }

      const startTime = form.startDate ? new Date(`${form.startDate}T${form.startTime}:00Z`).toISOString() : null;
      const endTime = form.endDate ? new Date(`${form.endDate}T${form.endTime}:00Z`).toISOString() : null;

      const result = await deployNftCollection({
        walletProvider: provider,
        name: form.name,
        description: form.description,
        imageFile: artwork.file,
        onProgress: setDeployState,
      });

      await recordCollectionLaunch(result.collectionAddress, {
        name: form.name,
        description: form.description,
        wallet: form.wallet,
        // The real on-chain update authority is whichever wallet actually
        // signed the deploy transaction — always trust that over the
        // free-text wallet field above (which is just a display label and
        // could theoretically be edited to something else).
        updateAuthority: address,
        metadataUri: result.metadataUri,
        image: result.imageUri,
        price: Number(form.price) || 0,
        supply: Number(form.supply) || 0,
        eligibility: form.eligibility,
        whitelist: form.eligibility === 'whitelist' ? form.whitelist.split('\n').map((l) => l.trim()).filter(Boolean) : [],
        startTime,
        endTime,
        status: startTime && new Date(startTime) > new Date() ? 'upcoming' : 'live',
      });

      // Deploying the collection only creates the container — a real
      // *public* mint additionally needs a Candy Machine + Candy Guard
      // configured with the same price/timing/eligibility rules, so any
      // wallet (not just the creator) can mint against enforced on-chain
      // rules. Chaining it here means "Deploy" produces something buyers
      // can actually mint from, not just an empty collection.
      setDeployState('deploying-candy-machine');
      const whitelistAddresses =
        form.eligibility === 'whitelist' ? form.whitelist.split('\n').map((l) => l.trim()).filter(Boolean) : [];

      const candyResult = await deployCandyMachine({
        walletProvider: provider,
        collectionAddress: result.collectionAddress,
        name: form.name,
        sharedMetadataUri: result.metadataUri,
        itemsAvailable: Number(form.supply) || 0,
        priceSol: Number(form.price) || 0,
        treasuryWallet: form.wallet || address,
        startTime,
        endTime,
        maxPerWallet: Number(form.maxPerWallet) || 0,
        whitelist: whitelistAddresses,
        onProgress: setDeployState,
      });

      setDeployResult({ ...result, ...candyResult });
      setDeployState('success');
    } catch (err) {
      console.error('[CreateNFT] deploy failed:', err);
      setDeployState('error');
      setDeployError(
        err?.name === 'WalletNotReadyError'
          ? err.message
          : err?.message?.includes('User rejected') || err?.message?.includes('rejected')
            ? 'You rejected the transaction in your wallet.'
            : err?.message || 'Something went wrong deploying the collection. Check the console for details.'
      );
    }
  };

  return (
    <Page>
      <Eyebrow>Create · NFT collection</Eyebrow>
      <Title>Launch a timed mint</Title>

      <Layout>
        <StepList>
          {steps.map((label, i) => (
            <StepItem
              key={label}
              $active={i === step}
              $done={i < step}
              onClick={() => goToStep(i)}
              disabled={i > maxStepReached}
              style={i > maxStepReached ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
            >
              <span className="num">{i < step ? <Check size={12} /> : i + 1}</span>
              <span className="label">{label}</span>
            </StepItem>
          ))}
        </StepList>

        <Card>
          {step === 0 && (
            <>
              <FieldGroup>
                <Field>
                  <Label>Collection name</Label>
                  <Input placeholder="e.g. Solar Cartel" value={form.name} onChange={set('name')} $invalid={!!errors.name} />
                  {errors.name && <ErrorText>{errors.name}</ErrorText>}
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <Label>Description</Label>
                  <TextArea placeholder="What is this collection, and why should someone mint it?" value={form.description} onChange={set('description')} $invalid={!!errors.description} />
                  {errors.description && <ErrorText>{errors.description}</ErrorText>}
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <Label>Collection artwork</Label>
                  {artwork ? (
                    <PreviewWrap>
                      <PreviewImg src={artwork.url} alt="Collection artwork preview" />
                      <PreviewBar>
                        <span><FileImage size={12} style={{ verticalAlign: -2, marginRight: 5 }} />{artwork.file.name} · {fmtSize(artwork.file.size)}</span>
                        <RemoveBtn onClick={removeArtwork} type="button">
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
                      <UploadCloud size={20} />
                      {dragActive ? 'Drop it here' : 'Drop an image or click to upload'}
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
                  {errors.artwork && <ErrorText>{errors.artwork}</ErrorText>}
                </Field>
              </FieldGroup>
            </>
          )}

          {step === 1 && (
            <>
              <FieldGroup $cols="1fr 1fr">
                <Field>
                  <Label>Total supply</Label>
                  <Input type="number" value={form.supply} onChange={set('supply')} $invalid={!!errors.supply} />
                  {errors.supply && <ErrorText>{errors.supply}</ErrorText>}
                </Field>
                <Field>
                  <Label>Mint price (SOL)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={set('price')} $invalid={!!errors.price} />
                  {errors.price && <ErrorText>{errors.price}</ErrorText>}
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <Label><Wallet size={12} style={{ verticalAlign: -2 }} /> Creator wallet address</Label>
                  <Input value={form.wallet} onChange={set('wallet')} $invalid={!!errors.wallet} placeholder={connected ? undefined : 'Connect your wallet above, or paste an address'} />
                  {errors.wallet ? <ErrorText>{errors.wallet}</ErrorText> : <Hint>Mint proceeds and royalties are sent here.</Hint>}
                </Field>
              </FieldGroup>
            </>
          )}

          {step === 2 && (
            <>
              <FieldGroup $cols="1fr 1fr">
                <Field>
                  <Label>Mint opens — date</Label>
                  <Input type="date" min={todayStr} value={form.startDate} onChange={set('startDate')} $invalid={!!errors.startDate} />
                  {errors.startDate && <ErrorText>{errors.startDate}</ErrorText>}
                </Field>
                <Field>
                  <Label>Mint opens — time (UTC)</Label>
                  <Input type="time" value={form.startTime} onChange={set('startTime')} />
                </Field>
              </FieldGroup>
              <FieldGroup $cols="1fr 1fr">
                <Field>
                  <Label>Mint closes — date</Label>
                  <Input type="date" min={minEndDate} value={form.endDate} onChange={set('endDate')} $invalid={!!errors.endDate} />
                  {errors.endDate && <ErrorText>{errors.endDate}</ErrorText>}
                </Field>
                <Field>
                  <Label>Mint closes — time (UTC)</Label>
                  <Input type="time" value={form.endTime} onChange={set('endTime')} />
                </Field>
              </FieldGroup>
              <Hint>Leave the close date blank to keep the mint open until sold out.</Hint>
            </>
          )}

          {step === 3 && (
            <>
              <FieldGroup>
                <Field>
                  <Label>Who can mint?</Label>
                  <ToggleRow>
                    <ToggleBtn $active={form.eligibility === 'public'} onClick={() => setEligibility('public')}>
                      Public mint
                    </ToggleBtn>
                    <ToggleBtn $active={form.eligibility === 'whitelist'} onClick={() => setEligibility('whitelist')}>
                      <Users2 size={14} /> Whitelist only
                    </ToggleBtn>
                  </ToggleRow>
                </Field>
              </FieldGroup>
              {form.eligibility === 'whitelist' && (
                <FieldGroup>
                  <Field>
                    <Label>Whitelist addresses</Label>
                    <TextArea placeholder={'One wallet address per line\n7xKp...9mQ2\nBk4n...2Lw8'} value={form.whitelist} onChange={set('whitelist')} $invalid={!!errors.whitelist} />
                    {errors.whitelist ? (
                      <ErrorText>{errors.whitelist}</ErrorText>
                    ) : (
                      <Hint>{form.whitelist.split('\n').filter(Boolean).length} address(es) added — you can also upload a CSV later.</Hint>
                    )}
                  </Field>
                </FieldGroup>
              )}
              <FieldGroup>
                <Field>
                  <Label>Max mints per wallet (optional)</Label>
                  <Input type="number" min="0" placeholder="Unlimited" value={form.maxPerWallet} onChange={set('maxPerWallet')} />
                  <Hint>Enforced on-chain by the mint guard — leave blank for no limit.</Hint>
                </Field>
              </FieldGroup>
            </>
          )}

          {step === 4 && (
            <>
              <NetworkNotice />
              <ReviewRow><span>Collection</span><span>{form.name || 'Untitled collection'}</span></ReviewRow>
              <ReviewRow><span>Artwork</span><span>{artwork ? artwork.file.name : 'Not uploaded'}</span></ReviewRow>
              <ReviewRow><span>Supply</span><span>{form.supply}</span></ReviewRow>
              <ReviewRow><span>Mint price</span><span>{form.price} ◎</span></ReviewRow>
              <ReviewRow><span>Creator wallet</span><span>{form.wallet.slice(0, 6)}…{form.wallet.slice(-4)}</span></ReviewRow>
              <ReviewRow><span>Opens</span><span>{form.startDate || 'TBD'} {form.startTime}</span></ReviewRow>
              <ReviewRow><span>Closes</span><span>{form.endDate || 'Until sold out'} {form.endDate && form.endTime}</span></ReviewRow>
              <ReviewRow><span>Eligibility</span><span>{form.eligibility}</span></ReviewRow>
              <ReviewRow><span>Network</span><span>{NETWORK}</span></ReviewRow>

              {deployState === 'success' && deployResult ? (
                <DeploySuccess>
                  <Check size={18} color={colors.up} />
                  <div>
                    <div style={{ color: colors.paper, fontWeight: 600, fontSize: 13.5 }}>
                      Collection + public mint deployed on-chain
                    </div>
                    <DeployLinks>
                      <a href={explorerUrl(deployResult.collectionAddress, 'address')} target="_blank" rel="noreferrer">
                        View collection <ExternalLink size={11} />
                      </a>
                      {deployResult.candyMachineAddress && (
                        <a href={explorerUrl(deployResult.candyMachineAddress, 'address')} target="_blank" rel="noreferrer">
                          View mint contract <ExternalLink size={11} />
                        </a>
                      )}
                      <a href={explorerUrl(deployResult.signature, 'tx')} target="_blank" rel="noreferrer">
                        View transaction <ExternalLink size={11} />
                      </a>
                    </DeployLinks>
                    <DeployNote>
                      Anyone can now mint from this collection on the NFT Marketplace page — price, timing, and{' '}
                      {form.eligibility === 'whitelist' ? 'allowlist membership' : 'per-wallet limits'} are enforced
                      on-chain by Metaplex's Candy Guard program, not by this app.
                    </DeployNote>
                  </div>
                </DeploySuccess>
              ) : (
                <>
                  <Button
                    style={{ width: '100%', marginTop: 24 }}
                    onClick={handleDeploy}
                    disabled={deployBusy || !artwork}
                  >
                    {deployBusy && <SpinnerIcon size={14} style={{ marginRight: 6 }} />}
                    {deployLabel}
                  </Button>
                  {deployState === 'error' && (
                    <DeployError><AlertTriangle size={13} /> {deployError}</DeployError>
                  )}
                  {!connected && <Hint style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>Connect your wallet to deploy — it will sign and pay for the on-chain transaction.</Hint>}
                </>
              )}
            </>
          )}

          <Foot>
            <Button $variant="ghost" onClick={back} disabled={step === 0}>
              <ChevronLeft size={15} /> Back
            </Button>
            {step < steps.length - 1 && (
              <Button onClick={next}>
                Continue <ChevronRight size={15} />
              </Button>
            )}
          </Foot>
        </Card>
      </Layout>
    </Page>
  );
}
