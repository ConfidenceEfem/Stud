import styled from 'styled-components';
import { Flame } from 'lucide-react';
import { Page } from '../components/Layout';
import { PriceChange, Sparkline, Mono, Eyebrow, LiveIndicator } from '../components/Atoms';
import { colors, font } from '../theme';
import { useSearch } from '../context/SearchContext';
import { matchesQuery } from '../utils/search';
import { useTrendingTokens } from '../hooks/useTrendingTokens';
import { flatSpark } from '../utils/spark';

const Title = styled.h1`
  font-size: 42px;
  color: ${colors.paper};
  margin-top: 10px;
`;

const Sub = styled.p`
  color: ${colors.muted};
  font-size: 14px;
  margin-top: 8px;
`;

const Board = styled.div`
  margin-top: 30px;
  border: 1px solid ${colors.stroke};
  border-radius: 16px;
  overflow: hidden;
`;

const HeadRow = styled.div`
  display: grid;
  grid-template-columns: 50px 1.8fr 1fr 90px 1fr 1fr 1fr;
  gap: 10px;
  padding: 12px 20px;
  background: ${colors.panelRaised};
  font-family: ${font.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${colors.faint};

  @media (max-width: 800px) {
    display: none;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 50px 1.8fr 1fr 90px 1fr 1fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid ${colors.stroke};
  background: ${colors.panel};

  &:hover { background: ${colors.panelRaised}; }

  @media (max-width: 800px) {
    grid-template-columns: 40px 1fr auto;
  }
`;

const RankCell = styled.div`
  font-family: ${font.mono};
  font-size: 13px;
  color: ${(p) => (p.$top ? colors.stamp : colors.faint)};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NameCell = styled.div`
  display: flex;
  flex-direction: column;
  b { font-size: 14px; color: ${colors.paper}; }
  small { font-family: ${font.mono}; font-size: 11px; color: ${colors.faint}; }
`;

const PriceCell = styled.span`
  font-family: ${font.mono};
  font-size: 13px;
  color: ${colors.paper};
`;

const Hide = styled.span`
  @media (max-width: 800px) { display: none; }
`;

export default function TrendingTokens() {
  const { query } = useSearch();
  const { tokens, live, loading, source } = useTrendingTokens(20);
  const filtered = tokens.filter((t) => matchesQuery(query, t.ticker, t.name));

  return (
    <Page>
      <Eyebrow><Flame size={12} /> Updated every 30s</Eyebrow>
      <Title>Top 20 trending tokens</Title>
      <Sub>
        Ranked by 24h volume{live ? ` · live from ${source === 'birdeye' ? 'Birdeye' : 'DexScreener'}` : ' across every meme launched on STUB.'}
      </Sub>
      <div style={{ marginTop: 12 }}>
        <LiveIndicator live={live} loading={loading} label={source === 'birdeye' ? 'Birdeye' : source === 'dexscreener' ? 'DexScreener' : undefined} />
      </div>

      <Board>
        <HeadRow>
          <span>Rank</span>
          <span>Token</span>
          <span>Price</span>
          <span>24h</span>
          <span>Chart</span>
          <span>Volume</span>
          <span>Market cap</span>
        </HeadRow>
        {filtered.length ? (
          filtered.map((t) => (
            <Row key={t.address || t.ticker}>
              <RankCell $top={t.rank <= 3}>#{t.rank}</RankCell>
              <NameCell>
                <b>${t.ticker}</b>
                <small>{t.name}</small>
              </NameCell>
              <PriceCell>{t.price < 0.01 ? t.price.toExponential(2) : `$${t.price.toFixed(2)}`}</PriceCell>
              <PriceChange $value={t.change}>{Math.abs(t.change).toFixed(1)}%</PriceChange>
              <Hide><Sparkline data={t.spark || flatSpark(t.change >= 0)} positive={t.change >= 0} /></Hide>
              <Hide><Mono style={{ color: colors.muted, fontSize: 13 }}>{t.volume}</Mono></Hide>
              <Hide><Mono style={{ color: colors.muted, fontSize: 13 }}>{t.mcap}</Mono></Hide>
            </Row>
          ))
        ) : (
          <div style={{ padding: '20px', color: colors.faint, fontFamily: font.mono, fontSize: 13 }}>
            No tokens match "{query}".
          </div>
        )}
      </Board>
    </Page>
  );
}
