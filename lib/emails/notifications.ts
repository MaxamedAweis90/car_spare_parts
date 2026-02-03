import { ID } from "node-appwrite";
import { messagingServer } from "@/lib/api/appwrite-server";
import {
  getOrderConfirmationTemplate,
  getOrderDeliveredTemplate,
} from "@/lib/emails/templates";

// Use environment variable or constant for subject lines
const SUBJECT_ORDER_CONFIRMED = "Order Confirmed - SomaParts";
const SUBJECT_ORDER_DELIVERED = "Your Order Has Been Delivered! - SomaParts";

export async function sendOrderConfirmationEmail(
  userEmail: string, // We need to pass email explicitly since we might not just rely on userId
  userId: string,
  userName: string,
  order: any,
) {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const viewOrderLink = `${origin}/account/orders/${order.$id}`;

    // Parse items if they are strings
    const items = order.items.map((item: any) =>
      typeof item === "string" ? JSON.parse(item) : item,
    );

    const content = getOrderConfirmationTemplate(
      userName,
      order.$id,
      order.totalPrice,
      items,
      typeof order.shippingAddress === "string"
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress,
      viewOrderLink,
    );

    await messagingServer.createEmail(
      ID.unique(),
      SUBJECT_ORDER_CONFIRMED,
      content,
      [], // Topics (optional)
      [userId], // Targets (User IDs) - Appwrite Messaging targets users by ID usually
      // If we want to send to a specific email that might NOT be the user's primary email (unlikely here),
      // we would need a provider that supports CC/BCC or just trust target=userId sends to their email.
      // NOTE: Appwrite Create Email sends to the User's email on file.
      [], // cc
      [], // bcc
      [], // draft
      [], // attachments
      false, // html (false = default to true for createEmail? No, wait.)
      true, // html enable
    );
    console.log(`[Email] Order confirmation sent to ${userEmail}`);
  } catch (error) {
    console.error("[Email] Failed to send order confirmation:", error);
    // Don't block the flow if email fails
  }
}

export async function sendOrderDeliveredEmail(
  userId: string,
  userName: string,
  orderId: string,
) {
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const viewOrderLink = `${origin}/account/orders/${orderId}`;

    const content = getOrderDeliveredTemplate(userName, orderId, viewOrderLink);

    await messagingServer.createEmail(
      ID.unique(),
      SUBJECT_ORDER_DELIVERED,
      content,
      [],
      [userId],
      [],
      [],
      [],
      [],
      false,
      true,
    );
    console.log(`[Email] Delivery notification sent to user ${userId}`);
  } catch (error) {
    console.error("[Email] Failed to send delivery notification:", error);
  }
}
