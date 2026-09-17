import { fetchJson } from './http';
import { RPC_URL } from '../config/env';

let idCounter = 0;
async function dasCall(method, params) {
  idCounter += 1;
  const body = { jsonrpc: '2.0', id: `stub-${idCounter}`, method, params };
  const json = await fetchJson(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

// Everything a wallet owns — NFTs (compressed + regular) and fungible SPL
// tokens — in one call. This is the real data behind the Profile page.
// Docs: https://docs.helius.dev/compression-and-das-api/digital-asset-standard-das-api/get-assets-by-owner
export async function getAssetsByOwner(ownerAddress, { page = 1, limit = 50 } = {}) {
  const result = await dasCall('getAssetsByOwner', {
    ownerAddress,
    page,
    limit,
    displayOptions: { showFungible: true, showNativeBalance: true },
  });

  const items = result?.items || [];
  const nfts = items.filter((i) => i.interface !== 'FungibleToken' && i.interface !== 'FungibleAsset');
  const fungibles = items.filter((i) => i.interface === 'FungibleToken' || i.interface === 'FungibleAsset');

  return {
    total: result?.total ?? items.length,
    nativeBalanceLamports: result?.nativeBalance?.lamports ?? 0,
    nfts: nfts.map(mapNftAsset),
    tokens: fungibles.map(mapFungibleAsset),
  };
}

// All assets belonging to a given on-chain collection/group — used to show
// real mint progress (minted/supply) for a featured NFT collection.
// Docs: .../get-assets-by-group
export async function getAssetsByGroup(groupValue, { page = 1, limit = 1000, groupKey = 'collection' } = {}) {
  const result = await dasCall('getAssetsByGroup', { groupKey, groupValue, page, limit });
  return {
    total: result?.total ?? 0,
    items: (result?.items || []).map(mapNftAsset),
  };
}

// Fetch metadata + supply/on-chain info for a single asset (e.g. the
// collection NFT itself, to read its name/image/creator).
export async function getAsset(assetId) {
  const result = await dasCall('getAsset', { id: assetId });
  return result ? mapNftAsset(result) : null;
}

// Recent parsed activity for a wallet — used for the Profile page's
// Activity tab. This is Helius's "Enhanced Transactions" REST API (a
// different base URL than the RPC/DAS endpoint above), which returns
// human-readable transaction types instead of raw instruction data.
// Docs: https://docs.helius.dev/solana-apis/enhanced-transactions-api/parsed-transaction-history
export async function getRecentActivity(address, limit = 10) {
  const apiKey = RPC_URL.match(/api-key=([^&]+)/)?.[1];
  if (!apiKey) return []; // custom RPC without a Helius key configured — skip silently
  const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${apiKey}&limit=${limit}`;
  const json = await fetchJson(url);
  return (Array.isArray(json) ? json : []).map((tx) => ({
    id: tx.signature,
    type: mapActivityType(tx.type),
    label: tx.description || tx.type || 'Transaction',
    time: tx.timestamp ? timeAgo(tx.timestamp * 1000) : '',
    signature: tx.signature,
  }));
}

function mapActivityType(type = '') {
  const t = type.toUpperCase();
  if (t.includes('NFT') || t.includes('COMPRESSED')) return 'mint';
  if (t.includes('SWAP') || t.includes('TRANSFER')) return 'trade';
  if (t.includes('TOKEN_MINT') || t.includes('CREATE')) return 'launch';
  return 'trade';
}

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function mapNftAsset(a) {
  const file = a.content?.files?.[0];
  return {
    id: a.id,
    name: a.content?.metadata?.name || 'Untitled',
    description: a.content?.metadata?.description || '',
    image: file?.cdn_uri || file?.uri || a.content?.links?.image || '',
    collection: a.grouping?.find((g) => g.group_key === 'collection')?.group_value || null,
    owner: a.ownership?.owner || null,
    compressed: Boolean(a.compression?.compressed),
    frozen: Boolean(a.ownership?.frozen),
  };
}

function mapFungibleAsset(a) {
  const info = a.token_info || {};
  const decimals = info.decimals ?? 0;
  const rawAmount = Number(info.balance ?? 0);
  return {
    mint: a.id,
    symbol: info.symbol || a.content?.metadata?.symbol || '???',
    name: a.content?.metadata?.name || info.symbol || 'Unknown token',
    image: a.content?.links?.image || a.content?.files?.[0]?.uri || '',
    decimals,
    amount: decimals ? rawAmount / 10 ** decimals : rawAmount,
    priceUsd: info.price_info?.price_per_token ?? null,
    valueUsd: info.price_info?.total_price ?? null,
  };
}
