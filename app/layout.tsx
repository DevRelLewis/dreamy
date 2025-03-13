import '@mantine/core/styles.css';
// Add this import for notifications
import '@mantine/notifications/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
// Add this import for notifications
import { Notifications } from '@mantine/notifications';
import { Merriweather } from 'next/font/google';
// Import the AuthProvider
import { AuthProvider } from '../components/auth/auth-provider';

const merriweather = Merriweather({ weight: '400', subsets: ['latin'] });

export const metadata = {
  title: 'Dream-San',
  description: 'Specialized AI for Dream Interpretation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={merriweather.className}>
        <MantineProvider
          theme={{
            fontSizes: {
              xs: '0.75rem',
              sm: '0.875rem',
              md: '1rem',
              lg: '1.125rem',
              xl: '1.25rem',
            },
            breakpoints: {
              xs: '30em',
              sm: '48em',
              md: '64em',
              lg: '74em',
              xl: '90em',
            },
          }}
        >
          {/* Add the Notifications component */}
          <Notifications />
          {/* Wrap children with AuthProvider */}
          <AuthProvider>
            {children}
          </AuthProvider>
        </MantineProvider>
      </body>
    </html>
  );
}