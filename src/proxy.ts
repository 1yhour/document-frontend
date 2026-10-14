import { NextResponse, NextRequest } from "next/server";

/**
 * Next.js 16 Proxy (formerly middleware)
 * Server-side edge guard for coarse authentication checks.
 * Note: Laravel Sanctum session cookies are encrypted, so role & permission
 * evaluation happens client-side and at backend API boundaries.
 */
export function proxy(request: NextRequest) {
  const isAuthenticated = request.cookies.has("laravel-session");
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Unauthenticated guests accessing protected routes are redirected to /login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If already authenticated and visiting public routes, let client-side router
  // redirect them to their specific role-based home route (/admin or /documents)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};