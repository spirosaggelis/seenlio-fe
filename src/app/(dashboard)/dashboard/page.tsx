import { Suspense } from 'react';
import DateRangePicker from './_components/DateRangePicker';
import ReportTabs from './_components/ReportTabs';
import { isReportTab, type ReportTabId } from './_components/reportTabs';
import { resolveDateRange } from './_components/dateRange';
import OverviewReport from './_reports/OverviewReport';
import TrafficReport from './_reports/TrafficReport';
import ProductsReport from './_reports/ProductsReport';
import SearchReport from './_reports/SearchReport';
import SocialReport from './_reports/SocialReport';
import AffiliateReport from './_reports/AffiliateReport';

const TAB_META: Record<ReportTabId, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Site-wide performance summary' },
  traffic: { title: 'Traffic', subtitle: 'Pages, sources and devices' },
  products: { title: 'Products', subtitle: 'Product views, clicks, and CTR' },
  search: { title: 'Search', subtitle: 'What users are searching for' },
  social: { title: 'Social Media', subtitle: 'Performance across YouTube, TikTok, Instagram, Pinterest' },
  affiliate: { title: 'Affiliate', subtitle: 'Affiliate link clicks and conversions' },
};

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; tab?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab: ReportTabId = isReportTab(params.tab) ? params.tab : 'overview';
  const { from, to } = resolveDateRange(params);
  const meta = TAB_META[tab];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[var(--fg-primary)]'>{meta.title}</h1>
          <p className='text-sm text-[var(--fg-muted)] mt-1'>{meta.subtitle}</p>
        </div>
        <Suspense>
          <DateRangePicker />
        </Suspense>
      </div>

      <Suspense>
        <ReportTabs active={tab} />
      </Suspense>

      {tab === 'overview' && <OverviewReport from={from} to={to} />}
      {tab === 'traffic' && <TrafficReport from={from} to={to} />}
      {tab === 'products' && <ProductsReport from={from} to={to} />}
      {tab === 'search' && <SearchReport from={from} to={to} />}
      {tab === 'social' && <SocialReport from={from} to={to} />}
      {tab === 'affiliate' && <AffiliateReport from={from} to={to} />}
    </div>
  );
}
