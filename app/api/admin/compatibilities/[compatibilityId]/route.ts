import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";

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

export async function GET(req: NextRequest, ctx: { params: Promise<{ compatibilityId: string }> }) {
  try {
    await requireAdmin(req);
    const compatCollectionId = ensureCompatibilitiesCollectionId();
    const { compatibilityId } = await ctx.params;

    const compatibility = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      compatCollectionId,
      compatibilityId
    );

    return NextResponse.json({ compatibility });
  } catch (error: any) {
    console.error("Admin compatibility GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ compatibilityId: string }> }) {
  try {
    await requireAdmin(req);
    const compatCollectionId = ensureCompatibilitiesCollectionId();
    const { compatibilityId } = await ctx.params;

    const body = await req.json().catch(() => null);
    const updates: Record<string, unknown> = {};

    if (body && Object.prototype.hasOwnProperty.call(body, "productId")) {
      const rawProductId = body?.productId;
      const productId = rawProductId == null ? null : String(rawProductId).trim() || null;
      updates.productId = productId;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "vehicleType")) {
      const vehicleType = String(body?.vehicleType ?? "").trim();
      if (!vehicleType) return jsonError("vehicleType is required", 400);
      updates.vehicleType = vehicleType;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "make")) {
      const make = String(body?.make ?? "").trim();
      if (!make) return jsonError("make is required", 400);
      updates.make = make;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "model")) {
      const model = String(body?.model ?? "").trim();
      if (!model) return jsonError("model is required", 400);
      updates.model = model;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "yearFrom")) {
      const yearFrom = toNumber(body?.yearFrom);
      if (!Number.isFinite(yearFrom)) return jsonError("yearFrom must be a valid number", 400);
      updates.yearFrom = yearFrom;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "yearTo")) {
      const yearTo = toNumber(body?.yearTo);
      if (!Number.isFinite(yearTo)) return jsonError("yearTo must be a valid number", 400);
      updates.yearTo = yearTo;
    }

    if (body && Object.prototype.hasOwnProperty.call(body, "label")) {
      updates.label = String(body?.label ?? "").trim() || null;
    }

    const updated = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      compatCollectionId,
      compatibilityId,
      updates
    );

    return NextResponse.json({ compatibility: updated });
  } catch (error: any) {
    console.error("Admin compatibility PATCH error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ compatibilityId: string }> }) {
  try {
    await requireAdmin(req);
    const compatCollectionId = ensureCompatibilitiesCollectionId();
    const { compatibilityId } = await ctx.params;

    await databasesServer.deleteDocument(appwriteConfig.databaseId, compatCollectionId, compatibilityId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Admin compatibility DELETE error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
