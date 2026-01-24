/**
 * Payment Details Utilities
 *
 * Helper functions for working with compact JSON payment details
 * stored in the 255-character paymentDetails field.
 */

import type { PaymentDetails } from "@/lib/types/order";

/**
 * Parse payment details JSON string
 *
 * @param paymentDetailsStr - JSON string from database
 * @returns Parsed PaymentDetails object or empty object if invalid
 */
export function parsePaymentDetails(
  paymentDetailsStr?: string | null,
): PaymentDetails {
  if (!paymentDetailsStr) return {};

  try {
    return JSON.parse(paymentDetailsStr) as PaymentDetails;
  } catch (error) {
    console.error("Failed to parse payment details:", error);
    return {};
  }
}

/**
 * Serialize payment details to compact JSON string
 *
 * @param details - PaymentDetails object
 * @returns Compact JSON string (optimized for 255-char limit)
 */
export function serializePaymentDetails(details: PaymentDetails): string {
  // Remove undefined/null values to save space
  const cleaned = Object.fromEntries(
    Object.entries(details).filter(([_, v]) => v != null),
  );

  return JSON.stringify(cleaned);
}

/**
 * Update payment details with new values
 * Merges with existing details
 *
 * @param existingStr - Current payment details JSON string
 * @param updates - New values to merge
 * @returns Updated JSON string
 */
export function updatePaymentDetails(
  existingStr: string | null | undefined,
  updates: Partial<PaymentDetails>,
): string {
  const existing = parsePaymentDetails(existingStr);
  const merged = { ...existing, ...updates };
  return serializePaymentDetails(merged);
}

/**
 * Create payment details for cash payment
 *
 * @returns PaymentDetails object
 */
export function createCashPaymentDetails(): PaymentDetails {
  return {
    m: "cash",
    ps: "pending",
  };
}

/**
 * Create payment details for mobile money payment
 *
 * @param phoneNumber - Customer phone number
 * @param method - "evc_plus" or "edahab"
 * @returns PaymentDetails object
 */
export function createMobileMoneyPaymentDetails(
  phoneNumber: string,
  method: "evc_plus" | "edahab",
): PaymentDetails {
  return {
    m: method,
    ph: phoneNumber,
    ps: "pending",
  };
}

/**
 * Create payment details for Stripe payment
 *
 * @param checkoutUrl - Stripe Checkout Session URL
 * @param sessionId - Stripe Session ID
 * @returns PaymentDetails object
 */
export function createStripePaymentDetails(
  checkoutUrl: string,
  sessionId: string,
): PaymentDetails {
  return {
    m: "stripe",
    u: checkoutUrl,
    si: sessionId,
    ps: "pending",
  };
}

/**
 * Update payment details with Stripe payment confirmation
 *
 * @param existingStr - Current payment details JSON string
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns Updated JSON string
 */
export function confirmStripePayment(
  existingStr: string | null | undefined,
  paymentIntentId: string,
): string {
  return updatePaymentDetails(existingStr, {
    pi: paymentIntentId,
    ps: "paid",
  });
}

/**
 * Check if order has a Stripe payment link
 *
 * @param paymentDetailsStr - Payment details JSON string
 * @returns true if Stripe URL exists
 */
export function hasStripePaymentLink(
  paymentDetailsStr?: string | null,
): boolean {
  const details = parsePaymentDetails(paymentDetailsStr);
  return !!details.u && details.m === "stripe";
}

/**
 * Get Stripe payment link URL
 *
 * @param paymentDetailsStr - Payment details JSON string
 * @returns Stripe URL or null
 */
export function getStripePaymentLink(
  paymentDetailsStr?: string | null,
): string | null {
  const details = parsePaymentDetails(paymentDetailsStr);
  return details.u || null;
}

/**
 * Get payment status from details
 *
 * @param paymentDetailsStr - Payment details JSON string
 * @returns Payment status or "unknown"
 */
export function getPaymentStatus(
  paymentDetailsStr?: string | null,
): "pending" | "paid" | "failed" | "refunded" | "unknown" {
  const details = parsePaymentDetails(paymentDetailsStr);
  return details.ps || "unknown";
}

/**
 * Validate payment details size (must fit in 255 chars)
 *
 * @param details - PaymentDetails object
 * @returns true if valid, false if too large
 */
export function validatePaymentDetailsSize(details: PaymentDetails): boolean {
  const serialized = serializePaymentDetails(details);
  return serialized.length <= 255;
}
