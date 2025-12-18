"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import ProductCard from "@/components/ProductCard";
import { HeroSection } from "./sections/HeroSection";
import { CategoryTabsSection } from "./sections/CategoryTabsSection";
import { LeftRail } from "./sections/LeftRail";

type Product = {
  $id: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  imageUrl?: string | null;
  active?: boolean;
  published?: boolean;
};

function groupByCategory(products: Product[]) {
  const map: Record<string, Product[]> = {};
  products.forEach((p) => {
    const key = p.category || "Other";
    if (!map[key]) map[key] = [];
    map[key].push(p);
  });
  return map;
}

function useSwiper(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    const anyWin = window as any;
    const SwiperLib = anyWin.Swiper;
    if (!SwiperLib) return;

    const instance = new SwiperLib(ref.current, {
      slidesPerView: 1,
      spaceBetween: 12,
      loop: true,
      autoplay: { delay: 2800, disableOnInteraction: false },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });

    return () => {
      if (instance && instance.destroy) instance.destroy(true, false);
    };
  }, [ref]);
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const heroImage = "/heroimages/brakes.png";
  const heroPromos = [
    {
      eyebrow: "New rims",
      headline: "New tires",
      description: "Wearing the best!",
      imageUrl: "/heroimages/Tires.png",
      href: "/products?category=Tires",
    },
    {
      eyebrow: "Get yours",
      headline: "HiFi audio",
      description: "Listening to the best",
      imageUrl: "/heroimages/car.png",
      href: "/products?category=Audio",
    },
  ];

  useSwiper(sliderRef);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products?limit=24", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Failed to load products");
        const items: Product[] = Array.isArray(body?.items) ? (body.items as Product[]) : [];
        const activeItems = items.filter((p: Product) => (p as any)?.active !== false && (p as any)?.published !== false);
        setProducts(activeItems);
      } catch (err: any) {
        setError(err?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featured = useMemo(() => products.slice(0, 4), [products]);
  const categories = useMemo(() => groupByCategory(products), [products]);
  const categoryList = useMemo(() => Object.keys(categories).sort(), [categories]);

  const sliderItems = useMemo(() => {
    const base = featured.length ? featured : products;
    return base.slice(0, 8);
  }, [featured, products]);

  const hotOffer = featured[0] || products[0];

  return (
    <div className="bg-(--color-bg) pb-16">
      <div className="mx-auto w-full max-w-10/12 px-4 sm:px-6">
        <div className="space-y-8 pt-6 sm:pt-10">
          <HeroSection imageUrl={heroImage} promos={heroPromos} />

          <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
            <LeftRail categories={categoryList} hotOffer={hotOffer} />
            <CategoryTabsSection products={products} loading={loading} error={error} />
          </div>

          <section className="overflow-hidden rounded-2xl bg-(--color-accent) p-6 text-white shadow-panel">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#cbd5e1]">Interior items for</p>
                <h3 className="text-3xl font-extrabold">Premium class</h3>
                <p className="text-sm text-[#cbd5e1]">Elevate your cabin with curated accessories built to last.</p>
              </div>
              <a
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-(--color-primary) px-5 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-(--color-primary-strong)"
              >
                View details <i className="fa-solid fa-arrow-right text-xs" aria-hidden></i>
              </a>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-(--color-border-strong) bg-(--color-surface) p-6 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-bold uppercase tracking-wide text-(--color-muted)">Weekly offer</p>
                <h3 className="text-2xl font-extrabold text-(--color-accent)">Highlights</h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-(--color-muted)">
                {(["Oils", "Filters", "Brakes"] as const).map((label, index) => (
                  <span
                    key={label}
                    className={`cursor-pointer pb-1 ${
                      index === 0 ? "border-b-2 border-(--color-primary) text-(--color-accent)" : "hover:text-(--color-accent)"
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="swiper" ref={sliderRef}>
              <div className="swiper-wrapper">
                {sliderItems.map((p) => (
                  <div className="swiper-slide" key={`slide-${p.$id}`}>
                    <ProductCard
                      id={p.$id}
                      name={p.name}
                      price={p.price}
                      imageUrl={(p as any).imageUrl || undefined}
                      category={p.category}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
