import { Query, type Models } from "node-appwrite";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

export type ProductDocument = Models.Document & {
  name: string;
  description?: string | null;
  price?: number | null;
  stock?: number | null;
  mainCategoryId?: string | null;
  sellerId: string;
  brand?: string | null;
  condition?: string | null;
  partNumber?: string | null;
  compatibilityOptionIds?: string[];
  imageIds?: string[];
  imageId?: string | null;
  isActive?: boolean;
  originalPrice?: number | null;
  onSale?: boolean;
  discountStartDate?: string | null;
  discountExpiry?: string | null;
};

export async function findProductsBySellerId(sellerId: string, limit = 10) {
  const list = await databasesServer.listDocuments<ProductDocument>(
    appwriteConfig.databaseId,
    appwriteConfig.productsCollectionId,
    [Query.equal("sellerId", sellerId), Query.limit(limit)]
  );

  return list.documents as ProductDocument[];
}

export function buildProductImageUrl(fileId: string | null) {
  if (!fileId) return null;
  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const project =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID;
  const bucket =
    process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID ||
    process.env.APPWRITE_PRODUCT_BUCKET_ID;
  if (!endpoint || !project || !bucket) return null;
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`
  );
  url.searchParams.set("project", project);
  return url.toString();
}
