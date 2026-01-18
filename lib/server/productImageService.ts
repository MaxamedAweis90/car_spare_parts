import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import { Permission, Role } from "node-appwrite";

function ensureProductBucketId() {
  const bucketId = process.env.APPWRITE_PRODUCT_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!bucketId) {
    throw new Error("Missing Appwrite product bucket id (APPWRITE_PRODUCT_BUCKET_ID)");
  }
  return bucketId;
}

function ensureUploadBasics() {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite endpoint, project id, or API key for uploads");
  }

  return { endpoint, projectId, apiKey } as const;
}

export async function uploadProductImage(fileBytes: Uint8Array, filename: string, accountId?: string) {
  const bucketId = ensureProductBucketId();
  const { endpoint, projectId, apiKey } = ensureUploadBasics();

  const uploadUrl = `${endpoint}/storage/buckets/${bucketId}/files`;
  const form = new FormData();
  const blob = new Blob([Buffer.from(fileBytes)], { type: "application/octet-stream" });

  form.append("fileId", "unique()");
  form.append("file", blob, filename || `product-image-${randomUUID()}`);

  // Public read so products can be rendered on storefront.
  form.append("permissions[]", Permission.read(Role.any()));
  // Allow the uploading account to manage their own uploaded files (optional).
  if (accountId) {
    form.append("permissions[]", Permission.update(Role.user(accountId)));
    form.append("permissions[]", Permission.delete(Role.user(accountId)));
  }

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
    },
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || "Failed to upload product image";
    throw new Error(message);
  }

  const uploadedId: unknown = payload?.$id ?? payload?.fileId ?? payload?.id;
  if (typeof uploadedId !== "string" || !uploadedId) {
    throw new Error("Appwrite upload succeeded but returned an invalid file id");
  }

  return uploadedId;
}

export async function deleteProductImage(fileId: string) {
  if (!fileId) return;

  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!endpoint || !projectId || !apiKey) return;

  const bucketId = process.env.APPWRITE_PRODUCT_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;
  if (!bucketId) return;

  try {
    const url = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        "X-Appwrite-Project": projectId,
        "X-Appwrite-Key": apiKey,
      },
    });
  } catch (error) {
    console.error("Failed to delete product image", error);
  }
}

