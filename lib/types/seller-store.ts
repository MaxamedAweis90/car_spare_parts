import type { Models } from "node-appwrite";

export type SellerStoreDocument = Models.Document & {
  sellerId: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeAvatarId?: string | null;
  storeBannerId?: string | null;
  contactPhone?: string | number | null;
  contactEmail?: string | null;
  isActive: boolean;
  isOnboarded: boolean;
};

export type SellerStorePayload = {
  storeName?: string;
  storeSlug?: string;
  storeDescription?: string;
  contactPhone?: string | number | null;
  contactEmail?: string | null;
  storeAvatarId?: string | null;
  storeBannerId?: string | null;
  isActive?: boolean;
  isOnboarded?: boolean;
};

export type SellerStoreResponse = {
  id: string;
  sellerId: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  storeAvatarId: string | null;
  storeBannerId: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
};

export function serializeStore(doc: SellerStoreDocument): SellerStoreResponse {
  return {
    id: doc.$id,
    sellerId: doc.sellerId,
    storeName: doc.storeName,
    storeSlug: doc.storeSlug,
    storeDescription: doc.storeDescription || "",
    storeAvatarId: doc.storeAvatarId ?? null,
    storeBannerId: doc.storeBannerId ?? null,
    contactPhone:
      doc.contactPhone === undefined || doc.contactPhone === null
        ? null
        : String(doc.contactPhone),
    contactEmail: doc.contactEmail ?? null,
    isActive: Boolean(doc.isActive),
    isOnboarded: Boolean(doc.isOnboarded),
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
  };
}
