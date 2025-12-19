"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export interface ProductCardProps {
  id: string;
  name: string;
  price?: number | null;
  imageId?: string | null;
  href?: string;
  stock?: number | null;
}

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

export default function ProductCard({
  id,
  name,
  price,
  imageId,
  href,
  stock,
}: ProductCardProps) {
  const cart = useCart();
  const priceDisplay = typeof price === "number" ? `£${price.toFixed(2)}` : "";
  const linkHref = href ?? `/products/${id}`;
  const imageUrl = buildPublicProductImageUrl(imageId ?? null);
  const canAddToCart = typeof price === "number" && (typeof stock !== "number" || stock > 0);

  const handleAddToCart: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canAddToCart) return;
    cart.addItem({ id, name, price: price as number, imageId: imageId ?? null });
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
          <div className="flex h-full w-full items-center justify-center text-xs sm:text-sm text-(--color-muted)">No image</div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 px-3 py-3 sm:px-4 sm:py-4">
        <h3 className="line-clamp-2 text-sm sm:text-base font-bold leading-snug text-(--color-text) group-hover:text-(--color-primary)">{name}</h3>
        {priceDisplay && <div className="text-base sm:text-lg font-black text-(--color-text)">{priceDisplay}</div>}

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
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-muted) transition group-hover:border-(--color-primary) group-hover:text-(--color-primary) disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="fa-solid fa-cart-shopping text-sm sm:text-base" aria-hidden></i>
          </button>
        </div>
      </div>
    </Link>
  );
}
