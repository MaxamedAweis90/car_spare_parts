"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type DashboardStats = {
  users: { total: number; active: number; inactive: number };
  sellers: { total: number; active: number; inactive: number; pendingApproval: number };
  visitors: { year: number; week: number; day: number };
  generatedAt: string;
};

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", { method: "GET" });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Failed to load dashboard stats");
      }
      setStats(body);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load dashboard stats";
      setMessage(message);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    {
      label: "Total users",
      value: stats?.users.total,
      sub: stats ? `${stats.users.active} active • ${stats.users.inactive} inactive` : "—",
    },
    {
      label: "Total sellers",
      value: stats?.sellers.total,
      sub: stats ? `${stats.sellers.active} active • ${stats.sellers.inactive} inactive` : "—",
    },
    {
      label: "Sellers pending",
      value: stats?.sellers.pendingApproval,
      sub: "Awaiting approval",
    },
    {
      label: "Visitors / year",
      value: stats?.visitors.year,
      sub: "Based on order volume",
    },
    {
      label: "Visitors / week",
      value: stats?.visitors.week,
      sub: "Based on order volume",
    },
    {
      label: "Visitors / day",
      value: stats?.visitors.day,
      sub: "Based on order volume",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 px-5 py-6 text-white">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-blue-100">ADMIN CONSOLE</p>
              <h1 className="mt-1 text-2xl font-semibold">Dashboard</h1>
              <p className="mt-1 text-sm text-blue-100">
                Oversight, approvals, and system health.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/seller-settings"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Seller settings
              </Link>
              <Link
                href="/admin/catalog"
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Catalog
              </Link>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">System snapshot</h2>
                <p className="text-sm text-slate-600">Core KPIs for users, sellers, and traffic.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  fetchStats();
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={statsLoading}
              >
                {statsLoading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-3xl font-semibold text-slate-900">
                      {statsLoading && stats === null ? "—" : (card.value ?? "—")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{card.sub}</p>
                </div>
              ))}
            </div>

            {stats?.generatedAt && (
              <p className="text-xs text-slate-500">
                Last updated: {new Date(stats.generatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">{message}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
