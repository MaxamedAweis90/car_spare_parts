import { notFound } from "next/navigation";
import {
  findStoreBySlug,
  serializeStoreDocument,
} from "@/lib/server/sellerStoreService";
import { findProductsBySellerId } from "@/lib/server/productService";

import StorePageClient from "./StorePageClient";

// ... existing imports ...

// Helper function remains or moves - keeping it here for simplicity
function buildStoreAssetUrl(fileId: string | null, kind: "avatar" | "banner") {
  if (!fileId) return null;
  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
  const project =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID;
  const avatarBucket =
    process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID ||
    process.env.APPWRITE_STORE_AVATAR_BUCKET_ID;
  const bannerBucket =
    process.env.NEXT_PUBLIC_APPWRITE_STORE_BANNER_BUCKET_ID ||
    process.env.APPWRITE_STORE_BANNER_BUCKET_ID ||
    avatarBucket;
  const bucket = kind === "avatar" ? avatarBucket : bannerBucket;
  if (!endpoint || !project || !bucket) return null;
  const url = new URL(
    `${endpoint}/storage/buckets/${bucket}/files/${fileId}/view`,
  );
  url.searchParams.set("project", project);
  return url.toString();
}

type StorePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const storeDoc = await findStoreBySlug(slug);
  if (!storeDoc || storeDoc.isActive === false) {
    notFound();
  }

  const store = serializeStoreDocument(storeDoc);
  const avatarUrl = buildStoreAssetUrl(store.storeAvatarId ?? null, "avatar");
  const bannerUrl = buildStoreAssetUrl(store.storeBannerId ?? null, "banner");

  // Initial products fetch
  const productsDocs = await findProductsBySellerId(store.sellerId, 20);

  // Serialize products (convert to plain objects if needed - usually Appwrite docs are fine but better safe)
  const products = productsDocs.map((doc) => ({
    ...doc,
    // Ensure ID is available as $id or id for the client component
    id: doc.$id,
    // Ensure imageId is available
    imageId: doc.imageId || (doc.imageIds && doc.imageIds[0]) || null,
  }));

  return (
    <div className="-mt-6">
      <StorePageClient
        store={store}
        avatarUrl={avatarUrl}
        bannerUrl={bannerUrl}
        initialProducts={products}
      />
    </div>
  );
}
