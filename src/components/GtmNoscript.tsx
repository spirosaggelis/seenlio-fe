// Server component — renders consistently on server and client, no hydration risk
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function GtmNoscript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height='0'
        width='0'
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
}
