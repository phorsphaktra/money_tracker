import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');

export default supabase;
