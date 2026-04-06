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

function TruncatedTick({
  x,
  y,
  payload,
}: {
  x: number;
  y: number;
  payload: { value: string };
}) {
  const maxLen = 22;
  const name = payload.value;
  const truncated = name.length > maxLen ? name.slice(0, maxLen) + '...' : name;
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{name}</title>
      <text x={-4} y={0} dy={4} textAnchor='end' fill='#a0a0b8' fontSize={11}>
        {truncated}
      </text>
    </g>
  );
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
        margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray='3 3'
          stroke='rgba(255,255,255,0.04)'
          horizontal={false}
        />
        <XAxis
          type='number'
          tick={{ fontSize: 11, fill: '#6b6b80' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type='category'
          dataKey='name'
          width={160}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tick={TruncatedTick as any}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#12121a',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            fontSize: 12,
            color: '#e2e2ea',
          }}
          labelStyle={{ color: '#f4f4f8' }}
          itemStyle={{ color: '#e2e2ea' }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          formatter={(val) => [(val as number).toLocaleString(), label]}
        />
        <Bar dataKey='value' radius={[0, 4, 4, 0]} maxBarSize={22}>
          {sliced.map((_, i) => (
            <Cell key={i} fill={color} fillOpacity={1 - i * 0.06} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
