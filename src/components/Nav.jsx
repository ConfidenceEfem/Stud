import styled from 'styled-components';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, X, LogOut, Ticket as TicketIcon, Wallet as WalletIcon } from 'lucide-react';
import { colors, font, radius } from '../theme';
import { Button, Avatar } from './Atoms';
import { useWallet } from '../context/WalletContext';
import { useSearch } from '../context/SearchContext';

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 14px 28px;
  background: rgba(11, 11, 13, 0.86);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${colors.stroke};

  @media (max-width: 860px) {
    padding: 12px 16px;
    gap: 14px;
  }
`;

const Logo = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${font.display};
  font-size: 24px;
  letter-spacing: 0.03em;
  color: ${colors.paper};
  white-space: nowrap;

  svg {
    color: ${colors.stamp};
  }
`;

const Links = styled.nav`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;

  @media (max-width: 860px) {
    display: none;
  }
`;

const NavItem = styled(NavLink)`
  font-size: 13.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: ${radius.pill};
  color: ${colors.muted};

  &:hover {
    color: ${colors.paper};
  }
  &.active {
    color: ${colors.void};
    background: ${colors.stamp};
  }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: ${radius.md};
  border: 1px solid ${(p) => (p.$focused ? colors.stamp : colors.stroke)};
  background: ${colors.panel};
  color: ${colors.faint};
  width: 240px;
  transition: border-color 0.15s ease;

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  @media (max-width: 1080px) {
    display: none;
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: ${colors.paper};
  font-family: ${font.mono};
  font-size: 12.5px;
  width: 100%;

  &::placeholder {
    color: ${colors.faint};
  }
`;

const ClearBtn = styled.button`
  color: ${colors.faint};
  display: flex;
  flex-shrink: 0;

  &:hover {
    color: ${colors.stamp};
  }
`;

const WalletGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WalletChip = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  border-radius: ${radius.pill};
  border: 1px solid ${colors.stroke};
  background: ${colors.panel};

  span {
    font-family: ${font.mono};
    font-size: 12px;
    color: ${colors.paper};
  }

  &:hover {
    border-color: ${colors.stamp};
  }
`;

const DisconnectBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid ${colors.stroke};
  color: ${colors.faint};
  flex-shrink: 0;

  &:hover {
    color: ${colors.down};
    border-color: ${colors.down};
  }
`;

const links = [
  { to: '/', label: 'Discover', end: true },
  { to: '/nfts', label: 'NFT Market' },
  { to: '/memes', label: 'Meme Market' },
  { to: '/trending', label: 'Trending' },
  { to: '/create', label: 'Create NFT' },
  { to: '/launch', label: 'Launch Meme' },
];

export default function Nav() {
  const { connected, address, username, openPicker, disconnect } = useWallet();
  const { query, setQuery } = useSearch();
  const navigate = useNavigate();

  const label = username || (address ? `${address.slice(0, 4)}…${address.slice(-4)}` : '');
  const avatarLetter = (username || address || '?')[0].toUpperCase();

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) navigate('/nfts');
  };

  return (
    <Bar>
      <Logo to="/" end>
        <TicketIcon size={22} strokeWidth={2.4} />
        STUB
      </Logo>
      <Links>
        {links.map((l) => (
          <NavItem key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavItem>
        ))}
      </Links>

      <SearchBox>
        <Search />
        <SearchInput
          placeholder="Search collections, tickers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {query && (
          <ClearBtn type="button" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={13} />
          </ClearBtn>
        )}
      </SearchBox>

      {connected ? (
        <WalletGroup>
          <WalletChip to="/profile">
            <Avatar $size="26px">{avatarLetter}</Avatar>
            <span>{label}</span>
          </WalletChip>
          <DisconnectBtn type="button" onClick={disconnect} title="Disconnect wallet" aria-label="Disconnect wallet">
            <LogOut size={14} />
          </DisconnectBtn>
        </WalletGroup>
      ) : (
        <Button $sm onClick={openPicker}>
          <WalletIcon size={14} /> Connect wallet
        </Button>
      )}
    </Bar>
  );
}
