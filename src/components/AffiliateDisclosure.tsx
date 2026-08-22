export default function AffiliateDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 leading-relaxed ${className}`}>
      Seenlio is an affiliate. We may earn a commission if you buy through these
      links, at no extra cost to you.
    </p>
  );
}
