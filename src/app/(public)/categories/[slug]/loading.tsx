export default function CategoryLoading() {
  return (
    <div className='min-h-screen bg-[#0a0a0f]'>
      <div className='mx-auto max-w-7xl px-4 py-8 sm:py-12'>
        {/* Header skeleton */}
        <div className='mb-12 text-center'>
          <div className='mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/5 animate-pulse' />
          <div className='mx-auto h-10 w-64 rounded bg-white/5 animate-pulse mb-3' />
          <div className='mx-auto h-5 w-96 max-w-full rounded bg-white/5 animate-pulse' />
        </div>

        {/* Product grid skeleton */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[...Array(8)].map((_, i) => (
            <div key={i} className='rounded-2xl bg-white/5 overflow-hidden'>
              <div className='aspect-square bg-white/5 animate-pulse' />
              <div className='p-4 space-y-3'>
                <div className='h-4 w-3/4 rounded bg-white/5 animate-pulse' />
                <div className='h-4 w-1/2 rounded bg-white/5 animate-pulse' />
                <div className='flex justify-between'>
                  <div className='h-5 w-16 rounded bg-white/5 animate-pulse' />
                  <div className='h-5 w-12 rounded bg-white/5 animate-pulse' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
