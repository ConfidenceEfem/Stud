// Mock data — swap for live API responses later.

const spark = (seed, up) => {
  let v = 50;
  const out = [];
  for (let i = 0; i < 24; i++) {
    v += (Math.sin(seed + i * 0.7) + (up ? 0.35 : -0.35)) * 4;
    out.push({ i, v: Math.max(10, v) });
  }
  return out;
};

export const trendingTokens = [
  { rank: 1, ticker: 'BONK', name: 'Bonk', price: 0.0000284, change: 18.4, volume: '$41.2M', mcap: '$1.9B', spark: spark(1, true) },
  { rank: 2, ticker: 'WIF', name: 'dogwifhat', price: 2.41, change: -4.2, volume: '$38.7M', mcap: '$2.4B', spark: spark(2, false) },
  { rank: 3, ticker: 'POPCAT', name: 'Popcat', price: 1.08, change: 9.7, volume: '$22.1M', mcap: '$1.1B', spark: spark(3, true) },
  { rank: 4, ticker: 'MEW', name: 'cat in a dogs world', price: 0.0091, change: 5.1, volume: '$14.6M', mcap: '$640M', spark: spark(4, true) },
  { rank: 5, ticker: 'PNUT', name: 'Peanut the Squirrel', price: 0.62, change: -1.8, volume: '$19.3M', mcap: '$610M', spark: spark(5, false) },
  { rank: 6, ticker: 'GIGA', name: 'Gigachad', price: 0.19, change: 3.3, volume: '$9.8M', mcap: '$190M', spark: spark(6, true) },
  { rank: 7, ticker: 'MOODENG', name: 'Moo Deng', price: 0.24, change: 12.6, volume: '$17.4M', mcap: '$240M', spark: spark(7, true) },
  { rank: 8, ticker: 'SLERF', name: 'Slerf', price: 0.081, change: -6.3, volume: '$6.2M', mcap: '$78M', spark: spark(8, false) },
  { rank: 9, ticker: 'BOME', name: 'Book of Meme', price: 0.0083, change: 2.4, volume: '$11.9M', mcap: '$580M', spark: spark(9, true) },
  { rank: 10, ticker: 'RETARDIO', name: 'Retardio', price: 0.44, change: -2.1, volume: '$4.7M', mcap: '$44M', spark: spark(10, false) },
  { rank: 11, ticker: 'MYRO', name: 'Myro', price: 0.055, change: 1.9, volume: '$3.1M', mcap: '$52M', spark: spark(11, true) },
  { rank: 12, ticker: 'PONKE', name: 'Ponke', price: 0.31, change: 7.8, volume: '$8.4M', mcap: '$99M', spark: spark(12, true) },
  { rank: 13, ticker: 'SILLY', name: 'Silly Dragon', price: 0.0098, change: -3.5, volume: '$2.6M', mcap: '$31M', spark: spark(13, false) },
  { rank: 14, ticker: 'WEN', name: 'Wen', price: 0.00021, change: 0.6, volume: '$1.9M', mcap: '$27M', spark: spark(14, true) },
  { rank: 15, ticker: 'HARAMBE', name: 'Harambe', price: 0.0034, change: 15.2, volume: '$5.5M', mcap: '$34M', spark: spark(15, true) },
  { rank: 16, ticker: 'FWOG', name: 'Fwog', price: 0.19, change: -8.9, volume: '$3.3M', mcap: '$41M', spark: spark(16, false) },
  { rank: 17, ticker: 'MICHI', name: 'Michi', price: 0.088, change: 4.4, volume: '$2.8M', mcap: '$29M', spark: spark(17, true) },
  { rank: 18, ticker: 'DADDY', name: "Daddy Tate", price: 0.026, change: -1.2, volume: '$1.6M', mcap: '$18M', spark: spark(18, false) },
  { rank: 19, ticker: 'ACT', name: 'Act I', price: 0.32, change: 6.1, volume: '$4.1M', mcap: '$37M', spark: spark(19, true) },
  { rank: 20, ticker: 'SNAI', name: 'Solana AI', price: 0.014, change: 2.8, volume: '$1.1M', mcap: '$12M', spark: spark(20, true) },
];

