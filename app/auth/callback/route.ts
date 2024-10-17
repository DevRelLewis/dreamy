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
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) throw error;

          console.log('Session set successfully', data);
          router.push('/chat');
        } catch (error) {
          console.error('Error setting session:', error);
          router.push('/login?error=SetSessionError');
        }
      } else {
        console.error('No tokens found in URL');
        router.push('/login?error=NoTokens');
      }
    };

    handleAuthCallback();
  }, [router, supabase]);


}