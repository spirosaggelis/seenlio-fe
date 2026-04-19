import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ConsentProvider } from '@/providers/ConsentProvider';
import CookieConsent from '@/components/CookieConsent';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
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
  themeColor: '#8b5cf6',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com',
  ),
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
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
    <html lang='en' className='dark' suppressHydrationWarning>
      <head>
        <GtmScript />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ServiceWorkerRegister />
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

