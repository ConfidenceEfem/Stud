import { getSupabase } from '../services/supabaseClient';

// Records which on-chain SPL Token Swap pool (if any) belongs to a given
// token mint. Same local-first, Supabase-shared pattern as
// collectionConfig.js / tokenLaunchConfig.js — see those files for why.
const KEY = 'stub_pool_config';

export function readPoolConfigs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function writeLocal(mintAddress, config) {
  const all = readPoolConfigs();
  all[mintAddress] = { ...all[mintAddress], ...config };
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
  return all[mintAddress];
}

function toRow(mintAddress, c) {
  return {
    mint_address: mintAddress,
    swap_account: c.swapAccount ?? null,
    authority: c.authority ?? null,
    vault_sol: c.vaultSol ?? null,
    vault_token: c.vaultToken ?? null,
    pool_mint: c.poolMint ?? null,
    fee_account: c.feeAccount ?? null,
    creator: c.creator ?? null,
    updated_at: new Date().toISOString(),
  };
}

function fromRow(row) {
  if (!row) return null;
  return {
    swapAccount: row.swap_account,
    authority: row.authority,
    vaultSol: row.vault_sol,
    vaultToken: row.vault_token,
    poolMint: row.pool_mint,
    feeAccount: row.fee_account,
    creator: row.creator,
  };
}

export async function savePoolConfig(mintAddress, patch) {
  const merged = writeLocal(mintAddress, patch);
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('pools').upsert(toRow(mintAddress, merged));
    if (error) console.warn('[poolConfig] Supabase upsert failed (saved locally only):', error.message);
  }
  return merged;
}

export async function getPoolConfig(mintAddress) {
  const local = readPoolConfigs()[mintAddress];
  if (local) return local;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase.from('pools').select('*').eq('mint_address', mintAddress).maybeSingle();
  if (error) {
    console.warn('[poolConfig] Supabase lookup failed:', error.message);
    return null;
  }
  return fromRow(data);
}

export async function listAllPoolConfigs() {
  const merged = { ...readPoolConfigs() };
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.from('pools').select('*');
    if (error) {
      console.warn('[poolConfig] Supabase list failed (showing local only):', error.message);
    } else {
      for (const row of data || []) {
        merged[row.mint_address] = { ...merged[row.mint_address], ...fromRow(row) };
      }
    }
  }
  return merged;
}
