import { NextRequest, NextResponse } from "next/server";
import type { Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

type CategoryType = "vehicle" | "system" | "sellable";
type StoredCategoryType = "Vehicle" | "System" | "sellable";

type CategoryDocument = Models.Document & {
  name?: string;
  parentCategoryId?: string | null;
  type?: string | null;
};

function parseCategoryType(value: unknown): CategoryType | null {
  const v = typeof value === "string" ? value.trim() : "";
  const lower = v.toLowerCase();
  if (lower === "vehicle" || lower === "system" || lower === "sellable") return lower as CategoryType;
  return null;
}

function toStoredCategoryType(type: CategoryType): StoredCategoryType {
  if (type === "vehicle") return "Vehicle";
  if (type === "system") return "System";
  return "sellable";
}

function inferParentType(parent: CategoryDocument): "vehicle" | "system" | null {
  const explicit = parseCategoryType(parent.type);
  if (explicit === "vehicle" || explicit === "system") return explicit;
  // Legacy inference: root-ish categories behave like vehicles; non-root behave like systems.
  return parent.parentCategoryId ? "system" : "vehicle";
}

async function validateHierarchy(
  categoriesCollectionId: string,
  type: CategoryType | null,
  parentCategoryId: string | null
): Promise<{ ok: true } | { ok: false; message: string; status?: number }> {
  if (!type) return { ok: false, message: "Category type must be one of: vehicle, system, sellable" };

  if (type === "vehicle") {
    if (parentCategoryId) return { ok: false, message: "Vehicle categories cannot have a parentCategoryId" };
    return { ok: true };
  }

  if (!parentCategoryId) {
    return {
      ok: false,
      message: type === "system" ? "System categories must have a vehicle parentCategoryId" : "Sellable categories must have a system parentCategoryId",
    };
  }

  const parent = await databasesServer.getDocument<CategoryDocument>(
    appwriteConfig.databaseId,
    categoriesCollectionId,
    parentCategoryId
  );
  const parentType = inferParentType(parent);

  if (type === "system" && parentType !== "vehicle") return { ok: false, message: "System categories must have a vehicle parent" };
  if (type === "sellable" && parentType !== "system") return { ok: false, message: "Sellable categories must have a system parent" };

  return { ok: true };
}

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
    return jsonError(error?.message || "Server error", error?.code || error?.status || 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ categoryId: string }> }) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();
    const { categoryId } = await ctx.params;

    const body = await req.json().catch(() => null);
    const updates: Record<string, unknown> = {};

    // If we're changing hierarchy-related fields, validate the merged result.
    const touchingHierarchy =
      (body && Object.prototype.hasOwnProperty.call(body, "parentCategoryId")) ||
      (body && Object.prototype.hasOwnProperty.call(body, "type"));

    let nextType: CategoryType | null = null;
    let nextParentCategoryId: string | null = null;

    if (touchingHierarchy) {
      const existing = await databasesServer.getDocument<CategoryDocument>(
        appwriteConfig.databaseId,
        categoriesCollectionId,
        categoryId
      );

      const existingType = parseCategoryType(existing.type);
      const existingParent = typeof existing.parentCategoryId === "string" ? existing.parentCategoryId.trim() : null;

      const requestedParent = body && Object.prototype.hasOwnProperty.call(body, "parentCategoryId")
        ? String(body?.parentCategoryId ?? "").trim() || null
        : existingParent;

      const requestedType = body && Object.prototype.hasOwnProperty.call(body, "type")
        ? parseCategoryType(body?.type)
        : existingType;

      nextType = requestedType;
      nextParentCategoryId = requestedParent;

      const validation = await validateHierarchy(categoriesCollectionId, nextType, nextParentCategoryId);
      if (!validation.ok) return jsonError(validation.message, validation.status || 400);
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = String(body?.name ?? "").trim();
      if (!name) return jsonError("Category name is required", 400);
      updates.name = name;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "parentCategoryId")) {
      updates.parentCategoryId = nextParentCategoryId ?? (String(body?.parentCategoryId ?? "").trim() || null);
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "type")) {
      const parsed = nextType ?? parseCategoryType(body?.type);
      if (!parsed) return jsonError("Category type must be one of: vehicle, system, sellable", 400);
      updates.type = toStoredCategoryType(parsed);
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
    return jsonError(error?.message || "Server error", error?.code || error?.status || 500);
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
    return jsonError(error?.message || "Server error", error?.code || error?.status || 500);
  }
}
