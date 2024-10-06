import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PaymentComplete() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main app page after a short delay
    const timer = setTimeout(() => {
      router.push('/chat');  // Adjust this to your main app route
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Your subscription has been activated and tokens have been added to your account.</p>
      <p>You will be redirected to the main app in a few seconds...</p>
    </div>
  );
}