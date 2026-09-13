import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GlobalStyle } from './GlobalStyle';
import { WalletProvider } from './context/WalletContext';
import { SearchProvider } from './context/SearchContext';
import Nav from './components/Nav';
import TickerRail from './components/TickerRail';
import Footer from './components/Footer';
import UsernameModal from './components/UsernameModal';
import WalletPickerModal from './components/WalletPickerModal';
import Discover from './pages/Discover';
import NFTMarket from './pages/NFTMarket';
import MemeMarket from './pages/MemeMarket';
import TrendingTokens from './pages/TrendingTokens';
import CreateNFT from './pages/CreateNFT';
import LaunchMeme from './pages/LaunchMeme';
import Profile from './pages/Profile';

export default function App() {
  return (
    <WalletProvider>
      <SearchProvider>
        <BrowserRouter>
          <GlobalStyle />
          <Nav />
          <TickerRail />
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/nfts" element={<NFTMarket />} />
            <Route path="/memes" element={<MemeMarket />} />
            <Route path="/trending" element={<TrendingTokens />} />
            <Route path="/create" element={<CreateNFT />} />
            <Route path="/launch" element={<LaunchMeme />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
          <Footer />
          <WalletPickerModal />
          <UsernameModal />
        </BrowserRouter>
      </SearchProvider>
    </WalletProvider>
  );
}
