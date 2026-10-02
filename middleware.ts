import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Protected mutation routes (creating/editing/deleting questions, solutions, thoughts, and uploads)
  const isProtectedMutation =
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
    (pathname.startsWith('/api/questions') ||
      pathname.startsWith('/api/solutions') ||
      pathname.startsWith('/api/thoughts') ||
      pathname.startsWith('/api/upload') ||
      pathname.startsWith('/api/admin'));

  const token =
    request.cookies.get('rqna_token')?.value || request.cookies.get('edu_token')?.value;

  if (isProtectedMutation && !token) {
    return NextResponse.json(
      { error: 'Authentication required. Please log in to perform this action.' },
      { status: 401 }
    );
  }

  // Protected admin UI page
  if (pathname.startsWith('/admin') && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/questions/:path*',
    '/api/solutions/:path*',
    '/api/thoughts/:path*',
    '/api/upload/:path*',
    '/api/admin/:path*',
  ],
};
