import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page, Grid } from '../components/Layout';
import { Button, LiveIndicator } from '../components/Atoms';
import MemeCard from '../components/MemeCard';
import { colors, font } from '../theme';
import { useSearch } from '../context/SearchContext';
import { matchesQuery } from '../utils/search';
import { useMemeTokens } from '../hooks/useMemeTokens';

const Head = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 42px;
  color: ${colors.paper};
`;

const Sub = styled.p`
  color: ${colors.muted};
  font-size: 14px;
  margin-top: 8px;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 28px 0 26px;
`;

const Tab = styled.button`
  font-family: ${font.mono};
  font-size: 12px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$active ? colors.stamp : colors.stroke)};
  background: ${(p) => (p.$active ? 'rgba(255,204,1,0.1)' : 'transparent')};
  color: ${(p) => (p.$active ? colors.stamp : colors.muted)};

  &:hover { color: ${colors.stamp}; border-color: ${colors.stamp}; }
`;

const statusTabs = ['all', 'bonding', 'graduated'];

export default function MemeMarket() {
  const [status, setStatus] = useState('all');
  const { query } = useSearch();
  const { tokens: memeLaunches, live, loading } = useMemeTokens();

  const filtered = useMemo(
    () =>
      memeLaunches.filter(
        (m) => (status === 'all' || m.status === status) && matchesQuery(query, m.ticker, m.name)
      ),
    [memeLaunches, status, query]
  );

  return (
    <Page>
      <Head>
        <div>
          <Title>Meme marketplace</Title>
          <Sub>{memeLaunches.length} tokens · live supply, liquidity & FDV</Sub>
          <div style={{ marginTop: 10 }}>
            <LiveIndicator live={live} loading={loading} label="DexScreener" />
          </div>
        </div>
        <Button as={Link} to="/launch"><Plus size={15} /> Launch a meme</Button>
      </Head>

      <FilterBar>
        {statusTabs.map((s) => (
          <Tab key={s} $active={status === s} onClick={() => setStatus(s)}>{s}</Tab>
        ))}
      </FilterBar>

      {filtered.length ? (
        <Grid $cols={3}>
          {filtered.map((m) => <MemeCard key={m.id} item={m} />)}
        </Grid>
      ) : (
        <p style={{ color: colors.faint, fontFamily: font.mono, fontSize: 13 }}>
          {query ? `No tokens match "${query}".` : 'No tokens match those filters yet.'}
        </p>
      )}
    </Page>
  );
}
