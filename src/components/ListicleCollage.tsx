import Image from 'next/image';
import { proxyImage } from '@/lib/imageProxy';

/**
 * A 4-up collage built from product photos — used as the listicle hero
 * (on /lists/[slug]) and as the card thumbnail on the /lists index. When
 * there are fewer images available the layout collapses gracefully
 * (single hero / 2-up / 3-up).
 */
interface Props {
  images: string[];
  alt: string;
  /** Visual variant: 'hero' renders a 16:9 wide collage; 'card' a 4:3 thumbnail. */
  variant?: 'hero' | 'card';
  priority?: boolean;
}

export default function ListicleCollage({
  images,
  alt,
  variant = 'hero',
  priority = false,
}: Props) {
  const pics = images.filter(Boolean).slice(0, 4);
  const aspect = variant === 'hero' ? 'aspect-[16/9]' : 'aspect-[4/3]';

  if (pics.length === 0) {
    return (
      <div
        className={[
          aspect,
          'flex w-full items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-purple-900/30 via-gray-900 to-cyan-900/30 text-xs text-gray-500',
        ].join(' ')}
      >
        No preview
      </div>
    );
  }

  const sizes =
    variant === 'hero'
      ? '(max-width: 768px) 100vw, 768px'
      : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  // Layout: 1 = single, 2 = 2-col, 3 = 1 large + 2 stacked, 4 = 2x2
  let cols = 'grid-cols-1';
  let rows = 'grid-rows-1';
  if (pics.length === 2) cols = 'grid-cols-2';
  if (pics.length === 3) {
    cols = 'grid-cols-2';
    rows = 'grid-rows-2';
  }
  if (pics.length === 4) {
    cols = 'grid-cols-2';
    rows = 'grid-rows-2';
  }

  return (
    <div
      className={[
        aspect,
        'relative w-full overflow-hidden rounded-xl border border-white/10 bg-black',
      ].join(' ')}
    >
      <div className={`grid h-full w-full gap-0.5 ${cols} ${rows}`}>
        {pics.map((url, i) => {
          const spanClass =
            pics.length === 3 && i === 0 ? 'row-span-2' : '';
          return (
            <div
              key={`${url}-${i}`}
              className={`relative ${spanClass} overflow-hidden bg-white/5`}
            >
              <Image
                src={proxyImage(url)}
                alt={i === 0 ? alt : ''}
                fill
                sizes={sizes}
                className='object-cover'
                priority={priority && i === 0}
              />
            </div>
          );
        })}
      </div>
      {/* Soft fade at the bottom so overlaid text stays legible */}
      <div className='pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent' />
    </div>
  );
}
