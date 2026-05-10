import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * The browser Supabase client (`@supabase/supabase-js`) persists sessions in **localStorage**
 * by default. Edge middleware cannot read localStorage, so cookie-based checks here always
 * looked “logged out” and redirected `/admin` → `/login` after a successful sign-in
 * (full-page navigation includes no session cookie).
 *
 * Enforcement: `AdminRouteGuard` (client, reads Supabase session) + API `Authorization`
 * checks on admin actions.
 */
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
