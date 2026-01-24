import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
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
        { status: 401 },
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
        { status: 400 },
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
          { status: 400 },
        );
      }

      // Fetch product
      const product = await databasesServer.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.productsCollectionId,
        productId,
      );

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${productId}` },
          { status: 404 },
        );
      }

      // Check stock
      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          },
          { status: 400 },
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
            product.imageId ? product.imageId : null,
          ),
          sellerId: product.sellerId,
        }),
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
        status: "pending_verification", // Updated: new default status for customer orders
        shippingAddress:
          typeof shippingAddress === "string"
            ? shippingAddress
            : JSON.stringify(shippingAddress),
        paymentMethod: paymentMethod || "card",
        paymentDetails: paymentDetails ? JSON.stringify(paymentDetails) : null,
        createdAt: new Date().toISOString(),
        sellerId: null, // Customer orders don't have a seller initially
        verificationNotes: null,
      },
      [
        Permission.read(Role.user(customerId)),
        Permission.read(Role.label("admin")), // Assuming admins have 'admin' label or similar, or just user specific
        Permission.read(Role.user(appwriteConfig.mainAdminId)),
      ],
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
          },
        ),
      ),
    );

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Server error processing order" },
      { status: 500 },
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

    const sellerIdParam = searchParams.get("sellerId");
    const customerIdParam = searchParams.get("customerId");

    const queries = [Query.orderDesc("createdAt")];

    // Access control and Filtering logic
    const isAdmin =
      session.profile.role === "admin" || session.profile.role === "main_admin";

    if (sellerIdParam) {
      // --- SELLER VIEW ---
      // Check authorization: Must be the seller themselves or an admin
      if (session.profile.$id !== sellerIdParam && !isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You can only view your own sales" },
          { status: 403 },
        );
      }
      // Query by sellerId field
      queries.push(Query.equal("sellerId", sellerIdParam));
    } else if (isAdmin) {
      // --- ADMIN VIEW ---
      // Admins can see everything, or filter by customer
      if (customerIdParam) {
        queries.push(Query.equal("customerId", customerIdParam));
      }
    } else {
      // --- CUSTOMER VIEW ---
      // Regular users can only see their own orders
      queries.push(Query.equal("customerId", session.profile.$id));
    }

    const list = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      queries,
    );

    return NextResponse.json({
      success: true,
      orders: list.documents,
      total: list.total,
    });
  } catch (error: any) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Server error fetching orders" },
      { status: 500 },
    );
  }
}
