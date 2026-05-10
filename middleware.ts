import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function hasSupabaseTokenCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some((c) => c.name.includes('auth-token') || c.name === 'sb-access-token' || c.name === 'sb-refresh-token');
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  if (pathname === '/admin/login') return NextResponse.next();

  // Defense-in-depth: if no auth-like cookie exists, bounce to /login quickly.
  // Client-side guard in Admin layout performs authoritative Supabase session check.
  if (!hasSupabaseTokenCookie(req)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
