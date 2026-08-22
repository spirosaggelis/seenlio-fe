const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Server-rendered GTM + Consent Mode defaults.
 * Must stay in the public layout so dashboard traffic is excluded.
 */
export default function GtmSnippet() {
  if (!GTM_ID) return null;

  const snippet = `
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
`.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
