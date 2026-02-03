import { NextRequest, NextResponse } from "next/server";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import { ID, Permission, Query, Role } from "node-appwrite";
import { getServerSession } from "@/lib/auth/get-server-session";
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
    const session = await getServerSession();
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

    // --- TRIGGER REVIEW EMAIL ---
    if (newStatus === "delivered" && currentStatus !== "delivered") {
      try {
        const { sendOrderDeliveredEmail } =
          await import("@/lib/emails/notifications");

        // We need the customer's name. Fetch from users collection if not in order doc
        // Actually, let's fetch the customer profile to get name and email
        const customerProfile = await databasesServer.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          order.customerId,
        );

        // Send email
        await sendOrderDeliveredEmail(
          order.customerId,
          customerProfile.name,
          orderId,
        );

        const reviewLink = `${req.nextUrl.origin}/reviews/${orderId}`;
        const message = `Your order ${orderId.slice(-8).toUpperCase()} has been delivered! Please take a moment to review your products.`;

        // Send Notification (Simplified: In-app + Attempt Email via Appwrite Function or similar)
        // For now, we reuse the existing in-app notification structure, but targeting the CUSTOMER
        // Note: The existing notifyFollowers is for STORE followers. We need a direct user notification here.

        await databasesServer.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.notificationsCollectionId,
          ID.unique(),
          {
            userId: order.customerId,
            storeId: "system", // System notification
            type: "order_delivered", // New type
            title: "Order Delivered",
            message: message,
            link: reviewLink,
            isRead: false,
          },
          [
            Permission.read(Role.user(order.customerId)),
            Permission.update(Role.user(order.customerId)),
            Permission.delete(Role.user(order.customerId)),
          ],
        );

        // TODO: In a real production env, here we would trigger the Appwrite Cloud Function for Email:
        // await functionsServer.createExecution('send-email', JSON.stringify({ to: customerEmail, subject: "Delivered", body: ... }));
      } catch (notifyError) {
        console.error("Failed to send delivery notification:", notifyError);
      }
    }
    // ----------------------------

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
