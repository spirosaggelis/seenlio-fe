'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from 'recharts';
import type { LegendPayload, TooltipContentProps } from 'recharts';

export interface OverviewMetricsPoint {
  date: string;
  pageViews: number;
  sessions: number;
  uniqueUsers: number;
  productViews: number;
  affiliateClicks: number;
}

const SERIES: Array<{ dataKey: keyof OverviewMetricsPoint; label: string; color: string }> = [
  { dataKey: 'pageViews', label: 'Page views', color: '#8b5cf6' },
  { dataKey: 'sessions', label: 'Sessions', color: '#22d3ee' },
  { dataKey: 'uniqueUsers', label: 'Users', color: '#ec4899' },
  { dataKey: 'productViews', label: 'Product views', color: '#fbbf24' },
  { dataKey: 'affiliateClicks', label: 'Affiliate clicks', color: '#fb923c' },
];

const LABEL_BY_DATA_KEY = Object.fromEntries(
  SERIES.map((s) => [s.dataKey as string, s.label]),
) as Record<string, string>;

const COLOR_BY_DATA_KEY = Object.fromEntries(
  SERIES.map((s) => [s.dataKey as string, s.color]),
) as Record<string, string>;

function OverviewTooltip(props: TooltipContentProps) {
  const { active, label, payload } = props;
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: '#12121a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        fontSize: 12,
        padding: '10px 12px',
        minWidth: 200,
      }}
    >
      <div style={{ color: '#f4f4f8', fontWeight: 600, marginBottom: 8 }}>{label}</div>
      {payload.map((item) => {
        const dk = String(item.dataKey ?? '');
        const textLabel = LABEL_BY_DATA_KEY[dk] ?? String(item.name ?? dk);
        const color =
          (typeof item.color === 'string' && item.color) || COLOR_BY_DATA_KEY[dk] || '#e2e2ea';
        return (
          <div
            key={dk}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              marginTop: 4,
              alignItems: 'baseline',
            }}
          >
            <span style={{ color, fontWeight: 500 }}>{textLabel}</span>
            <span style={{ color: '#e2e2ea', fontVariantNumeric: 'tabular-nums' }}>
              {Number(item.value ?? 0).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function OverviewMetricsChart({ data }: { data: OverviewMetricsPoint[] }) {
  return (
    <ResponsiveContainer width='100%' height={340}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.04)' />
        <XAxis
          dataKey='date'
          tick={{ fontSize: 11, fill: '#6b6b80' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b6b80' }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          content={OverviewTooltip}
          cursor={{ stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value, entry: LegendPayload) => (
            <span style={{ color: entry.color ?? '#e2e2ea' }}>{value}</span>
          )}
        />
        {SERIES.map((s) => (
          <Line
            key={s.dataKey}
            type='monotone'
            dataKey={s.dataKey}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
        {data.length > 20 && (
          <Brush
            dataKey='date'
            height={20}
            stroke='rgba(255,255,255,0.08)'
            fill='rgba(18,18,26,0.8)'
            travellerWidth={6}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
