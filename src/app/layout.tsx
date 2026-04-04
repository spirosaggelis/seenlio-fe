import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ConsentProvider } from '@/providers/ConsentProvider';
import CookieConsent from '@/components/CookieConsent';
import GtmScript, { GtmNoscript } from '@/components/GtmScript';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com',
  ),
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
        </ConsentProvider>
      </body>
    </html>
  );
}

