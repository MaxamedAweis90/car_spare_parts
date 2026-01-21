"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/queries/useCategories";
import { useProducts } from "@/hooks/queries/useProducts";
import Skeleton from "@mui/material/Skeleton";

export function ProductDetailSidebar() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: newProductsData, isLoading: productsLoading } = useProducts({
    limit: 3,
  });

  const featues = [
    {
      icon: "fa-truck-fast",
      title: "Free Shipping",
      desc: "Free Shipping World Wide",
      color: "text-blue-500",
    },
    {
      icon: "fa-headset",
      title: "24 X 7 Service",
      desc: "Online Service For New Customer",
      color: "text-purple-500",
    },
    {
      icon: "fa-bullhorn",
      title: "Festival Offer",
      desc: "New Online Special Festival Offer",
      color: "text-pink-500",
    },
    {
      icon: "fa-credit-card",
      title: "Online Payment",
      desc: "Contrary To Popular Belief",
      color: "text-orange-500",
    },
  ];

  return (
    <aside className="w-full lg:w-72 flex flex-col gap-8">
      {/* Category Section */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-(--color-border) bg-(--color-bg)">
          <h3 className="font-black uppercase tracking-widest text-xs text-(--color-text)">
            Category
          </h3>
        </div>
        <div className="p-2">
          {categoriesLoading ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} variant="text" height={24} />
              ))}
            </div>
          ) : (
            <ul className="flex flex-col">
              {categories?.slice(0, 8).map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/shop?category=${cat.id}`}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-(--color-surface-hover) transition-colors group"
                  >
                    <span className="text-sm font-medium text-(--color-text-muted) group-hover:text-(--color-primary)">
                      {cat.name}
                    </span>
                    <i className="fa-solid fa-chevron-right text-[10px] text-(--color-border-strong) group-hover:translate-x-0.5 transition-transform"></i>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Feature Section */}
      <div className="flex flex-col gap-4">
        {featues.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-4 p-4 bg-(--color-surface) border border-(--color-border) rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`text-2xl ${item.color} w-10 flex justify-center`}>
              <i className={`fa-solid ${item.icon}`}></i>
            </div>
            <div>
              <h4 className="text-sm font-black text-(--color-text)">
                {item.title}
              </h4>
              <p className="text-[11px] text-(--color-text-muted)">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* New Product Section */}
      <div className="bg-(--color-surface) border border-(--color-border) rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-(--color-border) bg-(--color-bg) flex justify-between items-center">
          <h3 className="font-black uppercase tracking-widest text-xs text-(--color-text)">
            New Product
          </h3>
          <div className="flex gap-2">
            <button className="text-[10px] text-(--color-text-muted) hover:text-(--color-primary)">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button className="text-[10px] text-(--color-text-muted) hover:text-(--color-primary)">
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-5">
          {productsLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={60}
                    className="rounded-lg"
                  />
                  <div className="flex-1">
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="60%" />
                  </div>
                </div>
              ))
            : newProductsData?.products.map((h: any) => (
                <Link
                  key={h.$id}
                  href={`/products/${h.$id}`}
                  className="flex gap-4 group"
                >
                  <div className="w-16 h-16 bg-(--color-bg) rounded-lg overflow-hidden flex-shrink-0 border border-(--color-border)">
                    {h.imageUrl ? (
                      <img
                        src={h.imageUrl}
                        alt={h.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-(--color-text-muted)">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <h4 className="text-xs font-bold text-(--color-text) line-clamp-1 group-hover:text-(--color-primary) transition-colors">
                      {h.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-(--color-primary)">
                        ${h.price?.toFixed(2)}
                      </span>
                      {h.originalPrice > h.price && (
                        <span className="text-[10px] text-(--color-text-muted) line-through">
                          ${h.originalPrice?.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </aside>
  );
}
