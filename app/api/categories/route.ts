import { NextRequest, NextResponse } from "next/server";
import { Query, type Models } from "node-appwrite";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

type CategoryDocument = Models.Document & {
  name: string;
  parentCategoryId?: string | null;
  type?: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function ensureCategoriesCollectionId() {
  const id =
    (appwriteConfig as any).categoriesCollectionId ||
    process.env.APPWRITE_CATEGORIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID;

  if (!id) {
    throw new Error(
      "Missing Appwrite categories collection id (APPWRITE_CATEGORIES_COLLECTION_ID)"
    );
  }

  return String(id);
}

export async function GET(req: NextRequest) {
  try {
    const categoriesCollectionId = ensureCategoriesCollectionId();

    const list = await databasesServer.listDocuments<CategoryDocument>(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      [Query.orderAsc("name"), Query.limit(500)]
    );

    const items = list.documents.map((doc) => ({
      id: doc.$id,
      name: doc.name,
      parentCategoryId: doc.parentCategoryId || null,
      type: doc.type?.toLowerCase() || null,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Public categories GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
