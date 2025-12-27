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

export async function POST(req: NextRequest) {
  try {
    const {
      customerId,
      items,
      shippingAddress,
      paymentMethod,
      paymentDetails,
    } = await req.json();

    // 1. Validation
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }
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
          { stock: update.newStock }
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
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");

    const queries = [Query.orderDesc("createdAt")];
    if (customerId) {
      queries.push(Query.equal("customerId", customerId));
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
      // Fetch seller's products
      const productsResponse = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productsCollectionId,
        [Query.equal("sellerId", sellerId), Query.limit(1000)]
      );

      const productIds = productsResponse.documents.map((p) => p.$id);

      // Filter orders that contain seller's products
      filteredOrders = list.documents.filter((order) => {
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
