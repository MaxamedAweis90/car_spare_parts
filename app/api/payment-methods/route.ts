import { NextRequest, NextResponse } from "next/server";
import { ID, Permission, Role, Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import type { PaymentMethodInput } from "@/lib/types/payment";
import {
  validateSomaliaPhone,
  validateCardNumber,
  getCardBrand,
  maskCardNumber,
} from "@/lib/utils/fakePayment";

/**
 * GET /api/payment-methods
 * Get user's saved payment methods
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    let targetUserId = session.profile.$id;

    if (requestedUserId && requestedUserId !== targetUserId) {
      // Check permissions
      const isAdmin =
        session.profile.role === "admin" ||
        session.profile.role === "main_admin";
      const isSeller = session.profile.role === "seller";

      if (!isAdmin && !isSeller) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      targetUserId = requestedUserId;
    }

    // Fetch user's payment methods
    const paymentMethods = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.paymentMethodsCollectionId,
      [Query.equal("userId", targetUserId)],
    );

    return NextResponse.json({ paymentMethods: paymentMethods.documents });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment methods" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/payment-methods
 * Save a new payment method
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.profile.$id;
    const input: PaymentMethodInput = await req.json();

    // Validate input
    if (!input.type) {
      return NextResponse.json(
        { error: "Payment method type is required" },
        { status: 400 },
      );
    }

    // Validate based on type
    if (input.type === "evc_plus" || input.type === "edahab") {
      if (!input.phoneNumber) {
        return NextResponse.json(
          { error: "Phone number is required" },
          { status: 400 },
        );
      }

      if (!validateSomaliaPhone(input.phoneNumber)) {
        return NextResponse.json(
          { error: "Invalid phone number format" },
          { status: 400 },
        );
      }
    }

    if (input.type === "card") {
      if (!input.cardNumber || !input.cardExpiry || !input.cardholderName) {
        return NextResponse.json(
          { error: "Card details are required" },
          { status: 400 },
        );
      }

      if (!validateCardNumber(input.cardNumber)) {
        return NextResponse.json(
          { error: "Invalid card number" },
          { status: 400 },
        );
      }
    }

    // If setting as default, unset other defaults
    if (input.isDefault) {
      const existingMethods = await databasesServer.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.paymentMethodsCollectionId,
        [],
      );

      const userDefaults = existingMethods.documents.filter(
        (pm: any) => pm.userId === userId && pm.isDefault,
      );

      // Update existing defaults to false
      await Promise.all(
        userDefaults.map((pm: any) =>
          databasesServer.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.paymentMethodsCollectionId,
            pm.$id,
            { isDefault: false },
          ),
        ),
      );
    }

    // Prepare payment method data
    const paymentMethodData: any = {
      userId,
      type: input.type,
      isDefault: input.isDefault || false,
      nickname: input.nickname || null,
    };

    // Add type-specific fields
    if (input.type === "evc_plus" || input.type === "edahab") {
      paymentMethodData.phoneNumber = input.phoneNumber;
      // provider not in schema, removing
    }

    if (input.type === "card") {
      // In real implementation, card number would be tokenized/encrypted
      // For now, we only store last 4 digits
      const last4 = input.cardNumber!.slice(-4);
      const brand = getCardBrand(input.cardNumber!);

      paymentMethodData.cardLast4 = last4;
      paymentMethodData.cardBrand = brand;
      paymentMethodData.cardExpiry = input.cardExpiry;
      paymentMethodData.cardholderName = input.cardholderName;
    }

    // Create payment method
    const paymentMethod = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.paymentMethodsCollectionId,
      ID.unique(),
      paymentMethodData,
      [
        Permission.read(Role.user(session.account.$id)),
        Permission.update(Role.user(session.account.$id)),
        Permission.delete(Role.user(session.account.$id)),
      ],
    );

    return NextResponse.json({
      success: true,
      paymentMethod,
      message: "Payment method saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving payment method:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save payment method" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/payment-methods/[id]
 * Delete a saved payment method
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const paymentMethodId = url.pathname.split("/").pop();

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 },
      );
    }

    // Delete payment method (Appwrite permissions will ensure user owns it)
    await databasesServer.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.paymentMethodsCollectionId,
      paymentMethodId,
    );

    return NextResponse.json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete payment method" },
      { status: 500 },
    );
  }
}
