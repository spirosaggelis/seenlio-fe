import { headers } from 'next/headers';
import {
  DEVICE_ALLOW_SOURCE,
  GENERIC_CRAWLER_SOURCE,
  IN_APP_BROWSER_SOURCE,
  NAMED_CRAWLER_SOURCE,
  isCrawler,
} from '@/lib/requestAgents';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Server-rendered GTM + Consent Mode defaults.
 * Must stay in the public layout so dashboard traffic is excluded.
 * Crawlers get no snippet. The inline check repeats the same test so a
 * cached human response still does not load GTM inside a bot webview.
 */
export default async function GtmSnippet() {
  if (!GTM_ID) return null;
  if (isCrawler((await headers()).get('user-agent'))) return null;

  const named = JSON.stringify(NAMED_CRAWLER_SOURCE);
  const generic = JSON.stringify(GENERIC_CRAWLER_SOURCE);
  const devices = JSON.stringify(DEVICE_ALLOW_SOURCE);
  const inApp = JSON.stringify(IN_APP_BROWSER_SOURCE);

  const snippet = `
(function() {
var ua = navigator.userAgent || '';
var inApp = new RegExp(${inApp}, 'i').test(ua) || (/Mozilla/i.test(ua) && /WhatsApp\\/[\\d.]+/i.test(ua) && !/WhatsApp\\/[\\d.]+ A\\b/i.test(ua));
var named = new RegExp(${named}, 'i').test(ua);
var generic = new RegExp(${generic}, 'i').test(ua) && !new RegExp(${devices}, 'i').test(ua);
if (!ua || (!inApp && (named || generic))) return;
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  functionality_storage: 'granted',
  personalization_storage: 'granted'
});
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
})();
`.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
