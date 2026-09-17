import { getSupabase } from '../services/supabaseClient';

// Same idea as collectionConfig.js, for meme token launches: records the
// creator-entered name/ticker/supply at launch time, keyed by the real
// mint address created on-chain in Tier 3. Cached locally always; written
// through to a shared Supabase `tokens` table when configured, so a
// launch shows up on the marketplace for anyone, not just the browser
// that launched it.
const KEY = 'stub_token_launch_config';

export function readTokenLaunchConfigs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocal(address, config) {
  const all = readTokenLaunchConfigs();
  all[address] = { ...all[address], ...config };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  return all[address];
}

function toRow(address, c) {
  return {
    address,
    name: c.name ?? null,
    ticker: c.ticker ?? null,
    decimals: c.decimals ?? 6,
    supply: c.supply ?? 0,
    image: c.image ?? null,
    creator: c.creator ?? null,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row) {
  if (!row) return null;
  return { name: row.name, ticker: row.ticker, decimals: row.decimals, supply: row.supply, image: row.image, creator: row.creator };
}

export async function saveTokenLaunchConfig(address, patch) {
  const merged = writeLocal(address, patch);

  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('tokens').upsert(toRow(address, merged));
    if (error) console.warn('[tokenLaunchConfig] Supabase upsert failed (saved locally only):', error.message);
  }

  return merged;
}

export async function getTokenLaunchConfig(address) {
  const local = readTokenLaunchConfigs()[address];
  if (local) return local;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('tokens').select('*').eq('address', address).maybeSingle();
  if (error) {
    console.warn('[tokenLaunchConfig] Supabase lookup failed:', error.message);
    return null;
  }
  return fromRow(data);
}

// Every token this app knows about, for the marketplace listing.
export async function listAllTokenLaunchConfigs() {
  const merged = { ...readTokenLaunchConfigs() };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('tokens').select('*');
    if (error) {
      console.warn('[tokenLaunchConfig] Supabase list failed (showing local only):', error.message);
    } else {
      for (const row of data || []) {
        merged[row.address] = { ...merged[row.address], ...fromRow(row) };
      }
    }
  }

  return merged;
}
