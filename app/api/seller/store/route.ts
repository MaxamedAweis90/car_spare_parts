import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import {
  createStoreForSeller,
  findStoreBySellerId,
  updateStoreDocument,
  serializeStoreDocument,
} from "@/lib/server/sellerStoreService";
import type { SellerStorePayload } from "@/lib/types/seller-store";
import { slugify } from "@/lib/utils/slugify";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { account, profile } = await requireSeller(req);
    const storeDoc = await findStoreBySellerId(profile.$id);
    if (!storeDoc) {
      const createdStore = await createStoreForSeller({
        sellerId: profile.$id,
        sellerName: profile.name,
        sellerEmail: profile.email,
        accountId: account.$id,
      });
      return NextResponse.json({ store: createdStore }, { status: 201 });
    }
    return NextResponse.json({ store: serializeStoreDocument(storeDoc) });
  } catch (error: any) {
    console.error("GET /api/seller/store error", error);
    const status = error?.status || 500;
    return jsonError(error?.message || "Failed to fetch store", status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { account, profile } = await requireSeller(req);
    const existing = await findStoreBySellerId(profile.$id);
    if (existing) {
      return jsonError("Store already exists", 409);
    }

    const store = await createStoreForSeller({
      sellerId: profile.$id,
      sellerName: profile.name,
      sellerEmail: profile.email,
      accountId: account.$id,
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/seller/store error", error);
    const status = error?.status || 500;
    return jsonError(error?.message || "Failed to create store", status);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { profile } = await requireSeller(req);
    const store = await findStoreBySellerId(profile.$id);
    if (!store) {
      return jsonError("Store not found", 404);
    }

    const body = (await req.json()) as SellerStorePayload & { storeSlug?: string };
    const updates: SellerStorePayload = {};

    if (typeof body.storeName === "string" && body.storeName.trim()) {
      updates.storeName = body.storeName.trim();
      if (updates.storeName !== store.storeName) {
        updates.storeSlug = `${slugify(updates.storeName)}-${profile.$id.slice(-6)}`;
      }
    }
    if (typeof body.storeDescription === "string") {
      updates.storeDescription = body.storeDescription;
    }
    if (typeof body.contactPhone === "string") {
      const trimmed = body.contactPhone.trim();
      updates.contactPhone = trimmed.length > 0 ? trimmed : null;
    } else if (body.contactPhone === null) {
      updates.contactPhone = null;
    }
    if (typeof body.contactEmail === "string") {
      const trimmedEmail = body.contactEmail.trim();
      updates.contactEmail = trimmedEmail.length > 0 ? trimmedEmail : null;
    } else if (body.contactEmail === null) {
      updates.contactEmail = null;
    }
    if (typeof body.isActive === "boolean") {
      updates.isActive = body.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No updates provided", 400);
    }

    const initialPayload: SellerStorePayload = { ...updates };
    try {
      const updated = await updateStoreDocument(store.$id, initialPayload);
      return NextResponse.json({ store: updated });
    } catch (error: any) {
      if (
        typeof initialPayload.contactPhone === "string" &&
        initialPayload.contactPhone &&
        error?.type === "document_invalid_structure" &&
        String(error?.message || "").includes("contactPhone")
      ) {
        const digits = initialPayload.contactPhone.replace(/\D/g, "");
        if (!digits) {
          return jsonError("Phone number must contain digits", 400);
        }
        const retryPayload: SellerStorePayload = {
          ...initialPayload,
          contactPhone: Number(digits),
        };
        const retried = await updateStoreDocument(store.$id, retryPayload);
        return NextResponse.json({ store: retried });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("PUT /api/seller/store error", error);
    const status = error?.status || 500;
    return jsonError(error?.message || "Failed to update store", status);
  }
}
