export interface DateRange {
  from: string;
  to: string;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function resolveDateRange(params: { from?: string; to?: string }): DateRange {
  const to = params.to ?? isoDate(new Date());
  const from = params.from ?? isoDate(new Date(Date.now() - 30 * 86_400_000));
  return { from, to };
}
