import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Read the terms and conditions governing your use of Seenlio.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms & Conditions',
    description: 'Read the terms and conditions governing your use of Seenlio.',
    url: '/terms',
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout title='Terms & Conditions' lastUpdated='10 April 2026'>
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Seenlio website at{' '}
          <Link href='https://seenlio.com'>seenlio.com</Link>&nbsp;and the
          Seenlio application (&quot;App&quot;), you agree to be bound by these
          Terms & Conditions. If you do not agree to these terms, you must not
          use the website or application.
        </p>
      </section>

      <section>
        <h2>2. Description of Service</h2>
        <p>
          Seenlio is a product discovery platform that curates trending consumer
          products featured in viral videos. We aggregate product information
          from public sources and provide links to third-party retailers where
          products can be purchased.
        </p>
        <p>
          Seenlio does <strong>not</strong> sell products directly. We are a
          content and discovery service only.
        </p>
        <p>
          Seenlio may also provide tools that allow users to publish and manage
          content on third-party platforms (such as TikTok) through authorized
          integrations.
        </p>
      </section>

      <section>
        <h2>3. Affiliate Links and Third-Party Products</h2>
        <p>
          The Service contains affiliate links to third-party retailers
          including, but not limited to, Amazon, AliExpress, Temu, and TikTok
          Shop. When you click on these links and make a purchase, we may earn a
          commission at no additional cost to you.
        </p>
        <p>
          <strong>Important disclaimers:</strong>
        </p>
        <ul>
          <li>
            Seenlio is not the seller, manufacturer, or distributor of any
            product listed on the website.
          </li>
          <li>
            We do not guarantee product availability, pricing, quality, or
            accuracy of product descriptions.
          </li>
          <li>
            Product prices and availability are subject to change without
            notice. The price displayed on Seenlio may differ from the price on
            the retailer&apos;s website at the time of purchase.
          </li>
          <li>
            All purchases are governed by the terms and conditions of the
            respective retailer. Any disputes regarding purchases must be
            resolved directly with the retailer.
          </li>
          <li>
            We are not responsible for the content, policies, or practices of
            any third-party websites.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Intellectual Property</h2>
        <p>
          The Seenlio name, logo, website design, original content, and
          underlying technology are the property of Seenlio and are protected by
          intellectual property laws.
        </p>
        <p>
          Product images, names, and descriptions displayed on the Service may
          be the property of their respective owners and are used for
          informational and editorial purposes under fair use principles.
        </p>
        <p>
          You may not reproduce, distribute, modify, or create derivative works
          from any content on the Service without prior written permission.
        </p>
      </section>

      <section>
        <h2>5. User Conduct</h2>
        <p>When using the Service, you agree not to:</p>
        <ul>
          <li>
            Use automated tools, bots, or scrapers to access or extract data
            from the Service without permission.
          </li>
          <li>
            Attempt to interfere with, disrupt, or compromise the integrity or
            security of the Service.
          </li>
          <li>
            Use the Service for any unlawful purpose or in violation of any
            applicable laws or regulations.
          </li>
          <li>
            Impersonate Seenlio or misrepresent your affiliation with the
            Service.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Disclaimers</h2>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis without warranties of any kind, either express
          or implied.
        </p>
        <ul>
          <li>
            We do not warrant that the Service will be uninterrupted,
            error-free, or free of harmful components.
          </li>
          <li>
            Product information, including prices, ratings, and trend data, is
            provided for informational purposes only and may not be accurate or
            up to date.
          </li>
          <li>
            Trend scores and popularity metrics are based on our proprietary
            algorithms and do not constitute financial or purchasing advice.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Seenlio and its
          operators shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including but not limited to loss
          of profits, data, or goodwill, arising out of or in connection with
          your use of the Service.
        </p>
        <p>
          Our total liability for any claim arising from the use of the Service
          shall not exceed the amount you have paid to us (if any) in the 12
          months preceding the claim.
        </p>
      </section>

      <section>
        <h2>8. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Seenlio and its operators
          from any claims, damages, losses, or expenses (including reasonable
          legal fees) arising from your use of the Service or violation of these
          Terms.
        </p>
      </section>

      <section>
        <h2>9. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of the jurisdiction in which Seenlio operates, without regard to
          conflict of law principles.
        </p>
      </section>

      <section>
        <h2>10. Changes to These Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. Changes will
          be posted on this page with an updated &quot;Last updated&quot; date.
          Continued use of the Service after changes are posted constitutes
          acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>If you have questions about these Terms, please contact us at:</p>
        <p>
          <strong>Email:</strong> legal@seenlio.com
        </p>
      </section>
    </LegalPageLayout>
  );
}
