import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { buildProductImageUrl, type ProductDocument } from "@/lib/server/productService";

type ProductResponse = ProductDocument & { imageUrl: string | null };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawName = typeof body?.name === "string" ? body.name.trim() : "";
    if (!rawName) {
      return jsonError("Product name is required", 400);
    }

    const priceValue = typeof body?.price === "number" ? body.price : Number(body?.price);
    if (!Number.isFinite(priceValue)) {
      return jsonError("Price must be a valid number", 400);
    }

    const stockValue = typeof body?.stock === "number" ? body.stock : Number(body?.stock);
    if (!Number.isFinite(stockValue)) {
      return jsonError("Stock must be a valid number", 400);
    }

    const rawCategory = typeof body?.category === "string" ? body.category.trim() : "";
    if (!rawCategory) {
      return jsonError("Category is required", 400);
    }

    const rawSellerId = typeof body?.sellerId === "string" ? body.sellerId.trim() : "";
    if (!rawSellerId) {
      return jsonError("sellerId is required", 400);
    }

    const imageId = typeof body?.imageId === "string" && body.imageId.trim() ? body.imageId.trim() : null;
    const description = typeof body?.description === "string" ? body.description.trim() : undefined;

    const created = await databasesServer.createDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      ID.unique(),
      {
        name: rawName,
        price: priceValue,
        stock: stockValue,
        category: rawCategory,
        sellerId: rawSellerId,
        imageId,
        description,
      },
      [
        `user:${rawSellerId}`,
        `user:${appwriteConfig.mainAdminId}`,
        "role:users",
      ]
    );

    const response: ProductResponse = {
      ...created,
      imageUrl: buildProductImageUrl(created.imageId ?? null),
    };

    return NextResponse.json({ product: response }, { status: 201 });
  } catch (error: any) {
    console.error("Products POST error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "24", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 24;

    const list = await databasesServer.listDocuments<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [Query.greaterThan("stock", 0), Query.limit(limit)]
    );

    const items: ProductResponse[] = list.documents.map((doc) => ({
      ...doc,
      imageUrl: buildProductImageUrl(doc.imageId ?? null),
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Products GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
