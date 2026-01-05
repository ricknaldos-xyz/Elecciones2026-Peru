import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

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
