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
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) throw error

      console.log('Session data:', data)

      // Explicitly set the session
      if (data.session) {
        await supabase.auth.setSession(data.session)
      }

      // Verify the session was set correctly
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError

      console.log('Verified session:', sessionData.session)

    } catch (error) {
      console.error('Error in auth callback:', error)
      // You might want to redirect to an error page here
      return NextResponse.redirect(`${requestUrl.origin}/error?message=${encodeURIComponent('Authentication failed')}`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}