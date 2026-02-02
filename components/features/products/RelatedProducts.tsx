"use client";

import { useProducts } from "@/hooks/queries/useProducts";
import ProductCard from "./ProductCard";
import Skeleton from "@mui/material/Skeleton";

interface RelatedProductsProps {
  categoryId?: string | null;
  currentProductId: string;
}

export function RelatedProducts({
  categoryId,
  currentProductId,
}: RelatedProductsProps) {
  const { data, isLoading } = useProducts({
    category: categoryId,
    limit: 6,
  });

  const filteredProducts =
    data?.products.filter((p: any) => p.$id !== currentProductId).slice(0, 6) ||
    [];

  if (!isLoading && filteredProducts.length === 0) return null;

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-(--color-text) uppercase tracking-[0.2em]">
          Related Products
        </h2>
        <div className="h-1 w-20 bg-(--color-primary) rounded-full"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {isLoading
          ? [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton
                  variant="rectangular"
                  height={200}
                  className="rounded-2xl"
                />
                <div className="space-y-2">
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>
            ))
          : filteredProducts.map((product: any) => (
              <ProductCard
                key={product.$id}
                id={product.$id}
                name={product.name}
                price={product.price ?? null}
                originalPrice={product.originalPrice ?? null}
                onSale={product.onSale}
                discountStartDate={product.discountStartDate}
                discountExpiry={product.discountExpiry}
                stock={product.stock ?? null}
                imageId={product.imageId ?? null}
                imageUrl={product.imageUrl ?? null}
                slug={product.slug}
              />
            ))}
      </div>
    </section>
  );
}
