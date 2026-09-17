import styled from 'styled-components';
import { Image as ImageIcon, Lock } from 'lucide-react';
import { Ticket, TicketMedia, TicketStub } from './Ticket';
import { Mono, Badge } from './Atoms';
import { colors, font } from '../theme';

const Img = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Name = styled.div`
  font-size: 14px;
  color: ${colors.paper};
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Id = styled.div`
  font-family: ${font.mono};
  font-size: 10.5px;
  color: ${colors.faint};
  margin-top: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Renders a single asset as returned by Helius's DAS API for a connected
// wallet — real image, real name, real mint address. No price/status/
// eligibility fields here because those are launch-config, not ownership.
export default function WalletAssetCard({ item }) {
  return (
    <Ticket>
      <TicketMedia $h="150px">
        {item.image ? <Img src={item.image} alt={item.name} /> : <ImageIcon size={28} color="rgba(255,255,255,0.4)" strokeWidth={1.4} />}
        {item.compressed && (
          <Badge $color={colors.muted} style={{ position: 'absolute', top: 12, left: 12 }}>
            compressed
          </Badge>
        )}
        {item.frozen && (
          <Badge $color={colors.stamp} style={{ position: 'absolute', top: 12, right: 12 }}>
            <Lock size={10} /> frozen
          </Badge>
        )}
      </TicketMedia>
      <TicketStub>
        <Name title={item.name}>{item.name}</Name>
        <Id title={item.id}><Mono>{item.id.slice(0, 6)}…{item.id.slice(-6)}</Mono></Id>
      </TicketStub>
    </Ticket>
  );
}
