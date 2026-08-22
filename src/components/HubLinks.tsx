import Link from 'next/link';

export type HubLink = {
  href: string;
  label: string;
  hint?: string;
};

export default function HubLinks({
  title,
  items,
}: {
  title: string;
  items: HubLink[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-white/10 bg-white/[0.02] p-4 hover:border-purple-500/40"
            >
              <p className="font-medium text-white">{item.label}</p>
              {item.hint ? (
                <p className="mt-1 line-clamp-2 text-sm text-gray-400">{item.hint}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
