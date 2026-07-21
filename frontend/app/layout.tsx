import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Astra Academy — The Hidden Kingdom of Knowledge',
  description: 'Enter a secret world of premium courses. Astra Academy — where knowledge meets legend.',
  keywords: ['courses', 'learning', 'premium', 'private academy', 'online education'],
  openGraph: {
    title: 'Astra Academy',
    description: 'Premium private learning academy. Authentication required.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1523',
                color: '#e8d5b7',
                border: '1px solid rgba(201, 162, 39, 0.3)',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#c9a227',
                  secondary: '#0a0610',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff6b35',
                  secondary: '#0a0610',
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
