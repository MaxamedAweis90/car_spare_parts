import { NextRequest, NextResponse } from "next/server";
import { ID, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import type { PaymentRequest } from "@/lib/types/payment";
import { processFakePayment } from "@/lib/utils/fakePayment";

/**
 * POST /api/payments/process
 * Process a payment for an order
 *
 * This endpoint handles fake payments for now.
 * When real payment API is integrated, replace processFakePayment()
 * with actual API calls to Sifalo Pay or other gateway.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customerId = session.profile.$id;
    const request: PaymentRequest = await req.json();

    // Validate request
    if (!request.orderId || !request.amount) {
      return NextResponse.json(
        { error: "Order ID and amount are required" },
        { status: 400 },
      );
    }

    // Fetch order to verify ownership and status
    const order = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      request.orderId,
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify customer owns this order
    if (order.customerId !== customerId) {
      return NextResponse.json(
        { error: "You don't have permission to pay for this order" },
        { status: 403 },
      );
    }

    // Verify order is awaiting payment
    if (order.status !== "awaiting_payment") {
      return NextResponse.json(
        {
          error: `Order cannot be paid. Current status: ${order.status}`,
        },
        { status: 400 },
      );
    }

    // Create payment transaction record (pending)
    const paymentTransaction = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.paymentsCollectionId,
      ID.unique(),
      {
        orderId: request.orderId,
        customerId,
        amount: request.amount,
        currency: request.currency || "USD",
        paymentMethodId: request.paymentMethodId || null,
        paymentType: request.paymentMethodInput?.type || "card",
        status: "pending",
        isFakePayment: true,
      },
      [
        Permission.read(Role.user(customerId)),
        Permission.read(Role.label("admin")),
        Permission.read(Role.user(appwriteConfig.mainAdminId)),
      ],
    );

    // Process fake payment
    const paymentResult = await processFakePayment(request);

    // Update payment transaction with result
    const updatedTransaction = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.paymentsCollectionId,
      paymentTransaction.$id,
      {
        status: paymentResult.status,
        gatewayTransactionId: paymentResult.transactionId,
        gatewayResponse: JSON.stringify(paymentResult),
        errorMessage: paymentResult.success ? null : paymentResult.message,
      },
    );

    // If payment successful, update order status
    if (paymentResult.success) {
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.ordersCollectionId,
        request.orderId,
        {
          status: "paid",
          paymentDetails: JSON.stringify({
            m: request.paymentMethodInput?.type,
            tid: paymentResult.transactionId,
            ps: "paid",
            fake: true,
          }),
        },
      );
    }

    return NextResponse.json({
      success: paymentResult.success,
      transactionId: updatedTransaction.$id,
      gatewayTransactionId: paymentResult.transactionId,
      status: paymentResult.status,
      message: paymentResult.message,
      isFake: paymentResult.isFake,
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/payments/[transactionId]
 * Get payment transaction details
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const transactionId = url.pathname.split("/").pop();

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    const transaction = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.paymentsCollectionId,
      transactionId,
    );

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Verify user has access to this transaction
    const customerId = session.profile.$id;
    if (
      transaction.customerId !== customerId &&
      session.profile.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "You don't have permission to view this transaction" },
        { status: 403 },
      );
    }

    return NextResponse.json({ transaction });
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}
