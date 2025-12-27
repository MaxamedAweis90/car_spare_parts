import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import {
  buildProductImageUrl,
  type ProductDocument,
} from "@/lib/server/productService";

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

    const priceValue =
      typeof body?.price === "number" ? body.price : Number(body?.price);
    if (!Number.isFinite(priceValue)) {
      return jsonError("Price must be a valid number", 400);
    }

    const stockValue =
      typeof body?.stock === "number" ? body.stock : Number(body?.stock);
    if (!Number.isFinite(stockValue)) {
      return jsonError("Stock must be a valid number", 400);
    }

    const rawCategory =
      typeof body?.category === "string" ? body.category.trim() : "";
    if (!rawCategory) {
      return jsonError("Category is required", 400);
    }

    const rawSellerId =
      typeof body?.sellerId === "string" ? body.sellerId.trim() : "";
    if (!rawSellerId) {
      return jsonError("sellerId is required", 400);
    }

    const imageId =
      typeof body?.imageId === "string" && body.imageId.trim()
        ? body.imageId.trim()
        : null;
    const description =
      typeof body?.description === "string"
        ? body.description.trim()
        : undefined;

    const created = await databasesServer.createDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      ID.unique(),
      {
        name: rawName,
        price: priceValue,
        stock: stockValue,
        mainCategoryId: rawCategory,
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
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 100;

    // Get filter parameters
    const searchQuery = searchParams.get("search")?.toLowerCase() || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const onSale = searchParams.get("onSale") === "true";

    // Build Appwrite queries
    const queries = [Query.limit(limit)];

    // Price range filtering
    if (minPrice) {
      queries.push(Query.greaterThanEqual("price", Number(minPrice)));
    }
    if (maxPrice) {
      queries.push(Query.lessThanEqual("price", Number(maxPrice)));
    }

    const list = await databasesServer.listDocuments<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      queries
    );

    let items: ProductResponse[] = list.documents.map((doc) => {
      const imageIds = Array.isArray((doc as any).imageIds)
        ? ((doc as any).imageIds as string[])
        : [];
      const imageId = (doc as any).imageId ?? imageIds[0] ?? null;
      return {
        ...(doc as any),
        imageId,
        imageUrl: buildProductImageUrl(imageId ?? null),
      } as ProductResponse;
    });

    // Client-side filtering for search query (Appwrite doesn't support text search well)
    if (searchQuery) {
      items = items.filter((item) => {
        const name = item.name?.toLowerCase() || "";
        const description = item.description?.toLowerCase() || "";
        return name.includes(searchQuery) || description.includes(searchQuery);
      });
    }

    // Filter for on-sale products
    if (onSale) {
      items = items.filter((item) => (item as any).onSale === true);
    }

    return NextResponse.json({
      items: items,
      products: items,
      total: items.length,
    });
  } catch (error: any) {
    console.error("Products GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
