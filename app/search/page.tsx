"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BreadcrumbTrail } from "@/components/BreadcrumbTrail";

interface Product {
  $id: string;
  name: string;
  price: number;
  imageId: string | null;
  imageUrl: string | null;
  stock: number;
  onSale?: boolean;
  salePrice?: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const onSale = searchParams.get("onSale");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (query) params.set("search", query);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (onSale) params.set("onSale", onSale);

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch products");

        setProducts(data.products || []);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query, minPrice, maxPrice, onSale]);

  const activeFilters = [];
  if (minPrice && Number(minPrice) > 0) {
    activeFilters.push({ label: `Min: £${minPrice}`, key: "minPrice" });
  }
  if (maxPrice && Number(maxPrice) < 1000) {
    activeFilters.push({ label: `Max: £${maxPrice}`, key: "maxPrice" });
  }
  if (onSale === "true") {
    activeFilters.push({ label: "On Sale", key: "onSale" });
  }

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BreadcrumbTrail
          items={[{ label: "Home", href: "/" }, { label: "Search Results" }]}
        />

        {/* Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">
            {query ? `Search results for "${query}"` : "All Products"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {loading ? "Searching..." : `${products.length} products found`}
          </p>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Active Filters:
            </span>
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => clearFilter(filter.key)}
                className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700 transition hover:bg-orange-200"
              >
                {filter.label}
                <i className="fa-solid fa-xmark text-xs" aria-hidden />
              </button>
            ))}
            <button
              onClick={() => (window.location.href = "/search")}
              className="text-sm font-semibold text-slate-600 underline hover:text-slate-900"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
              <p className="text-sm font-semibold text-slate-600">
                Loading products...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <i
              className="fa-solid fa-exclamation-circle mb-3 text-4xl text-red-500"
              aria-hidden
            />
            <h3 className="mb-2 text-lg font-bold text-red-900">
              Error Loading Products
            </h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <i
              className="fa-solid fa-search mb-4 text-6xl text-slate-300"
              aria-hidden
            />
            <h3 className="mb-2 text-xl font-bold text-slate-900">
              No products found
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              {query
                ? `We couldn't find any products matching "${query}"`
                : "Try adjusting your filters or search terms"}
            </p>
            <Link
              href="/shop"
              className="inline-block rounded-full bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.$id}
                href={`/product/${product.$id}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <i
                        className="fa-solid fa-image text-6xl text-slate-300"
                        aria-hidden
                      />
                    </div>
                  )}
                  {product.onSale && (
                    <div className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                      SALE
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-2 line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-orange-600">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {product.onSale && product.salePrice ? (
                      <>
                        <span className="text-lg font-extrabold text-orange-600">
                          £{product.salePrice.toFixed(2)}
                        </span>
                        <span className="text-sm font-semibold text-slate-400 line-through">
                          £{product.price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-extrabold text-slate-900">
                        £{product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.stock > 0
                      ? `${product.stock} in stock`
                      : "Out of stock"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
