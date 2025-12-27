"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";

export type TopDealItem = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
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

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }),
    []
  );

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
        {deals.map((deal, index) => {
          const comparePrice = deal.compareAtPrice ?? null;
          const displayPrice = formatter.format(deal.price || 0);
          const displayCompare = comparePrice
            ? formatter.format(comparePrice)
            : null;
          const badge = index === 0 ? "Flash Deal" : null;
          const moqLabel = deal.moq ? `MOQ: ${deal.moq}` : null;

          return (
            <article
              key={deal.id}
              className="group flex w-56 shrink-0 snap-start flex-col rounded-2xl border border-(--color-border) bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:w-auto sm:flex-1"
            >
              <div className="relative rounded-t-2xl bg-(--color-bg)">
                {badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-(--color-danger) px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    {badge}
                  </span>
                )}
                {deal.imageUrl ? (
                  <img
                    src={deal.imageUrl}
                    alt={deal.name}
                    className="h-40 w-full rounded-t-2xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center rounded-t-2xl bg-gray-100 text-xs text-gray-500">
                    Image coming soon
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 rounded-b-2xl bg-white p-4">
                <h3 className="line-clamp-2 text-sm font-semibold text-(--color-text)">
                  {deal.name}
                </h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-(--color-accent)">
                    {displayPrice}
                  </span>
                  {displayCompare && (
                    <span className="text-xs text-(--color-muted) line-through">
                      {displayCompare}
                    </span>
                  )}
                </div>
                {moqLabel && (
                  <p className="text-xs font-medium text-(--color-muted)">
                    {moqLabel}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
