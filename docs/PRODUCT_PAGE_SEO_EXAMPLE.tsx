/**
 * Example: Product Page with SEO Metadata
 *
 * This is a SERVER COMPONENT example showing how to add metadata to product pages.
 * To implement this in your actual product page:
 *
 * 1. Convert your page to a server component (remove "use client")
 * 2. Add the generateMetadata function
 * 3. Fetch product data in the component
 * 4. Add StructuredData component with product schema
 *
 * OR keep it as a client component and use next/head or a separate layout
 */

import { Metadata } from "next";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { getImageUrl } from "@/lib/appwrite/storage";
import { Query } from "node-appwrite";
import { generateProductMetadata, generateProductSchema } from "@/lib/metadata";
import StructuredData from "@/components/layout/StructuredData";

// Generate dynamic metadata for the product page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const { databases } = createAdminClient();

    // Fetch product by slug
    const response = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PRODUCTS_COLLECTION_ID!,
      [Query.equal("slug", params.slug), Query.limit(1)],
    );

    const product = response.documents[0];

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    // Get image URL if available
    let imageUrl: string | undefined;
    if (product.imageId) {
      imageUrl = getImageUrl("products", product.imageId) || undefined;
    }

    return generateProductMetadata({
      title: product.name,
      description: product.description,
      image: imageUrl,
      price: product.price,
      availability: product.stock > 0 ? "in_stock" : "out_of_stock",
      slug: params.slug,
    });
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product",
      description: "View product details",
    };
  }
}

// Server Component
export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const { databases } = createAdminClient();

  // Fetch product data
  const response = await databases.listDocuments(
    process.env.APPWRITE_DATABASE_ID!,
    process.env.APPWRITE_PRODUCTS_COLLECTION_ID!,
    [Query.equal("slug", params.slug), Query.limit(1)],
  );

  const product = response.documents[0];

  if (!product) {
    return <div>Product not found</div>;
  }

  // Get image URL
  let imageUrl: string | undefined;
  if (product.imageId) {
    imageUrl = getImageUrl("products", product.imageId) || undefined;
  }

  // Generate structured data for the product
  const productSchema = generateProductSchema({
    name: product.name,
    description: product.description,
    image: imageUrl,
    price: product.price,
    availability: product.stock > 0 ? "in_stock" : "out_of_stock",
    brand: product.brand,
    sku: product.sku || product.$id,
    condition: "NewCondition",
  });

  return (
    <>
      <StructuredData data={productSchema} />
      {/* Your existing product page JSX */}
      <div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        {/* ... rest of your product page */}
      </div>
    </>
  );
}
