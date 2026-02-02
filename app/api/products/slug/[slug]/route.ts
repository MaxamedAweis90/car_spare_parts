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

    const product = {
      ...doc,
      imageUrl: buildProductImageUrl(mainImageId),
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
