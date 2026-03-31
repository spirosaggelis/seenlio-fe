export default function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <article className='mx-auto max-w-3xl px-6 py-16'>
      <h1 className='text-3xl font-bold gradient-text mb-2'>{title}</h1>
      <p className='text-sm text-[var(--fg-muted)] mb-12'>
        Last updated: {lastUpdated}
      </p>
      <div className='space-y-10 text-[var(--fg-secondary)] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--fg-primary)] [&_h2]:mb-4 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-[var(--accent-cyan)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[var(--accent-purple)] [&_table]:w-full [&_th]:text-left [&_th]:text-[var(--fg-primary)] [&_th]:pb-3 [&_th]:text-sm [&_th]:font-semibold [&_td]:py-2 [&_td]:text-sm [&_td]:border-t [&_td]:border-[var(--border-subtle)]'>
        {children}
      </div>
    </article>
  );
}
