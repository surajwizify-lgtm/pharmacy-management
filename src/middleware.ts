import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Page-level auth guard. API routes do their own `requireSession()` checks
 * (see src/lib/api-utils.ts) since they need typed JSON error responses;
 * this middleware only guards full-page navigation, redirecting to /login
 * when there's no session, and away from /users for non-admins (the page
 * equivalent of @Roles(Role.ADMIN) on UsersController).
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    if (req.nextUrl.pathname.startsWith('/users') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  },
);

export const config = {
  matcher: ['/dashboard/:path*', '/medicines/:path*', '/batches/:path*', '/billing/:path*', '/users/:path*'],
};
