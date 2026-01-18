import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { messagingServer } from "@/lib/api/appwrite-server";
import { requireSeller } from "@/lib/server/requireSeller";
import {
  createStoreForSeller,
  findStoreBySellerId,
  findStoreBySlug,
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

    const body = (await req.json()) as SellerStorePayload & {
      storeSlug?: string;
    };
    const updates: SellerStorePayload = {};

    if (typeof body.storeName === "string" && body.storeName.trim()) {
      updates.storeName = body.storeName.trim();
    }

    if (typeof body.storeSlug === "string" && body.storeSlug.trim()) {
      const requestedSlug = body.storeSlug.trim();
      if (requestedSlug !== store.storeSlug) {
        // Validate slug uniqueness
        const existing = await findStoreBySlug(requestedSlug);
        if (existing && existing.$id !== store.$id) {
          return jsonError("Store slug is already taken", 409);
        }
        updates.storeSlug = requestedSlug;
      }
    } else if (updates.storeName && updates.storeName !== store.storeName) {
      // Default auto-slug if name changed but no slug provided
      updates.storeSlug = `${slugify(updates.storeName)}-${profile.$id.slice(
        -6
      )}`;
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
    if (typeof body.isOnboarded === "boolean") {
      updates.isOnboarded = body.isOnboarded;
    }

    if (Object.keys(updates).length === 0) {
      return jsonError("No updates provided", 400);
    }

    const initialPayload: SellerStorePayload = { ...updates };
    try {
      const updated = await updateStoreDocument(store.$id, initialPayload);

      // Send Setup Success Email if onboarding is completed
      if (body.isOnboarded === true && !store.isOnboarded) {
        try {
          const subject = "🎉 Your store is ready on SomaParts!";
          const content = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: 900; color: #1f2937; letter-spacing: -0.025em; }
    .content { background: #ffffff; border-radius: 24px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .button { display: inline-block; background: #1f2937; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SomaParts</div>
    </div>
    <div class="content">
      <h1 style="margin-top: 0;">Store Setup Complete!</h1>
      <p>Congratulations, <strong>${profile.name}</strong>!</p>
      <p>Your store <strong>${updated.storeName}</strong> is now fully configured and ready to welcome customers.</p>
      <p>You can now start listing your products and managing your inventory through the seller dashboard.</p>
      <div style="text-align: center;">
        <a href="${req.nextUrl.origin}/seller/dashboard" class="button">Go to Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>
          `;
          await messagingServer.createEmail(
            ID.unique(),
            subject,
            content,
            [],
            [profile.appwriteUserId || profile.$id],
            [],
            [],
            [],
            [],
            false,
            true
          );
        } catch (emailErr) {
          console.error("Failed to send onboarding success email", emailErr);
        }
      }

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

