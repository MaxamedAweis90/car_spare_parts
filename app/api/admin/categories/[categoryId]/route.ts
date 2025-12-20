import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

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

export async function GET(req: NextRequest, ctx: { params: Promise<{ categoryId: string }> }) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();
    const { categoryId } = await ctx.params;

    const category = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      categoryId
    );

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("Admin category GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ categoryId: string }> }) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();
    const { categoryId } = await ctx.params;

    const body = await req.json().catch(() => null);
    const updates: Record<string, unknown> = {};

    if (body && Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = String(body?.name ?? "").trim();
      if (!name) return jsonError("Category name is required", 400);
      updates.name = name;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "parentCategoryId")) {
      updates.parentCategoryId = String(body?.parentCategoryId ?? "").trim() || null;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "type")) {
      updates.type = String(body?.type ?? "").trim() || null;
    }

    const updated = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      categoryId,
      updates
    );

    return NextResponse.json({ category: updated });
  } catch (error: any) {
    console.error("Admin category PATCH error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ categoryId: string }> }) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();
    const { categoryId } = await ctx.params;

    await databasesServer.deleteDocument(appwriteConfig.databaseId, categoriesCollectionId, categoryId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Admin category DELETE error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
