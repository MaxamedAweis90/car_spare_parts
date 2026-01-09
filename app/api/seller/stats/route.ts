import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required" },
        { status: 400 }
      );
    }

    // Fetch seller's products to get product IDs
    const productsResponse = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productsCollectionId,
      [Query.equal("sellerId", sellerId), Query.limit(1000)]
    );

    const productIds = productsResponse.documents.map((p) => p.$id);

    if (productIds.length === 0) {
      // No products, return empty stats
      return NextResponse.json({
        success: true,
        stats: {
          totalVisits: 0,
          bounceRate: 0,
          returningUsers: 0,
          revenueData: [],
          lastWeekRevenue: [],
          customerStats: {
            newCustomers: 0,
            returningCustomers: 0,
          },
        },
      });
    }

    // Fetch all orders to filter by seller's products
    const ordersResponse = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      [Query.orderDesc("createdAt"), Query.limit(1000)]
    );

    // Filter orders that contain seller's products
    const sellerOrders = ordersResponse.documents.filter((order) => {
      try {
        const items = order.items as string[];
        return items.some((itemStr) => {
          const item = JSON.parse(itemStr);
          return productIds.includes(item.productId);
        });
      } catch {
        return false;
      }
    });

    // Calculate statistics
    const totalVisits = productsResponse.total || 0; // Using product count as proxy for visits
    const bounceRate = Math.floor(Math.random() * 30) + 10; // Mock bounce rate (10-40%)

    // Calculate returning customers
    const customerOrderCounts = new Map<string, number>();
    sellerOrders.forEach((order) => {
      const customerId = (order as any).customerId;
      customerOrderCounts.set(
        customerId,
        (customerOrderCounts.get(customerId) || 0) + 1
      );
    });

    const returningCustomers = Array.from(customerOrderCounts.values()).filter(
      (count) => count > 1
    ).length;
    const newCustomers = customerOrderCounts.size - returningCustomers;

    // Calculate revenue data for the last 7 days
    const now = new Date();
    const revenueData = [];
    const lastWeekRevenue = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = sellerOrders.filter((order) => {
        const orderDate = new Date((order as any).createdAt);
        return orderDate >= date && orderDate < nextDate;
      });

      const dayRevenue = dayOrders.reduce(
        (sum, order) => sum + ((order as any).totalPrice || 0),
        0
      );

      revenueData.push({
        date: date.toISOString().split("T")[0],
        revenue: dayRevenue,
      });
    }

    // Calculate last week's revenue for comparison
    for (let i = 13; i >= 7; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = sellerOrders.filter((order) => {
        const orderDate = new Date((order as any).createdAt);
        return orderDate >= date && orderDate < nextDate;
      });

      const dayRevenue = dayOrders.reduce(
        (sum, order) => sum + ((order as any).totalPrice || 0),
        0
      );

      lastWeekRevenue.push({
        date: date.toISOString().split("T")[0],
        revenue: dayRevenue,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalVisits,
        bounceRate,
        returningUsers: returningCustomers,
        revenueData,
        lastWeekRevenue,
        customerStats: {
          newCustomers,
          returningCustomers,
        },
      },
    });
  } catch (error: any) {
    console.error("Seller stats fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Server error fetching seller stats" },
      { status: 500 }
    );
  }
}
