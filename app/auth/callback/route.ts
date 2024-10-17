// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    try {
      await supabase.auth.exchangeCodeForSession(code)
      
      // Explicitly get and log the session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      console.log('Session set in callback:', session)
      
    } catch (error) {
      console.error('Error in auth callback:', error)
      // You might want to redirect to an error page here
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}