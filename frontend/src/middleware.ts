import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPrefixes = ['/student', '/teacher', '/admin', '/research', '/consent'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('emolearn_token')?.value;
  if (!token) {
    const hasLocalStorageHint = request.headers.get('x-emolearn-auth');
    if (!hasLocalStorageHint) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*', '/research/:path*', '/consent'],
};
