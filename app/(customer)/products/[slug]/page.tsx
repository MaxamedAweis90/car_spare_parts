"use client";

import { useParams } from "next/navigation";
import { useProductBySlug } from "@/hooks/queries/useProducts";
import { ProductDetailSidebar } from "@/components/features/products/ProductDetailSidebar";
import { ProductGallery } from "@/components/features/products/ProductGallery";
import { ProductMainInfo } from "@/components/features/products/ProductMainInfo";
import { ProductTabs } from "@/components/features/products/ProductTabs";
import { RelatedProducts } from "@/components/features/products/RelatedProducts";
import Link from "next/link";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: product, isLoading, error } = useProductBySlug(slug);

  if (error) {
    console.error("ProductDetailPage: Error loading product", slug, error);
  } else if (!isLoading && !product) {
    console.warn(
      "ProductDetailPage: Product not found (no data returned)",
      slug,
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-(--color-primary) border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black text-(--color-text) uppercase tracking-widest animate-pulse">
            Loading Product...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-(--color-bg) flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-(--color-border) shadow-xl text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl">
            <i className="fa-solid fa-circle-exclamation"></i>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-(--color-text)">
              Product Not Found
            </h1>
            <p className="text-sm text-(--color-text-muted) leading-relaxed">
              Widely acknowledged as the "Ghost of SomaParts", this product
              seems to have disappeared or never existed.
            </p>
          </div>
          <Link
            href="/shop"
            className="h-12 px-8 bg-(--color-primary) text-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center uppercase tracking-widest text-xs shadow-lg shadow-(--color-primary)/20"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-(--color-bg) min-h-screen pt-4 pb-20">
      <div className="mx-auto w-full max-w-full sm:max-w-10/12 px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 py-6 text-[10px] font-black uppercase tracking-widest text-(--color-text-muted)">
          <Link
            href="/"
            className="hover:text-(--color-primary) transition-colors"
          >
            Home
          </Link>
          <i className="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
          <Link
            href="/shop"
            className="hover:text-(--color-primary) transition-colors"
          >
            Shop
          </Link>
          <i className="fa-solid fa-chevron-right text-[8px] opacity-30"></i>
          <span className="text-(--color-text) truncate max-w-[150px]">
            {product.name}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar - Visible on Desktop */}
          <div className="hidden lg:block">
            <ProductDetailSidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-12">
            {/* Product Core: Gallery + Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              <ProductGallery
                mainImageId={product.imageId}
                imageIds={product.imageIds}
                name={product.name}
              />
              <ProductMainInfo
                id={product.$id}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                stock={product.stock}
                description={product.description}
                imageId={product.imageId}
                imageUrl={product.imageUrl}
                sellerId={product.sellerId}
                sellerStore={product.sellerStore}
              />
            </div>

            {/* Sidebar - Visible on Mobile (below gallery/info) */}
            <div className="lg:hidden">
              <ProductDetailSidebar />
            </div>

            {/* Tabs Section */}
            <ProductTabs description={product.description} />

            {/* Related Products */}
            <RelatedProducts
              categoryId={product.mainCategoryId}
              currentProductId={product.$id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
