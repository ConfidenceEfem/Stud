import { createClient } from '@supabase/supabase-js';
import { HAS_SUPABASE, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';

let client = null;
if (HAS_SUPABASE) {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Returns null when Supabase isn't configured — every caller in this app
// is written to check for that and fall back to localStorage-only
// behavior, so the app still works with zero backend setup, just limited
// to "only this browser sees what it deployed" until you add one.
export function getSupabase() {
  return client;
}
