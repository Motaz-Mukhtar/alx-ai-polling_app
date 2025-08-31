import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req: any) {
  // Skip middleware processing for static assets and API routes
  if (req.nextUrl.pathname.includes('/_next') || 
      req.nextUrl.pathname.includes('/api/') ||
      req.nextUrl.pathname.includes('/favicon.ico') ||
      req.nextUrl.pathname.includes('/@vite')) {
    return NextResponse.next();
  }

  // Prevent redirect loops by checking the referer and cookie
  const referer = req.headers.get('referer') || '';
  const currentPath = req.nextUrl.pathname;
  const hasCookie = req.cookies.has('auth_token');
  
  // If we're already in a potential redirect loop, just proceed without redirecting
  if (referer.includes('/auth/login') && currentPath === '/auth/login') {
    console.log('Potential redirect loop detected, proceeding without redirect');
    return NextResponse.next();
  }

  const res = NextResponse.next();
  
  // Only create Supabase client and check session if we need to
  // For login page, only check if there's a cookie
  if (currentPath === '/auth/login' && hasCookie) {
    // If we're on login page and have a cookie, try to redirect to polls
    try {
      const supabase = createMiddlewareClient({ req, res });
      const { data } = await supabase.auth.getSession();
      
      if (data?.session?.user?.id) {
        console.log('Valid session found on login page, redirecting to polls');
        return NextResponse.redirect(new URL('/polls', req.url));
      }
    } catch (error) {
      console.error('Error checking session on login page:', error);
      // Continue to login page if there's an error
    }
  }
  
  // For polls page, check if there's no cookie and redirect to login
  if (currentPath.startsWith('/polls') && !hasCookie) {
    console.log('No auth cookie found, redirecting to login');
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  
  // For all other cases, just proceed
  return res;
}

export const config = {
  // Apply middleware to these routes
  matcher: [
    // Protected routes
    '/polls/:path*',
    // Auth routes
    '/auth/login',
    '/auth/signup',
  ],
};
