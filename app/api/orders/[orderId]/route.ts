import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";

type RouteContext = {
  params: { orderId: string };
};

/**
 * PATCH /api/orders/[orderId]
 * Update order status
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { orderId } = context.params;
    const { status, sellerId } = await req.json();

    // Validate status
    const validStatuses = [
      "pending",
      "paid",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
        },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // If sellerId is provided, verify seller owns at least one product in the order
    if (sellerId) {
      // Fetch seller's products
      const productsResponse = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productsCollectionId,
        [{ method: "equal", attribute: "sellerId", values: [sellerId] }]
      );

      const productIds = productsResponse.documents.map((p) => p.$id);

      // Check if order contains seller's products
      const items = order.items as string[];
      const hasSellerProduct = items.some((itemStr) => {
        try {
          const item = JSON.parse(itemStr);
          return productIds.includes(item.productId);
        } catch {
          return false;
        }
      });

      if (!hasSellerProduct) {
        return NextResponse.json(
          { error: "You don't have permission to update this order" },
          { status: 403 }
        );
      }
    }

    // Update the order
    const updatedOrder = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      { status }
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: error.message || "Server error updating order" },
      { status: 500 }
    );
  }
}
