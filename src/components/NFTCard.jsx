import { useState } from 'react';
import styled from 'styled-components';
import { Image, Users, Clock, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Ticket, TicketMedia, TicketStub, TicketRow } from './Ticket';
import { Badge, statusBadgeProps, Mono, Button } from './Atoms';
import { colors, font } from '../theme';

const CardImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Name = styled.h3`
  font-size: 19px;
  color: ${colors.paper};
`;

const Creator = styled.p`
  font-family: ${font.mono};
  font-size: 11.5px;
  color: ${colors.faint};
  margin-top: 2px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StatLabel = styled.span`
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.faint};
`;

const StatValue = styled.span`
  font-family: ${font.mono};
  font-size: 13px;
  color: ${colors.paper};
`;

const ProgressTrack = styled.div`
  height: 5px;
  border-radius: 3px;
  background: ${colors.stroke};
  overflow: hidden;
  margin: 12px 0 4px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: ${(p) => (p.$pct >= 100 ? colors.up : colors.stamp)};
`;

const fmtTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const MintNote = styled.p`
  display: flex;
  gap: 6px;
  margin-top: 8px;
  font-size: 10.5px;
  line-height: 1.4;
  color: ${(p) => (p.$warn ? colors.stamp : colors.down)};
`;

export default function NFTCard({ item, onMint }) {
  const pct = Math.round((item.minted / item.supply) * 100);
  const [state, setState] = useState('idle'); // idle | minting | success | error | forbidden
  const [message, setMessage] = useState('');

  const handleMint = async () => {
    if (!onMint) return;
    setState('minting');
    setMessage('');
    try {
      await onMint(item);
      setState('success');
    } catch (err) {
      const infoOnly = ['NotCollectionAuthorityError', 'NoPublicMintError', 'NotEligibleError'].includes(err?.name);
      setState(infoOnly ? 'forbidden' : 'error');
      setMessage(err?.message || 'Mint failed — see console for details.');
    }
  };

  const mintLabel = {
    idle: 'Mint now',
    minting: 'Minting…',
    success: 'Minted ✓',
    error: 'Retry mint',
    forbidden: 'Not eligible',
  }[state];

  return (
    <Ticket>
      <TicketMedia $from={item.palette[0]} $to={item.palette[1]} $h="150px">
        {item.image ? <CardImg src={item.image} alt={item.name} /> : <Image size={30} color="rgba(255,255,255,0.55)" strokeWidth={1.4} />}
        <Badge
          {...statusBadgeProps(item.status)}
          style={{ position: 'absolute', top: 12, left: 12 }}
        >
          {item.status}
        </Badge>
      </TicketMedia>
      <TicketStub style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TicketRow>
          <div>
            <Name>{item.name}</Name>
            <Creator>by {item.creator}</Creator>
          </div>
          <Badge $color={colors.muted}>
            <Users size={11} style={{ marginRight: 2 }} /> {item.eligibility}
          </Badge>
        </TicketRow>

        <ProgressTrack>
          <ProgressFill $pct={pct} />
        </ProgressTrack>
        <StatLabel>{item.minted.toLocaleString()} / {item.supply.toLocaleString()} minted</StatLabel>

        <TicketRow style={{ marginTop: 14 }}>
          <Stat>
            <StatLabel>Mint price</StatLabel>
            <StatValue>{item.price} ◎</StatValue>
          </Stat>
          <Stat style={{ alignItems: 'flex-end' }}>
            <StatLabel><Clock size={10} style={{ verticalAlign: -1 }} /> Opens</StatLabel>
            <StatValue>{fmtTime(item.startTime)}</StatValue>
          </Stat>
        </TicketRow>

        <Button
          $sm
          $variant={item.status === 'sold out' ? 'ghost' : 'primary'}
          disabled={item.status === 'sold out' || state === 'minting'}
          onClick={handleMint}
          style={{ marginTop: 16, width: '100%' }}
        >
          {state === 'minting' && <Loader2 size={13} className="spin" style={{ marginRight: 6, animation: 'spin 0.8s linear infinite' }} />}
          {state === 'success' && <Check size={13} style={{ marginRight: 6 }} />}
          {item.status === 'live' ? mintLabel : item.status === 'upcoming' ? 'Join whitelist' : 'Sold out'}
        </Button>
        {(state === 'error' || state === 'forbidden') && (
          <MintNote $warn={state === 'forbidden'}>
            <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} /> {message}
          </MintNote>
        )}
      </TicketStub>
    </Ticket>
  );
}
