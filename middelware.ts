// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware running for path:', request.nextUrl.pathname)
  
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  console.log('Checking session...')
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('Session:', session ? 'Found' : 'Not found')

  // If there's no session and the user is trying to access a protected route
  if (!session && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/auth')) {
    console.log('No session, redirecting to login')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set(`redirectedFrom`, request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If there's a session and the user is trying to access the login page
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    console.log('Session found, redirecting to chat')
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/chat'
    return NextResponse.redirect(redirectUrl)
  }

  console.log('Middleware completed')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}