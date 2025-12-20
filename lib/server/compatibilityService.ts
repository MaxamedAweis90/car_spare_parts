import { ID, Query, type Models } from "node-appwrite";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

export type CompatibilityDocument = Models.Document & {
  productId: string;
  sellerId: string;
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
};

export type CompatibilityInput = {
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
};

function ensureCompatibilityCollectionId() {
  const id =
    (appwriteConfig as any).compatibilitiesCollectionId ||
    process.env.APPWRITE_COMPATIBILITIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITIES_COLLECTION_ID;

  if (!id) {
    throw new Error("Missing Appwrite compatibilities collection id (APPWRITE_COMPATIBILITIES_COLLECTION_ID)");
  }

  return String(id);
}

export async function listCompatibilitiesForProduct(params: {
  sellerId: string;
  productId: string;
  limit?: number;
}) {
  const { sellerId, productId, limit = 100 } = params;
  const compatCollectionId = ensureCompatibilityCollectionId();

  const list = await databasesServer.listDocuments<CompatibilityDocument>(
    appwriteConfig.databaseId,
    compatCollectionId,
    [
      Query.equal("sellerId", sellerId),
      Query.equal("productId", productId),
      Query.limit(Math.min(Math.max(limit, 1), 200)),
    ]
  );

  return list.documents as CompatibilityDocument[];
}

export async function replaceCompatibilitiesForProduct(params: {
  sellerId: string;
  productId: string;
  entries: CompatibilityInput[];
}) {
  const { sellerId, productId, entries } = params;
  const compatCollectionId = ensureCompatibilityCollectionId();

  const existing = await listCompatibilitiesForProduct({ sellerId, productId, limit: 200 });

  for (const doc of existing) {
    await databasesServer.deleteDocument(appwriteConfig.databaseId, compatCollectionId, doc.$id);
  }

  const created: CompatibilityDocument[] = [];
  for (const entry of entries) {
    const doc = await databasesServer.createDocument<CompatibilityDocument>(
      appwriteConfig.databaseId,
      compatCollectionId,
      ID.unique(),
      {
        sellerId,
        productId,
        vehicleType: entry.vehicleType,
        make: entry.make,
        model: entry.model,
        yearFrom: entry.yearFrom,
        yearTo: entry.yearTo,
      }
    );
    created.push(doc as CompatibilityDocument);
  }

  return created;
}
