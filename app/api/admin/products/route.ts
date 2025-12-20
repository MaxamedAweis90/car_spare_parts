import { NextRequest, NextResponse } from "next/server";
import { Query, type Models } from "node-appwrite";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { buildProductImageUrl, type ProductDocument } from "@/lib/server/productService";

type ProductListItem = ProductDocument & {
  imageUrls?: string[];
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "200", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 200;
    const sellerId = searchParams.get("sellerId")?.trim() || null;

    const queries: any[] = [Query.orderDesc("$createdAt"), Query.limit(limit)];
    if (sellerId) queries.unshift(Query.equal("sellerId", sellerId));

    const list = await databasesServer.listDocuments<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      queries
    );

    const items: ProductListItem[] = list.documents.map((doc) => {
      const imageIds = Array.isArray((doc as any).imageIds) ? ((doc as any).imageIds as string[]) : [];
      const imageUrls = imageIds.length ? imageIds.map((id) => buildProductImageUrl(id) ?? "").filter(Boolean) : [];
      return { ...(doc as any), imageUrls };
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Admin products GET error", error);
    return jsonError(error?.message || "Server error", error?.status || 500);
  }
}
