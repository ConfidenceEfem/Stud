import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Page, Section, SectionHead, SectionTitle, SectionLink, ScrollRow, Panel } from '../components/Layout';
import { Eyebrow, Button, Mono, PriceChange, Sparkline } from '../components/Atoms';
import NFTCard from '../components/NFTCard';
import MemeCard from '../components/MemeCard';
import { colors, font } from '../theme';
import { useSearch } from '../context/SearchContext';
import { matchesQuery } from '../utils/search';
import { useTrendingTokens } from '../hooks/useTrendingTokens';
import { useNftCollections } from '../hooks/useNftCollections';
import { useMemeTokens } from '../hooks/useMemeTokens';
import { useNftMintHandler } from '../hooks/useNftMintHandler';
import { flatSpark } from '../utils/spark';

const Hero = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 40px;
  align-items: center;
  padding: 44px 0 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Headline = styled.h1`
  font-size: 68px;
  line-height: 0.96;
  color: ${colors.paper};

  span {
    color: ${colors.stamp};
  }

  @media (max-width: 640px) {
    font-size: 44px;
  }
`;

const Sub = styled.p`
  font-size: 16px;
  color: ${colors.muted};
  max-width: 44ch;
  margin-top: 18px;
  line-height: 1.55;
`;

const CTAs = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
`;

const StatStrip = styled.div`
  display: flex;
  gap: 0;
  margin-top: 44px;
  border-top: 1px solid ${colors.stroke};
  border-bottom: 1px solid ${colors.stroke};
`;

const StatItem = styled.div`
  flex: 1;
  padding: 18px 24px;
  border-right: 1px solid ${colors.stroke};
  &:last-child { border-right: none; }
`;

const StatNum = styled.div`
  font-family: ${font.mono};
  font-size: 22px;
  color: ${colors.paper};
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${colors.faint};
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 4px;
`;

const HeroTicket = styled(Panel)`
  padding: 0;
  overflow: hidden;
`;

const HTHead = styled.div`
  padding: 16px 20px;
  border-bottom: 1.5px dashed ${colors.stroke};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HTRow = styled(Link)`
  display: grid;
  grid-template-columns: 26px 1fr auto auto;
  align-items: center;
  gap: 12px;
  padding: 11px 20px;
  border-bottom: 1px solid ${colors.stroke};
  &:last-child { border-bottom: none; }
  &:hover { background: ${colors.panelRaised}; }
`;

const Rank = styled.span`
  font-family: ${font.mono};
  font-size: 12px;
  color: ${colors.faint};
`;

const TokName = styled.span`
  display: flex;
  flex-direction: column;
  b { font-size: 13.5px; color: ${colors.paper}; }
  small { font-family: ${font.mono}; font-size: 10.5px; color: ${colors.faint}; }
`;

export default function Discover() {
  const { query } = useSearch();
  const searching = !!query.trim();

  const { tokens: trendingTokens } = useTrendingTokens(20);
  const { collections: nftCollections } = useNftCollections();
  const { tokens: memeLaunches } = useMemeTokens();
  const handleMint = useNftMintHandler();

  const matchedTokens = trendingTokens.filter((t) => matchesQuery(query, t.ticker, t.name));
  const matchedNFTs = nftCollections.filter((n) => matchesQuery(query, n.name, n.creator));
  const matchedMemes = memeLaunches.filter((m) => matchesQuery(query, m.ticker, m.name));

  const top6 = matchedTokens.slice(0, 6);
  const featuredNFTs = matchedNFTs.slice(0, 3);
  const featuredMemes = matchedMemes.slice(0, 4);

  return (
    <Page>
      <Hero>
        <div>
          <Eyebrow><Sparkles size={12} /> Solana mint & launch platform</Eyebrow>
          <Headline style={{ marginTop: 14 }}>
            Mint the <span>moment.</span><br />Launch the <span>meme.</span>
          </Headline>
          <Sub>
            One ticket, two doors. Drop a whitelisted NFT collection with real mint
            timing, or send a meme straight to a bonding curve — no separate
            platforms, no separate wallets.
          </Sub>
          <CTAs>
            <Button as={Link} to="/create">Create an NFT drop</Button>
            <Button as={Link} to="/launch" $variant="outline">Launch a meme</Button>
          </CTAs>

          <StatStrip>
            <StatItem>
              <StatNum>128.6K ◎</StatNum>
              <StatLabel>24h volume</StatLabel>
            </StatItem>
            <StatItem>
              <StatNum>342</StatNum>
              <StatLabel>Live mints</StatLabel>
            </StatItem>
            <StatItem>
              <StatNum>1,904</StatNum>
              <StatLabel>Tokens launched</StatLabel>
            </StatItem>
          </StatStrip>
        </div>

        <HeroTicket>
          <HTHead>
            <Eyebrow>{searching ? `Matches for "${query}"` : 'Top movers'}</Eyebrow>
            {!searching && <SectionLink as={Link} to="/trending">Full board <ArrowUpRight size={11} /></SectionLink>}
          </HTHead>
          {top6.length ? (
            top6.map((t) => (
              <HTRow to="/trending" key={t.address || t.ticker}>
                <Rank>#{t.rank}</Rank>
                <TokName>
                  <b>${t.ticker}</b>
                  <small>{t.name}</small>
                </TokName>
                <Sparkline data={t.spark || flatSpark(t.change >= 0)} positive={t.change >= 0} width={56} height={22} />
                <PriceChange $value={t.change}>{Math.abs(t.change).toFixed(1)}%</PriceChange>
              </HTRow>
            ))
          ) : (
            <div style={{ padding: '18px 20px', color: colors.faint, fontFamily: font.mono, fontSize: 12.5 }}>
              No tokens match "{query}".
            </div>
          )}
        </HeroTicket>
      </Hero>

      <Section>
        <SectionHead>
          <SectionTitle>{searching ? 'Matching NFT drops' : 'Featured NFT drops'}</SectionTitle>
          {!searching && <SectionLink as={Link} to="/nfts">View all <ArrowUpRight size={11} /></SectionLink>}
        </SectionHead>
        {featuredNFTs.length ? (
          <ScrollRow>
            {featuredNFTs.map((n) => <NFTCard key={n.id} item={n} onMint={handleMint} />)}
          </ScrollRow>
        ) : (
          <p style={{ color: colors.faint, fontFamily: font.mono, fontSize: 13 }}>No NFT collections match "{query}".</p>
        )}
      </Section>

      <Section>
        <SectionHead>
          <SectionTitle>{searching ? 'Matching meme launches' : 'Fresh meme launches'}</SectionTitle>
          {!searching && <SectionLink as={Link} to="/memes">View all <ArrowUpRight size={11} /></SectionLink>}
        </SectionHead>
        {featuredMemes.length ? (
          <ScrollRow>
            {featuredMemes.map((m) => <MemeCard key={m.id} item={m} />)}
          </ScrollRow>
        ) : (
          <p style={{ color: colors.faint, fontFamily: font.mono, fontSize: 13 }}>No meme tokens match "{query}".</p>
        )}
      </Section>
    </Page>
  );
}
