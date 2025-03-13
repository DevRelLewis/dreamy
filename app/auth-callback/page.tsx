'use client'

import { useEffect } from 'react'
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'
import { useRouter } from 'next/navigation'
import { supabase } from '@/supabase/supabaseClient'

export default function AuthCallback() {
  const { isLoading, isAuthenticated, user } = useKindeBrowserClient()
  const router = useRouter()

  useEffect(() => {
    const syncUserWithDatabase = async () => {
      if (!isLoading && isAuthenticated && user) {
        try {
          // Check if user exists in Supabase
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (userError && userError.code !== 'PGRST116') {
            console.error('Error checking for existing user:', userError)
          }

          // If user exists, update their Kinde ID if needed
          if (existingUser) {
            if (!existingUser.kinde_user_id) {
              const { error: updateError } = await supabase
                .from('users')
                .update({ 
                  kinde_user_id: user.id,
                  first_name: user.given_name || existingUser.first_name,
                  last_name: user.family_name || existingUser.last_name,
                  avatar_url: user.picture || existingUser.avatar_url
                })
                .eq('id', existingUser.id)

              if (updateError) {
                console.error('Error updating user:', updateError)
              }
            }
          } else {
            // Create new user
            const { error: insertError } = await supabase
            .from('users')
            .insert({
                email: user.email,
                first_name: user.given_name || '',
                last_name: user.family_name || '',
                kinde_user_id: user.id,
                avatar_url: '', // Set this to empty string instead of user.picture
                token_balance: 250,
                tokens_spent: 0,
                is_subscribed: false,
                username: null // If you made this nullable
            })

            if (insertError) {
              console.error('Error creating user:', insertError)
            }
          }

          // Redirect to the chat page
          router.push('/chat')
        } catch (error) {
          console.error('Error in auth callback:', error)
          router.push('/')
        }
      } else if (!isLoading && !isAuthenticated) {
        router.push('/')
      }
    }

    syncUserWithDatabase()
  }, [isLoading, isAuthenticated, user, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-2xl font-bold">Setting up your account...</h1>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
      </div>
    </div>
  )
}