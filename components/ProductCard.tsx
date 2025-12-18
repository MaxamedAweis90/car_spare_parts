"use client";

import Link from "next/link";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  category?: string;
}

export default function ProductCard({ id, name, price, imageUrl, category }: ProductCardProps) {
  const priceLabel = price != null ? `£${price.toFixed(2)}` : "";
  return (
    <Link
      href={`/products/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--color-border-strong) bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_34px_rgba(0,0,0,0.09)]"
    >
      <div className="relative aspect-square w-full bg-[#f5f7fb]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-(--color-muted)">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-(--color-muted)">{category || "Brake parts"}</span>
        <div className="line-clamp-2 text-base font-extrabold leading-tight text-(--color-text) group-hover:text-(--color-accent)">{name}</div>
        <div className="flex items-center gap-1 text-[11px] text-(--color-muted)">
          {[...Array(5)].map((_, idx) => (
            <i key={idx} className="fa-solid fa-star text-[#f6b300]" aria-hidden></i>
          ))}
          <span className="ml-1 text-xs font-semibold text-(--color-muted)">2 reviews</span>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="text-xl font-extrabold text-(--color-text)">{priceLabel}</div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) text-(--color-muted) transition group-hover:border-(--color-accent) group-hover:text-(--color-accent)">
            <i className="fa-solid fa-cart-shopping text-base" aria-hidden></i>
            <span className="sr-only">Add to cart</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
