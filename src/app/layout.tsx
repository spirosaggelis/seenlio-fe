import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import { ConsentProvider } from '@/providers/ConsentProvider';
import CookieConsent from '@/components/CookieConsent';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

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
        {GTM_ID && (
          <>
            {/* Google Consent Mode v2 — set defaults BEFORE GTM loads */}
            <Script
              id='gtm-consent-default'
              strategy='beforeInteractive'
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{
  analytics_storage:'granted',
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  functionality_storage:'granted',
  personalization_storage:'granted',
  wait_for_update:500
});`,
              }}
            />
            {/* GTM snippet */}
            <Script
              id='gtm-script'
              strategy='beforeInteractive'
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${inter.variable} antialiased`}>
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height='0'
              width='0'
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <ConsentProvider>
          {children}
          <CookieConsent />
        </ConsentProvider>
      </body>
    </html>
  );
}
