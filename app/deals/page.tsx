"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";

type Product = {
  $id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string | null;
  active?: boolean;
  published?: boolean;
};

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products?limit=30", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Failed to load products");
        const items: Product[] = Array.isArray(body?.items) ? (body.items as Product[]) : [];
        const activeItems = items.filter((p) => (p as any)?.active !== false && (p as any)?.published !== false);
        setProducts(activeItems);
      } catch (err: any) {
        setError(err?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dealItems = useMemo(() => {
    if (!products.length) return [];
    return [...products].sort((a, b) => (b.price || 0) - (a.price || 0)).slice(0, 9);
  }, [products]);

  return (
    <div className="bg-(--color-bg) min-h-screen py-10">
      <div className="mx-auto w-full max-w-10/12 px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-(--color-muted)">Featured savings</p>
            <h1 className="text-3xl font-bold text-(--color-text)">Top Deals</h1>
            <p className="text-sm text-(--color-muted)">Hand-picked offers on the most popular parts.</p>
          </div>
          <span className="text-sm font-semibold text-(--color-muted)">{dealItems.length} items</span>
        </div>

        {error && <p className="mb-4 text-sm text-(--color-danger)">{error}</p>}
        {loading && !error && <p className="mb-4 text-sm text-(--color-muted)">Loading deals...</p>}
        {!loading && !error && dealItems.length === 0 && <p className="text-sm text-(--color-muted)">No deals available right now.</p>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dealItems.map((p) => (
            <ProductCard key={`deal-${p.$id}`} id={p.$id} name={p.name} price={p.price} imageUrl={p.imageUrl || undefined} category={p.category} />
          ))}
        </div>
      </div>
    </div>
  );
}
