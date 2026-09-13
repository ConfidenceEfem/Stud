import styled from 'styled-components';
import { colors, font } from '../theme';
import { PriceChange, Mono } from './Atoms';
import { useTrendingTokens } from '../hooks/useTrendingTokens';

const Rail = styled.div`
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid ${colors.stroke};
  background: ${colors.panel};
  padding: 8px 0;

  mask-image: linear-gradient(90deg, transparent, black 4%, black 96%, transparent);
`;

const Track = styled.div`
  display: flex;
  width: max-content;
  animation: marquee 42s linear infinite;
`;

const Item = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 22px;
  font-family: ${font.mono};
  font-size: 12.5px;
  white-space: nowrap;
  border-right: 1px solid ${colors.stroke};

  b {
    color: ${colors.paper};
    font-weight: 600;
  }
`;

export default function TickerRail() {
  const { tokens } = useTrendingTokens(20);
  const doubled = [...tokens, ...tokens];
  return (
    <Rail>
      <Track>
        {doubled.map((t, i) => (
          <Item key={i}>
            <b>${t.ticker}</b>
            <Mono>{t.price < 0.01 ? t.price.toExponential(2) : `$${t.price.toFixed(2)}`}</Mono>
            <PriceChange $value={t.change}>{Math.abs(t.change).toFixed(1)}%</PriceChange>
          </Item>
        ))}
      </Track>
    </Rail>
  );
}
