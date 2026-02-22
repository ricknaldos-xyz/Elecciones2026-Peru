import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Only handle i18n - let admin pages handle their own auth
export default intlMiddleware;

export const config = {
  matcher: [
    '/',
    '/(qu|ay)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
