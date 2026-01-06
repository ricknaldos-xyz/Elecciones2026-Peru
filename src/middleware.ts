import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIE_NAME = 'admin_session';
const locales = ['es', 'qu', 'ay', 'ase'];

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this is an admin route (excluding login)
  const isAdminRoute = locales.some(locale =>
    pathname.startsWith(`/${locale}/admin`) && !pathname.includes('/admin/login')
  );

  if (isAdminRoute) {
    // Check for admin session cookie
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const isValidSession = sessionToken && /^[a-z0-9]+_[a-z0-9]+$/.test(sessionToken);

    if (!isValidSession) {
      // Extract locale from pathname
      const locale = locales.find(l => pathname.startsWith(`/${l}/`)) || 'es';

      // Redirect to admin login
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Continue with i18n middleware for all routes
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (with extensions)
  // - Next.js internals
  matcher: [
    '/',
    '/(es|qu|ay|ase)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
