import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
const ADMIN_PATHS = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and Next.js internals
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith('/_next')) ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check authentication via cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  const isAuthenticated = accessToken || refreshToken;

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
