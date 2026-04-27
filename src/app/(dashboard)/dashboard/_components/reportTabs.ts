export const REPORT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'products', label: 'Products' },
  { id: 'search', label: 'Search' },
  { id: 'social', label: 'Social' },
  { id: 'affiliate', label: 'Affiliate' },
] as const;

export type ReportTabId = (typeof REPORT_TABS)[number]['id'];

export function isReportTab(id: string | undefined): id is ReportTabId {
  return !!id && REPORT_TABS.some((t) => t.id === id);
}
