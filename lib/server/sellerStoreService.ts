import { AppwriteException, ID, Permission, Query, Role } from "node-appwrite";
import { randomUUID } from "crypto";
import {
  appwriteConfig,
  databasesServer,
  storageServer,
} from "@/lib/api/appwrite-server";
import { slugify } from "@/lib/utils/slugify";
import {
  validateFileSize,
  optimizeAvatar,
  optimizeBanner,
} from "@/lib/utils/imageOptimization";
import type {
  SellerStoreDocument,
  SellerStorePayload,
} from "@/lib/types/seller-store";
import { serializeStore } from "@/lib/types/seller-store";

const {
  databaseId,
  storeCollectionId,
  storeAvatarBucketId,
  storeBannerBucketId,
  endpoint,
  projectId,
  apiKey,
} = appwriteConfig;

function ensureUploadBasics() {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Appwrite endpoint, project id, or API key for uploads",
    );
  }
  return { endpoint, projectId, apiKey } as const;
}

function ensureStoreCollectionId() {
  if (!storeCollectionId) {
    throw new Error("Missing Appwrite store collection id");
  }
  return storeCollectionId;
}

export async function findStoreBySellerId(sellerId: string) {
  const collectionId = ensureStoreCollectionId();
  try {
    const document = await databasesServer.getDocument<SellerStoreDocument>(
      databaseId,
      collectionId,
      sellerId,
    );
    return document as SellerStoreDocument;
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 404) {
      const list = await databasesServer.listDocuments<SellerStoreDocument>(
        databaseId,
        collectionId,
        [Query.equal("sellerId", sellerId)],
      );
      return list.total > 0 ? (list.documents[0] as SellerStoreDocument) : null;
    }
    throw error;
  }
}

export async function findStoreBySlug(storeSlug: string) {
  const collectionId = ensureStoreCollectionId();
  const list = await databasesServer.listDocuments<SellerStoreDocument>(
    databaseId,
    collectionId,
    [Query.equal("storeSlug", storeSlug)],
  );
  return list.total > 0 ? (list.documents[0] as SellerStoreDocument) : null;
}

export async function listActiveStores() {
  const collectionId = ensureStoreCollectionId();
  const list = await databasesServer.listDocuments<SellerStoreDocument>(
    databaseId,
    collectionId,
    [Query.equal("isActive", true), Query.equal("isOnboarded", true)],
  );
  return list.documents.map(serializeStore);
}

export async function createStoreForSeller({
  sellerId,
  sellerName,
  sellerEmail,
  accountId,
}: {
  sellerId: string;
  sellerName: string;
  sellerEmail?: string;
  accountId: string;
}) {
  const baseName = sellerName || "My Store";
  const baseSlug = slugify(baseName);
  const slug = `${baseSlug}-${sellerId.slice(-6)}`;

  const collectionId = ensureStoreCollectionId();

  try {
    const document = await databasesServer.createDocument<SellerStoreDocument>(
      databaseId,
      collectionId,
      ID.custom(sellerId),
      {
        sellerId,
        storeName: baseName,
        storeSlug: slug,
        storeDescription: "",
        storeAvatarId: null,
        storeBannerId: null,
        contactPhone: null,
        contactEmail: sellerEmail ?? null,
        isActive: true,
        isOnboarded: false,
      },
      [
        Permission.read(Role.user(accountId)),
        Permission.update(Role.user(accountId)),
        Permission.delete(Role.user(accountId)),
      ],
    );

    return serializeStore(document as SellerStoreDocument);
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 409) {
      const existing = await findStoreBySellerId(sellerId);
      if (existing) {
        return serializeStore(existing as SellerStoreDocument);
      }
    }
    throw error;
  }
}

export async function updateStoreDocument(
  documentId: string,
  payload: SellerStorePayload,
) {
  const delta: Partial<SellerStoreDocument> = {
    ...payload,
  } as Partial<SellerStoreDocument>;
  const collectionId = ensureStoreCollectionId();
  const updated = await databasesServer.updateDocument<SellerStoreDocument>(
    databaseId,
    collectionId,
    documentId,
    delta,
  );
  return serializeStore(updated as SellerStoreDocument);
}

export function ensureStoreAvatarBucketId() {
  if (!storeAvatarBucketId) {
    throw new Error("Missing Appwrite store avatar bucket id");
  }
  return storeAvatarBucketId;
}

