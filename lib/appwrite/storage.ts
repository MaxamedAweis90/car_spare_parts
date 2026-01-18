import { storageClient, generateUniqueId } from "@/lib/api/appwrite";

// Reuse the shared Appwrite client instead of creating a new one.
export const storage = storageClient;

const AVATAR_BUCKET_ID =
  process.env.APPWRITE_AVATAR_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_AVATAR_BUCKET_ID;
const PRODUCT_BUCKET_ID =
  process.env.APPWRITE_PRODUCT_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
const STORE_AVATAR_BUCKET_ID =
  process.env.APPWRITE_STORE_AVATAR_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID;
const STORE_BANNER_BUCKET_ID =
  process.env.APPWRITE_STORE_BANNER_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_STORE_BANNER_BUCKET_ID || STORE_AVATAR_BUCKET_ID;

export async function uploadImage(
  bucketId: "avatars" | "products" | "storeAvatars" | "storeBanners",
  file: File
) {
  const id =
    bucketId === "avatars"
      ? AVATAR_BUCKET_ID
      : bucketId === "products"
      ? PRODUCT_BUCKET_ID
      : bucketId === "storeAvatars"
      ? STORE_AVATAR_BUCKET_ID
      : STORE_BANNER_BUCKET_ID;
  if (!id) {
    throw new Error(`Missing bucket id for ${bucketId}`);
  }
  return await storage.createFile(id, generateUniqueId(), file);
}

export function getImageUrl(bucketId: "avatars" | "products" | "storeAvatars" | "storeBanners", fileId: string): string | null {
  const id =
    bucketId === "avatars"
      ? AVATAR_BUCKET_ID
      : bucketId === "products"
      ? PRODUCT_BUCKET_ID
      : bucketId === "storeAvatars"
      ? STORE_AVATAR_BUCKET_ID
      : STORE_BANNER_BUCKET_ID;
  if (!id) {
    console.warn(`Missing Appwrite bucket id for ${bucketId}; returning null image URL.`);
    return null;
  }
  return storage.getFileView(id, fileId).toString();
}

