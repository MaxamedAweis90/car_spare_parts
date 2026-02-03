"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Rate } from "antd";
import { getProductImageUrl } from "@/lib/utils/product-image";
import Link from "next/link";

interface ProductMainInfoProps {
  id: string;
  name: string;
  price?: number | null;
  originalPrice?: number | null;
  stock?: number | null;
  description?: string | null;
  imageId?: string | null;
  imageUrl?: string | null;
  sellerId?: string;
  sellerStore?: {
    $id: string;
    name: string;
    slug: string;
    avatarId?: string | null;
  } | null;
}

export function ProductMainInfo({
  id,
  name,
  price,
  originalPrice,
  stock,
  description,
  imageId,
  imageUrl,
  sellerId,
  sellerStore,
}: ProductMainInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();

  const isSale = originalPrice && price && originalPrice > price;
  const discountPercent = isSale
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!price) return;
    for (let i = 0; i < quantity; i++) {
      cart.addItem({
        id,
        name,
        price,
        imageId: imageId ?? null,
        imageUrl: imageUrl ?? null,
      });
    }
    cart.openCart();
  };

  const stockPercent = stock ? Math.min((stock / 100) * 100, 100) : 0;
  const stockColor =
    stock && stock < 10 ? "bg-(--color-danger)" : "bg-(--color-success)";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-(--color-text) leading-tight">
          {name}
        </h1>
        <div className="flex items-center gap-4">
          <Rate disabled defaultValue={4.5} className="text-sm" />
          <span className="text-xs font-bold text-(--color-text-muted) uppercase tracking-widest">
            18 Reviews
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-black text-(--color-text)">
            ${price?.toFixed(2)}
          </span>
          {isSale && (
            <span className="text-lg font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
              {discountPercent}% Off
            </span>
          )}
        </div>
        {isSale && (
          <span className="text-lg text-(--color-text-muted) line-through font-medium">
            ${originalPrice?.toFixed(2)}
          </span>
        )}
      </div>

      {/* Seller Store Info */}
      {sellerStore && (
        <Link
          href={`/stores/${sellerStore.slug}`}
          className="flex items-center gap-3 p-4 bg-(--color-bg) rounded-xl border border-(--color-border) hover:border-(--color-primary) transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-white border-2 border-(--color-border) overflow-hidden flex-shrink-0">
            {sellerStore.avatarId ? (
              <img
                src={`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID}/files/${sellerStore.avatarId}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`}
                alt={sellerStore.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-(--color-primary)/10 to-(--color-primary)/20">
                <i className="fa-solid fa-store text-(--color-primary)"></i>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-(--color-text-muted) uppercase tracking-widest">
              Sold By
            </p>
            <p className="text-sm font-black text-(--color-text) group-hover:text-(--color-primary) transition-colors truncate">
              {sellerStore.name}
            </p>
          </div>
          <i className="fa-solid fa-chevron-right text-xs text-(--color-text-muted) group-hover:text-(--color-primary) transition-colors"></i>
        </Link>
      )}

      {/* Stock Bar */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-black text-(--color-text-muted) uppercase tracking-widest">
          {stock && stock > 0 ? (
            <>
              Hurry! We have only{" "}
              <span className="text-(--color-danger)">{stock}</span> product in
              stock.
            </>
          ) : (
            "Out of stock"
          )}
        </p>
        <div className="h-2 w-full bg-(--color-bg) rounded-full overflow-hidden border border-(--color-border)">
          <div
            className={`h-full ${stockColor} transition-all duration-1000 ease-out`}
            style={{ width: `${stockPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Select Size / Options Placeholder */}
      <div className="flex flex-col gap-3 py-4 border-y border-(--color-border)">
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-(--color-text) uppercase tracking-widest">
            Select Size
          </span>
          <button className="text-[10px] font-bold text-(--color-primary) hover:underline">
            Size Chart
          </button>
        </div>
        <div className="flex gap-2">
          {["S", "M", "L"].map((size) => (
            <button
              key={size}
              className="w-10 h-10 rounded-lg border border-(--color-border) flex items-center justify-center text-sm font-bold text-(--color-text) hover:border-(--color-primary) hover:text-(--color-primary) transition-all"
            >
              {size}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-green-600">In Stock</span>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center h-12 border border-(--color-border) rounded-xl overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 h-full hover:bg-(--color-surface-hover) transition-colors text-(--color-text-muted)"
            >
              <i className="fa-solid fa-minus text-xs"></i>
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-12 text-center font-black text-(--color-text) focus:outline-none"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 h-full hover:bg-(--color-surface-hover) transition-colors text-(--color-text-muted)"
            >
              <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 h-12 bg-(--color-primary) text-white font-black rounded-xl hover:bg-(--color-primary)/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-(--color-primary)/20 uppercase tracking-widest text-xs"
          >
            Add To Cart
          </button>
          <button className="flex-1 h-12 bg-(--color-text) text-white font-black rounded-xl hover:bg-(--color-text)/90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10 uppercase tracking-widest text-xs">
            Buy Now
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 py-4">
        <h4 className="text-xs font-black text-(--color-text) uppercase tracking-widest">
          Product Details
        </h4>
        <p className="text-sm text-(--color-text-muted) leading-relaxed line-clamp-3">
          {description ||
            "No description provided for this premium car part. Please contact support for more information about compatibility and installation."}
        </p>
      </div>

      <div className="flex items-center justify-between py-4 border-t border-(--color-border)">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-(--color-text-muted) uppercase tracking-widest">
            Share it:
          </span>
          <div className="flex gap-3 text-(--color-text-muted)">
            <button className="hover:text-blue-600 transition-colors">
              <i className="fa-brands fa-facebook-f"></i>
            </button>
            <button className="hover:text-blue-400 transition-colors">
              <i className="fa-brands fa-twitter"></i>
            </button>
            <button className="hover:text-pink-600 transition-colors">
              <i className="fa-brands fa-instagram"></i>
            </button>
            <button className="hover:text-red-600 transition-colors">
              <i className="fa-brands fa-google-plus-g"></i>
            </button>
          </div>
        </div>
        <button className="flex items-center gap-2 text-[10px] font-black text-(--color-text-muted) hover:text-(--color-primary) transition-colors uppercase tracking-widest">
          <i className="fa-regular fa-heart"></i>
          Add To WishList
        </button>
      </div>

      {/* Time Reminder Placeholder */}
      <div className="p-6 bg-(--color-bg) rounded-2xl border border-(--color-border) flex items-center justify-between">
        <span className="text-xs font-black text-(--color-text) uppercase tracking-widest">
          Time Reminder
        </span>
        <div className="flex gap-4">
          {[
            { v: "237", l: "Days" },
            { v: "16", l: "Hrs" },
            { v: "22", l: "Min" },
            { v: "18", l: "Sec" },
          ].map((t) => (
            <div key={t.l} className="flex flex-col items-center">
              <span className="text-lg font-black text-(--color-text)">
                -{t.v}
              </span>
              <span className="text-[10px] font-bold text-(--color-text-muted) uppercase tracking-tighter">
                {t.l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
