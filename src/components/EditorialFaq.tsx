import type { FaqItem } from '@/lib/editorialFaq';

export default function EditorialFaq({
  items,
  title = 'Common questions',
}: {
  items: FaqItem[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <dl className="space-y-3">
        {items.map((item) => (
          <div
            key={item.question}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4"
          >
            <dt className="text-sm font-semibold text-white">{item.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-gray-400">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
