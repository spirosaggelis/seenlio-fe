'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from 'recharts';

interface TimeSeriesChartProps {
  data: Array<{ date: string; value: number }>;
  label?: string;
  color?: string;
}

export default function TimeSeriesChart({
  data,
  label = 'Events',
  color = '#8b5cf6',
}: TimeSeriesChartProps) {
  return (
    <ResponsiveContainer width='100%' height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor={color} stopOpacity={0.3} />
            <stop offset='95%' stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
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
        />
        <Tooltip
          contentStyle={{
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#f0f0f5',
            fontSize: 12,
          }}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }}
          formatter={(val) => [(val as number).toLocaleString(), label]}
        />
        <Area
          type='monotone'
          dataKey='value'
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color.replace('#', '')})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
        {data.length > 20 && (
          <Brush
            dataKey='date'
            height={20}
            stroke='rgba(255,255,255,0.08)'
            fill='rgba(18,18,26,0.8)'
            travellerWidth={6}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
