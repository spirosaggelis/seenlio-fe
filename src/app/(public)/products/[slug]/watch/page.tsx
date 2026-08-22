import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/strapi';
import {
  buildVideoObjectJsonLd,
  pickProductVideo,
  publicVideoThumbnail,
  type VideoItem,
} from '@/lib/productVideo';

export const revalidate = 3600;

interface ProductData {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  media?: Array<{ url?: string; type?: string; isPrimary?: boolean }>;
  videos?: VideoItem[];
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = (await getProduct(slug)) as ProductData | null;
  if (!product) return { title: 'Video Not Found' };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  const watchUrl = `${siteUrl}/products/${product.slug}/watch`;
  const video = pickProductVideo(product.videos);
  if (!video) return { title: 'Video Not Found' };

  const title = video.title || product.name;
  const description =
    product.shortDescription ||
    product.description ||
    `Watch the viral short for ${product.name} on Seenlio.`;
  const ogImage = publicVideoThumbnail(video);

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: { canonical: watchUrl },
    openGraph: {
      title,
      description,
      url: watchUrl,
      type: 'video.other',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductWatchPage({ params }: PageProps) {
  const { slug } = await params;
  const product = (await getProduct(slug)) as ProductData | null;
  if (!product) notFound();

  const productVideo = pickProductVideo(product.videos);
  if (!productVideo) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seenlio.com';
  const watchPageUrl = `${siteUrl}/products/${product.slug}/watch`;
  const description =
    product.shortDescription ||
    product.description ||
    `Viral short featuring ${product.name}.`;

  const videoJsonLd = buildVideoObjectJsonLd({
    name: product.name,
    description,
    pageUrl: watchPageUrl,
    video: productVideo,
  });

  return (
    <div className='min-h-screen bg-[#0a0a0f]'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />

      <div className='mx-auto max-w-3xl px-4 py-8 sm:py-12'>
        <nav className='mb-6 flex items-center gap-2 text-sm text-gray-500'>
          <Link href='/' className='hover:text-purple-400 transition-colors'>
            Home
          </Link>
          <span aria-hidden>›</span>
          <Link
            href={`/products/${product.slug}`}
            className='hover:text-purple-400 transition-colors truncate'
          >
            {product.name}
          </Link>
          <span aria-hidden>›</span>
          <span className='text-gray-300'>Watch</span>
        </nav>

        <header className='mb-6 text-center'>
          <p className='text-xs font-semibold uppercase tracking-[0.2em] text-pink-300/80 mb-2'>
            Viral Short
          </p>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-white leading-tight'>
            {productVideo.title || product.name}
          </h1>
        </header>

        <div className='relative mx-auto w-full max-w-[360px]'>
          <div
            aria-hidden
            className='pointer-events-none absolute -inset-4 rounded-[2.5rem] bg-linear-to-br from-purple-500/30 via-pink-500/20 to-cyan-500/30 blur-2xl'
          />
          <div className='relative rounded-[2rem] border border-white/15 bg-[#0a0a0f] p-2 shadow-[0_20px_80px_-20px_rgba(139,92,246,0.5)]'>
            <div
              className='relative w-full overflow-hidden rounded-[1.5rem] bg-black'
              style={{ aspectRatio: '9 / 16' }}
            >
              <iframe
                className='absolute inset-0 h-full w-full'
                src={`${productVideo.embedUrl}?rel=0&modestbranding=1`}
                title={productVideo.title || product.name}
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                allowFullScreen
              />
            </div>
          </div>
        </div>

        <div className='mt-8 flex flex-col items-center gap-3 text-center'>
          <Link
            href={`/products/${product.slug}`}
            className='inline-flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-semibold text-purple-200 transition hover:border-purple-400/50 hover:bg-purple-500/20'
          >
            View product details
          </Link>
          <a
            href={productVideo.watchUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='text-xs text-gray-500 hover:text-gray-300 transition-colors'
          >
            Also on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
