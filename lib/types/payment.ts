import type { Models } from "appwrite";

/**
 * Payment Methods - Saved customer payment methods
 */
export interface SavedPaymentMethod extends Models.Document {
  userId: string;
  type: "evc_plus" | "edahab" | "card";
  isDefault: boolean;

  // Mobile Money fields
  phoneNumber?: string;
  provider?: "evc_plus" | "edahab";

  // Card fields
  cardLast4?: string;
  cardBrand?: string; // "visa", "mastercard", "amex"
  cardExpiry?: string; // "MM/YY"
  cardholderName?: string;

  // Metadata
  nickname?: string; // e.g., "My EVC Plus", "Work Card"
  createdAt: string;
}

/**
 * Payment Transaction - Records of all payment attempts
 */
export interface PaymentTransaction extends Models.Document {
  orderId: string;
  customerId: string;
  amount: number;
  currency: string; // "USD", "SOS", etc.

  // Payment method used
  paymentMethodId?: string; // Reference to SavedPaymentMethod
  paymentType: "evc_plus" | "edahab" | "card" | "cash";

  // Transaction status
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";

  // Payment gateway details (for future real integration)
  gatewayTransactionId?: string; // External transaction ID from payment gateway
  gatewayResponse?: string; // JSON string of gateway response

  // Fake payment simulation
  isFakePayment: boolean; // true for now, false when using real API
  fakeProcessingDelay?: number; // Simulated delay in ms

  // Timestamps
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;

  // Error handling
  errorMessage?: string;
  errorCode?: string;
}

/**
 * Payment Method Input (for creating new payment methods)
 */
export interface PaymentMethodInput {
  type: "evc_plus" | "edahab" | "card";
  isDefault?: boolean;
  nickname?: string;

  // Mobile Money
  phoneNumber?: string;

  // Card
  cardNumber?: string; // Will be tokenized/encrypted in real implementation
  cardExpiry?: string;
  cardCvv?: string; // Never stored, only used for validation
  cardholderName?: string;
}

/**
 * Payment Request (for initiating payment)
 */
export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string; // Use saved payment method
  paymentMethodInput?: PaymentMethodInput; // Or provide new payment method
}

/**
 * Payment Response
 */
export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;

  // For fake payments
  isFake?: boolean;
  simulatedDelay?: number;
}
