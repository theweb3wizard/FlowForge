import { type NextRequest } from 'next/server';
import { auth } from '@/lib/auth/server';

export async function proxy(request: NextRequest) {
  const middleware = auth.middleware({ loginUrl: '/auth/sign-in' });
  const handler = middleware(request);
  return handler;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/recipe/:path*',
    '/api/compile',
    '/api/generate',
    '/api/explain',
    '/api/audit',
    '/api/generate-recipe',
  ],
};
