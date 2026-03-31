interface KpiCardProps {
  label: string;
  value: string | number;
  delta?: number; // percentage change vs previous period
  accent?: 'purple' | 'cyan' | 'pink';
}

export default function KpiCard({ label, value, delta, accent = 'purple' }: KpiCardProps) {
  const accentColor = {
    purple: 'var(--accent-purple)',
    cyan: 'var(--accent-cyan)',
    pink: 'var(--accent-pink)',
  }[accent];

  const deltaPositive = delta !== undefined && delta >= 0;

  return (
    <div
      className='rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 flex flex-col gap-3'
      style={{ borderTopColor: accentColor, borderTopWidth: 2 }}
    >
      <p className='text-xs font-semibold uppercase tracking-wider text-[var(--fg-muted)]'>{label}</p>
      <p className='text-3xl font-bold text-[var(--fg-primary)]'>{value}</p>
      {delta !== undefined && (
        <p
          className='text-xs font-medium'
          style={{ color: deltaPositive ? 'var(--accent-cyan)' : 'var(--accent-pink)' }}
        >
          {deltaPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs prev period
        </p>
      )}
    </div>
  );
}
