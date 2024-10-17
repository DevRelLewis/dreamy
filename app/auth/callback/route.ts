// app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');

      if (access_token && refresh_token) {
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        // Refresh the page to ensure the new session is reflected
        router.refresh();

        // Redirect to the desired page after successful authentication
        router.push('/dashboard');
      } else {
        console.error('No tokens found in URL');
        router.push('/login?error=AuthCallbackError');
      }
    };

    handleAuthCallback();
  }, [router, supabase, searchParams]);


}