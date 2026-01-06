"use client";

import ProductCard from "@/components/ProductCard";

type HotOfferProduct = {
  $id: string;
  name: string;
  price: number;
  stock?: number | null;
  imageId?: string | null;
};

interface LeftRailProps {
  categories: string[];
  hotOffer?: HotOfferProduct;
}

const BRANDS = ["Subaru", "Hyundai", "Toyota", "Kia", "Dodge", "Jaguar"];

export function LeftRail({ categories, hotOffer }: LeftRailProps) {
  return (
    <aside className="space-y-6">
      <div className="rounded-2xl border border-(--color-border-strong) bg-(--color-surface) shadow-panel">
        <div className="flex items-center justify-between border-b border-(--color-border-strong) px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wide text-(--color-accent)">
            Categories
          </h3>
          <a
            href="/shop"
            className="text-xs font-semibold text-(--color-primary) hover:underline"
          >
            View all
          </a>
        </div>
        <ul className="divide-y divide-(--color-border-strong)">
          {categories.slice(0, 8).map((cat) => (
            <li key={cat}>
              <a
                href={`/shop?category=${encodeURIComponent(cat)}`}
                className="flex items-center justify-between px-4 py-2 text-sm text-(--color-text) hover:bg-(--color-bg) transition-colors"
              >
                <span>{cat}</span>
                <i
                  className="fa-solid fa-angle-right text-(--color-muted)"
                  aria-hidden
                ></i>
              </a>
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-4 py-3 text-sm text-(--color-muted)">
              No categories available.
            </li>
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-(--color-border-strong) bg-(--color-surface) p-4 shadow-panel">
        <h3 className="text-sm font-bold uppercase tracking-wide text-(--color-accent)">
          Brands
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="rounded-lg border border-dashed border-(--color-border) px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-(--color-muted)"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-(--color-border-strong) bg-(--color-surface) p-4 shadow-panel">
        <h3 className="text-sm font-bold uppercase tracking-wide text-(--color-accent)">
          Hot offers
        </h3>
        {hotOffer ? (
          <div className="mt-3">
            <ProductCard
              id={hotOffer.$id}
              name={hotOffer.name}
              price={hotOffer.price}
              stock={hotOffer.stock ?? null}
              imageId={hotOffer.imageId ?? null}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-(--color-muted)">
            No offers available.
          </p>
        )}
      </div>
    </aside>
  );
}
