"use client";

import { useRef } from "react";
import Link from "next/link";
import ProductCard, { type ProductCardProps } from "@/components/features/products/ProductCard";

export type TopDealItem = ProductCardProps & {
  moq?: number;
};

interface TopDealsSectionProps {
  deals: TopDealItem[];
  loading: boolean;
  viewMoreHref: string;
}

export function TopDealsSection({
  deals,
  loading,
  viewMoreHref,
}: TopDealsSectionProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: "left" | "right") => {
    const node = scrollerRef.current;
    if (!node) return;
    const distance = node.offsetWidth * 0.9;
    node.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-(--color-border-strong) bg-(--color-surface) p-6 shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.28em] text-(--color-muted)">
            Top Deals
          </p>
          <h2 className="text-2xl font-extrabold text-(--color-text)">
            Score the lowest prices today
          </h2>
          <p className="text-sm text-(--color-muted)">
            Shop limited time drops curated for fast-moving sellers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy("left")}
            aria-label="Scroll deals left"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-(--color-border) bg-white text-(--color-muted) shadow-sm transition hover:text-(--color-text) sm:flex"
          >
            <span aria-hidden>◀</span>
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            aria-label="Scroll deals right"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-(--color-border) bg-white text-(--color-muted) shadow-sm transition hover:text-(--color-text) sm:flex"
          >
            <span aria-hidden>▶</span>
          </button>
          <Link
            href={viewMoreHref}
            className="inline-flex items-center gap-2 rounded-full bg-(--color-primary) px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--color-primary-strong)"
          >
            View more
            <span aria-hidden>›</span>
          </Link>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-(--color-muted)">Loading top deals...</p>
      )}
      {!loading && deals.length === 0 && (
        <p className="text-sm text-(--color-muted)">
          No deals available yet. Check back soon.
        </p>
      )}

      <div
        ref={scrollerRef}
        className="-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-2 sm:overflow-x-visible"
      >
        {deals.map((deal) => (
          <div key={deal.id} className="w-56 shrink-0 snap-start sm:w-64">
            <ProductCard {...deal} />
          </div>
        ))}
      </div>
    </section>
  );
}

