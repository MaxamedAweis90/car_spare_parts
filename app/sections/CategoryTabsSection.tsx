"use client";

"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

export type CategoryTabsSectionProduct = {
  $id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string | null;
};

interface CategoryTabsSectionProps {
  products: CategoryTabsSectionProduct[];
  loading: boolean;
  error: string | null;
}

export function CategoryTabsSection({ products, loading, error }: CategoryTabsSectionProps) {
  const [tab, setTab] = useState<"sale" | "popular" | "hot">("sale");

  const tabProducts = useMemo(() => {
    if (!products.length) return [];
    if (tab === "sale") return [...products].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 4);
    if (tab === "popular") return products.slice(0, 4);
    return [...products].slice(0, 4);
  }, [products, tab]);

  return (
    <section className="space-y-5 rounded-2xl border border-(--color-border-strong) bg-(--color-surface) p-6 shadow-panel">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-(--color-border) pb-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-(--color-muted)">Suggested</p>
          <h2 className="text-2xl font-extrabold text-(--color-accent)">What we offer</h2>
        </div>
        <a href="/products" className="text-sm font-semibold text-(--color-primary) hover:underline">
          View all
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-(--color-muted)">
        {(
          [
            { key: "sale", label: "On sale" },
            { key: "popular", label: "Popular" },
            { key: "hot", label: "Hot 🔥" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`pb-2 uppercase tracking-wide transition ${
              tab === key
                ? "border-b-2 border-(--color-primary) text-(--color-accent)"
                : "text-(--color-muted) hover:text-(--color-accent)"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-(--color-muted)">Loading products...</p>}
      {error && <p className="text-sm text-(--color-danger)">{error}</p>}
      {!loading && !error && tabProducts.length === 0 && <p className="text-sm text-(--color-muted)">No products available.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tabProducts.map((p) => (
          <ProductCard
            key={`${tab}-${p.$id}`}
            id={p.$id}
            name={p.name}
            price={p.price}
            imageUrl={(p as any).imageUrl || undefined}
            category={p.category}
          />
        ))}
      </div>
    </section>
  );
}
