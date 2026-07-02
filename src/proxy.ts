import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(_request: NextRequest) {
  return NextResponse.next();
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
