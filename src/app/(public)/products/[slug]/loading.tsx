export default function ProductLoading() {
  return (
    <div className='min-h-screen bg-[#0a0a0f]'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:py-12'>
        {/* Breadcrumbs skeleton */}
        <div className='mb-8 flex items-center gap-2'>
          <div className='h-4 w-12 rounded bg-white/5 animate-pulse' />
          <div className='h-4 w-4 rounded bg-white/5' />
          <div className='h-4 w-24 rounded bg-white/5 animate-pulse' />
          <div className='h-4 w-4 rounded bg-white/5' />
          <div className='h-4 w-40 rounded bg-white/5 animate-pulse' />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16'>
          {/* Image gallery skeleton */}
          <div className='space-y-4'>
            <div className='aspect-square rounded-2xl bg-white/5 animate-pulse' />
            <div className='flex gap-3'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='w-20 h-20 rounded-lg bg-white/5 animate-pulse' />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className='space-y-5'>
            <div className='h-10 w-3/4 rounded bg-white/5 animate-pulse' />
            <div className='h-10 w-1/2 rounded bg-white/5 animate-pulse' />
            <div className='flex gap-4'>
              <div className='h-6 w-20 rounded bg-white/5 animate-pulse' />
              <div className='h-6 w-16 rounded bg-white/5 animate-pulse' />
            </div>
            <div className='flex gap-2'>
              <div className='h-7 w-20 rounded-lg bg-white/5 animate-pulse' />
              <div className='h-7 w-16 rounded-lg bg-white/5 animate-pulse' />
              <div className='h-7 w-28 rounded-lg bg-white/5 animate-pulse' />
            </div>
            {/* CTA button skeleton */}
            <div className='pt-1'>
              <div className='h-14 w-full rounded-xl bg-white/5 animate-pulse' />
            </div>
          </div>
        </div>

        {/* Description skeleton */}
        <div className='mt-10 rounded-2xl bg-white/5 p-6 sm:p-8 animate-pulse'>
          <div className='h-4 w-32 rounded bg-white/5 mb-4' />
          <div className='space-y-3'>
            <div className='h-4 w-full rounded bg-white/5' />
            <div className='h-4 w-5/6 rounded bg-white/5' />
            <div className='h-4 w-4/6 rounded bg-white/5' />
          </div>
        </div>
      </div>
    </div>
  );
}
