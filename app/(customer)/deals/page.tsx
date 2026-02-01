"use client";

import { useMemo } from "react";
import ProductCard from "@/components/features/products/ProductCard";
import Skeleton from "@mui/material/Skeleton";
import { useProducts } from "@/hooks/queries/useProducts";

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
  // Use TanStack Query with onSale filter
  const {
    data,
    isLoading,
    error: queryError,
  } = useProducts({
    limit: 100,
  });

  const products = useMemo(() => {
    if (!data?.products) return [];
    // Filter for on-sale products only
    return data.products.filter(
      (p: any) => p.active !== false && p.published !== false && p.onSale,
    );
  }, [data?.products]);

  const error = queryError ? String(queryError) : null;

  const dealItems = useMemo(() => {
    if (!products.length) return [];
    // Sort by largest discount percentage
    return [...products]
      .filter(
        (p) => (p.price ?? 0) > 0 && (p.originalPrice ?? 0) > (p.price ?? 0),
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
          {!isLoading && (
            <span className="text-sm font-semibold text-(--color-muted)">
              {dealItems.length} items
            </span>
          )}
        </div>

        {error && <p className="mb-4 text-sm text-(--color-danger)">{error}</p>}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
          {isLoading && !error && products.length === 0
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

        {!isLoading && !error && dealItems.length === 0 && (
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
