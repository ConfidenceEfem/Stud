import { getAsset, getAssetsByGroup } from './helius';
import { listAllCollectionConfigs } from '../data/collectionConfig';
import { FEATURED_NFT_COLLECTIONS, HAS_HELIUS } from '../config/env';
import { nftCollections as MOCK_COLLECTIONS } from '../data/mockData';

const PALETTES = [
  ['#FFCC01', '#151318'],
  ['#8C8894', '#0B0B0D'],
  ['#33D17A', '#151318'],
  ['#FF5C5C', '#151318'],
  ['#FFCC01', '#0B0B0D'],
];

// Real on-chain data for every collection this app knows about: whatever
// the operator listed in VITE_FEATURED_NFT_COLLECTIONS, PLUS anything
// anyone has deployed through this app (see CreateNFT.jsx /
// data/collectionConfig.js) — no env var editing required for a deploy to
// show up here. Falls back to bundled demo collections if Helius isn't
// configured or nothing's been deployed/featured yet.
export async function loadNftCollections() {
  const configs = await listAllCollectionConfigs();
  const addresses = [...new Set([...FEATURED_NFT_COLLECTIONS, ...Object.keys(configs)])];

  if (!HAS_HELIUS || !addresses.length) {
    return { data: MOCK_COLLECTIONS, live: false };
  }

  const results = await Promise.allSettled(
    addresses.map((address, i) => loadOneCollection(address, configs[address] || {}, i))
  );

  const data = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (!data.length) return { data: MOCK_COLLECTIONS, live: false };
  return { data, live: true };
}

async function loadOneCollection(address, config, i) {
  const [collectionAsset, group] = await Promise.all([
    getAsset(address),
    getAssetsByGroup(address, { limit: 1000 }),
  ]);

  const minted = group.items.filter((item) => item.owner && item.owner !== collectionAsset?.owner).length || group.total;

  return {
    id: address,
    name: collectionAsset?.name || config.name || 'Unnamed collection',
    creator: config.creatorLabel || shorten(config.wallet || collectionAsset?.owner || ''),
    price: config.price ?? 0,
    supply: config.supply ?? group.total ?? minted,
    minted,
    status: config.status || inferStatus(config, minted, config.supply ?? group.total),
    eligibility: config.eligibility || 'public',
    startTime: config.startTime || new Date().toISOString(),
    palette: PALETTES[i % PALETTES.length],
    // Prefer the image URL we uploaded ourselves at deploy time over
    // Helius's off-chain metadata crawl — the crawl is a separate,
    // slower, less reliable step (especially on devnet) that has to fetch
    // and parse the Arweave JSON after the fact, whereas this is the exact
    // URL we already know is correct.
    image: config.image || collectionAsset?.image || '',
  };
}

function inferStatus(config, minted, supply) {
  if (supply && minted >= supply) return 'sold out';
  if (config.startTime && new Date(config.startTime) > new Date()) return 'upcoming';
  return 'live';
}

function shorten(addr) {
  return addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : 'Unknown';
}
