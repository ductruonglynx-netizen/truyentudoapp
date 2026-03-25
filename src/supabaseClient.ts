import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  typeof supabaseUrl === 'string' &&
  supabaseUrl.trim() &&
  typeof supabaseAnonKey === 'string' &&
  supabaseAnonKey.trim()
    ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const hasSupabase = Boolean(supabase);
