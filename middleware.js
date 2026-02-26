import { NextResponse } from 'next/server';

const PASSWORD = process.env.SITE_PASSWORD || 'cheongnyang2026';

export function middleware(request) {
  // Skip API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get('auth_token');
  if (cookie?.value === PASSWORD) {
    return NextResponse.next();
  }

  // Show login page if not authenticated
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
