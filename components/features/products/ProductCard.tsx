"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export interface ProductCardProps {
  id: string;
  name: string;
  price?: number | null;
  originalPrice?: number | null;
  onSale?: boolean;
  discountStartDate?: string | null;
  discountExpiry?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  href?: string;
  stock?: number | null;
  slug?: string;
}

import { getProductImageUrl } from "@/lib/utils/product-image";
export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  onSale,
  discountStartDate,
  discountExpiry,
  imageId,
  imageUrl: imageUrlProp,
  href,
  stock,
  slug,
}: ProductCardProps) {
  const isCurrentlyOnSale = (() => {
    if (!onSale) return false;
    const now = new Date();
    if (discountStartDate) {
      if (now < new Date(discountStartDate)) return false;
    }
    if (discountExpiry) {
      if (now > new Date(discountExpiry)) return false;
    }
    return true;
  })();

  const cart = useCart();
  const priceDisplay = typeof price === "number" ? `$${price.toFixed(2)}` : "";
  const linkHref = href && href.length > 0 ? href : `/products/${slug || id}`;
  const imageUrl = imageUrlProp ?? getProductImageUrl(imageId ?? null);

  if (!id) {
    console.warn("ProductCard: missing id for product", name);
  }
  const canAddToCart =
    typeof price === "number" && (typeof stock !== "number" || stock > 0);

  const handleAddToCart: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart) return;
    cart.addItem({
      id,
      name,
      price: price as number,
      imageId: imageId ?? null,
      imageUrl: imageUrl ?? null,
      slug: slug,
    });
    cart.openCart();
  };

  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);

  return (
    <Link
      href={linkHref}
      onMouseEnter={() => {
        // Potentially cycle images or show secondary image if supported in the future
      }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border-strong) bg-(--color-surface) shadow-panel transition hover:-translate-y-0.5"
    >
      <div className="relative aspect-square w-full bg-(--color-bg)">
        {currentImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs sm:text-sm text-(--color-muted)">
            No image
          </div>
        )}

        {isCurrentlyOnSale && (
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            <div className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white shadow-lg">
              SALE
            </div>
            {originalPrice && price && (
              <div className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                -{(((originalPrice - price) / originalPrice) * 100).toFixed(0)}%
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 py-3 sm:px-4 sm:py-4 bg-white">
        <h3 className="line-clamp-2 text-sm sm:text-base font-bold leading-snug text-(--color-text) group-hover:text-(--color-primary)">
          {name}
        </h3>
        {priceDisplay && (
          <div className="flex items-center gap-2">
            <div className="text-base sm:text-lg font-black text-(--color-text)">
              {priceDisplay}
            </div>
            {isCurrentlyOnSale && originalPrice && (
              <div className="text-xs sm:text-sm text-(--color-muted) line-through">
                ${Number(originalPrice).toFixed(2)}
              </div>
            )}
          </div>
        )}

        {discountExpiry && isCurrentlyOnSale && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-md w-fit">
            <i className="fa-solid fa-clock animate-pulse"></i>
            <span>Ends: {new Date(discountExpiry).toLocaleDateString()}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          {typeof stock === "number" ? (
            <div className="text-xs sm:text-[13px] font-semibold text-(--color-muted)">
              Stock: <span className="font-bold">{stock} left</span>
            </div>
          ) : (
            <div className="text-xs sm:text-[13px] font-semibold text-(--color-muted)">
              Stock: <span className="font-bold">—</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            aria-label="Add to cart"
            className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] transition-all duration-200 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md active:scale-90"
          >
            <i
              className="fa-solid fa-cart-shopping text-sm sm:text-base"
              aria-hidden
            ></i>
          </button>
        </div>
      </div>
    </Link>
  );
}
