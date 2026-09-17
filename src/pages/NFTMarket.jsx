import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Page, Grid } from '../components/Layout';
import { Button, LiveIndicator } from '../components/Atoms';
import NFTCard from '../components/NFTCard';
import { useNftMintHandler } from '../hooks/useNftMintHandler';
import { colors, font } from '../theme';
import { useSearch } from '../context/SearchContext';
import { matchesQuery } from '../utils/search';
import { useNftCollections } from '../hooks/useNftCollections';

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
  flex-wrap: wrap;
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

const Sep = styled.div`
  width: 1px;
  height: 20px;
  background: ${colors.stroke};
  margin: 0 4px;
`;

const statusTabs = ['all', 'live', 'upcoming', 'sold out'];
const eligTabs = ['all', 'public', 'whitelist'];

export default function NFTMarket() {
  const [status, setStatus] = useState('all');
  const [elig, setElig] = useState('all');
  const { query } = useSearch();
  const { collections: nftCollections, live, loading } = useNftCollections();
  const handleMint = useNftMintHandler();

  const filtered = useMemo(
    () =>
      nftCollections.filter(
        (n) =>
          (status === 'all' || n.status === status) &&
          (elig === 'all' || n.eligibility === elig) &&
          matchesQuery(query, n.name, n.creator)
      ),
    [nftCollections, status, elig, query]
  );

  return (
    <Page>
      <Head>
        <div>
          <Title>NFT marketplace</Title>
          <Sub>{nftCollections.length} collections · timed mints, wallet-gated whitelists</Sub>
          <div style={{ marginTop: 10 }}>
            <LiveIndicator live={live} loading={loading} label="on-chain" />
          </div>
        </div>
        <Button as={Link} to="/create"><Plus size={15} /> Create a drop</Button>
      </Head>

      <FilterBar>
        {statusTabs.map((s) => (
          <Tab key={s} $active={status === s} onClick={() => setStatus(s)}>{s}</Tab>
        ))}
        <Sep />
        {eligTabs.map((e) => (
          <Tab key={e} $active={elig === e} onClick={() => setElig(e)}>{e}</Tab>
        ))}
      </FilterBar>

      {filtered.length ? (
        <Grid $cols={3}>
          {filtered.map((n) => <NFTCard key={n.id} item={n} onMint={handleMint} />)}
        </Grid>
      ) : (
        <p style={{ color: colors.faint, fontFamily: font.mono, fontSize: 13 }}>
          {query ? `No collections match "${query}".` : 'No collections match those filters yet.'}
        </p>
      )}
    </Page>
  );
}
