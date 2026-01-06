"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@mui/material/Skeleton";

type Product = {
  $id: string;
  name: string;
  price?: number | null;
  originalPrice?: number | null;
  onSale?: boolean;
  discountStartDate?: string | null;
  discountExpiry?: string | null;
  stock?: number | null;
  category?: string | null;
  imageId?: string | null;
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
        const res = await fetch("/api/products?limit=100&onSale=true", {
          cache: "no-store",
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Failed to load products");
        const items: any[] = Array.isArray(body?.items) ? body.items : [];
        const normalized: Product[] = items
          .filter((p) => p && typeof p === "object")
          .map((p) => ({
            $id: String(p.$id),
            name: String(p.name ?? ""),
            price:
              typeof p.price === "number"
                ? p.price
                : p.price != null
                ? Number(p.price)
                : null,
            originalPrice:
              typeof p.originalPrice === "number"
                ? p.originalPrice
                : p.originalPrice != null
                ? Number(p.originalPrice)
                : null,
            onSale: !!p.onSale,
            discountStartDate: p.discountStartDate ?? null,
            discountExpiry: p.discountExpiry ?? null,
            stock:
              typeof p.stock === "number"
                ? p.stock
                : p.stock != null
                ? Number(p.stock)
                : null,
            imageId: p.imageId ?? null,
            imageUrl: p.imageUrl ?? null,
            active: p.isActive ?? p.active,
          }));

        const activeOnSaleItems = normalized.filter(
          (p) =>
            p.active !== false && (p as any).published !== false && p.onSale
        );
        setProducts(activeOnSaleItems);
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
    // Sort by largest discount percentage
    return [...products]
      .filter(
        (p) => (p.price ?? 0) > 0 && (p.originalPrice ?? 0) > (p.price ?? 0)
      )
      .sort((a, b) => {
        const discountA = (a.originalPrice! - a.price!) / a.originalPrice!;
        const discountB = (b.originalPrice! - b.price!) / b.originalPrice!;
        return discountB - discountA;
      })
      .slice(0, 48);
  }, [products]);

  return (
    <div className="bg-(--color-bg) min-h-screen py-10">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-(--color-muted)">
              Featured savings
            </p>
            <h1 className="text-3xl font-bold text-(--color-text)">
              Top Deals
            </h1>
            <p className="text-sm text-(--color-muted)">
              Hand-picked offers on the most popular parts.
            </p>
          </div>
          {!loading && (
            <span className="text-sm font-semibold text-(--color-muted)">
              {dealItems.length} items
            </span>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-(--color-danger)">{error}</p>}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {loading && !error && products.length === 0
            ? Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border-strong) bg-(--color-surface) shadow-panel"
                >
                  <div className="relative aspect-4/3 w-full bg-(--color-bg)">
                    <Skeleton
                      variant="rectangular"
                      width="100%"
                      height="100%"
                      sx={{ position: "absolute", inset: 0 }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-3 py-3 sm:px-4 sm:py-4">
                    <Skeleton variant="text" height={24} />
                    <Skeleton variant="text" width="55%" height={26} />
                    <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                      <Skeleton variant="text" width="45%" height={18} />
                      <Skeleton variant="circular" width={36} height={36} />
                    </div>
                  </div>
                </div>
              ))
            : dealItems.map((p) => (
                <ProductCard
                  key={`deal-${p.$id}`}
                  id={p.$id}
                  name={p.name}
                  price={p.price}
                  originalPrice={p.originalPrice}
                  onSale={p.onSale}
                  discountStartDate={p.discountStartDate}
                  discountExpiry={p.discountExpiry}
                  stock={p.stock ?? null}
                  imageId={p.imageId ?? null}
                  imageUrl={p.imageUrl ?? null}
                />
              ))}
        </div>

        {!loading && !error && dealItems.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg font-medium text-(--color-muted)">
              No deals available right now. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
