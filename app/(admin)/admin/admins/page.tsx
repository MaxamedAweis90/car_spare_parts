"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CreateUserForm from "@/components/forms/CreateUserForm";
import { useSession } from "@/lib/auth/useSession";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import { deleteUser, getUsers, updateUser } from "@/services/users";

type ScreenKey = "create" | "list";

type AdminUser = {
  $id: string;
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
};

export default function AdminAdminsPage() {
  const { profile } = useSession();
  const router = useRouter();
  const [screen, setScreen] = useState<ScreenKey>("create");
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [mainAdmin, setMainAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const mainAdminId = (process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID || "").trim();
  const isMainAdmin = profile?.role === "main_admin" || (Boolean(mainAdminId) && profile?.$id === mainAdminId);

  useEffect(() => {
    if (!profile) return;
    if (!isMainAdmin) {
      router.replace("/admin");
    }
  }, [isMainAdmin, profile, router]);

  const loadAdmins = async () => {
    setLoading(true);
    setMessage("");
    try {
      const [adminsRes, mainRes] = await Promise.all([
        getUsers({ role: "admin" }),
        getUsers({ role: "main_admin" }),
      ]);
      const main = (mainRes?.documents || [])[0] || null;
      setMainAdmin(main);
      setAdmins(adminsRes?.documents || []);
      setEditingId(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to load admins";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isMainAdmin) return;
    if (screen !== "list") return;
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMainAdmin, screen]);

  const sortedAdmins = useMemo(() => {
    return [...admins].sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });
  }, [admins]);

  const startEdit = (u: AdminUser) => {
    setEditingId(u.$id);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setMessage("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  };

  const saveEdit = async (userId: string) => {
    if (!profile?.$id) return;
    setBusyUserId(userId);
    setMessage("");
    try {
      const res = await updateUser({ userId, updaterId: profile.$id, name: editName.trim(), email: editEmail.trim() });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setAdmins((prev) => prev.map((u) => (u.$id === userId ? { ...u, name: res?.name ?? u.name, email: res?.email ?? u.email } : u)));
      cancelEdit();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update admin";
      setMessage(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  const toggleActive = async (u: AdminUser) => {
    if (!profile?.$id) return;
    setBusyUserId(u.$id);
    setMessage("");
    try {
      const res = await updateUser({ userId: u.$id, updaterId: profile.$id, isActive: u.isActive === false });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setAdmins((prev) => prev.map((x) => (x.$id === u.$id ? { ...x, isActive: res?.isActive ?? !(u.isActive === false) } : x)));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update status";
      setMessage(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  const removeAdmin = async (u: AdminUser) => {
    if (!profile?.$id) return;
    const ok = window.confirm(`Delete admin "${u.name || u.email || u.$id}"? This cannot be undone.`);
    if (!ok) return;

    setBusyUserId(u.$id);
    setMessage("");
    try {
      const res = await deleteUser({ userId: u.$id, deleterId: profile.$id });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setAdmins((prev) => prev.filter((x) => x.$id !== u.$id));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete admin";
      setMessage(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  if (!isMainAdmin) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Admin accounts</h1>
          <p className="mt-1 text-sm text-slate-600">Main admin only.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Admin accounts</h1>
        <p className="mt-1 text-sm text-slate-600">Only the main admin can create and review admin accounts.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setScreen("create")}
            className={
              "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition " +
              (screen === "create" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")
            }
          >
            Create admin
          </button>
          <button
            type="button"
            onClick={() => setScreen("list")}
            className={
              "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition " +
              (screen === "list" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")
            }
          >
            Admin list
          </button>
        </div>
      </div>

      {screen === "create" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {profile?.$id ? (
            <CreateUserForm currentUserId={profile.$id} />
          ) : (
            <p className="text-sm text-slate-600">Loading current admin...</p>
          )}
        </div>
      )}

      {screen === "list" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-700">Admins</h2>
            <button
              type="button"
              onClick={loadAdmins}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {mainAdmin && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-amber-700">MAIN ADMIN</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{mainAdmin.name || "—"}</p>
                  <p className="text-sm text-slate-700">{mainAdmin.email || "—"}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-800">
                  <EmojiEventsOutlinedIcon fontSize="inherit" />
                  Crown
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">This account is unique and can manage all admin accounts.</p>
            </div>
          )}

          {sortedAdmins.length === 0 && !loading && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">No admins found.</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {sortedAdmins.map((u) => (
                  <tr key={u.$id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 font-semibold">
                      {editingId === u.$id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                          placeholder="Name"
                        />
                      ) : (
                        u.name || "—"
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {editingId === u.$id ? (
                        <input
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full min-w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      ) : (
                        u.email || "—"
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">admin</span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " + (u.isActive === false ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
                        {u.isActive === false ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>

                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        {editingId === u.$id ? (
                          <>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                              placeholder="Name"
                            />
                            <button
                              type="button"
                              onClick={() => saveEdit(u.$id)}
                              disabled={busyUserId === u.$id}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                            >
                              {busyUserId === u.$id ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={busyUserId === u.$id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(u)}
                              disabled={busyUserId === u.$id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleActive(u)}
                              disabled={busyUserId === u.$id}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {u.isActive === false ? "Activate" : "Deactivate"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAdmin(u)}
                              disabled={busyUserId === u.$id}
                              className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {message && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-700">{message}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

