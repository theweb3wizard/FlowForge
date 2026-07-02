import { createNeonAuth } from '@neondatabase/auth/next/server';

let _auth: ReturnType<typeof createNeonAuth> | null = null;
let _initAttempted = false;

function getAuth() {
  if (!_auth && !_initAttempted) {
    _initAttempted = true;
    const baseUrl = process.env.NEON_AUTH_BASE_URL;
    const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;
    if (!baseUrl || !cookieSecret) {
      return null;
    }
    _auth = createNeonAuth({
      baseUrl,
      cookies: { secret: cookieSecret },
    });
  }
  return _auth;
}

const nullSession = Promise.resolve({ data: null, error: new Error('Auth not configured') });

export const auth = new Proxy({} as ReturnType<typeof createNeonAuth>, {
  get(_, prop: string | symbol) {
    const instance = getAuth();
    if (!instance) {
      if (prop === 'getSession') return () => nullSession;
      if (prop === 'middleware') return () => (req: any) => undefined;
      if (prop === 'handler') return () => ({ GET: null, POST: null });
      return () => nullSession;
    }
    return (instance as any)[prop];
  },
});

export type Session = Awaited<ReturnType<ReturnType<typeof createNeonAuth>['getSession']>>['data'];
