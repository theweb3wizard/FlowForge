import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anon key.');
}

// Base Supabase client (unauthenticated)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Store for authenticated clients per wallet address
 * This prevents creating multiple instances
 */
const clientCache = new Map<string, ReturnType<typeof createClient>>();

/**
 * Creates an authenticated Supabase client using a server-signed JWT
 * This fetches a properly signed token from your backend
 */
export async function createAuthenticatedSupabaseClient(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();
  
  // Return cached client if it exists
  if (clientCache.has(normalizedAddress)) {
    return clientCache.get(normalizedAddress)!;
  }

  try {
    // Fetch a properly signed JWT from your backend
    const response = await fetch('/api/auth/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: normalizedAddress }),
    });

    if (!response.ok) {
      throw new Error('Failed to get authentication token');
    }

    const { token } = await response.json();

    // Create authenticated client with the signed JWT
    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Cache the client
    clientCache.set(normalizedAddress, authenticatedClient);

    return authenticatedClient;
  } catch (error) {
    console.error('Failed to create authenticated client:', error);
    // Fallback to base client if authentication fails
    return supabase;
  }
}

/**
 * Clear cached client when wallet disconnects
 */
export function clearAuthenticatedClient(walletAddress: string) {
  clientCache.delete(walletAddress.toLowerCase());
}