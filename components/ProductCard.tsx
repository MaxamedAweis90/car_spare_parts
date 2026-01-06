"use client";

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
}

function buildPublicProductImageUrl(fileId?: string | null) {
  if (!fileId) return null;
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!endpoint || !project || !bucket) return null;
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`
  );
  url.searchParams.set("project", project);
  return url.toString();
}
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
  const linkHref = href ?? `/products/${id}`;
  const imageUrl = imageUrlProp ?? buildPublicProductImageUrl(imageId ?? null);
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
    });
    cart.openCart();
  };

  return (
    <Link
      href={linkHref}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border-strong) bg-(--color-surface) shadow-panel transition hover:-translate-y-0.5"
    >
      <div className="relative aspect-4/3 w-full bg-(--color-bg)">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-contain p-3 sm:p-4 transition-transform duration-300 group-hover:scale-105"
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

      <div className="flex flex-1 flex-col gap-2 px-3 py-3 sm:px-4 sm:py-4">
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
