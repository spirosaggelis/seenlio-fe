import { headers } from 'next/headers';
import { isCrawler } from '@/lib/requestAgents';

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/** No-JS crawlers must not request the GTM iframe either. */
export default async function GtmNoscript() {
  if (!GTM_ID) return null;
  if (isCrawler((await headers()).get('user-agent'))) return null;
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
