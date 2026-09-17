import { useState } from 'react';
import styled from 'styled-components';
import { Copy, Rocket, Image as ImageIcon, Activity as ActivityIcon, Check, Pencil, X, Wallet as WalletIcon, Coins } from 'lucide-react';
import { Page, Grid } from '../components/Layout';
import { Avatar, Button, LiveIndicator } from '../components/Atoms';
import WalletAssetCard from '../components/WalletAssetCard';
import { colors, font, radius } from '../theme';
import { useWallet } from '../context/WalletContext';
import { useWalletPortfolio } from '../hooks/useWalletPortfolio';

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px 0;
  border-bottom: 1px solid ${colors.stroke};
  flex-wrap: wrap;
`;

const Username = styled.h1`
  font-size: 34px;
  color: ${colors.paper};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const EditBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: ${colors.faint};
  &:hover { color: ${colors.stamp}; background: ${colors.panelRaised}; }
`;

const UsernameForm = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UsernameInput = styled.input`
  font-family: ${font.mono};
  font-size: 20px;
  background: ${colors.panelRaised};
  border: 1px solid ${colors.stamp};
  border-radius: ${radius.md};
  padding: 6px 10px;
  color: ${colors.paper};
  width: 220px;
  &:focus { outline: none; }
`;

const WalletRow = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${font.mono};
  font-size: 12.5px;
  color: ${colors.faint};
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  border-radius: ${radius.pill};
  padding: 5px 10px;
  margin-top: 8px;

  &:hover { color: ${colors.stamp}; border-color: ${colors.stamp}; }
`;

const Bio = styled.p`
  color: ${colors.muted};
  font-size: 13.5px;
  margin-top: 10px;
  max-width: 46ch;
`;

const StatBlock = styled.div`
  display: flex;
  gap: 28px;
  margin-left: auto;

  @media (max-width: 700px) {
    margin-left: 0;
  }
`;

const Stat = styled.div`
  text-align: right;
  div:first-child { font-family: ${font.mono}; font-size: 20px; color: ${colors.paper}; }
  div:last-child { font-size: 10.5px; color: ${colors.faint}; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 2px; }
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  margin: 26px 0 24px;
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: ${radius.pill};
  font-size: 13px;
  font-weight: 600;
  border: 1px solid ${(p) => (p.$active ? colors.stamp : colors.stroke)};
  background: ${(p) => (p.$active ? 'rgba(255,204,1,0.1)' : 'transparent')};
  color: ${(p) => (p.$active ? colors.stamp : colors.muted)};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ActivityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid ${colors.stroke};

  span.label { flex: 1; font-size: 13.5px; color: ${colors.paper}; }
  span.time { font-family: ${font.mono}; font-size: 11.5px; color: ${colors.faint}; }
`;

const ActIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.panelRaised};
  color: ${colors.stamp};
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 100px 20px;
`;

const EmptyIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${colors.panel};
  border: 1px solid ${colors.stroke};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.stamp};
  margin-bottom: 4px;
`;

const EmptyTitle = styled.h2`
  font-size: 26px;
  color: ${colors.paper};
`;

const EmptySub = styled.p`
  color: ${colors.muted};
  font-size: 13.5px;
  max-width: 40ch;
`;

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
`;

const TokenRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid ${colors.stroke};

  .amount, .value {
    font-family: ${font.mono};
    font-size: 13px;
    color: ${colors.paper};
    text-align: right;
    min-width: 90px;
  }
  .value { color: ${colors.muted}; }
`;

const TokenIdent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  .symbol { font-size: 13.5px; color: ${colors.paper}; font-weight: 600; }
  .name { font-family: ${font.mono}; font-size: 11px; color: ${colors.faint}; }