export function ensureStoreBannerBucketId() {
  if (!storeBannerBucketId) {
    throw new Error("Missing Appwrite store banner bucket id");
  }
  return storeBannerBucketId;
}

export async function deleteStoreAvatar(fileId: string) {
  if (!fileId) return;
  const bucketId = ensureStoreAvatarBucketId();
  try {
    await storageServer.deleteFile(bucketId, fileId);
  } catch (error) {
    console.error("Failed to delete old store avatar", error);
  }
}

export async function deleteStoreBanner(fileId: string) {
  if (!fileId) return;
  const bucketId = ensureStoreBannerBucketId();
  try {
    await storageServer.deleteFile(bucketId, fileId);
  } catch (error) {
    console.error("Failed to delete old store banner", error);
  }
}

export async function uploadStoreAvatar(
  fileBuffer: Buffer,
  filename: string,
  accountId: string,
) {
  const bytes = Uint8Array.from(fileBuffer);

  // Validate file size before processing
  validateFileSize(bytes, "avatar");

  // Optimize avatar (resize to 400x400 + convert to WebP)
  const optimizedBuffer = await optimizeAvatar(bytes);

  const bucketId = ensureStoreAvatarBucketId();
  const {
    endpoint: apiEndpoint,
    projectId: project,
    apiKey: key,
  } = ensureUploadBasics();
  const uploadUrl = `${apiEndpoint}/storage/buckets/${bucketId}/files`;
  const form = new FormData();

  // Use optimized image with .webp extension
  const webpFilename =
    filename.replace(/\.[^.]+$/, ".webp") ||
    `store-avatar-${randomUUID()}.webp`;
  const blob = new Blob([new Uint8Array(optimizedBuffer)], {
    type: "image/webp",
  });

  form.append("fileId", "unique()");
  form.append("file", blob, webpFilename);
  form.append("permissions[]", Permission.read(Role.any()));
  form.append("permissions[]", Permission.update(Role.user(accountId)));
  form.append("permissions[]", Permission.delete(Role.user(accountId)));

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": project,
      "X-Appwrite-Key": key,
    },
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || "Failed to upload store avatar";
    throw new Error(message);
  }

  const uploadedId: unknown = payload?.$id ?? payload?.fileId ?? payload?.id;
  if (typeof uploadedId !== "string" || !uploadedId) {
    throw new Error(
      "Appwrite upload succeeded but returned an invalid file id",
    );
  }

  return uploadedId;
}

export async function uploadStoreBanner(
  fileBuffer: Buffer,
  filename: string,
  accountId: string,
) {
  const bytes = Uint8Array.from(fileBuffer);

  // Validate file size before processing
  validateFileSize(bytes, "banner");

  // Optimize banner (resize to 1920x600 + convert to WebP)
  const optimizedBuffer = await optimizeBanner(bytes);

  const bucketId = ensureStoreBannerBucketId();
  const {
    endpoint: apiEndpoint,
    projectId: project,
    apiKey: key,
  } = ensureUploadBasics();
  const uploadUrl = `${apiEndpoint}/storage/buckets/${bucketId}/files`;
  const form = new FormData();

  // Use optimized image with .webp extension
  const webpFilename =
    filename.replace(/\.[^.]+$/, ".webp") ||
    `store-banner-${randomUUID()}.webp`;
  const blob = new Blob([new Uint8Array(optimizedBuffer)], {
    type: "image/webp",
  });

  form.append("fileId", "unique()");
  form.append("file", blob, webpFilename);
  form.append("permissions[]", Permission.read(Role.any()));
  form.append("permissions[]", Permission.update(Role.user(accountId)));
  form.append("permissions[]", Permission.delete(Role.user(accountId)));

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": project,
      "X-Appwrite-Key": key,
    },
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || "Failed to upload store banner";
    throw new Error(message);
  }

  const uploadedId: unknown = payload?.$id ?? payload?.fileId ?? payload?.id;
  if (typeof uploadedId !== "string" || !uploadedId) {
    throw new Error(
      "Appwrite upload succeeded but returned an invalid file id",
    );
  }

  return uploadedId;
}

export function serializeStoreDocument(doc: SellerStoreDocument) {
  return serializeStore(doc);
}
