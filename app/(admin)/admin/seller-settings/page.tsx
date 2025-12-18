"use client";

import { useMemo, useState } from "react";

type SellerRecord = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  totalOrders: number;
  lastOrder: string;
};

const initialSellers: SellerRecord[] = [
  {
    id: "sel-1001",
    name: "Aisha Malik",
    email: "aisha.malik@example.com",
    active: true,
    totalOrders: 184,
    lastOrder: "2024-02-18",
  },
  {
    id: "sel-1002",
    name: "Diego Ramirez",
    email: "diego.ramirez@example.com",
    active: true,
    totalOrders: 96,
    lastOrder: "2024-02-17",
  },
  {
    id: "sel-1003",
    name: "Saanvi Patel",
    email: "saanvi.patel@example.com",
    active: false,
    totalOrders: 41,
    lastOrder: "2024-02-05",
  },
  {
    id: "sel-1004",
    name: "Noah Andersen",
    email: "noah.andersen@example.com",
    active: true,
    totalOrders: 223,
    lastOrder: "2024-02-19",
  },
  {
    id: "sel-1005",
    name: "Maya Chen",
    email: "maya.chen@example.com",
    active: false,
    totalOrders: 12,
    lastOrder: "2024-01-29",
  },
];

export default function SellerRoleSettingsPage() {
  const [sellers, setSellers] = useState(initialSellers);
  const [message, setMessage] = useState<string | null>(null);

  const { activeCount, inactiveCount } = useMemo(() => {
    const active = sellers.filter((seller) => seller.active).length;
    const inactive = sellers.length - active;
    return { activeCount: active, inactiveCount: inactive };
  }, [sellers]);

  const toggleSellerStatus = (id: string) => {
    setSellers((existing) => {
      const nextSellers = existing.map((seller) =>
        seller.id === id ? { ...seller, active: !seller.active } : seller,
      );

      const updatedSeller = nextSellers.find((seller) => seller.id === id);
      if (updatedSeller) {
        setMessage(
          `${updatedSeller.name} ${updatedSeller.active ? "activated" : "deactivated"}.`,
        );
      }

      return nextSellers;
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Seller role settings</h1>
        <p className="text-sm text-slate-600">
          Enable or disable access to seller tools for each account. Changes sync with the permissions service when connected to the API.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-blue-600">Total sellers</p>
          <p className="mt-1 text-2xl font-semibold">{sellers.length}</p>
          <p className="text-xs text-slate-500">Accounts with seller role</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-600">Active sellers</p>
          <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
          <p className="text-xs text-slate-500">Currently live in the marketplace</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-amber-600">Inactive sellers</p>
          <p className="mt-1 text-2xl font-semibold">{inactiveCount}</p>
          <p className="text-xs text-slate-500">Awaiting reactivation</p>
        </div>
      </section>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Seller roster</h2>
            <p className="text-sm text-slate-600">Toggle their live access status in one place.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Mock data for prototype use
          </span>
        </div>

        <ul className="divide-y divide-slate-200">
          {sellers.map((seller) => (
            <li key={seller.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{seller.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      seller.active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {seller.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{seller.email}</p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>Total orders: {seller.totalOrders}</span>
                  <span>Last order: {seller.lastOrder}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => toggleSellerStatus(seller.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    seller.active
                      ? "bg-slate-900 text-white hover:bg-slate-700"
                      : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {seller.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
