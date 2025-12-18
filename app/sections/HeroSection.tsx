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
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:h-125">
      {/* Main Hero Card - Spans 2 columns */}
      <div className="relative overflow-hidden rounded-3xl bg-(--color-primary) p-8 lg:col-span-2 flex flex-col justify-center shadow-panel">
        <div className="relative z-10 max-w-md space-y-4">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-(--color-accent) backdrop-blur-sm">
            Weekly Offer
          </span>
          <h2 className="text-4xl font-black uppercase leading-tight text-(--color-accent) sm:text-5xl lg:text-6xl">
            Exciting <br /> Bundle
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-lg font-bold text-(--color-accent)">
              Get <span className="text-white">50% off</span>
            </span>
          </div>
          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-black"
          >
            Shop Now
            <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        
        {/* Main Image */}
        <div className="absolute top-1/2 -right-50 h-[130%] w-[75%] -translate-y-1/2">
          <img
            src={imageUrl}
            alt="Hero Bundle"
            className="h-full w-full object-contain object-center drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right Column - Stacked Cards */}
      <div className="flex flex-col gap-6 lg:h-full">
        {promos.map((promo, idx) => (
          <div
            key={idx}
            className="relative flex-1 overflow-hidden rounded-3xl bg-(--color-surface) p-6 shadow-panel transition hover:shadow-lg border border-(--color-border-strong)"
          >
            <div className="relative z-10 flex h-full flex-col justify-center items-start gap-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-(--color-muted)">
                  {promo.eyebrow}
                </p>
                <h3 className="mt-1 text-2xl font-extrabold uppercase text-(--color-accent)">
                  {promo.headline}
                </h3>
                <p className="mt-1 text-xs text-(--color-muted) max-w-37.5">
                  {promo.description}
                </p>
              </div>
              
              <Link
                href={promo.href}
                className="group mt-4 inline-flex items-center gap-2 text-sm font-bold text-(--color-primary) transition hover:text-(--color-primary-strong)"
              >
                View Details
                <i className="fa-solid fa-circle-arrow-right transition-transform group-hover:translate-x-1"></i>
              </Link>
            </div>

            {/* Promo Image */}
            <div className="absolute top-1/2 -right-16 h-[140%] w-[60%] -translate-y-1/2">
              <img
                src={promo.imageUrl}
                alt={promo.headline}
                className="h-full w-full object-contain object-center drop-shadow-xl"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
