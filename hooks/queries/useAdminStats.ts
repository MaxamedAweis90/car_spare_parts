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
  revenueHistory: { date: string; revenue: number; count: number }[];
  pendingAdmins: { name: string; email: string }[];
  activities: {
    id: string;
    adminName: string;
    action: string;
    targetName?: string;
    details?: string;
    createdAt: string;
  }[];
  generatedAt: string;
}

async function fetchAdminStats() {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to fetch admin dashboard stats");
  const data = await res.json();
  return data as AdminStats;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
    staleTime: 2 * 60 * 1000, // 2 minutes (override global 5 min for fresher stats)
    refetchInterval: 60000, // Auto-refresh every 60 seconds (reduced from 30s)
    refetchOnWindowFocus: true, // Refresh when admin returns to tab
    placeholderData: (previousData) => previousData, // Show old data while refetching
  });
}
