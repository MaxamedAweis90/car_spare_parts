"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CreateUserForm from "@/components/CreateUserForm";
import { useSession } from "@/lib/useSession";
import { getUsers, updateUser } from "@/services/users";

interface UserItem {
  $id: string;
  name: string;
  email: string;
  role: string;
  sellerApproved?: boolean;
}

export default function AdminPage() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-gray-700">Manage admins and approve sellers.</p>
      </div>

      <section className="border rounded p-4 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Seller role settings</h2>
            <p className="text-sm text-gray-600">
              Toggle seller activation when you need to restrict access.
            </p>
          </div>
          <Link
            href="/admin/seller-settings"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Manage sellers
          </Link>
        </div>
      </section>

      <section className="border rounded p-4 bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Create admin or seller</h2>
        {profile?.$id ? (
          <CreateUserForm currentUserId={profile.$id} />
        ) : (
          <p className="text-sm text-gray-600">Loading current admin...</p>
        )}
      </section>

      <section className="border rounded p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Pending sellers</h2>
          <button
            onClick={fetchPending}
            className="text-sm px-3 py-1 border rounded"
          >
            Refresh
          </button>
        </div>
        {loading && <p className="text-sm text-gray-600">Loading...</p>}
        {!loading && pendingSellers.length === 0 && (
          <p className="text-sm text-gray-700">No pending sellers.</p>
        )}
        <div className="space-y-3">
          {pendingSellers.map((u) => (
            <div
              key={u.$id}
              className="flex items-center justify-between border rounded p-2"
            >
              <div>
                <p className="font-medium">{u.name}</p>
                <p className="text-sm text-gray-600">{u.email}</p>
              </div>
              <button
                onClick={() => approveSeller(u.$id)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded"
              >
                Approve
              </button>
            </div>
          ))}
        </div>
        {message && <p className="text-sm text-gray-700 mt-3">{message}</p>}
      </section>
    </div>
  );
}
