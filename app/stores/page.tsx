"use client";

import { useEffect, useState } from "react";
import { getStores } from "@/services/store";
import type { SellerStoreResponse } from "@/lib/types/seller-store";
import StoreCard from "@/components/features/store/StoreCard";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { Spin, Empty } from "antd";

export default function StoresPage() {
  const [stores, setStores] = useState<SellerStoreResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStores() {
      try {
        const data = await getStores();
        setStores(data.stores);
      } catch (err: any) {
        setError(err.message || "Failed to load stores");
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  return (
    <div className="min-h-screen bg-(--color-bg ) py-8 sm:py-12 lg:py-16">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6 lg:px-8">
        {/* Header & Breadcrumbs */}
        <div className="mb-8 sm:mb-12 flex flex-col gap-4">
          <Breadcrumbs items={[{ title: "Stores" }]} />
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Featured Stores
            </h1>
            <p className="max-w-2xl text-base sm:text-lg font-medium text-slate-500">
              Discover the best car parts sellers on SomaParts. Quality
              guaranteed from trusted community partners.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-rose-600">Oops!</h2>
              <p className="mt-2 text-slate-600">{error}</p>
            </div>
          </div>
        ) : stores.length === 0 ? (
          <div className="flex h-96 items-center justify-center rounded-[2rem] sm:rounded-[3rem] border border-dashed border-[#d8d1c4] bg-white/50">
            <Empty description="No stores found yet. Check back soon!" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6 md:gap-8 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

