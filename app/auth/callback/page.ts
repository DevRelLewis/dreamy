// app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { searchParams, hash } = new URL(window.location.href)
      const code = searchParams.get('code')

      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      } else if (hash) {
        // Parse the hash to get access_token and refresh_token
        const hashParams = new URLSearchParams(hash.slice(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        } else {
          console.error('Missing tokens in URL hash')
          router.push('/login')
          return
        }
      } else {
        console.error('No code or tokens found in URL')
        router.push('/login')
        return
      }

      // Verify the session was set correctly
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        console.log('Session set successfully:', session)
        router.push('/chat')
      } else {
        console.error('Failed to set session')
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, supabase])

}