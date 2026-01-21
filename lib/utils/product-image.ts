export function getProductImageUrl(fileId?: string | null) {
  if (!fileId) return null;

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const bucket = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID;

  if (!endpoint || !project || !bucket) {
    console.warn("Missing Appwrite configuration for image URLs");
    return null;
  }

  // Clean endpoint: remove trailing v1 if present to construct standard storage URL
  // but Appwrite usually expects the full endpoint URL.
  // Standard format: [endpoint]/storage/buckets/[bucketId]/files/[fileId]/view?project=[projectId]

  try {
    const url = new URL(
      `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`,
    );
    url.searchParams.set("project", project);
    return url.toString();
  } catch (e) {
    console.error("Failed to construct product image URL", e);
    return null;
  }
}
