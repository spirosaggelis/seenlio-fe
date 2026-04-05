import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how Seenlio collects, uses, and protects your personal information.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy',
    description: 'Learn how Seenlio collects, uses, and protects your personal information.',
    url: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title='Privacy Policy' lastUpdated='21 March 2026'>
      <section>
        <h2>1. Introduction</h2>
        <p>
          Seenlio (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates
          the website{' '}
          <Link href='https://seenlio.com'>seenlio.com</Link> (the
          &quot;Service&quot;). This Privacy Policy explains how we collect, use,
          disclose, and safeguard your information when you visit our website.
        </p>
        <p>
          By using the Service, you agree to the collection and use of
          information in accordance with this policy.
        </p>
      </section>

      <section>
        <h2>2. Information We Collect</h2>
        <p>We collect the following types of information:</p>
        <ul>
          <li>
            <strong>Usage Data:</strong> Pages visited, products viewed, search
            queries, filters applied, clicks on product cards and affiliate
            links, and time spent on pages.
          </li>
          <li>
            <strong>Device Information:</strong> Device type (mobile, tablet, or
            desktop) derived from your user-agent string.
          </li>
          <li>
            <strong>Approximate Location:</strong> Country-level geolocation
            derived from your IP address. We do not store your full IP address —
            it is hashed immediately upon receipt.
          </li>
          <li>
            <strong>Session Data:</strong> A randomly generated session
            identifier stored in an essential cookie to link your browsing
            activity within a single visit.
          </li>
          <li>
            <strong>Referrer Information:</strong> The website or platform that
            directed you to Seenlio.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect names, email addresses, payment
          information, or any other personally identifiable information unless
          you voluntarily provide it.
        </p>
      </section>

      <section>
        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul>
          <li>Improve and optimise our product recommendations and content.</li>
          <li>Analyse traffic patterns and user behaviour to enhance the user experience.</li>
          <li>Measure the effectiveness of affiliate partnerships.</li>
          <li>Monitor and prevent abuse of the Service.</li>
          <li>Generate aggregated, anonymised statistics about site usage.</li>
        </ul>
      </section>

      <section>
        <h2>4. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar technologies to operate the Service and
          collect usage data. For detailed information about the cookies we use
          and how to manage them, please see our{' '}
          <Link href='/cookies'>Cookie Policy</Link>.
        </p>
        <p>
          You can control cookie preferences at any time through our cookie
          consent banner or your browser settings.
        </p>
      </section>

      <section>
        <h2>5. Third-Party Services</h2>
        <p>
          We may share anonymised or aggregated data with the following
          third-party services:
        </p>
        <ul>
          <li>
            <strong>Google Tag Manager:</strong> Used to manage analytics and
            marketing tags on the website. Only active after you provide cookie
            consent.
          </li>
          <li>
            <strong>Affiliate Platforms:</strong> When you click an affiliate
            link, you are redirected to a third-party retailer (such as Amazon,
            AliExpress, Temu, or TikTok Shop). These platforms have their own
            privacy policies that govern data collected on their sites.
          </li>
        </ul>
        <p>
          We do not sell your personal data to any third party.
        </p>
      </section>

      <section>
        <h2>6. Data Retention</h2>
        <p>
          Usage data and analytics are retained for up to 24 months. Session
          cookies expire after 7 days of inactivity. Cookie consent preferences
          are stored for 1 year.
        </p>
        <p>
          After the retention period, data is automatically deleted or
          anonymised so that it can no longer be associated with any individual
          session.
        </p>
      </section>

      <section>
        <h2>7. Your Rights</h2>
        <p>
          If you are located in the European Economic Area (EEA) or the United
          Kingdom, you have the following rights under the General Data
          Protection Regulation (GDPR):
        </p>
        <ul>
          <li>
            <strong>Right of Access:</strong> Request a copy of the data we hold
            about your sessions.
          </li>
          <li>
            <strong>Right to Rectification:</strong> Request correction of
            inaccurate data.
          </li>
          <li>
            <strong>Right to Erasure:</strong> Request deletion of your data.
          </li>
          <li>
            <strong>Right to Data Portability:</strong> Request your data in a
            structured, machine-readable format.
          </li>
          <li>
            <strong>Right to Object:</strong> Object to the processing of your
            data for certain purposes.
          </li>
          <li>
            <strong>Right to Restrict Processing:</strong> Request that we limit
            how we use your data.
          </li>
          <li>
            <strong>Right to Withdraw Consent:</strong> Withdraw your cookie
            consent at any time via the cookie settings on our website.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at the address
          below.
        </p>
      </section>

      <section>
        <h2>8. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries
          other than your own. We ensure that appropriate safeguards are in place
          to protect your data in accordance with this Privacy Policy and
          applicable data protection laws.
        </p>
      </section>

      <section>
        <h2>9. Children&apos;s Privacy</h2>
        <p>
          The Service is not directed to individuals under the age of 16. We do
          not knowingly collect personal information from children. If you become
          aware that a child has provided us with personal data, please contact
          us so we can take steps to remove such information.
        </p>
      </section>

      <section>
        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated &quot;Last updated&quot; date. We
          encourage you to review this page periodically.
        </p>
      </section>

      <section>
        <h2>11. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or wish to exercise
          your data rights, please contact us at:
        </p>
        <p>
          <strong>Email:</strong> privacy@seenlio.com
        </p>
      </section>
    </LegalPageLayout>
  );
}
