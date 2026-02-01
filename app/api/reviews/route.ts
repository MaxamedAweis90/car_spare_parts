import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, productId, rating, comment } = await req.json();
    const customerId = session.profile.$id;

    if (!orderId || !productId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1. Verify Order & Eligibility
    // Fetch order to check ownership and status
    const order = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check ownership
    if (order.customerId !== customerId) {
      return NextResponse.json(
        { error: "You can only review your own orders" },
        { status: 403 },
      );
    }

    // Check status
    // Must be 'delivered' (or 'completed' for legacy support)
    if (order.status !== "delivered" && order.status !== "completed") {
      return NextResponse.json(
        { error: "You can only review delivered orders" },
        { status: 400 },
      );
    }

    // Check if product exists in order
    // Order items are stored as JSON strings
    const items = order.items || [];
    const productItem = items.find((itemStr: string) => {
      try {
        const item = JSON.parse(itemStr);
        return item.productId === productId;
      } catch {
        return false;
      }
    });

    if (!productItem) {
      return NextResponse.json(
        { error: "Product not found in this order" },
        { status: 400 },
      );
    }

    const parsedItem = JSON.parse(productItem);
    const sellerId = parsedItem.sellerId;

    if (!sellerId) {
      // Should not happen in valid orders, but good to handle
      return NextResponse.json(
        { error: "Seller information missing for this product" },
        { status: 500 },
      );
    }

    // 2. Check for Existing Review (Upsert Logic)
    const existingReviews = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.reviewsCollectionId, // Assuming this is added to config
      [
        Query.equal("orderId", orderId),
        Query.equal("productId", productId),
        Query.equal("customerId", customerId),
      ],
    );

    if (existingReviews.total > 0) {
      // Update existing
      const reviewId = existingReviews.documents[0].$id;
      const updatedReview = await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.reviewsCollectionId,
        reviewId,
        {
          rating,
          comment,
        },
      );
      return NextResponse.json({
        success: true,
        review: updatedReview,
        message: "Review updated",
      });
    } else {
      // Create new
      const docId = ID.unique();
      const newReview = await databasesServer.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.reviewsCollectionId,
        docId,
        {
          reviewId: docId,
          sellerId,
          customerId,
          orderId,
          productId,
          rating,
          comment,
        },
        [
          Permission.read(Role.any()), // Publicly visible
          Permission.update(Role.user(customerId)), // Owner can edit
          Permission.delete(Role.label("admin")), // Admin can delete
        ],
      );
      return NextResponse.json({
        success: true,
        review: newReview,
        message: "Review submitted",
      });
    }
  } catch (error: any) {
    console.error("Review submission error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 },
    );
  }
}
