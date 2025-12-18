import { storageClient, generateUniqueId } from "@/lib/appwrite";

// Reuse the shared Appwrite client instead of creating a new one.
export const storage = storageClient;

const AVATAR_BUCKET_ID = process.env.APPWRITE_AVATAR_BUCKET_ID!;
const PRODUCT_BUCKET_ID = process.env.APPWRITE_PRODUCT_BUCKET_ID!;

export async function uploadImage(
  bucketId: "avatars" | "products",
  file: File
) {
  const id = bucketId === "avatars" ? AVATAR_BUCKET_ID : PRODUCT_BUCKET_ID;
  return await storage.createFile(id, generateUniqueId(), file);
}

export function getImageUrl(bucketId: "avatars" | "products", fileId: string) {
  const id = bucketId === "avatars" ? AVATAR_BUCKET_ID : PRODUCT_BUCKET_ID;
  return storage.getFileView(id, fileId).toString();
}
