import { useMutation } from "@tanstack/react-query";

interface ActivityLogParams {
  action: string; // e.g., "UPDATE_PROFILE", "CREATE_PRODUCT"
  details?: Record<string, any>; // Flexible JSON details
  targetId?: string; // ID of the object being acted on (e.g., productId, userId)
  targetType?: string; // "product", "seller", "order"
}

export function useActivityLog() {
  return useMutation({
    mutationFn: async ({
      action,
      details,
      targetId,
      targetType,
    }: ActivityLogParams) => {
      try {
        await fetch("/api/activities/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            details,
            targetId,
            targetType,
          }),
        });
      } catch (error) {
        // Logging should be silent usually, but good to warn in dev
        console.warn("Failed to log activity:", error);
      }
    },
  });
}
