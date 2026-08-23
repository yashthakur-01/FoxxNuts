import { NextResponse, type NextRequest } from 'next/server'
import { createProxyClient } from './supabase/proxyClient'

export async function proxy(request: NextRequest) {
  const { supabase, response } = createProxyClient(request)

  // Refresh auth session if expired & get active user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes: require active user session
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/chat')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If already authenticated and visiting /login, redirect to /dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/chat/:path*',
    '/login',
  ],
}
