'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartHProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
  label?: string;
  maxItems?: number;
}

export default function BarChartH({
  data,
  color = '#8b5cf6',
  label = 'Count',
  maxItems = 10,
}: BarChartHProps) {
  const sliced = data.slice(0, maxItems);
  const height = Math.max(200, sliced.length * 40);

  return (
    <ResponsiveContainer width='100%' height={height}>
      <BarChart
        data={sliced}
        layout='vertical'
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.04)' horizontal={false} />
        <XAxis
          type='number'
          tick={{ fontSize: 11, fill: '#6b6b80' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type='category'
          dataKey='name'
          width={140}
          tick={{ fontSize: 11, fill: '#a0a0b8' }}
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
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          formatter={(val) => [(val as number).toLocaleString(), label]}
        />
        <Bar dataKey='value' radius={[0, 4, 4, 0]} maxBarSize={22}>
          {sliced.map((_, i) => (
            <Cell
              key={i}
              fill={color}
              fillOpacity={1 - i * 0.06}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
