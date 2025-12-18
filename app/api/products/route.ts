import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { Models, Query } from "appwrite";

interface ProductDocument extends Models.Document {
  name: string;
  price: number;
  stock: number;
  category: string;
  sellerId: string;
}

export async function POST(req: NextRequest) {
  try {
    const { name, price, stock, category, sellerId } = await req.json();

    const product = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      "unique()",
      {
        name,
        price,
        stock,
        category,
        sellerId,
      },
      [
        `user:${sellerId}`,                    // seller write
        `user:${appwriteConfig.mainAdminId}`,  // main admin write
        "role:users",                          // all logged-in users read
      ]
    ) as ProductDocument;

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
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

    const products = list.documents as ProductDocument[];
    return NextResponse.json({ items: products });
  } catch (error: any) {
    console.error("Products GET error", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
