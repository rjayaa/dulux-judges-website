// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function must be named middleware
export function middleware(request: NextRequest) {
  // Get the user session from cookies
  const sessionCookie = request.cookies.get('judge_session');
  
  // Check if the user is authenticated
  let isAuthenticated = false;
  let isAdmin = false;
  
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      isAuthenticated = session.authenticated === true;
      isAdmin = session.isAdmin === true;
    } catch (e) {
      // Invalid session cookie, not authenticated
    }
  }
  
  // Get the path from the URL
  const path = request.nextUrl.pathname;
  
  // Redirect rules
  if (path.startsWith('/admin')) {
    // Admin routes require authentication and admin rights
    if (!isAuthenticated || !isAdmin) {
      return NextResponse.redirect(new URL('/login?redirectTo=' + encodeURIComponent(path), request.url));
    }
  } else if (path.startsWith('/submissions') || path.startsWith('/evaluation-method') || path.startsWith('/review-selections')) {
    // Jury routes require authentication
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login?redirectTo=' + encodeURIComponent(path), request.url));
    }
  } else if (path === '/login') {
    // Redirect authenticated users to appropriate dashboard
    if (isAuthenticated) {
      if (isAdmin) {
        return NextResponse.redirect(new URL('/admin/top-five', request.url));
      } else {
        return NextResponse.redirect(new URL('/submissions', request.url));
      }
    }
  }
  
  // Continue with the request for all other cases
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/admin/:path*',
    '/submissions',
    '/submissions/:path*',
    '/evaluation-method',
    '/review-selections',
    '/login',
  ],
}