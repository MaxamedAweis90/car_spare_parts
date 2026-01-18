"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getImageUrl } from "@/lib/appwrite/storage";
import type { SellerStoreResponse } from "@/lib/types/seller-store";

interface StoreCardProps {
  store: SellerStoreResponse;
}

export default function StoreCard({ store }: StoreCardProps) {
  const bannerUrl = useMemo(() => {
    if (!store.storeBannerId) return null;
    return getImageUrl("storeBanners", store.storeBannerId);
  }, [store.storeBannerId]);

  const avatarUrl = useMemo(() => {
    if (!store.storeAvatarId) return null;
    return getImageUrl("storeAvatars", store.storeAvatarId);
  }, [store.storeAvatarId]);

  const initials = store.storeName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={`/stores/${store.storeSlug}`}
      className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-[#ece8de] bg-white transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/5"
    >
      {/* Banner Section */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-slate-100">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${store.storeName} banner`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-3xl sm:text-4xl">🏷️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="relative flex flex-1 flex-col p-6 pt-12 sm:p-6 sm:pt-12">
        {/* Avatar Overlay */}
        <div className="absolute -top-10 left-6 h-20 w-20 sm:h-20 sm:w-20 overflow-hidden rounded-2xl border-4 border-white bg-[#1f2937] text-xl font-bold text-white shadow-lg shadow-black/5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${store.storeName} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              {initials}
            </span>
          )}
        </div>

        {/* Store Info */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {store.storeName}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-sm">
                  {i < 4 ? "★" : "☆"}
                </span>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400">
              4.5 (82 reviews)
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500 line-clamp-2 min-h-[2.5rem]">
          {store.storeDescription || "No description provided."}
        </p>

        <div className="mt-6 flex items-center justify-between border-t border-[#f8f6f0] pt-6 sm:pt-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {store.isActive ? "🟢 Active Store" : "⚪ Offline"}
          </span>
          <span className="text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
            Visit Store →
          </span>
        </div>
      </div>
    </Link>
  );
}