`;

const TokenImg = styled.img`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
`;

const iconFor = (type) => (type === 'mint' ? <ImageIcon size={14} /> : type === 'launch' ? <Rocket size={14} /> : <ActivityIcon size={14} />);

export default function Profile() {
  const { connected, address, username, openPicker, saveUsername } = useWallet();
  const [tab, setTab] = useState('nfts');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const { data, loading, error, missingApiKey } = useWalletPortfolio(connected ? address : null);

  if (!connected) {
    return (
      <Page>
        <EmptyState>
          <EmptyIcon><WalletIcon size={24} /></EmptyIcon>
          <EmptyTitle>Connect your wallet</EmptyTitle>
          <EmptySub>Connect a wallet to see your username, your minted NFTs, launched tokens, and activity.</EmptySub>
          <Button onClick={openPicker} style={{ marginTop: 8 }}>Connect wallet</Button>
        </EmptyState>
      </Page>
    );
  }

  const copyWallet = () => {
    navigator.clipboard?.writeText(address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const startEditing = () => {
    setDraft(username);
    setEditing(true);
  };

  const submitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed.length >= 3) {
      saveUsername(trimmed);
      setEditing(false);
    }
  };

  const avatarLetter = (username || address)[0].toUpperCase();
  const nfts = data?.nfts ?? [];
  const tokens = data?.tokens ?? [];
  const activity = data?.activity ?? [];

  return (
    <Page>
      <Header>
        <Avatar $size="72px">{avatarLetter}</Avatar>
        <div>
          {editing ? (
            <UsernameForm>
              <UsernameInput
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitEdit();
                  if (e.key === 'Escape') setEditing(false);
                }}
              />
              <EditBtn onClick={submitEdit} title="Save"><Check size={16} /></EditBtn>
              <EditBtn onClick={() => setEditing(false)} title="Cancel"><X size={16} /></EditBtn>
            </UsernameForm>
          ) : (
            <Username>
              {username}
              <EditBtn onClick={startEditing} title="Edit username"><Pencil size={14} /></EditBtn>
            </Username>
          )}
          <WalletRow onClick={copyWallet}>
            {address.slice(0, 6)}…{address.slice(-6)}
            {copied ? <Check size={12} color={colors.up} /> : <Copy size={12} />}
          </WalletRow>
          <Bio><LiveIndicator live={!missingApiKey && !error && !!data} loading={loading} label="wallet data" /></Bio>
        </div>
        <StatBlock>
          <Stat><div>{loading ? '—' : nfts.length}</div><div>NFTs held</div></Stat>
          <Stat><div>{loading ? '—' : tokens.length}</div><div>Tokens held</div></Stat>
          <Stat><div>{loading ? '—' : (data?.solBalance ?? 0).toFixed(2)} ◎</div><div>SOL balance</div></Stat>
        </StatBlock>
      </Header>

      {missingApiKey && (
        <EmptyState style={{ padding: '60px 20px' }}>
          <EmptyIcon><WalletIcon size={24} /></EmptyIcon>
          <EmptyTitle style={{ fontSize: 20 }}>Wallet data isn't wired up yet</EmptyTitle>
          <EmptySub>
            Set <code>VITE_HELIUS_API_KEY</code> in <code>.env.local</code> (free tier at{' '}
            <a href="https://dev.helius.xyz" target="_blank" rel="noreferrer" style={{ color: colors.stamp }}>dev.helius.xyz</a>) to pull this
            wallet's real NFTs, tokens, and activity.
          </EmptySub>
        </EmptyState>
      )}

      {!missingApiKey && error && (
        <EmptyState style={{ padding: '60px 20px' }}>
          <EmptyTitle style={{ fontSize: 20 }}>Couldn't load wallet data</EmptyTitle>
          <EmptySub>{error.message || 'Something went wrong talking to Helius. Try refreshing.'}</EmptySub>
        </EmptyState>
      )}

      {!missingApiKey && !error && (
        <>
          <Tabs>
            <Tab $active={tab === 'nfts'} onClick={() => setTab('nfts')}><ImageIcon size={14} /> My NFTs ({nfts.length})</Tab>
            <Tab $active={tab === 'tokens'} onClick={() => setTab('tokens')}><Coins size={14} /> My Tokens ({tokens.length})</Tab>
            <Tab $active={tab === 'activity'} onClick={() => setTab('activity')}><ActivityIcon size={14} /> Activity</Tab>
          </Tabs>

          {tab === 'nfts' && (
            nfts.length ? (
              <Grid $cols={3}>
                {nfts.map((n) => <WalletAssetCard key={n.id} item={n} />)}
              </Grid>
            ) : (
              <EmptySub style={{ padding: '40px 0' }}>No NFTs found in this wallet{data?.total === undefined ? '' : ' yet'}.</EmptySub>
            )
          )}

          {tab === 'tokens' && (
            tokens.length ? (
              <TokenList>
                {tokens.map((t) => (
                  <TokenRow key={t.mint}>
                    <TokenIdent>
                      {t.image ? <TokenImg src={t.image} alt={t.symbol} /> : <Coins size={18} color={colors.faint} />}
                      <div>
                        <div className="symbol">${t.symbol}</div>
                        <div className="name">{t.name}</div>
                      </div>
                    </TokenIdent>
                    <div className="amount">{t.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                    <div className="value">{t.valueUsd != null ? `$${t.valueUsd.toFixed(2)}` : '—'}</div>
                  </TokenRow>
                ))}
              </TokenList>
            ) : (
              <EmptySub style={{ padding: '40px 0' }}>No SPL tokens found in this wallet yet.</EmptySub>
            )
          )}

          {tab === 'activity' && (
            activity.length ? (
              <ActivityList>
                {activity.map((a) => (
                  <ActivityRow key={a.id}>
                    <ActIcon>{iconFor(a.type)}</ActIcon>
                    <span className="label">{a.label}</span>
                    <span className="time">{a.time}</span>
                  </ActivityRow>
                ))}
              </ActivityList>
            ) : (
              <EmptySub style={{ padding: '40px 0' }}>No recent activity found for this wallet.</EmptySub>
            )
          )}
        </>
      )}
    </Page>
  );
}

