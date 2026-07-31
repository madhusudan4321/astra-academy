import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Auth is handled client-side by the (protected)/layout.tsx via AuthContext.
  // Server-side cookie checks don't work in cross-origin deployments where
  // cookies are set on the backend domain, not the frontend domain.
  // This middleware is kept as a hook for future server-side checks (e.g., maintenance mode).
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