export const nftCollections = [
  {
    id: 'sc-01',
    name: 'Solar Cartel',
    creator: '7xKp...9mQ2',
    price: 2.4,
    supply: 4444,
    minted: 3812,
    status: 'live',
    eligibility: 'whitelist',
    startTime: '2026-08-20T18:00:00Z',
    palette: ['#FFCC01', '#151318'],
  },
  {
    id: 'gh-02',
    name: 'Ghost Runners',
    creator: 'Bk4n...2Lw8',
    price: 1.1,
    supply: 8000,
    minted: 8000,
    status: 'sold out',
    eligibility: 'public',
    startTime: '2026-08-14T12:00:00Z',
    palette: ['#8C8894', '#0B0B0D'],
  },
  {
    id: 'pf-03',
    name: 'Pixel Foxes',
    creator: 'D3xR...7Yh1',
    price: 0.85,
    supply: 6000,
    minted: 1204,
    status: 'upcoming',
    eligibility: 'whitelist',
    startTime: '2026-08-25T16:00:00Z',
    palette: ['#33D17A', '#151318'],
  },
  {
    id: 'vv-04',
    name: 'Velvet Vaults',
    creator: 'QpZ9...4Kx3',
    price: 3.2,
    supply: 2222,
    minted: 640,
    status: 'live',
    eligibility: 'public',
    startTime: '2026-08-18T09:00:00Z',
    palette: ['#FF5C5C', '#151318'],
  },
  {
    id: 'nb-05',
    name: 'Neon Bazaar',
    creator: 'Mn8w...1Tt6',
    price: 0.4,
    supply: 10000,
    minted: 9120,
    status: 'live',
    eligibility: 'public',
    startTime: '2026-08-10T10:00:00Z',
    palette: ['#FFCC01', '#0B0B0D'],
  },
  {
    id: 'sr-06',
    name: 'Static Ritual',
    creator: 'Ux2p...8Bq4',
    price: 1.75,
    supply: 3333,
    minted: 0,
    status: 'upcoming',
    eligibility: 'whitelist',
    startTime: '2026-09-02T20:00:00Z',
    palette: ['#8C8894', '#151318'],
  },
];

export const memeLaunches = [
  { id: 'm1', ticker: 'STUB', name: 'Ticket Stub', price: 0.00042, mcap: '$420K', liquidity: '$88K', fdv: '$4.2M', supply: '1,000,000,000', change: 24.1, progress: 62, status: 'bonding' },
  { id: 'm2', ticker: 'FRENS', name: 'Frens Only', price: 0.0091, mcap: '$3.1M', liquidity: '$410K', fdv: '$9.1M', supply: '1,000,000,000', change: -6.4, progress: 100, status: 'graduated' },
  { id: 'm3', ticker: 'RUGPR', name: 'Rug Proof', price: 0.000018, mcap: '$18K', liquidity: '$6K', fdv: '$180K', supply: '1,000,000,000', change: 142.0, progress: 12, status: 'bonding' },
  { id: 'm4', ticker: 'YAWN', name: 'Yawn Coin', price: 0.00071, mcap: '$710K', liquidity: '$140K', fdv: '$7.1M', supply: '1,000,000,000', change: 3.8, progress: 88, status: 'bonding' },
  { id: 'm5', ticker: 'GLIZZY', name: 'Glizzy Gladiator', price: 0.0034, mcap: '$3.4M', liquidity: '$520K', fdv: '$34M', supply: '1,000,000,000', change: -1.1, progress: 100, status: 'graduated' },
  { id: 'm6', ticker: 'DRIP', name: 'Drip Protocol', price: 0.00009, mcap: '$90K', liquidity: '$22K', fdv: '$900K', supply: '1,000,000,000', change: 61.3, progress: 34, status: 'bonding' },
];

export const currentUser = {
  username: 'ferro.sol',
  wallet: '7xKpQ2mN9vTz8sYb4hRr1wLc6dXf3gAe5uMoP',
  avatarSeed: 'ferro',
  joined: 'March 2026',
  bio: 'Minting the moment. Full-stack degen.',
  stats: { minted: 14, launched: 3, volume: '128.6 ◎', followers: 342 },
};

export const userNFTs = nftCollections.slice(0, 3);
export const userMemes = memeLaunches.slice(0, 2);

export const activity = [
  { id: 'a1', type: 'mint', label: 'Minted Solar Cartel #3812', time: '2h ago' },
  { id: 'a2', type: 'launch', label: 'Launched $STUB', time: '1d ago' },
  { id: 'a3', type: 'trade', label: 'Bought 4,200 $DRIP', time: '2d ago' },
  { id: 'a4', type: 'mint', label: 'Minted Neon Bazaar #9120', time: '4d ago' },
  { id: 'a5', type: 'trade', label: 'Sold 1,800 $FRENS', time: '6d ago' },
];
