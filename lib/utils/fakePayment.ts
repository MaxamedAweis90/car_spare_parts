/**
 * Fake Payment Processing Utilities
 *
 * Simulates payment gateway behavior for development/testing.
 * Designed to be easily replaced with real payment API calls.
 */

import type { PaymentRequest, PaymentResponse } from "@/lib/types/payment";

/**
 * Simulate payment processing delay (like real payment gateway)
 */
async function simulateProcessingDelay(ms: number = 2000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate phone number format (Somalia)
 */
export function validateSomaliaPhone(phone: string): boolean {
  // Somalia phone format: 252XXXXXXXXX or 0XXXXXXXXX
  const cleaned = phone.replace(/\s+/g, "");
  return /^(252|0)[0-9]{9}$/.test(cleaned);
}

/**
 * Validate card number (Luhn algorithm)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\s+/g, "");

  if (!/^\d{13,19}$/.test(cleaned)) return false;

  // Luhn algorithm
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Get card brand from card number
 */
export function getCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s+/g, "");

  if (/^4/.test(cleaned)) return "visa";
  if (/^5[1-5]/.test(cleaned)) return "mastercard";
  if (/^3[47]/.test(cleaned)) return "amex";

  return "unknown";
}

/**
 * Mask card number (show only last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s+/g, "");
  const last4 = cleaned.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Mask phone number (show only last 4 digits)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s+/g, "");
  const last4 = cleaned.slice(-4);
  return `***-***-${last4}`;
}

/**
 * Simulate EVC Plus payment
 */
export async function simulateEVCPlusPayment(
  phoneNumber: string,
  amount: number,
): Promise<{ success: boolean; message: string; transactionId: string }> {
  console.log(`[FAKE PAYMENT] EVC Plus: ${phoneNumber} - $${amount}`);

  // Validate phone
  if (!validateSomaliaPhone(phoneNumber)) {
    return {
      success: false,
      message: "Invalid phone number format",
      transactionId: "",
    };
  }

  // Simulate processing delay
  await simulateProcessingDelay(2000);

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  if (success) {
    const transactionId = `EVC${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return {
      success: true,
      message: "Payment successful",
      transactionId,
    };
  } else {
    return {
      success: false,
      message: "Insufficient balance or payment declined",
      transactionId: "",
    };
  }
}

/**
 * Simulate eDahab payment
 */
export async function simulateEdahabPayment(
  phoneNumber: string,
  amount: number,
): Promise<{ success: boolean; message: string; transactionId: string }> {
  console.log(`[FAKE PAYMENT] eDahab: ${phoneNumber} - $${amount}`);

  // Validate phone
  if (!validateSomaliaPhone(phoneNumber)) {
    return {
      success: false,
      message: "Invalid phone number format",
      transactionId: "",
    };
  }

  // Simulate processing delay
  await simulateProcessingDelay(2500);

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  if (success) {
    const transactionId = `EDH${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return {
      success: true,
      message: "Payment successful",
      transactionId,
    };
  } else {
    return {
      success: false,
      message: "Payment declined or network error",
      transactionId: "",
    };
  }
}

/**
 * Simulate card payment
 */
export async function simulateCardPayment(
  cardNumber: string,
  cardExpiry: string,
  cardCvv: string,
  amount: number,
): Promise<{ success: boolean; message: string; transactionId: string }> {
  console.log(
    `[FAKE PAYMENT] Card: ${maskCardNumber(cardNumber)} - $${amount}`,
  );

  // Validate card number
  if (!validateCardNumber(cardNumber)) {
    return {
      success: false,
      message: "Invalid card number",
      transactionId: "",
    };
  }

  // Validate expiry (basic check)
  if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
    return {
      success: false,
      message: "Invalid expiry date format (MM/YY)",
      transactionId: "",
    };
  }

  // Validate CVV
  if (!/^\d{3,4}$/.test(cardCvv)) {
    return {
      success: false,
      message: "Invalid CVV",
      transactionId: "",
    };
  }

  // Simulate processing delay
  await simulateProcessingDelay(3000);

  // Simulate 90% success rate (cards have slightly higher failure rate)
  const success = Math.random() > 0.1;

  if (success) {
    const transactionId = `CARD${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    return {
      success: true,
      message: "Payment successful",
      transactionId,
    };
  } else {
    return {
      success: false,
      message: "Card declined - insufficient funds or invalid card",
      transactionId: "",
    };
  }
}

/**
 * Process fake payment (main entry point)
 *
 * This function will be replaced with real payment gateway API calls
 * when Sifalo Pay or other API is integrated.
 */
export async function processFakePayment(
  request: PaymentRequest,
): Promise<PaymentResponse> {
  const { amount, paymentMethodInput } = request;

  if (!paymentMethodInput) {
    return {
      success: false,
      transactionId: "",
      status: "failed",
      message: "Payment method required",
      isFake: true,
    };
  }

  try {
    let result: { success: boolean; message: string; transactionId: string };

    switch (paymentMethodInput.type) {
      case "evc_plus":
        if (!paymentMethodInput.phoneNumber) {
          throw new Error("Phone number required for EVC Plus");
        }
        result = await simulateEVCPlusPayment(
          paymentMethodInput.phoneNumber,
          amount,
        );
        break;

      case "edahab":
        if (!paymentMethodInput.phoneNumber) {
          throw new Error("Phone number required for eDahab");
        }
        result = await simulateEdahabPayment(
          paymentMethodInput.phoneNumber,
          amount,
        );
        break;

      case "card":
        if (
          !paymentMethodInput.cardNumber ||
          !paymentMethodInput.cardExpiry ||
          !paymentMethodInput.cardCvv
        ) {
          throw new Error("Card details required");
        }
        result = await simulateCardPayment(
          paymentMethodInput.cardNumber,
          paymentMethodInput.cardExpiry,
          paymentMethodInput.cardCvv,
          amount,
        );
        break;

      default:
        throw new Error("Invalid payment method type");
    }

    return {
      success: result.success,
      transactionId: result.transactionId,
      status: result.success ? "completed" : "failed",
      message: result.message,
      isFake: true,
      simulatedDelay: 2000,
    };
  } catch (error: any) {
    return {
      success: false,
      transactionId: "",
      status: "failed",
      message: error.message || "Payment processing failed",
      isFake: true,
    };
  }
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Get payment method display name
 */
export function getPaymentMethodDisplayName(type: string): string {
  const names: Record<string, string> = {
    evc_plus: "EVC Plus (Hormuud)",
    edahab: "eDahab (Telesom)",
    card: "Credit/Debit Card",
    cash: "Cash on Delivery",
  };
  return names[type] || type;
}
