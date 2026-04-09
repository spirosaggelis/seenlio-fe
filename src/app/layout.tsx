import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ConsentProvider } from '@/providers/ConsentProvider';
import CookieConsent from '@/components/CookieConsent';
import GtmScript from '@/components/GtmScript';
import GtmNoscript from '@/components/GtmNoscript';
import AnalyticsConsole from '@/components/AnalyticsConsole';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com',
  ),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Seenlio',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='dark'>
      <head>
        <GtmScript />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <GtmNoscript />
        <ConsentProvider>
          {children}
          <CookieConsent />
          <AnalyticsConsole />
        </ConsentProvider>
      </body>
    </html>
  );
}

