import type { Models } from "appwrite";

export interface OrderItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image: string | null;
  imageUrl?: string | null;
  sellerId: string;
}

/**
 * Complete order status enum covering all workflow states
 */
export type OrderStatus =
  | "pending_verification" // Customer submitted, awaiting seller verification
  | "awaiting_payment" // Seller verified/created, waiting for payment
  | "paid" // Payment confirmed
  | "approved_for_fulfillment" // Seller approved for shipment after payment
  | "packing" // Seller is packing the order
  | "shipped" // Order dispatched
  | "delivered" // Order delivered to customer
  | "cancelled" // Cancelled by seller or customer
  | "rejected" // Seller rejected during verification
  // Legacy statuses (for backward compatibility)
  | "pending" // Old status, maps to pending_verification
  | "completed"; // Old status, maps to delivered

/**
 * Payment details structure (stored as compact JSON string)
 */
export interface PaymentDetails {
  m?: string; // method: "cash" | "mobile_money" | "stripe" | "evc_plus" | "edahab" | "card"
  ph?: string; // phone number (for mobile money)
  u?: string; // Stripe Checkout URL
  si?: string; // Stripe Session ID
  pi?: string; // Stripe Payment Intent ID
  ps?: "pending" | "paid" | "failed" | "refunded"; // payment status
}

export interface OrderDocument extends Models.Document {
  customerId: string;
  items: string[]; // JSON strings (array of OrderItem serialized)
  totalPrice: number;
  status: OrderStatus;
  shippingAddress: string; // JSON string or plain text
  paymentMethod: string;
  paymentDetails?: string | null; // Compact JSON string (PaymentDetails)
  sellerId?: string | null; // Seller who created/manages this order
  verificationNotes?: string | null; // Seller notes during verification
  createdAt: string; // ISO datetime (custom field, not $createdAt)

  // Computed on client
  parsedItems?: OrderItem[];
  parsedShippingAddress?: any;
  parsedPaymentDetails?: PaymentDetails;
}
