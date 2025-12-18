import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { Models } from "appwrite";

interface OrderDocument extends Models.Document {
  customerId: string;
  items: any[];
  totalPrice: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, items, totalPrice } = await req.json();

    const order = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      "unique()",
      {
        customerId,
        items,
        totalPrice,
        status: "pending",
      },
      [
        `user:${customerId}`,                    // customer read/write
        `user:${appwriteConfig.mainAdminId}`,    // main admin read/write
        "role:users",                            // admins/sellers can read
      ]
    ) as OrderDocument;

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
