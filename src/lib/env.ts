import { z } from 'zod';

/**
 * Runtime environment variable validation.
 * This module is imported at the top of the Supabase server client so that
 * any misconfigured deployment fails loudly at startup rather than silently
 * at request time with a cryptic undefined error.
 */

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_URL is required' })
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string({ required_error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required' })
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty'),

  NEXT_PUBLIC_APP_URL: z
    .string({ required_error: 'NEXT_PUBLIC_APP_URL is required' })
    .url('NEXT_PUBLIC_APP_URL must be a valid URL'),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    const message = `Environment variable validation failed:\n${missing}\n\nCheck your .env.local file or Vercel environment settings.`;

    // In development, log a clear warning but don't crash the server
    // so developers can see the error in the browser instead of a cryptic startup failure
    if (process.env.NODE_ENV === 'development') {
      console.error('\n⚠️  FlowForge env warning:\n' + message + '\n');
      // Return partial env with empty strings for missing values — dev server stays up
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:9002',
      };
    }

    // In production, fail hard at startup
    throw new Error(message);
  }

  return result.data;
}

// Validate on module load — fails fast at startup
export const env = validateEnv();
