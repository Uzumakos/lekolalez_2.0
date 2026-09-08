import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from .env'
  );
}

// Client-side Supabase client using public Anon key and Row Level Security (RLS)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Backward-compatible export: alias to the standard authenticated client
// Never expose service_role keys to the browser bundle
export const supabaseAdmin = supabase;

export default supabase;
