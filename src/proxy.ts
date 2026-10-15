// Proxy (ex-middleware) : langue et URL traduites pour le site public,
// redirection rapide vers la connexion pour l'administration.
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { ADMIN_COOKIE } from '@/lib/auth/constants';

const intl = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Simple aiguillage : la vérification réelle de la session est faite côté serveur, à chaque page et action.
    if (pathname !== '/admin/login' && !request.cookies.has(ADMIN_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  return intl(request);
}

export const config = {
  // Tout sauf les API, les fichiers internes de Next et les fichiers statiques (avec un point)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
