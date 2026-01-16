import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

const STATS_KEY = "spareparts-admin-stats";

async function fetchAdminStats() {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to fetch admin dashboard stats");
  const data = await res.json();
  // PERSIST
  if (typeof window !== "undefined") {
    localStorage.setItem(STATS_KEY, JSON.stringify(data));
  }
  return data as AdminStats;
}

export function useAdminStats() {
  const queryClient = useQueryClient();

  // 1. REHYDRATE FROM LOCALSTORAGE ON MOUNT
  useEffect(() => {
    const cached = localStorage.getItem(STATS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        queryClient.setQueryData(["adminStats"], parsed);
      } catch {
        // ignore
      }
    }
  }, [queryClient]);

  return useQuery({
    queryKey: ["adminStats"],
    queryFn: fetchAdminStats,
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 mins
  });
}
