import { NextRequest, NextResponse } from "next/server";
import { ID, Query, type Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
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

  if (!id) throw new Error("Missing Appwrite categories collection id (APPWRITE_CATEGORIES_COLLECTION_ID)");
  return String(id);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "200", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 200;

    const list = await databasesServer.listDocuments<CategoryDocument>(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      [Query.orderAsc("name"), Query.limit(limit)]
    );

    return NextResponse.json({ items: list.documents });
  } catch (error: any) {
    console.error("Admin categories GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();

    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    if (!name) return jsonError("Category name is required", 400);

    const parentCategoryId = String(body?.parentCategoryId ?? "").trim() || null;
    const type = String(body?.type ?? "").trim() || null;

    const created = await databasesServer.createDocument<CategoryDocument>(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      ID.unique(),
      {
        name,
        parentCategoryId,
        type,
      } as any
    );

    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin categories POST error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
