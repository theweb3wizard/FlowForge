import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';
// Validate required env vars on module load — fails loudly at startup if missing
import { env } from '@/lib/env';

export async function createServerClient() {
  const cookieStore = await cookies();

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createSupabaseServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can fail in Server Components; middleware refreshes sessions.
        }
      },
    },
  });
}
