/**
 * Order Status Transition Validation
 *
 * Enforces the order workflow state machine to prevent invalid status changes.
 * This is the single source of truth for allowed transitions.
 */

import type { OrderStatus } from "@/lib/types/order";

/**
 * Defines all allowed status transitions
 * Key = current status, Value = array of allowed next statuses
 */
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  // Customer self-service flow
  pending_verification: ["awaiting_payment", "rejected", "cancelled"],

  // Seller-assisted flow starts here
  awaiting_payment: ["paid", "cancelled"],

  // Post-payment fulfillment flow
  paid: ["approved_for_fulfillment", "cancelled"],
  approved_for_fulfillment: ["packing", "cancelled"],
  packing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],

  // Terminal states (no transitions allowed)
  delivered: [],
  cancelled: [],
  rejected: [],

  // Legacy status mappings (for backward compatibility)
  pending: ["awaiting_payment", "rejected", "cancelled"], // Treat as pending_verification
  completed: [], // Treat as delivered (terminal)
};

/**
 * User roles that can trigger status transitions
 */
export type UserRole = "customer" | "seller" | "admin" | "main_admin";

/**
 * Check if a status transition is valid based on current status and user role
 *
 * @param currentStatus - Current order status
 * @param newStatus - Desired new status
 * @param userRole - Role of user attempting the transition
 * @returns true if transition is allowed, false otherwise
 */
// Define the logical progression of order (for reference and sorting)
export const STATUS_FLOW: OrderStatus[] = [
  "pending_verification",
  "awaiting_payment",
  "paid",
  "approved_for_fulfillment",
  "packing",
  "shipped",
  "delivered",
];

export function isValidStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  userRole: UserRole,
): boolean {
  // Admins can force any transition
  if (userRole === "admin" || userRole === "main_admin") {
    return true;
  }

  // Customers: Strict rules (cancellation only)
  if (userRole === "customer") {
    return (
      newStatus === "cancelled" &&
      ["pending_verification", "awaiting_payment"].includes(currentStatus)
    );
  }

  // Sellers: Flexible Workflow
  // Can always cancel or reject
  if (newStatus === "cancelled" || newStatus === "rejected") return true;

  // Can move forward in the flow (jump steps)
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const newIndex = STATUS_FLOW.indexOf(newStatus);

  if (currentIndex !== -1 && newIndex !== -1) {
    return newIndex > currentIndex;
  }

  // Fallback to strict map if status not in flow (e.g. legacy)
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

export function getAllowedNextStatuses(
  currentStatus: OrderStatus,
  userRole: UserRole,
): OrderStatus[] {
  // Admins seeing everything
  if (userRole === "admin" || userRole === "main_admin") {
    const all = [...STATUS_FLOW, "cancelled", "rejected"] as OrderStatus[];
    return all.filter((s) => s !== currentStatus);
  }

  // Customers
  if (userRole === "customer") {
    if (["pending_verification", "awaiting_payment"].includes(currentStatus)) {
      return ["cancelled"];
    }
    return [];
  }

  // Sellers
  // Return all "future" states + cancel/reject
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  const actions: OrderStatus[] = [];

  if (currentIndex !== -1) {
    // Add all future steps
    for (let i = currentIndex + 1; i < STATUS_FLOW.length; i++) {
      actions.push(STATUS_FLOW[i]);
    }
  } else {
    // Fallback for interactions with legacy/unknown statuses
    const allowed = STATUS_TRANSITIONS[currentStatus] || [];
    allowed.forEach((s) => {
      if (!actions.includes(s)) actions.push(s);
    });
  }

  // Always allow cancel/reject (unless already terminal)
  if (
    !["delivered", "cancelled", "rejected", "completed"].includes(currentStatus)
  ) {
    if (!actions.includes("cancelled")) actions.push("cancelled");
    if (
      currentStatus === "pending_verification" &&
      !actions.includes("rejected")
    ) {
      actions.push("rejected");
    }
  }

  return actions;
}

/**
 * Get human-readable status label
 *
 * @param status - Order status
 * @returns Display label for UI
 */
export function getStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    pending_verification: "Needs Verification",
    awaiting_payment: "Awaiting Payment",
    paid: "Paid",
    approved_for_fulfillment: "Approved for Fulfillment",
    packing: "Packing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
    pending: "Pending", // Legacy
    completed: "Completed", // Legacy
  };
  return labels[status] || status;
}

/**
 * Get status color for UI display (Ant Design color scheme)
 *
 * @param status - Order status
 * @returns Color name for Tag/Chip component
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    pending_verification: "orange",
    awaiting_payment: "blue",
    paid: "cyan",
    approved_for_fulfillment: "green",
    packing: "purple",
    shipped: "geekblue",
    delivered: "success",
    cancelled: "default",
    rejected: "error",
    pending: "warning", // Legacy
    completed: "success", // Legacy
  };
  return colors[status] || "default";
}

/**
 * Map legacy status to new status enum
 * Used for migrating existing orders
 *
 * @param legacyStatus - Old status value
 * @returns Mapped new status
 */
export function mapLegacyStatus(legacyStatus: string): OrderStatus {
  const mapping: Record<string, OrderStatus> = {
    pending: "pending_verification",
    paid: "paid",
    shipped: "shipped",
    completed: "delivered",
    cancelled: "cancelled",
  };
  return (mapping[legacyStatus] as OrderStatus) || "pending_verification";
}

/**
 * Check if status is a terminal state (no further transitions)
 *
 * @param status - Order status
 * @returns true if terminal state
 */
export function isTerminalStatus(status: OrderStatus): boolean {
  return ["delivered", "cancelled", "rejected", "completed"].includes(status);
}

/**
 * Get action button label for status transition
 *
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns Button label text
 */
export function getTransitionActionLabel(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): string {
  const labels: Record<string, string> = {
    "pending_verification->awaiting_payment": "Approve Order",
    "pending_verification->rejected": "Reject Order",
    "pending_verification->cancelled": "Cancel Order",
    "awaiting_payment->cancelled": "Cancel Order",
    "paid->approved_for_fulfillment": "Approve for Shipment",
    "paid->cancelled": "Cancel & Refund",
    "approved_for_fulfillment->packing": "Start Packing",
    "packing->shipped": "Mark as Shipped",
    "shipped->delivered": "Mark as Delivered",
  };

  const key = `${fromStatus}->${toStatus}`;
  return labels[key] || `Change to ${getStatusLabel(toStatus)}`;
}
