import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { Query } from "node-appwrite";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://somaparts.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemap: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/stores`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  try {
    const { databases } = createAdminClient();

    // Fetch products
    const productsResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_PRODUCTS_COLLECTION_ID!,
      [Query.limit(1000), Query.equal("status", "active")],
    );

    const productUrls = productsResponse.documents.map((product) => ({
      url: `${BASE_URL}/products/${product.slug || product.$id}`,
      lastModified: new Date(product.$updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    sitemap.push(...productUrls);

    // Fetch categories
    const categoriesResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_CATEGORIES_COLLECTION_ID!,
      [Query.limit(100)],
    );

    const categoryUrls = categoriesResponse.documents.map((category) => ({
      url: `${BASE_URL}/categories/${category.slug || category.$id}`,
      lastModified: new Date(category.$updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    sitemap.push(...categoryUrls);

    // Fetch seller stores
    const storesResponse = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_STORE_COLLECTION_ID!,
      [Query.limit(500)],
    );

    const storeUrls = storesResponse.documents.map((store) => ({
      url: `${BASE_URL}/stores/${store.slug || store.$id}`,
      lastModified: new Date(store.$updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    sitemap.push(...storeUrls);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return basic sitemap if database fetch fails
  }

  return sitemap;
}
