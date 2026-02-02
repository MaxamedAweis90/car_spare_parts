"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/features/products/ProductCard";
import FollowButton from "@/components/features/store/FollowButton";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

type StorePageClientProps = {
  store: any; // Type this properly if possible, or use 'any' for now since it comes from server serialization
  avatarUrl: string | null;
  bannerUrl: string | null;
  initialProducts?: any[];
};

export default function StorePageClient({
  store,
  avatarUrl,
  bannerUrl,
  initialProducts = [],
}: StorePageClientProps) {
  const [activeTab, setActiveTab] = useState<"products" | "deals" | "about">(
    "products",
  );
  const [searchQuery, setSearchQuery] = useState("");

  const initials = store.storeName.slice(0, 2).toUpperCase();
  const heroFallback =
    "https://images.unsplash.com/photo-1549921296-3b4a698c73e1?auto=format&fit=crop&w=1600&q=80";
  const bannerImage = bannerUrl ?? heroFallback;

  // Fetch products
  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ["store-products", store.sellerId, activeTab],
    queryFn: async () => {
      if (activeTab === "about") return { items: [] };

      const url = new URL("/api/products", window.location.origin);
      url.searchParams.append("sellerId", store.sellerId);
      url.searchParams.append("limit", "20"); // Fetch more for grid

      if (activeTab === "deals") {
        url.searchParams.append("onSale", "true");
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    initialData:
      activeTab === "products" ? { items: initialProducts } : undefined,
    enabled: activeTab !== "about",
  });

  // Filter local results if search is used (simple client-side filter for now)
  const products =
    productData?.items?.filter((p: any) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <div className="bg-[#f4f1e9] min-h-screen pt-3">
      <div className="mx-auto w-full md:max-w-10/12 px-4 pt-2 pb-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { title: "Stores", href: "/stores" },
            { title: store.storeName },
          ]}
        />

        {/* Header Section */}
        <section className="overflow-hidden rounded-4xl bg-white shadow-xl shadow-black/5">
          <div className="relative h-60 sm:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerImage}
              alt={`${store.storeName} banner`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/35 to-transparent" />
            <div className="relative flex h-full items-end px-6 pb-6">
              <div className="flex items-center gap-4 text-white">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-white/20 backdrop-blur">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={`${store.storeName} logo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold">{initials}</span>
                  )}
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold sm:text-4xl">
                    {store.storeName}
                  </h1>
                  <p className="text-sm text-white/80">
                    Curated by {store.storeSlug}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-b border-(--color-border) bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-(--color-border) bg-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={`${store.storeName} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-(--color-text)">
                    {initials}
                  </span>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-(--color-text)">
                  {store.storeName}
                </p>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--color-muted)">
                  Official storefront
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <FollowButton storeId={store.id} />
              <button className="inline-flex items-center gap-2 rounded-full border border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-text) hover:border-(--color-primary) hover:text-(--color-primary)">
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  className="h-4 w-4 fill-current"
                >
                  <path d="M13.5 2a3.5 3.5 0 0 1 2.62 5.85l2.17 1.25a1 1 0 0 1 0 1.8l-2.6 1.5A3.5 3.5 0 1 1 9 17.5V14l4.49-2.58-4.5-2.59V5a3.5 3.5 0 0 1 4.5-3z" />
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Tab Navigation & Search */}
          <div className="flex flex-col gap-3 border-b border-(--color-border) bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap items-center gap-6 text-sm font-semibold text-(--color-muted)">
              <button
                onClick={() => setActiveTab("products")}
                className={`pb-1 transition-colors ${
                  activeTab === "products"
                    ? "border-b-2 border-(--color-primary) text-(--color-text)"
                    : "hover:text-(--color-text)"
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab("deals")}
                className={`pb-1 transition-colors ${
                  activeTab === "deals"
                    ? "border-b-2 border-(--color-primary) text-(--color-text)"
                    : "hover:text-(--color-text)"
                }`}
              >
                Deals
              </button>
              <button
                onClick={() => setActiveTab("about")}
                className={`pb-1 transition-colors ${
                  activeTab === "about"
                    ? "border-b-2 border-(--color-primary) text-(--color-text)"
                    : "hover:text-(--color-text)"
                }`}
              >
                About
              </button>
            </nav>

            {(activeTab === "products" || activeTab === "deals") && (
              <div className="relative w-full max-w-xs">
                <svg
                  aria-hidden
                  viewBox="0 0 16 16"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-(--color-muted)"
                >
                  <path d="M11.742 10.344 15.3 13.9l-1.4 1.4-3.556-3.558a6 6 0 1 1 1.4-1.4zM6.5 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z" />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-(--color-border) bg-(--color-surface) py-2 pl-9 pr-4 text-sm text-(--color-text) focus:border-(--color-primary) focus:outline-none"
                  placeholder={`Search ${activeTab}...`}
                />
              </div>
            )}
          </div>
        </section>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "about" ? (
            /* About Tab Content */
            <div className="space-y-6">
              <section className="rounded-3xl border border-(--color-border-strong) bg-white p-8 text-center shadow-panel">
                <h2 className="text-2xl font-bold text-(--color-text)">
                  About {store.storeName}
                </h2>
                <p className="mt-3 text-base text-(--color-muted)">
                  {store.storeDescription ||
                    "From first sip to the last mile, we keep your ride running at its best."}
                </p>
              </section>

              <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="space-y-4 rounded-3xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm">
                  <h3 className="text-lg font-extrabold text-(--color-text)">
                    Store Highlights
                  </h3>
                  <ul className="space-y-3 text-sm text-(--color-text)">
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check mt-1 text-(--color-primary)" />
                      All parts inspected for OEM quality.
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check mt-1 text-(--color-primary)" />
                      Flexible shipping and pickup options.
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-check mt-1 text-(--color-primary)" />
                      Dedicated support for compatibility questions.
                    </li>
                  </ul>
                </div>
                <div className="space-y-4 rounded-3xl border border-(--color-border) bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                      Contact Email
                    </p>
                    <p className="mt-2 text-sm font-semibold text-(--color-text)">
                      {store.contactEmail || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                      Contact Phone
                    </p>
                    <p className="mt-2 text-sm font-semibold text-(--color-text)">
                      {store.contactPhone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--color-muted)">
                      Member Since
                    </p>
                    <p className="mt-2 text-sm font-semibold text-(--color-text)">
                      {new Date(
                        store.createdAt || store.updatedAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            /* Products/Deals Content */
            <div>
              {productsLoading && !products.length ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--color-primary) border-t-transparent" />
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {products.map((product: any) => {
                    // Normalize product data from API
                    const imageId =
                      product.imageId ||
                      (product.imageIds && product.imageIds[0]) ||
                      null;

                    return (
                      <div key={product.$id || product.id} className="h-full">
                        <ProductCard
                          id={product.$id || product.id}
                          name={product.name}
                          price={product.price}
                          originalPrice={product.originalPrice}
                          onSale={product.onSale}
                          imageId={imageId}
                          imageUrl={product.imageUrl} // If API provides full URL
                          stock={product.stock}
                          slug={product.slug}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--color-border) bg-white py-24 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                    <i className="fa-solid fa-box-open text-2xl text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-(--color-text)">
                    No products found
                  </h3>
                  <p className="text-sm text-(--color-muted)">
                    {activeTab === "deals"
                      ? "This store has no active deals right now."
                      : "Try adjusting your search query."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
