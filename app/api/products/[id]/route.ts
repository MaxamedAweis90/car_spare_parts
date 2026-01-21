import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import {
  ProductDocument,
  buildProductImageUrl,
} from "@/lib/server/productService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }, // async params in Next.js 15
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Product ID required" },
        { status: 400 },
      );
    }

    const doc = await databasesServer.getDocument<ProductDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      id,
    );

    // If the product is not active or published, we might want to hide it
    // unless the user is the seller/admin. For now, let's match the list logic
    // which effectively returns everything but filters in code,
    // or relies on the caller to handle visibility.
    // Ideally we check:
    // if (doc.active === false && !isAdmin && !isSeller) return 404;

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
      `Error fetching product ${await params.then((p) => p.id)}:`,
      error,
    );
    if (error.code === 404) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
