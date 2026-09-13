import styled from 'styled-components';
import { Ticket as TicketIcon } from 'lucide-react';
import { colors, font } from '../theme';

const Wrap = styled.footer`
  border-top: 1px solid ${colors.stroke};
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 1240px;
  margin: 0 auto;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${font.display};
  font-size: 18px;
  color: ${colors.muted};

  svg { color: ${colors.stamp}; }
`;

const Note = styled.p`
  font-family: ${font.mono};
  font-size: 11.5px;
  color: ${colors.faint};
`;

export default function Footer() {
  return (
    <Wrap>
      <Brand><TicketIcon size={16} /> STUB</Brand>
      {/* <Note>Built on Solana · Demo data — connect an API to go live</Note> */}
    </Wrap>
  );
}
