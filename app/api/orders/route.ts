import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { Models } from "appwrite";
import { buildProductImageUrl } from "@/lib/server/productService";

interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface OrderDocument extends Models.Document {
  customerId: string;
  items: string[]; // Store as array of strings in Appwrite (e.g. JSON strings or just IDs) - keeping simple for now, usually JSON stringified
  totalPrice: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  shippingAddress: string;
  paymentMethod: string;
}

import { getServerSession } from "@/lib/session-server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in to place an order" },
        { status: 401 }
      );
    }

    const {
      // customerId, // Ignored from body, taken from session
      items,
      shippingAddress,
      paymentMethod,
      paymentDetails,
    } = await req.json();

    const customerId = session.profile.$id;

    // 1. Validation
    // customerId is guaranteed by session

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shippingAddress) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // 2. Fetch all products to verify stock and calculate real price
    // We'll calculate the total on the server to prevent tampering
    let calculatedTotal = 0;
    const orderItemsForDb = []; // We will store this in the order document
    const productUpdates = []; // List of updates to perform (stock reduction)

    for (const item of items) {
      const { productId, quantity } = item as OrderItemInput;

      if (!productId || quantity <= 0) {
        return NextResponse.json(
          { error: "Invalid item data" },
          { status: 400 }
        );
      }

      // Fetch product
      const product = await databasesServer.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.productsCollectionId,
        productId
      );

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 404 }
        );
      }

      // Check stock
      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      // Add to total
      calculatedTotal += product.price * quantity;

      // Persist item details snapshot (so price changes don't affect past orders)
      orderItemsForDb.push(
        JSON.stringify({
          productId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.imageId ? product.imageId : null, // Store simple ref
          imageUrl: buildProductImageUrl(
            product.imageId ? product.imageId : null
          ),
          sellerId: product.sellerId,
        })
      );

      // Prepare stock update
      productUpdates.push({
        productId,
        newStock: product.stock - quantity,
      });
    }

    // 3. Create Order
    // We create the order first. If this fails, no stocks are touched.
    const order = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      ID.unique(),
      {
        customerId,
        items: orderItemsForDb, // Appwrite array of strings
        totalPrice: calculatedTotal,
        status: "pending",
        shippingAddress:
          typeof shippingAddress === "string"
            ? shippingAddress
            : JSON.stringify(shippingAddress),
        paymentMethod: paymentMethod || "card",
        paymentDetails: paymentDetails ? JSON.stringify(paymentDetails) : null,
        createdAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(customerId)),
        Permission.read(Role.label("admin")), // Assuming admins have 'admin' label or similar, or just user specific
        Permission.read(Role.user(appwriteConfig.mainAdminId)),
      ]
    );

    // 4. Update Stock
    // Accessing this point means order is created. Now we decrement stocks.
    // If one fails here, we technically currently have an inconsistency (order created, stock not reduced).
    // In a robust system we'd handle this with transactions or compensation.
    // For this project, we'll log errors.
    await Promise.all(
      productUpdates.map((update) =>
        databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.productsCollectionId,
          update.productId,
          {
            stock: update.newStock,
            isActive: update.newStock > 0, // Deactivate if out of stock
          }
        )
      )
    );

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Server error processing order" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    // const customerIdParam = searchParams.get("customerId");

    const queries = [Query.orderDesc("createdAt")];

    // Access Control Logic:
    // If Admin: Can see all orders (or filter by customerId if provided)
    // If Seller: Can see orders containing their products (handled by filtering logic below).
    //            BUT listDocuments will return all orders if we don't filter.
    //            Ideally sellers should only call this with specific filters or a separate "seller/orders" endpoint.
    //            For now, let's assume this endpoint is general.
    // If Customer: Can ONLY see their own orders.

    const isAdmin =
      session.profile.role === "admin" || session.profile.role === "main_admin";
    const isSeller = session.profile.role === "seller";

    if (isAdmin) {
      // If admin provides customerId, use it. Otherwise show all.
      const customerIdParam = searchParams.get("customerId");
      if (customerIdParam) {
        queries.push(Query.equal("customerId", customerIdParam));
      }
    } else if (isSeller) {
      // Sellers might want to see orders.
      // Warning: This current endpoint implementation lists ALL orders from DB then filters in memory for sellerId.
      // This is inefficient but existing logic.
      // To be safe, we should NOT allow sellers to see "customerId" filter of others unless it's implicit.
      // Actually, sellers *need* to see orders from various customers.
      // BUT they should only see *their own* sales.
      // The existing code at lines 191-206 filters by `sellerId` query param.
      // We must enforce that the sellerId param matches the logged in seller.

      // However, looking at the code, it uses `listDocuments` on `ordersCollectionId` WITHOUT seller filter first.
      // This relies on Appwrite permissions or lists everything?
      // If "role:all" has read access, then anyone can list.
      // We should restrict queries.

      // Simplest fix for this file without changing Appwrite schema:
      // If seller, enforce they are filtering by their own sellerId?
      // Or if the UI sends sellerId...

      // Let's implement strict rules:
      // Customer -> Must query their own orders.

      // If it's a seller checking their orders (which are mixed in 'orders' collection?), they usually search by 'items' containing their ID.
      // Appwrite filtering inside JSON strings is hard.
      // The existing code does `listDocuments` then filters in memory. This effectively allows reading ALL orders if permissions are open.
      // Assuming permissions are Restricted (only owner/admin), then this fails for Sellers?
      // Wait, line 133: `Permission.read(Role.user(customerId))`
      // Only the customer and admins can read the order document by default permissions!
      // So sellers CANNOT read these orders via standard listDocuments unless they are also granted permission.
      // The existing code at line 131 doesn't grant read to seller.
      // So `GET` for seller likely returns 0 documents unless they are admin.

      // For now, let's Secure the Customer case properly.
      // If not admin, FORCE customerId = session.profile.$id

      // Wait, if it's a seller, they might be blocked by appwrite permissions anyway.
      // Let's assume this endpoint is primarily for Customers for now.

      if (!isAdmin) {
        queries.push(Query.equal("customerId", session.profile.$id));
      }
    } else {
      // Regular customer
      queries.push(Query.equal("customerId", session.profile.$id));
    }

    const list = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      queries
    );

    // Filter by seller if sellerId is provided
    const sellerId = searchParams.get("sellerId");
    let filteredOrders = list.documents;

    if (sellerId) {
      // Filter orders that contain items from this seller
      // We check the stored `sellerId` in the item snapshot.
      // This assumes orders created after this fix have `sellerId`.
      // Legacy orders without `sellerId` in snapshot will not appear here.
      filteredOrders = list.documents.filter((order) => {
        try {
          const items = order.items as string[];
          return items.some((itemStr) => {
            const item = JSON.parse(itemStr);
            return item.sellerId === sellerId;
          });
        } catch {
          return false;
        }
      });
    }

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      total: filteredOrders.length,
    });
  } catch (error: any) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Server error fetching orders" },
      { status: 500 }
    );
  }
}
