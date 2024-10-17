// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow access to the root page and auth callback regardless of session status
  if (req.nextUrl.pathname === '/' || req.nextUrl.pathname.startsWith('/auth')) {
    return res
  }

  // For all other routes, redirect to root if there's no session
  if (!session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}