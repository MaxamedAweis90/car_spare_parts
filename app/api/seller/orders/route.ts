import { NextRequest, NextResponse } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import { buildProductImageUrl } from "@/lib/server/productService";
import {
  createCashPaymentDetails,
  createMobileMoneyPaymentDetails,
  serializePaymentDetails,
} from "@/lib/utils/paymentDetails";

interface OrderItemInput {
  productId: string;
  quantity: number;
}

/**
 * POST /api/seller/orders
 * Seller-assisted order creation
 *
 * Allows sellers to create orders on behalf of customers
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate seller
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in" },
        { status: 401 },
      );
    }

    const userRole = session.profile.role || "";
    if (!["seller", "admin", "main_admin"].includes(userRole)) {
      return NextResponse.json(
        { error: "Only sellers and admins can create orders" },
        { status: 403 },
      );
    }

    const sellerId = session.profile.$id;

    // 2. Parse request
    const {
      customerId,
      items,
      shippingAddress,
      paymentMethod,
      paymentDetails: paymentDetailsInput,
    } = await req.json();

    // 3. Validation
    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 },
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 },
      );
    }

    // 4. Verify customer exists and get Auth ID
    let customerAuthId = customerId;
    try {
      const customerDoc = await databasesServer.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        customerId,
      );
      if ((customerDoc as any).appwriteUserId) {
        customerAuthId = (customerDoc as any).appwriteUserId;
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    // 5. Fetch all products and calculate total
    let calculatedTotal = 0;
    const orderItemsForDb = [];
    const productUpdates = [];

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

      // Authorization: seller can only create orders for their own products
      if (userRole === "seller" && product.sellerId !== sellerId) {
        return NextResponse.json(
          {
            error: `You don't have permission to sell product: ${product.name}`,
          },
          { status: 403 },
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

      // Persist item details snapshot
      orderItemsForDb.push(
        JSON.stringify({
          productId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.imageId ? product.imageId : null,
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

    // 6. Prepare payment details
    let paymentDetailsStr = null;
    if (paymentMethod === "cash") {
      paymentDetailsStr = serializePaymentDetails(createCashPaymentDetails());
    } else if (
      paymentMethod === "mobile_money" ||
      paymentMethod === "evc_plus" ||
      paymentMethod === "edahab"
    ) {
      const phoneNumber = paymentDetailsInput?.phoneNumber || "";
      const method =
        paymentMethod === "mobile_money" ? "evc_plus" : paymentMethod;
      paymentDetailsStr = serializePaymentDetails(
        createMobileMoneyPaymentDetails(
          phoneNumber,
          method as "evc_plus" | "edahab",
        ),
      );
    } else if (paymentMethod === "stripe_link") {
      // Stripe link will be generated separately via /api/stripe/checkout
      paymentDetailsStr = serializePaymentDetails({
        m: "stripe",
        ps: "pending",
      });
    } else if (paymentDetailsInput) {
      paymentDetailsStr = JSON.stringify(paymentDetailsInput);
    }

    // 7. Create Order
    // Seller-created orders start at "awaiting_payment" (skip verification)
    const order = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      ID.unique(),
      {
        customerId,
        items: orderItemsForDb,
        totalPrice: calculatedTotal,
        status: "awaiting_payment", // Seller-assisted orders skip verification
        shippingAddress:
          typeof shippingAddress === "string"
            ? shippingAddress
            : JSON.stringify(shippingAddress || {}),
        paymentMethod: paymentMethod || "cash",
        paymentDetails: paymentDetailsStr,
        createdAt: new Date().toISOString(),
        sellerId: sellerId, // Track who created this order
        verificationNotes: null,
      },
      [
        Permission.read(Role.user(customerAuthId)),
        Permission.read(Role.user(session.account.$id)),
        Permission.read(Role.label("admin")),
        Permission.read(Role.user(appwriteConfig.mainAdminId)),
      ],
    );

    // 8. Update Stock
    // Note: For seller-assisted orders, we reduce stock immediately
    // This matches the existing customer checkout behavior
    await Promise.all(
      productUpdates.map((update) =>
        databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.productsCollectionId,
          update.productId,
          {
            stock: update.newStock,
            isActive: update.newStock > 0,
          },
        ),
      ),
    );

    return NextResponse.json({
      success: true,
      order,
      message: "Order created successfully",
    });
  } catch (error: any) {
    console.error("Seller order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Server error creating order" },
      { status: 500 },
    );
  }
}
