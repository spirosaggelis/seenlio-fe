import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-36">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 hero-mesh-bg" />

      {/* Gradient orbs */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-[140px] animate-float-slow" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating decorative elements */}
      <div className="absolute top-20 right-[15%] w-20 h-20 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm rotate-12 animate-float-slow hidden lg:block" />
      <div className="absolute bottom-32 left-[10%] w-16 h-16 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm -rotate-6 animate-float-delayed hidden lg:block" />
      <div className="absolute top-40 left-[8%] w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm rotate-45 animate-float hidden lg:block" />

      <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
        {/* Live indicator pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-gray-300 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Tracking viral products in real-time
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] animate-fade-in-up">
          <span className="text-white">Discover Products</span>
          <br />
          <span className="text-white">That Are </span>
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
            Breaking The Internet
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up [animation-delay:200ms]">
          The hottest gadgets, tools, and accessories everyone is talking about
          — curated from viral videos and trending content worldwide.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up [animation-delay:400ms]">
          <Link
            href="/trending"
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
            <span className="relative flex items-center gap-2">
              Explore Trending
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </span>
          </Link>
          <Link
            href="/lookup"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
          >
            <svg
              className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Look Up Product
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto animate-fade-in-up [animation-delay:600ms]">
          {[
            { value: "1K+", label: "Products" },
            { value: "50M+", label: "Views tracked" },
            { value: "24/7", label: "Live updates" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
