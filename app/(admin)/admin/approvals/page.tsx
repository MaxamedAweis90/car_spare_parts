"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/useSession";
import { getUsers, updateUser } from "@/services/users";

interface UserItem {
  $id: string;
  name: string;
  email: string;
  role: string;
  sellerApproved?: boolean;
}

export default function AdminApprovalsPage() {
  const { profile } = useSession();
  const [pendingSellers, setPendingSellers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await getUsers({ role: "seller", sellerApproved: false });
      setPendingSellers(res?.documents || []);
    } catch {
      setMessage("Failed to load pending sellers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveSeller = async (userId: string) => {
    if (!profile?.$id) return;
    setMessage("");
    try {
      await updateUser({ userId, sellerApproved: true, updaterId: profile.$id });
      setMessage("Seller approved");
      fetchPending();
    } catch {
      setMessage("Failed to approve seller");
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Seller approvals</h1>
        <p className="mt-1 text-sm text-slate-600">Approve sellers to unlock seller console access.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Pending sellers</h2>
          <button
            onClick={fetchPending}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {!loading && pendingSellers.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-700">No pending sellers.</p>
          </div>
        )}

        <div className="space-y-3">
          {pendingSellers.map((u) => (
            <div key={u.$id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-sm text-slate-600">{u.email}</p>
                </div>
                <button
                  onClick={() => approveSeller(u.$id)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm text-slate-700">{message}</p>
          </div>
        )}
      </div>
    </section>
  );
}
