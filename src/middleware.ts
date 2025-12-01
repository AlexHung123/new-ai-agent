import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@/lib/auth/verifyTokenEdge';

// Protected API routes that require authentication
// Note: Paths are internal (without basePath) as Next.js strips it before middleware
const PROTECTED_ROUTES = [
  '/api/chat',
  '/api/chats',
  '/api/permissions',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this route needs authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );
  
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Extract token from Authorization header or query parameter
  let token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Fallback: check query parameter for initial page load
  if (!token) {
    token = request.nextUrl.searchParams.get('token') || undefined;
  }

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication token required' },
      { status: 401 }
    );
  }

  try {
    // Verify token and extract userId (using Edge Runtime-compatible version)
    const verified = await verifyTokenEdge(token);
    
    // Add verified userId to request headers for API routes to use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', verified.userId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  }
}

// Configure which routes this middleware applies to
// Next.js strips basePath before middleware, so use internal paths
export const config = {
  matcher: [
    '/api/chat/:path*',
    '/api/chats/:path*',
    '/api/permissions/:path*',
  ],
};
