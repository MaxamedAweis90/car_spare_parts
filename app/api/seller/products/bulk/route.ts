import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { ProductDocument } from "@/lib/server/productService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(req: NextRequest) {
  try {
    const { profile } = await requireSeller(req);

    const body = await req.json();
    const { productIds, discountPercent, startDate, expiryDate } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return jsonError("productIds must be a non-empty array", 400);
    }

    if (
      typeof discountPercent !== "number" ||
      discountPercent <= 0 ||
      discountPercent >= 100
    ) {
      return jsonError(
        "discountPercent must be a number between 1 and 99",
        400
      );
    }

    const results = [];
    const errors = [];

    // Process in chunks or parallel with limits if needed, but for now standard loop
    for (const productId of productIds) {
      try {
        const product = await databasesServer.getDocument<ProductDocument>(
          appwriteConfig.databaseId,
          appwriteConfig.productsCollectionId,
          productId
        );

        if (product.sellerId !== profile.$id) {
          errors.push({ productId, error: "Unauthorized" });
          continue;
        }

        // Calculate new price
        // Use current price as original price if originalPrice is not set
        const basePrice = product.originalPrice ?? product.price ?? 0;
        const newPrice = Math.round(basePrice * (1 - discountPercent / 100));

        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.productsCollectionId,
          productId,
          {
            originalPrice: basePrice,
            price: newPrice,
            onSale: true,
            discountStartDate: startDate || null,
            discountExpiry: expiryDate || null,
          }
        );

        results.push(productId);
      } catch (err: any) {
        errors.push({ productId, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: results.length,
      failedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Bulk discount error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
