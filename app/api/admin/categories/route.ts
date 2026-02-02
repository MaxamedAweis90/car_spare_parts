import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role, type Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";

type CategoryDocument = Models.Document & {
  name: string;
  parentCategoryId?: string | null;
  type?: string | null;
};

type CategoryType = "vehicle" | "system" | "sellable";
type StoredCategoryType = "Vehicle" | "System" | "sellable";

function parseCategoryType(value: unknown): CategoryType | null {
  const v = typeof value === "string" ? value.trim() : "";
  const lower = v.toLowerCase();
  if (lower === "vehicle" || lower === "system" || lower === "sellable")
    return lower as CategoryType;
  return null;
}

function toStoredCategoryType(type: CategoryType): StoredCategoryType {
  if (type === "vehicle") return "Vehicle";
  if (type === "system") return "System";
  return "sellable";
}

function inferParentType(
  parent: CategoryDocument,
): "vehicle" | "system" | null {
  const explicit = parseCategoryType(parent.type);
  if (explicit === "vehicle" || explicit === "system") return explicit;
  // Legacy inference: root-ish categories behave like vehicles; non-root behave like systems.
  return parent.parentCategoryId ? "system" : "vehicle";
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function ensureCategoriesCollectionId() {
  const id =
    (appwriteConfig as any).categoriesCollectionId ||
    process.env.APPWRITE_CATEGORIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID;

  if (!id)
    throw new Error(
      "Missing Appwrite categories collection id (APPWRITE_CATEGORIES_COLLECTION_ID)",
    );
  return String(id);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "200", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 200)
      : 200;

    const list = await databasesServer.listDocuments<CategoryDocument>(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      [Query.orderAsc("name"), Query.limit(limit)],
    );

    return NextResponse.json({ items: list.documents });
  } catch (error: any) {
    console.error("Admin categories GET error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500,
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();

    const body = await req.json().catch(() => null);
    const rawName = String(body?.name ?? "");
    const providedNames = Array.isArray(body?.names)
      ? (body.names as unknown[])
      : null;

    const names: string[] = (
      providedNames
        ? providedNames.map((n) => String(n ?? "").trim())
        : rawName.split(/[\n,]+/g).map((n) => n.trim())
    ).filter(Boolean);

    const uniqueNames = Array.from(new Set(names));
    if (!uniqueNames.length) return jsonError("Category name is required", 400);

    const parentCategoryId =
      String(body?.parentCategoryId ?? "").trim() || null;

    const type = parseCategoryType(body?.type);
    if (!type)
      return jsonError(
        "Category type must be one of: vehicle, system, sellable",
        400,
      );

    if (type === "vehicle") {
      if (parentCategoryId)
        return jsonError(
          "Vehicle categories cannot have a parentCategoryId",
          400,
        );
    }

    if (type === "system") {
      if (!parentCategoryId)
        return jsonError(
          "System categories must have a vehicle parentCategoryId",
          400,
        );
      const parent = await databasesServer.getDocument<CategoryDocument>(
        appwriteConfig.databaseId,
        categoriesCollectionId,
        parentCategoryId,
      );
      const parentType = inferParentType(parent);
      if (parentType !== "vehicle")
        return jsonError("System categories must have a vehicle parent", 400);
    }

    if (type === "sellable") {
      if (!parentCategoryId)
        return jsonError(
          "Sellable categories must have a system parentCategoryId",
          400,
        );
      const parent = await databasesServer.getDocument<CategoryDocument>(
        appwriteConfig.databaseId,
        categoriesCollectionId,
        parentCategoryId,
      );
      const parentType = inferParentType(parent);
      if (parentType !== "system")
        return jsonError("Sellable categories must have a system parent", 400);
    }

    if (uniqueNames.length === 1) {
      const created = await databasesServer.createDocument<CategoryDocument>(
        appwriteConfig.databaseId,
        categoriesCollectionId,
        ID.unique(),
        {
          name: uniqueNames[0],
          parentCategoryId,
          type: toStoredCategoryType(type),
        } as any,
        [Permission.read(Role.any()), Permission.write(Role.label("admin"))],
      );

      return NextResponse.json({ category: created }, { status: 201 });
    }

    const createdMany = await Promise.all(
      uniqueNames.map((name) =>
        databasesServer.createDocument<CategoryDocument>(
          appwriteConfig.databaseId,
          categoriesCollectionId,
          ID.unique(),
          {
            name,
            parentCategoryId,
            type: toStoredCategoryType(type),
          } as any,
          [Permission.read(Role.any()), Permission.write(Role.label("admin"))],
        ),
      ),
    );

    return NextResponse.json({ categories: createdMany }, { status: 201 });
  } catch (error: any) {
    console.error("Admin categories POST error", error);
    return jsonError(
      error?.message || "Server error",
      error?.code || error?.status || 500,
    );
  }
}
