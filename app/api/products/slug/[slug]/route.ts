import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { Query } from "node-appwrite";
import {
  ProductDocument,
  buildProductImageUrl,
} from "@/lib/server/productService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        { error: "Product Slug required" },
        { status: 400 },
      );
    }

    const res = await databasesServer.listDocuments<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [Query.equal("slug", slug), Query.limit(1)],
    );

    if (res.total === 0 || res.documents.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const doc = res.documents[0];

    // Construct public image URL
    const imageIds = Array.isArray(doc.imageIds)
      ? (doc.imageIds as string[])
      : [];
    const mainImageId = doc.imageId || imageIds[0] || null;

    // Fetch seller store information if sellerId exists
    let sellerStore = null;
    if (doc.sellerId) {
      try {
        const storeRes = await databasesServer.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.storeCollectionId,
          [Query.equal("sellerId", doc.sellerId), Query.limit(1)],
        );

        if (storeRes.total > 0) {
          const store = storeRes.documents[0];
          sellerStore = {
            $id: store.$id,
            name: store.name,
            slug: store.slug,
            avatarId: store.avatarId || null,
          };
        }
      } catch (storeError) {
        console.error("Error fetching seller store:", storeError);
        // Continue without store info if fetch fails
      }
    }

    const product = {
      ...doc,
      imageUrl: buildProductImageUrl(mainImageId),
      sellerStore,
    };

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(
      `Error fetching product slug ${await params.then((p) => p.slug)}:`,
      error,
    );
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
