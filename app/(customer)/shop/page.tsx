"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/features/products/ProductCard";
import Skeleton from "@mui/material/Skeleton";
import Link from "next/link";
import { SearchFilters } from "@/components/features/products/SearchFilters";
import { useCategories } from "@/hooks/queries/useCategories";
import { useProducts } from "@/hooks/queries/useProducts";
import { Drawer, Button as AntButton } from "antd";
import { FilterOutlined } from "@ant-design/icons";

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

function ShopPageContent() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const onSaleFilter = searchParams.get("onSale");
  const minPriceFilter = searchParams.get("minPrice");
  const maxPriceFilter = searchParams.get("maxPrice");
  const makeFilter = searchParams.get("make");
  const modelFilter = searchParams.get("model");
  const yearFilter = searchParams.get("year");

  // Use TanStack Query hook for automatic caching
  const {
    data,
    isLoading,
    error: queryError,
  } = useProducts({
    category: categoryFilter || undefined,
    search: searchQuery || undefined,
    onSale: onSaleFilter === "true" ? true : undefined,
    minPrice: minPriceFilter ? Number(minPriceFilter) : undefined,
    maxPrice: maxPriceFilter ? Number(maxPriceFilter) : undefined,
    limit: 100,
  });

  const products = useMemo(() => {
    if (!data?.products) return [];

    let filtered = data.products;

    // Filter by active/published status
    filtered = filtered.filter(
      (p: any) => p.active !== false && p.published !== false,
    );

    return filtered;
  }, [data?.products, onSaleFilter]);

  const error = queryError ? String(queryError) : null;

  const activeCategory = useMemo(() => {
    if (!categoryFilter || !categories) return null;
    const part = categories.find((c) => c.id === categoryFilter);
    if (!part) return null;

    const names: string[] = [part.name];
    let current = part;
    while (current.parentCategoryId) {
      const parent = categories.find((c) => c.id === current.parentCategoryId);
      if (parent) {
        names.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }

    return { ...part, fullLabel: names.join(" > ") };
  }, [categoryFilter, categories]);

  const handleFiltersChange = (newFilters: any) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.minPrice > 0)
      params.set("minPrice", newFilters.minPrice.toString());
    else params.delete("minPrice");

    if (newFilters.maxPrice < 1000)
      params.set("maxPrice", newFilters.maxPrice.toString());
    else params.delete("maxPrice");

    if (newFilters.onSale) params.set("onSale", "true");
    else params.delete("onSale");

    if (newFilters.make) params.set("make", newFilters.make);
    else params.delete("make");

    if (newFilters.model) params.set("model", newFilters.model);
    else params.delete("model");

    if (newFilters.year) params.set("year", newFilters.year);
    else params.delete("year");

    if (newFilters.category) params.set("category", newFilters.category);
    else params.delete("category");

    router.push(`/shop?${params.toString()}`);
  };

  const visibleProducts = useMemo(() => products.slice(0, 48), [products]);
  const hasFilters = !!(
    categoryFilter ||
    searchQuery ||
    onSaleFilter === "true" ||
    minPriceFilter ||
    maxPriceFilter ||
    makeFilter ||
    modelFilter ||
    yearFilter
  );

  return (
    <div className="bg-(--color-bg) min-h-screen py-10">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:w-80 lg:shrink-0">
            <div className="sticky top-24">
              <SearchFilters
                filters={{
                  minPrice: Number(minPriceFilter || 0),
                  maxPrice: Number(maxPriceFilter || 1000),
                  onSale: onSaleFilter === "true",
                  make: makeFilter || "",
                  model: modelFilter || "",
                  year: yearFilter || "",
                  category: categoryFilter || "",
                }}
                onFiltersChange={handleFiltersChange}
                onClose={() => {}}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Trigger */}
            <div className="flex items-center justify-between lg:hidden mb-6 p-4 rounded-3xl bg-white shadow-sm border border-(--color-border)">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-(--color-muted)">
                  Refine by
                </span>
                <span className="text-sm font-bold text-(--color-text)">
                  Categories & Fitment
                </span>
              </div>
              <AntButton
                type="primary"
                icon={<FilterOutlined />}
                onClick={() => setIsMobileFilterOpen(true)}
                className="h-12 px-6 rounded-2xl bg-(--color-primary) border-none font-bold shadow-lg shadow-(--color-primary-light) text-slate-900"
              >
                Filters
              </AntButton>
            </div>

            {/* Mobile Filter Drawer */}
            <Drawer
              title={null}
              placement="right"
              onClose={() => setIsMobileFilterOpen(false)}
              open={isMobileFilterOpen}
              size="default"
              styles={{
                body: { padding: "2rem 1rem", backgroundColor: "#f4f1e9" },
              }}
              closeIcon={null}
            >
              <div className="flex flex-col items-center">
                <SearchFilters
                  filters={{
                    minPrice: Number(minPriceFilter || 0),
                    maxPrice: Number(maxPriceFilter || 1000),
                    onSale: onSaleFilter === "true",
                    make: makeFilter || "",
                    model: modelFilter || "",
                    year: yearFilter || "",
                    category: categoryFilter || "",
                  }}
                  onFiltersChange={(f) => {
                    handleFiltersChange(f);
                    setIsMobileFilterOpen(false);
                  }}
                  onClose={() => setIsMobileFilterOpen(false)}
                />
              </div>
            </Drawer>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.24em] text-(--color-muted)">
                    Browse catalog
                  </p>
                  {hasFilters && (
                    <Link
                      href="/shop"
                      className="text-[10px] font-bold uppercase tracking-wider text-(--color-primary) hover:underline"
                    >
                      (Clear All)
                    </Link>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-(--color-text)">
                  {activeCategory
                    ? `Category: ${activeCategory.fullLabel}`
                    : "Shop All Products"}
                </h1>
                <p className="text-sm text-(--color-muted)">
                  {searchQuery
                    ? `Showing results for "${searchQuery}"`
                    : "Find brakes, accessories, electronics, and more."}
                </p>
              </div>
              {!isLoading && (
                <span className="text-sm font-semibold text-(--color-muted)">
                  {products.length} items found
                </span>
              )}
            </div>

            {error && (
              <p className="mb-4 text-sm text-(--color-danger)">{error}</p>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {isLoading
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
                : visibleProducts.map((p: any) => (
                    <ProductCard
                      key={`shop-${p.$id}`}
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
                      slug={p.slug}
                    />
                  ))}
            </div>

            {!isLoading && !error && visibleProducts.length === 0 && (
              <div className="py-20 text-center">
                <i className="fa-solid fa-box-open mb-4 block text-5xl text-(--color-border-strong)"></i>
                <p className="text-lg font-medium text-(--color-muted)">
                  No products found for this selection.
                </p>
                {hasFilters && (
                  <Link
                    href="/shop"
                    className="mt-4 inline-block font-semibold text-(--color-primary) hover:underline"
                  >
                    Clear all filters
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ShopPageContent />
    </Suspense>
  );
}
