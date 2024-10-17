// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          console.log('Session set successfully', data);

          // Verify the session was set correctly
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (session) {
            console.log('Session verified:', session);
            // Use replace instead of push to avoid browser back button issues
            router.replace('/chat');
          } else {
            throw new Error('Session not found after setting');
          }
        } else {
          throw new Error('No tokens found in URL');
        }
      } catch (error) {
        console.error('Error setting session:', error);
        console.log('Authentication failed. Please try logging in again.');
        // Redirect to login page after a short delay to show the error
        setTimeout(() => router.replace('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

 
}