"use client";

import { useState, useEffect } from "react";
import { getProductImageUrl } from "@/lib/utils/product-image";

interface ProductGalleryProps {
  mainImageId?: string | null;
  imageIds?: string[];
  name: string;
  previewUrls?: string[];
}

export function ProductGallery({
  mainImageId,
  imageIds = [],
  name,
  previewUrls,
}: ProductGalleryProps) {
  // If previewUrls is provided, use it directly. Otherwise, use IDs.
  const isPreview = !!previewUrls && previewUrls.length > 0;

  // For preview mode, we treat the URL as the ID
  const allImageIds = isPreview
    ? previewUrls!
    : Array.from(new Set([mainImageId, ...imageIds])).filter(
        (id): id is string => !!id,
      );

  const [activeId, setActiveId] = useState<string | null>(
    allImageIds[0] || null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!activeId && allImageIds.length > 0) {
      setActiveId(allImageIds[0]);
    } else if (
      allImageIds.length > 0 &&
      activeId &&
      !allImageIds.includes(activeId)
    ) {
      setActiveId(allImageIds[0]);
    }
  }, [allImageIds, activeId]);

  const handleHover = (id: string) => {
    if (activeId !== id) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveId(id);
        setIsTransitioning(false);
      }, 50); // Very fast transition for responsive feel
    }
  };

  const activeUrl = isPreview ? activeId : getProductImageUrl(activeId);

  return (
    <div className="flex flex-col gap-6">
      {/* Main Image Viewport */}
      <div className="relative aspect-square w-full bg-white border border-(--color-border) rounded-2xl overflow-hidden shadow-sm flex items-center justify-center group bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={name}
            className={`w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-110 ${
              isTransitioning ? "opacity-40 scale-95" : "opacity-100 scale-100"
            }`}
          />
        ) : (
          <div className="text-(--color-text-muted) flex flex-col items-center gap-2">
            <i className="fa-regular fa-image text-4xl opacity-20"></i>
            <span className="text-sm font-medium">No image available</span>
          </div>
        )}

        {/* Quality Indicator (Best Buy Style) */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-(--color-border) shadow-sm flex items-center gap-2">
            <i className="fa-solid fa-expand text-[10px] text-(--color-primary)"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-(--color-text)">
              Rollover to Zoom
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnails Navigator */}
      {allImageIds.length > 1 && (
        <div className="grid grid-cols-6 gap-3">
          {allImageIds.map((id) => (
            <div
              key={id}
              onMouseEnter={() => handleHover(id)}
              className={`aspect-square rounded-xl border-2 overflow-hidden bg-white p-1 transition-all cursor-pointer relative group/thumb ${
                activeId === id
                  ? "border-(--color-primary) ring-4 ring-(--color-primary)/5"
                  : "border-(--color-border) hover:border-(--color-border-strong)"
              }`}
            >
              <img
                src={isPreview ? id : getProductImageUrl(id)!}
                alt={`${name} thumbnail`}
                className="w-full h-full object-contain opacity-80 group-hover/thumb:opacity-100 transition-opacity"
              />
              {activeId === id && (
                <div className="absolute inset-0 bg-(--color-primary)/5 pointer-events-none"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
