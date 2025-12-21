"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import ProductCard from "@/components/ProductCard";
import Skeleton from "@mui/material/Skeleton";
import { HeroSection } from "./sections/HeroSection";
import { TopDealsSection } from "./sections/TopDealsSection";

type Product = {
  $id: string;
  name: string;
  description?: string | null;
  price?: number | null;
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
  const url = new URL(`${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`);
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
        const items: any[] = Array.isArray(body?.items) ? body.items : [];
        const normalized: Product[] = items
          .filter((p) => p && typeof p === "object")
          .map((p) => ({
            $id: String(p.$id),
            name: String(p.name ?? ""),
            description: p.description ?? null,
            price: typeof p.price === "number" ? p.price : p.price != null ? Number(p.price) : null,
            stock: typeof p.stock === "number" ? p.stock : p.stock != null ? Number(p.stock) : null,
            category: p.category ?? null,
            sellerId: String(p.sellerId ?? ""),
            imageId: p.imageId ?? null,
            imageUrl: p.imageUrl ?? null,
          }))
          .filter((p) => p.name && p.sellerId);

        setProducts(normalized);
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
  const topDeals = useMemo(
    () =>
      [...products]
        .filter((p) => typeof p.price === "number")
        .sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
        .slice(0, 6)
        .map((p, index) => ({
          id: p.$id,
          name: p.name,
          price: typeof p.price === "number" ? p.price : 0,
          compareAtPrice: typeof p.price === "number" ? Math.round(p.price * 1.15) : null,
          imageUrl: buildPublicProductImageUrl(p.imageId ?? null),
          moq: (index % 3) + 1,
        })),
    [products],
  );

  return (
    <div className="bg-(--color-bg ) ">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
        <div className="space-y-8 pt-6 sm:pt-10">
          <HeroSection imageUrl={heroImage} promos={heroPromos} />
              <TopDealsSection deals={topDeals} loading={loading && !products.length} viewMoreHref="/deals#top" />
        </div>
      </div>
      <section className="mt-12 bg-(--color-surface) py-10  sm:mb-20">
        <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black text-(--color-text)">Products</h2>
            </div>
            {error && <p className="text-sm font-medium text-(--color-danger)">{error}</p>}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 ">
              {loading && !error && products.length === 0
                ? Array.from({ length: 12 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border-strong) bg-(--color-surface) shadow-panel"
                    >
                      <div className="relative aspect-4/3 w-full bg-(--color-bg)">
                        <Skeleton variant="rectangular" width="100%" height="100%" sx={{ position: "absolute", inset: 0 }} />
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
                : products.slice(0, 12).map((product) => (
                    <ProductCard
                      key={product.$id}
                      id={product.$id}
                      name={product.name}
                      price={product.price ?? null}
                      stock={product.stock ?? null}
                      imageId={product.imageId ?? null}
                      imageUrl={product.imageUrl ?? null}
                      href={`/products/${product.$id}`}
                    />
                  ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
