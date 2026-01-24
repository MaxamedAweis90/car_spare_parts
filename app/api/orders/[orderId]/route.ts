import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import {
  isValidStatusTransition,
  type UserRole,
} from "@/lib/utils/orderStatusTransitions";
import type { OrderStatus } from "@/lib/types/order";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

/**
 * PATCH /api/orders/[orderId]
 * Update order status with validation
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { orderId } = await context.params;
    const { status, sellerId, verificationNotes } = await req.json();

    // Authenticate user
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate status
    const validStatuses: OrderStatus[] = [
      "pending_verification",
      "awaiting_payment",
      "paid",
      "approved_for_fulfillment",
      "packing",
      "shipped",
      "delivered",
      "cancelled",
      "rejected",
      // Legacy
      "pending",
      "completed",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
        },
        { status: 400 },
      );
    }

    // Fetch the order
    const order = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Validate status transition
    const userRole = session.profile.role as UserRole;
    const currentStatus = order.status as OrderStatus;
    const newStatus = status as OrderStatus;

    if (!isValidStatusTransition(currentStatus, newStatus, userRole)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${currentStatus} to ${newStatus} for role ${userRole}`,
        },
        { status: 400 },
      );
    }

    // If sellerId is provided, verify seller owns at least one product in the order
    if (sellerId) {
      // Fetch seller's products
      const productsResponse = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productsCollectionId,
        [Query.equal("sellerId", [sellerId])],
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
          { status: 403 },
        );
      }
    }

    // Prepare update data
    const updateData: any = { status };
    if (verificationNotes !== undefined) {
      updateData.verificationNotes = verificationNotes;
    }

    // Update the order
    const updatedOrder = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      updateData,
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: error.message || "Server error updating order" },
      { status: 500 },
    );
  }
}
