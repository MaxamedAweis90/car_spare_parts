import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import {
  buildProductImageUrl,
  type ProductDocument,
} from "@/lib/server/productService";

type ProductResponse = ProductDocument & { imageUrl: string | null };

import { getServerSession } from "@/lib/session-server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return jsonError("Unauthorized", 401);
    }

    const { profile } = session;
    const isMainAdmin = profile.role === "main_admin";
    const isAdmin = profile.role === "admin" || isMainAdmin;

    // Only sellers and admins can create products
    if (!isAdmin && profile.role !== "seller") {
      return jsonError("Forbidden: Only sellers can create products", 403);
    }

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

    // Determine sellerId:
    // If admin, they *can* provide a sellerId in body (e.g. creating on behalf of someone).
    // If seller, validation forces it to be their own ID.
    let targetSellerId = profile.$id;
    if (isAdmin && body?.sellerId) {
      targetSellerId = body.sellerId.trim();
    }

    if (!targetSellerId) {
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

    const originalPrice =
      typeof body?.originalPrice === "number"
        ? body.originalPrice
        : body?.originalPrice
        ? Number(body.originalPrice)
        : priceValue; // DEFAULT TO PRICE

    const discountStartDate =
      typeof body?.discountStartDate === "string"
        ? body.discountStartDate
        : null;

    const discountExpiry =
      typeof body?.discountExpiry === "string" ? body.discountExpiry : null;

    const onSale = originalPrice !== null && originalPrice > priceValue;

    const created = await databasesServer.createDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      ID.unique(),
      {
        name: rawName,
        price: priceValue,
        stock: stockValue,
        mainCategoryId: rawCategory,
        sellerId: targetSellerId,
        imageId,
        description,
        originalPrice,
        onSale,
        discountStartDate,
        discountExpiry,
        isActive: stockValue > 0, // Auto-active if stock > 0
      },
      [
        Permission.read(Role.any()),
        Permission.read(Role.user(targetSellerId)),
        Permission.update(Role.user(targetSellerId)),
        Permission.delete(Role.user(targetSellerId)),
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
    const categoryId =
      searchParams.get("categoryId") || searchParams.get("category");
    const onSale = searchParams.get("onSale") === "true";

    // Compatibility filters
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");

    // Build Appwrite queries
    const queries = [Query.limit(limit)];

    // Price range filtering
    if (minPrice) {
      queries.push(Query.greaterThanEqual("price", Number(minPrice)));
    }
    if (maxPrice) {
      queries.push(Query.lessThanEqual("price", Number(maxPrice)));
    }
    if (categoryId) {
      queries.push(Query.equal("mainCategoryId", categoryId));
    }

    // Compatibility filtering (requires querying the compatibility collection first)
    if (make || model || year) {
      const compatCollectionId =
        process.env.APPWRITE_COMPATIBILITIES_COLLECTION_ID ||
        process.env.NEXT_PUBLIC_APPWRITE_COMPATIBILITIES_COLLECTION_ID ||
        process.env.APPWRITE_COMPATIBILITY_OPTIONS_COLLECTION_ID ||
        "compatibilities"; // Fallback to common name

      const compatQueries = [Query.limit(100)];
      if (make) compatQueries.push(Query.equal("make", make));
      if (model) compatQueries.push(Query.equal("model", model));
      if (year) {
        const y = Number(year);
        compatQueries.push(Query.lessThanEqual("yearFrom", y));
        compatQueries.push(Query.greaterThanEqual("yearTo", y));
      }

      try {
        const compatList = await databasesServer.listDocuments(
          appwriteConfig.databaseId,
          compatCollectionId,
          compatQueries
        );
        const productIds = compatList.documents
          .map((doc: any) => doc.productId)
          .filter(Boolean);

        if (productIds.length > 0) {
          queries.push(Query.equal("$id", productIds));
        } else if (make || model || year) {
          // If compatibility filters were applied but no matches found, return empty
          return NextResponse.json({
            items: [],
            products: [],
            total: 0,
          });
        }
      } catch (e) {
        console.error("Failed to query compatibilities", e);
      }
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return jsonError("Unauthorized", 401);
    }

    const { productId, ...updates } = await req.json();

    if (!productId) {
      return jsonError("Product ID is required", 400);
    }

    // Verify ownership
    const existingProduct = await databasesServer.getDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId
    );

    if (!existingProduct) {
      return jsonError("Product not found", 404);
    }

    const isOwner = existingProduct.sellerId === session.profile.$id;
    const isAdmin =
      session.profile.role === "admin" || session.profile.role === "main_admin";

    if (!isOwner && !isAdmin) {
      return jsonError("Forbidden: You do not own this product", 403);
    }

    const price =
      typeof updates.price === "number" ? updates.price : existingProduct.price;
    const originalPrice =
      updates.originalPrice !== undefined
        ? typeof updates.originalPrice === "number"
          ? updates.originalPrice
          : Number(updates.originalPrice)
        : existingProduct.originalPrice;

    const payload: any = {
      ...updates,
      onSale: originalPrice !== null && originalPrice > (price ?? 0),
    };

    if (updates.discountStartDate !== undefined) {
      payload.discountStartDate = updates.discountStartDate;
    }

    // Auto-activate if restocking
    if (typeof updates.stock === "number" && updates.stock > 0) {
      if (updates.isActive === undefined) {
        payload.isActive = true;
      }
    }

    // Auto-deactivate if stock is 0
    if (typeof updates.stock === "number" && updates.stock <= 0) {
      if (updates.isActive === undefined) {
        payload.isActive = false;
      }
    }

    const updated = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      productId,
      payload
    );

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Products PUT error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
