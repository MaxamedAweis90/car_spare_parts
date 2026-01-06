"use client";

import Link from "next/link";

interface HeroPromos {
  eyebrow: string;
  headline: string;
  description: string;
  imageUrl: string;
  href: string;
}

interface HeroSectionProps {
  imageUrl: string;
  promos: HeroPromos[];
}

export function HeroSection({ imageUrl, promos }: HeroSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:h-[500px]">
      {/* Main Hero Card - Spans 2 columns */}
      <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-(--color-primary) to-[#1a1c1e] p-8 lg:col-span-2 flex flex-col justify-center shadow-panel border border-white/10">
        {/* Animated Background Element */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-(--color-accent)/10 blur-3xl transition-transform duration-700 group-hover:scale-110"></div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-(--color-accent) backdrop-blur-md border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--color-accent) opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-(--color-accent)"></span>
            </span>
            Exclusive Bundle
          </div>

          <h2 className="text-4xl font-black uppercase leading-[0.95] text-white sm:text-6xl lg:text-7xl">
            Ultimate <br />
            <span className="text-(--color-accent)">Performance</span>
          </h2>

          <p className="max-w-md text-sm sm:text-base font-medium text-white/70 leading-relaxed">
            Upgrade your drive with our curated performance bundle. Premium
            parts, professionally tested for your vehicle.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-white/40">
                Limited Offer
              </span>
              <span className="text-3xl font-black text-white">Save 50%</span>
            </div>
            <Link
              href="/shop?onSale=true"
              className="inline-flex items-center gap-3 rounded-full bg-(--color-accent) px-10 py-4 text-sm font-black uppercase tracking-widest text-[#1a1c1e] transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.3)]"
            >
              Shop Now
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </Link>
          </div>
        </div>

        {/* Main Image */}
        <div className="absolute top-[60%] -right-10 h-[80%] w-[60%] sm:top-1/2 sm:-right-20 sm:h-[110%] sm:w-[65%] -translate-y-1/2 transition-transform duration-700 group-hover:scale-105 group-hover:rotate-2 opacity-40 sm:opacity-100">
          <img
            src={imageUrl}
            alt="Hero Bundle"
            className="h-full w-full object-contain object-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>

      {/* Right Column - Stacked Cards */}
      <div className="flex flex-col gap-6">
        {promos.map((promo, idx) => (
          <div
            key={idx}
            className="group relative flex-1 overflow-hidden rounded-[2rem] bg-(--color-surface) p-8 shadow-panel transition-all duration-500 hover:shadow-2xl border border-(--color-border-strong) hover:border-(--color-primary)/20"
          >
            <div className="relative z-10 flex h-full flex-col justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-(--color-muted)">
                  {promo.eyebrow}
                </span>
                <h3 className="mt-2 text-3xl font-black uppercase leading-none text-(--color-text) group-hover:text-(--color-primary) transition-colors">
                  {promo.headline}
                </h3>
                <p className="mt-3 text-sm font-medium text-(--color-muted) max-w-[160px] leading-snug">
                  {promo.description}
                </p>
              </div>

              <Link
                href={promo.href}
                className="group/btn inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-(--color-primary) transition-all hover:gap-4"
              >
                View Details
                <i className="fa-solid fa-arrow-right-long transition-transform"></i>
              </Link>
            </div>

            {/* Promo Image */}
            <div className="absolute top-1/2 -right-8 h-[100%] w-[50%] sm:-right-12 sm:h-[120%] sm:w-[55%] -translate-y-1/2 transition-all duration-500 group-hover:scale-110 group-hover:-translate-x-2 opacity-50 sm:opacity-100">
              <img
                src={promo.imageUrl}
                alt={promo.headline}
                className="h-full w-full object-contain object-center drop-shadow-2xl"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
