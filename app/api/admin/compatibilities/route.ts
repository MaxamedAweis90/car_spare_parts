import { NextRequest, NextResponse } from "next/server";
import { ID, Query, type Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";

type CompatibilityDocument = Models.Document & {
  productId?: string | null;
  vehicleType: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  label?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function ensureCompatibilitiesCollectionId() {
  const id =
    process.env.APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
    process.env.APPWRITE_COMPATIBILITIES_COLLECTION_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITIES_COLLECTION_ID;

  if (!id) {
    throw new Error(
      "Missing Appwrite compatibilities/options collection id (set APPWRITE_COMPATIBILITIES_COLLECTION_ID or APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID)"
    );
  }

  return String(id);
}

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return NaN;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const compatCollectionId = ensureCompatibilitiesCollectionId();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId")?.trim() || null;
    const limitParam = parseInt(searchParams.get("limit") || "200", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 200;

    const queries = [Query.orderDesc("$createdAt"), Query.limit(limit)];
    if (productId) queries.unshift(Query.equal("productId", productId));

    const list = await databasesServer.listDocuments<CompatibilityDocument>(
      appwriteConfig.databaseId,
      compatCollectionId,
      queries
    );

    return NextResponse.json({ items: list.documents });
  } catch (error: any) {
    console.error("Admin compatibilities GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const compatCollectionId = ensureCompatibilitiesCollectionId();

    const body = await req.json().catch(() => null);

    const rawProductId = body?.productId;
    const productId = rawProductId == null ? null : String(rawProductId).trim() || null;

    const vehicleType = String(body?.vehicleType ?? "").trim();
    const make = String(body?.make ?? "").trim();
    const model = String(body?.model ?? "").trim();

    if (!vehicleType || !make || !model) {
      return jsonError("vehicleType, make, and model are required", 400);
    }

    const yearFrom = toNumber(body?.yearFrom);
    const yearTo = toNumber(body?.yearTo);
    if (!Number.isFinite(yearFrom) || !Number.isFinite(yearTo)) {
      return jsonError("yearFrom and yearTo must be valid numbers", 400);
    }

    const label = String(body?.label ?? "").trim() || null;

    const created = await databasesServer.createDocument<CompatibilityDocument>(
      appwriteConfig.databaseId,
      compatCollectionId,
      ID.unique(),
      {
        productId,
        vehicleType,
        make,
        model,
        yearFrom,
        yearTo,
        label,
      } as any
    );

    return NextResponse.json({ compatibility: created }, { status: 201 });
  } catch (error: any) {
    console.error("Admin compatibilities POST error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

