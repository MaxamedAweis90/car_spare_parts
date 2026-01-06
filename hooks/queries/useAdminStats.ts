import { useQuery } from "@tanstack/react-query";

export interface AdminStats {
  users: { total: number; active: number; inactive: number };
  sellers: {
    total: number;
    active: number;
    inactive: number;
    pendingApproval: number;
  };
  visitors: { year: number; week: number; day: number };
  generatedAt: string;
}

async function fetchAdminStats() {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to fetch admin dashboard stats");
  return (await res.json()) as AdminStats;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 mins
  });
}
