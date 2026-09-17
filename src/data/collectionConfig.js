import { getSupabase } from '../services/supabaseClient';

// On-chain data (via Helius DAS) tells us a collection's real name, image,
// creator, and exact minted-vs-supply count. It does NOT tell us the launch
// parameters that only exist inside this app — mint price, eligibility
// rules, whitelist, start/end time, or which Candy Machine belongs to it —
// because those aren't part of any token standard; they're this
// marketplace's own product surface.
//
// This config is always cached in localStorage (so it works instantly,
// offline, with zero setup). When a Supabase project is configured (see
// README), every save also writes through to a shared `collections` table,
// and reads fall back to it when the local cache doesn't have an entry —
// that's what makes a deploy show up on the marketplace for *anyone*,
// not just the browser that deployed it. Without Supabase configured, this
// is still real and useful — just limited to "the deploying browser sees
// its own deploys automatically" until a backend is added.
const KEY = 'stub_collection_launch_config';

export function readCollectionConfigs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocal(address, config) {
  const all = readCollectionConfigs();
  all[address] = { ...all[address], ...config };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore — demo persistence only
  }
  return all[address];
}

function toRow(address, c) {
  return {
    address,
    name: c.name ?? null,
    description: c.description ?? null,
    wallet: c.wallet ?? null,
    update_authority: c.updateAuthority ?? null,
    metadata_uri: c.metadataUri ?? null,
    image: c.image ?? null,
    price: c.price ?? 0,
    supply: c.supply ?? 0,
    eligibility: c.eligibility ?? 'public',
    whitelist: c.whitelist ?? [],
    max_per_wallet: c.maxPerWallet ?? 0,
    candy_machine_address: c.candyMachineAddress ?? null,
    start_time: c.startTime ?? null,
    end_time: c.endTime ?? null,
    status: c.status ?? 'live',
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row) {
  if (!row) return null;
  return {
    name: row.name,
    description: row.description,
    wallet: row.wallet,
    updateAuthority: row.update_authority,
    metadataUri: row.metadata_uri,
    image: row.image,
    price: row.price,
    supply: row.supply,
    eligibility: row.eligibility,
    whitelist: row.whitelist || [],
    maxPerWallet: row.max_per_wallet,
    candyMachineAddress: row.candy_machine_address,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
  };
}

// Saves locally immediately (always), then writes through to Supabase if
// configured, so the caller can update its own UI from the returned value
// without waiting on the network round trip.
export async function saveCollectionConfig(address, patch) {
  const merged = writeLocal(address, patch);

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('collections').upsert(toRow(address, merged));
    if (error) console.warn('[collectionConfig] Supabase upsert failed (saved locally only):', error.message);
  }

  return merged;
}

// Local-first, Supabase-fallback single lookup.
export async function getCollectionConfig(address) {
  const local = readCollectionConfigs()[address];
  if (local) return local;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('collections').select('*').eq('address', address).maybeSingle();
  if (error) {
    console.warn('[collectionConfig] Supabase lookup failed:', error.message);
    return null;
  }
  return fromRow(data);
}

// Every collection this app knows about, for the marketplace listing:
// everything saved locally, merged with everything in Supabase (if
// configured) so a collection deployed on another device shows up too.
export async function listAllCollectionConfigs() {
  const merged = { ...readCollectionConfigs() };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('collections').select('*');
    if (error) {
      console.warn('[collectionConfig] Supabase list failed (showing local only):', error.message);
    } else {
      for (const row of data || []) {
        merged[row.address] = { ...merged[row.address], ...fromRow(row) };
      }
    }
  }

  return merged;
}
