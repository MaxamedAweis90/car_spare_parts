"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth/useSession";
import { getUsers, updateUser } from "@/services/users";

type SellerRecord = {
  $id: string;
  name?: string;
  email?: string;
  isActive?: boolean;
  sellerApproved?: boolean;
  createdAt?: string;
};

export default function SellerRoleSettingsPage() {
  const { profile } = useSession();
  const [sellers, setSellers] = useState<SellerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSellers = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await getUsers({ role: "seller" });
      const docs: SellerRecord[] = Array.isArray(res?.documents) ? res.documents : [];
      setSellers(docs);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load sellers";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { activeCount, inactiveCount } = useMemo(() => {
    const active = sellers.filter((seller) => seller.isActive !== false).length;
    const inactive = sellers.length - active;
    return { activeCount: active, inactiveCount: inactive };
  }, [sellers]);

  const pendingApprovalCount = useMemo(() => {
    return sellers.filter((seller) => seller.sellerApproved === false).length;
  }, [sellers]);

  const setSellerActive = async (seller: SellerRecord, nextActive: boolean) => {
    if (!profile?.$id) {
      setMessage("Missing admin profile; please re-login.");
      return;
    }
    setMessage(null);
    try {
      const res = await updateUser({ userId: seller.$id, updaterId: profile.$id, isActive: nextActive });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setSellers((prev) => prev.map((s) => (s.$id === seller.$id ? { ...s, isActive: nextActive } : s)));
      setMessage(`${seller.name || seller.email || "Seller"} ${nextActive ? "activated" : "deactivated"}.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update seller";
      setMessage(msg);
    }
  };

  const approveSeller = async (seller: SellerRecord) => {
    if (!profile?.$id) {
      setMessage("Missing admin profile; please re-login.");
      return;
    }
    setMessage(null);
    try {
      const res = await updateUser({ userId: seller.$id, updaterId: profile.$id, sellerApproved: true });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setSellers((prev) => prev.map((s) => (s.$id === seller.$id ? { ...s, sellerApproved: true } : s)));
      setMessage(`${seller.name || seller.email || "Seller"} approved.`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to approve seller";
      setMessage(msg);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Seller role settings</h1>
        <p className="text-sm text-slate-600">
          Manage seller access and approvals. This page loads real seller accounts from Appwrite.
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
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-3">
          <p className="text-xs uppercase tracking-wide text-slate-600">Pending approvals</p>
          <p className="mt-1 text-2xl font-semibold">{pendingApprovalCount}</p>
          <p className="text-xs text-slate-500">Sellers that cannot access the seller console yet</p>
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
          <button
            type="button"
            onClick={loadSellers}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <ul className="divide-y divide-slate-200">
          {sellers.map((seller) => (
            <li key={seller.$id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{seller.name || "—"}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      seller.isActive !== false
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {seller.isActive !== false ? "Active" : "Inactive"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      seller.sellerApproved === false ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {seller.sellerApproved === false ? "Pending" : "Approved"}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{seller.email || "—"}</p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                {seller.sellerApproved === false && (
                  <button
                    type="button"
                    onClick={() => approveSeller(seller)}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    Approve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSellerActive(seller, seller.isActive === false)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    seller.isActive !== false
                      ? "bg-slate-900 text-white hover:bg-slate-700"
                      : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {seller.isActive !== false ? "Deactivate" : "Activate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

