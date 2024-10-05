import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Amatic_SC } from 'next/font/google';

const amatic_sc = Amatic_SC({ weight: '700', subsets: ['latin'] });

export const metadata = {
  title: 'Dream Net',
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
      <body className={amatic_sc.className}>
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
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}