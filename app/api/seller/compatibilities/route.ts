import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { requireSeller } from "@/lib/server/requireSeller";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { type CompatibilityDocument } from "@/lib/server/compatibilityService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

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

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireSeller(req);
    const compatCollectionId = ensureCompatibilityCollectionId();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId")?.trim() || null;

    const queries = [Query.equal("sellerId", profile.$id), Query.limit(200)];
    if (productId) queries.unshift(Query.equal("productId", productId));

    const list = await databasesServer.listDocuments<CompatibilityDocument>(
      appwriteConfig.databaseId,
      compatCollectionId,
      queries
    );

    return NextResponse.json({ items: list.documents });
  } catch (error: any) {
    console.error("Seller compatibilities GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
