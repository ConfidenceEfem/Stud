import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Rocket, Droplets } from 'lucide-react';
import { Ticket, TicketMedia, TicketStub, TicketRow } from './Ticket';
import { Badge, statusBadgeProps, PriceChange, Sparkline, Button } from './Atoms';
import { colors, font } from '../theme';
import { useWallet } from '../context/WalletContext';
import { getPoolReserves } from '../services/tokenSwap';
import LiquiditySwapModal from './LiquiditySwapModal';

const Name = styled.h3`
  font-size: 18px;
  color: ${colors.paper};
`;

const CardImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Ticker = styled.span`
  font-family: ${font.mono};
  font-size: 11.5px;
  color: ${colors.faint};
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatLabel = styled.span`
  font-size: 9.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.faint};
`;

const StatValue = styled.span`
  font-family: ${font.mono};
  font-size: 12.5px;
  color: ${colors.paper};
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 10px;
  margin: 14px 0;
`;

const CurveTrack = styled.div`
  height: 5px;
  border-radius: 3px;
  background: ${colors.stroke};
  overflow: hidden;
`;

const CurveFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$pct >= 100 ? colors.up : colors.stamp)};
`;

export default function MemeCard({ item }) {
  const { address, connected } = useWallet();
  const isRealToken = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(item.id);
  const isCreator = connected && item.creator && address === item.creator;
  const hasOwnPool = item.status === 'graduated' && item.hasOwnPool;
  const canJupiterTrade = isRealToken && item.status === 'graduated' && !item.hasOwnPool;

  const [modalMode, setModalMode] = useState(null); // null | 'seed' | 'swap'
  const [reserves, setReserves] = useState(null);

  useEffect(() => {
    if (hasOwnPool && isRealToken) {
      getPoolReserves(item.id).then(setReserves).catch(() => setReserves(null));
    }
  }, [hasOwnPool, isRealToken, item.id]);

  const handleTrade = () => {
    if (!canJupiterTrade) return;
    // Jupiter aggregates every DEX pool on Solana (Raydium, Orca, Meteora,
    // etc) — linking to its swap UI with the token pre-filled is a real,
    // working trade action with no custom integration needed, as long as
    // the token actually has a live pool on a DEX Jupiter routes through.
    window.open(`https://jup.ag/swap/SOL-${item.id}`, '_blank', 'noopener,noreferrer');
  };

  let buttonLabel = `Trade $${item.ticker}`;
  let buttonAction = null;
  let buttonDisabled = true;

  if (hasOwnPool) {
    buttonLabel = `Buy $${item.ticker}`;
    buttonAction = () => setModalMode('swap');
    buttonDisabled = false;
  } else if (canJupiterTrade) {
    buttonLabel = `Trade $${item.ticker} on Jupiter`;
    buttonAction = handleTrade;
    buttonDisabled = false;
  } else if (item.status === 'bonding' && isRealToken && isCreator) {
    buttonLabel = 'Seed liquidity pool';
    buttonAction = () => setModalMode('seed');
    buttonDisabled = false;
  } else if (item.status === 'bonding') {
    buttonLabel = 'No liquidity pool yet';
  }

  return (
    <>
      <Ticket>
        <TicketMedia $from={colors.panelRaised} $to={colors.panel} $h="96px">
          {item.image ? <CardImg src={item.image} alt={item.name} /> : <Rocket size={26} color="rgba(255,204,1,0.5)" strokeWidth={1.5} />}
          <Badge {...statusBadgeProps(item.status)} style={{ position: 'absolute', top: 12, left: 12 }}>
            {item.status}
          </Badge>
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <Sparkline data={item.sparkArr || sparkFallback} positive={item.change >= 0} />
          </div>
        </TicketMedia>
        <TicketStub style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <TicketRow>
            <div>
              <Name>${item.ticker}</Name>
              <Ticker>{item.name}</Ticker>
            </div>
            <PriceChange $value={item.change}>{Math.abs(item.change).toFixed(1)}%</PriceChange>
          </TicketRow>

          <StatGrid>
            <Stat><StatLabel>Price</StatLabel><StatValue>{item.priceUnit === 'SOL' ? `${item.price.toFixed(6)} ◎` : `$${item.price}`}</StatValue></Stat>
            <Stat><StatLabel>Market cap</StatLabel><StatValue>{item.mcap}</StatValue></Stat>
            <Stat><StatLabel>Liquidity</StatLabel><StatValue style={{ fontSize: 10.5 }}>{item.liquidity}</StatValue></Stat>
            <Stat><StatLabel>FDV</StatLabel><StatValue>{item.fdv}</StatValue></Stat>
          </StatGrid>

          <StatLabel>Bonding curve — {item.progress}%</StatLabel>
          <CurveTrack style={{ marginTop: 6, marginBottom: 14 }}>
            <CurveFill $pct={item.progress} />
          </CurveTrack>

          <Button
            $sm
            disabled={buttonDisabled}
            onClick={buttonAction || undefined}
            style={{ width: '100%', marginTop: 'auto' }}
            title={
              hasOwnPool
                ? 'Buy with devnet SOL against this token\'s real pool'
                : canJupiterTrade
                  ? 'Opens Jupiter in a new tab'
                  : item.status === 'bonding' && isCreator
                    ? 'Deposit your token + SOL to create a real devnet pool'
                    : 'Not tradeable yet — no live pool'
            }
          >
            {item.status === 'bonding' && isCreator && !hasOwnPool && <Droplets size={13} style={{ marginRight: 6 }} />}
            {buttonLabel}
          </Button>
        </TicketStub>
      </Ticket>

      {modalMode && (
        <LiquiditySwapModal
          mode={modalMode}
          token={item}
          reserves={reserves}
          onClose={() => setModalMode(null)}
          onDone={() => {
            getPoolReserves(item.id).then(setReserves).catch(() => {});
          }}
        />
      )}
    </>
  );
}

const sparkFallback = Array.from({ length: 12 }, (_, i) => ({ i, v: 40 + Math.sin(i) * 10 }));
