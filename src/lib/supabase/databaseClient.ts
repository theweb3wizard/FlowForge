import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// The third generic varies between browser and server clients from @supabase/ssr.
// Using `never` for the schema arg makes this type compatible with both.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Supabase = SupabaseClient<Database, 'public', any>;
