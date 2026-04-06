'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
}

const DEFAULT_COLORS = [
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ef4444',
  '#a78bfa',
];

export default function DonutChart({
  data,
  colors = DEFAULT_COLORS,
}: DonutChartProps) {
  return (
    <ResponsiveContainer width='100%' height={260}>
      <PieChart>
        <Pie
          data={data}
          cx='50%'
          cy='45%'
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey='value'
        >
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} stroke='none' />
          ))}
        </Pie>
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
          formatter={(val, name) => [
            (val as number).toLocaleString(),
            name as string,
          ]}
        />
        <Legend
          iconType='circle'
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: '#a0a0b8', fontSize: 11 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
