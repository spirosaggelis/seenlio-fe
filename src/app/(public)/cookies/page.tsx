import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPageLayout from '@/components/LegalPageLayout';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn about the cookies Seenlio uses and how to manage your preferences.',
  alternates: { canonical: '/cookies' },
  openGraph: {
    title: 'Cookie Policy',
    description: 'Learn about the cookies Seenlio uses and how to manage your preferences.',
    url: '/cookies',
  },
};

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout title='Cookie Policy' lastUpdated='21 March 2026'>
      <section>
        <h2>1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are placed on your device when you
          visit a website. They are widely used to make websites work more
          efficiently, provide a better browsing experience, and supply
          information to site operators.
        </p>
      </section>

      <section>
        <h2>2. Cookies We Use</h2>
        <p>
          The following table describes the cookies used on{' '}
          <Link href='https://seenlio.com'>seenlio.com</Link>:
        </p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Purpose</th>
              <th>Duration</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>__sess</td>
              <td>
                Session identification — links your browsing activity within a
                single visit for analytics.
              </td>
              <td>7 days</td>
              <td>Essential</td>
            </tr>
            <tr>
              <td>consent_preferences</td>
              <td>
                Stores your cookie consent choices so we don&apos;t ask you
                again on every visit.
              </td>
              <td>1 year</td>
              <td>Essential</td>
            </tr>
            <tr>
              <td>_ga, _ga_*</td>
              <td>
                Google Analytics cookies set via Google Tag Manager to measure
                site traffic and usage patterns. These are essential for
                operating and improving the Service.
              </td>
              <td>Up to 2 years</td>
              <td>Essential</td>
            </tr>
            <tr>
              <td>_gcl_*, _gac_*</td>
              <td>
                Google advertising cookies for measuring campaign effectiveness
                and ad conversions.
              </td>
              <td>90 days</td>
              <td>Marketing</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>3. Essential Cookies</h2>
        <p>
          These cookies are strictly necessary for the website to function and
          cannot be switched off. They are typically only set in response to
          actions you take, such as setting your privacy preferences or browsing
          the site. Without these cookies, the Service cannot operate properly.
        </p>
      </section>

      <section>
        <h2>4. Analytics Cookies</h2>
        <p>
          We use analytics cookies (Google Analytics via Google Tag Manager) as
          part of our essential site operations to understand how visitors
          interact with the website. These cookies collect anonymised data and
          are necessary for us to measure and improve the performance of our
          Service. They are loaded by default and cannot be disabled.
        </p>
      </section>

      <section>
        <h2>5. Marketing Cookies</h2>
        <p>
          These cookies may be set through our site by advertising partners.
          They may be used to build a profile of your interests and show you
          relevant content on other sites. They do not directly store personal
          information but are based on uniquely identifying your browser and
          device. These cookies are only set if you explicitly enable them in
          your cookie preferences.
        </p>
      </section>

      <section>
        <h2>6. How to Manage Cookies</h2>
        <p>You can manage your cookie preferences in two ways:</p>
        <ul>
          <li>
            <strong>Our cookie consent banner:</strong> Click the
            &quot;Adjust&quot; button on the cookie banner to customise which
            categories of cookies you allow. You can change your preferences at
            any time by clearing the <code>consent_preferences</code> cookie
            from your browser, which will cause the banner to reappear.
          </li>
          <li>
            <strong>Browser settings:</strong> Most browsers allow you to block
            or delete cookies through their settings. Note that blocking
            essential cookies may prevent the website from functioning correctly.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Third-Party Cookies</h2>
        <p>
          When you click affiliate links on our site, third-party retailers may
          set their own cookies on your device. These cookies are governed by
          the respective retailer&apos;s privacy and cookie policies and are
          outside our control. Please refer to the privacy policies of{' '}
          <strong>Amazon</strong>, <strong>AliExpress</strong>,{' '}
          <strong>Temu</strong>, and <strong>TikTok Shop</strong> for more
          information.
        </p>
      </section>

      <section>
        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes
          in the cookies we use or for operational, legal, or regulatory
          reasons. Please revisit this page periodically to stay informed.
        </p>
      </section>

      <section>
        <h2>9. Contact Us</h2>
        <p>
          If you have questions about our use of cookies, please contact us at:
        </p>
        <p>
          <strong>Email:</strong> privacy@seenlio.com
        </p>
        <p>
          For more details on how we handle your data, see our{' '}
          <Link href='/privacy'>Privacy Policy</Link>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
