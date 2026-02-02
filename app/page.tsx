"use client";

import { useMemo, useRef, type RefObject, useEffect } from "react";
import ProductCard from "@/components/features/products/ProductCard";
import Skeleton from "@mui/material/Skeleton";
import { HeroSection } from "@/components/features/landing/HeroSection";
import { TopDealsSection } from "@/components/features/landing/TopDealsSection";

type Product = {
  $id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  originalPrice?: number | null;
  onSale?: boolean;
  discountStartDate?: string | null;
  discountExpiry?: string | null;
  stock?: number | null;
  category?: string | null;
  sellerId: string;
  imageId?: string | null;
  imageUrl?: string | null;
};

function buildPublicProductImageUrl(fileId?: string | null) {
  if (!fileId) return null;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!endpoint || !project || !bucket) return null;
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`,
  );
  url.searchParams.set("project", project);
  return url.toString();
}

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

import { useInfiniteProducts } from "@/hooks/queries/useInfiniteProducts";

// ... (previous imports)

// ... (Product type definition)

// ... (helper functions buildPublicProductImageUrl, groupByCategory, useSwiper)

export default function Home() {
  // Use TanStack Query for automatic caching & infinite loading
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: queryError,
  } = useInfiniteProducts({
    limit: 18,
    sort: "newest",
  });

  const products = useMemo(
    () => data?.pages.flatMap((page) => page.products) || [],
    [data],
  );

  const error = queryError ? String(queryError) : null;

  const sliderRef = useRef<HTMLDivElement>(null);
  const heroImage = "/heroimages/brakes.png";
  const heroPromos = [
    {
      eyebrow: "Elite Selection",
      headline: "Performance Tires",
      description: "Unmatched grip and durability for every road condition.",
      imageUrl: "/heroimages/Tires.png",
      href: "/shop?search=tire",
    },
    {
      eyebrow: "Pure Sound",
      headline: "Audio Systems",
      description: "Crystal clear acoustics with our premium HiFi collection.",
      imageUrl: "/heroimages/car.png",
      href: "/shop?search=audio",
    },
  ];

  useSwiper(sliderRef);

  const featured = useMemo(() => products.slice(0, 4), [products]);
  // ... (categories logic same as before)

  // ... (sliderItems, hotOffer logic same as before)

  const topDeals = useMemo(
    () =>
      [...products]
        .filter((p) => p.onSale && typeof p.price === "number")
        .sort((a, b) => {
          // ... (sort logic same as before)
          const discA =
            (Number(a.originalPrice || 0) - (a.price || 0)) /
            (a.originalPrice || 1);
          const discB =
            (Number(b.originalPrice || 0) - (b.price || 0)) /
            (b.originalPrice || 1);
          return discB - discA;
        })
        .slice(0, 10)
        .map((p, index: number) => ({
          // Cast for map
          // ... (map logic same as before)
          id: p.$id,
          name: p.name,
          price: typeof p.price === "number" ? p.price : 0,
          originalPrice: p.originalPrice ?? null,
          onSale: !!p.onSale,
          discountStartDate: p.discountStartDate,
          discountExpiry: p.discountExpiry,
          stock: p.stock,
          imageId: p.imageId,
          imageUrl: p.imageUrl,
          slug: p.slug,
          moq: (index % 3) + 1,
        })),
    [products],
  );

  return (
    <div className="bg-(--color-bg ) ">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
        <div className="space-y-8 pt-6 sm:pt-10">
          <HeroSection imageUrl={heroImage} promos={heroPromos} />
          {/* Only show top deals if we have enough products to calculate them */}
          {products.length > 0 && (
            <TopDealsSection
              deals={topDeals}
              loading={isLoading && !products.length}
              viewMoreHref="/deals#top"
            />
          )}
        </div>
      </div>
      <section className="mt-12 bg-(--color-surface) py-10  sm:mb-20">
        <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-(--color-text)">
                Products
              </h2>
            </div>
            {error && (
              <p className="text-sm font-medium text-(--color-danger)">
                {error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ">
              {isLoading && !products.length
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
                : products.map((product: any) => (
                    <ProductCard
                      key={product.$id}
                      id={product.$id}
                      name={product.name}
                      price={product.price ?? null}
                      originalPrice={product.originalPrice ?? null}
                      onSale={product.onSale}
                      discountStartDate={product.discountStartDate}
                      discountExpiry={product.discountExpiry}
                      stock={product.stock ?? null}
                      imageId={product.imageId ?? null}
                      imageUrl={product.imageUrl ?? null}
                      href={`/products/${product.slug || product.$id}`}
                      slug={product.slug}
                    />
                  ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="group flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-(--color-primary-strong) disabled:opacity-50"
                >
                  <span>
                    {isFetchingNextPage ? "Loading more..." : "Load More"}
                  </span>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:bg-(--color-primary-strong) group-hover:text-white group-hover:border-transparent ${isFetchingNextPage ? "animate-spin" : ""}`}
                  >
                    {isFetchingNextPage ? (
                      <i className="fa-solid fa-spinner"></i>
                    ) : (
                      <i className="fa-solid fa-arrow-down"></i>
                    )}
                  </div>
                </button>
              </div>
            )}
            {!hasNextPage && products.length > 0 && (
              <div className="mt-8 flex justify-center text-xs text-slate-400 font-medium">
                You've reached the end
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
