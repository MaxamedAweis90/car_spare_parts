import { useQuery } from "@tanstack/react-query";

interface SellerStats {
  totalVisits: number;
  bounceRate: number;
  returningUsers: number;
  revenueData: Array<{ date: string; revenue: number }>;
  lastWeekRevenue: Array<{ date: string; revenue: number }>;
  customerStats: {
    newCustomers: number;
    returningCustomers: number;
  };
}

async function fetchSellerStats(sellerId: string) {
  const res = await fetch(`/api/seller/stats?sellerId=${sellerId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch stats");
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch stats");
  }
  return data.stats as SellerStats;
}

export function useSellerStats(sellerId?: string) {
  return useQuery({
    queryKey: ["sellerStats", sellerId],
    queryFn: () => fetchSellerStats(sellerId!),
    enabled: !!sellerId,
  });
}

