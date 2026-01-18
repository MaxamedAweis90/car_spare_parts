import { NextRequest, NextResponse } from "next/server";
import { Query, type Models } from "node-appwrite";
import { requireSeller } from "@/lib/server/requireSeller";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";

type CategoryDocument = Models.Document & {
  name: string;
  parentCategoryId?: string | null;
  type?: string | null;
};

type CategoryType = "vehicle" | "system" | "sellable";

function parseCategoryType(value: unknown): CategoryType | null {
  const v = typeof value === "string" ? value.trim() : "";
  const lower = v.toLowerCase();
  if (lower === "vehicle" || lower === "system" || lower === "sellable") return lower as CategoryType;
  return null;
}

function normalizeId(value: unknown): string | null {
  const v = typeof value === "string" ? value.trim() : "";
  return v ? v : null;
}

function buildHierarchyLabel(
  categoryId: string,
  categoryById: Map<string, CategoryDocument>
): { label: string; vehicleId: string | null; systemId: string | null } {
  const sellable = categoryById.get(categoryId);
  if (!sellable) return { label: categoryId, vehicleId: null, systemId: null };

  const systemId = normalizeId(sellable.parentCategoryId);
  const system = systemId ? categoryById.get(systemId) : null;
  const vehicleId = system ? normalizeId(system.parentCategoryId) : null;
  const vehicle = vehicleId ? categoryById.get(vehicleId) : null;

  const names = [vehicle?.name, system?.name, sellable.name].filter((n): n is string => typeof n === "string" && n.trim().length > 0);
  const label = names.length ? names.join(" > ") : sellable.name;
  return { label, vehicleId, systemId };
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function ensureCategoriesCollectionId() {
  const id =
    (appwriteConfig as any).categoriesCollectionId ||
    process.env.APPWRITE_CATEGORIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID;

  if (!id) {
    throw new Error("Missing Appwrite categories collection id (APPWRITE_CATEGORIES_COLLECTION_ID)");
  }

  return String(id);
}

export async function GET(req: NextRequest) {
  try {
    await requireSeller(req);
    const categoriesCollectionId = ensureCategoriesCollectionId();

    const list = await databasesServer.listDocuments<CategoryDocument>(
      appwriteConfig.databaseId,
      categoriesCollectionId,
      [Query.orderAsc("name"), Query.limit(200)]
    );

    const categoryById = new Map<string, CategoryDocument>();
    list.documents.forEach((doc) => categoryById.set(doc.$id, doc));

    const isSellable = (doc: CategoryDocument): boolean => {
      const t = parseCategoryType(doc.type);
      if (t === "sellable") return true;
      if (t) return false;

      // Legacy inference: consider it sellable if it has a parent AND that parent has a parent.
      const systemId = normalizeId(doc.parentCategoryId);
      if (!systemId) return false;
      const system = categoryById.get(systemId);
      const vehicleId = system ? normalizeId(system.parentCategoryId) : null;
      return Boolean(vehicleId);
    };

    const sellableDocs = list.documents.filter(isSellable);
    const items = sellableDocs.map((doc) => {
      const hierarchy = buildHierarchyLabel(doc.$id, categoryById);
      return {
        id: doc.$id,
        name: doc.name,
        label: hierarchy.label,
        vehicleId: hierarchy.vehicleId,
        systemId: hierarchy.systemId,
      };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Seller categories GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

