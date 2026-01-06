import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderDocument, OrderItem } from "@/lib/types/order";

interface UseOrdersParams {
  sellerId?: string;
  customerId?: string;
}

async function fetchOrders(params: UseOrdersParams) {
  const searchParams = new URLSearchParams();
  if (params.sellerId) searchParams.set("sellerId", params.sellerId);
  if (params.customerId) searchParams.set("customerId", params.customerId);

  const res = await fetch(`/api/orders?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }
  const data = await res.json();
  return data.orders as OrderDocument[];
}

export function useOrders(params: UseOrdersParams) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: async () => {
      const orders = await fetchOrders(params);
      // Parse items and address
      return orders.map((order) => ({
        ...order,
        parsedItems: order.items.map((item) => JSON.parse(item) as OrderItem),
        parsedShippingAddress: tryParse(order.shippingAddress),
      }));
    },
  });
}

function tryParse(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      status,
    }: {
      orderId: string;
      status: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error("Failed to update order");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
