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
  appwriteUserId?: string;
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

  const envMainIdsString = (
    process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID || ""
  ).trim();

  const mainAdminIds = useMemo(() => {
    return envMainIdsString
      .split(",")
      .map((id) => id.trim().replace(/^["'](.+)["']$/, "$1"))
      .filter(Boolean);
  }, [envMainIdsString]);

  const isMainAdmin = useMemo(() => {
    if (!profile) return false;
    return (
      profile.role === "main_admin" ||
      (mainAdminIds.length > 0 &&
        (mainAdminIds.includes(profile.$id) ||
          (profile.appwriteUserId &&
            mainAdminIds.includes(profile.appwriteUserId))))
    );
  }, [profile, mainAdminIds]);

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
      const fetchedAdmins = (adminsRes?.documents || []) as AdminUser[];
      const fetchedMain = (mainRes?.documents || []) as AdminUser[];

      const allFetched = [...fetchedAdmins, ...fetchedMain];
      // Deduplicate by $id
      const uniqueMap = new Map<string, AdminUser>();
      allFetched.forEach((a) => uniqueMap.set(a.$id, a));
      const uniqueList = Array.from(uniqueMap.values());

      // Identify main admin: ID matches any in env OR role is 'main_admin'
      let finalMain =
        uniqueList.find(
          (a) =>
            a.role === "main_admin" ||
            (mainAdminIds.length > 0 &&
              (mainAdminIds.includes(a.$id) ||
                (a.appwriteUserId && mainAdminIds.includes(a.appwriteUserId)))),
        ) || null;

      // Regular admins are everyone else
      const others = uniqueList.filter((a) => a.$id !== finalMain?.$id);

      setMainAdmin(finalMain);
      setAdmins(others);
      setEditingId(null);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to load admins";
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
    // Filter out the main admin from the regular admin list
    const regularAdmins = admins.filter((admin) => {
      const isThisMain =
        admin.$id === mainAdmin?.$id ||
        (mainAdminIds.length > 0 &&
          (mainAdminIds.includes(admin.$id) ||
            (admin.appwriteUserId &&
              mainAdminIds.includes(admin.appwriteUserId))));
      return !isThisMain;
    });

    return regularAdmins.sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bTime - aTime;
    });
  }, [admins, mainAdmin, mainAdminIds]);

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
      const res = await updateUser({
        userId,
        updaterId: profile.$id,
        name: editName.trim(),
        email: editEmail.trim(),
      });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setAdmins((prev) =>
        prev.map((u) =>
          u.$id === userId
            ? { ...u, name: res?.name ?? u.name, email: res?.email ?? u.email }
            : u,
        ),
      );
      cancelEdit();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update admin";
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
      const res = await updateUser({
        userId: u.$id,
        updaterId: profile.$id,
        isActive: u.isActive === false,
      });
      if (res?.error) {
        setMessage(res.error);
        return;
      }
      setAdmins((prev) =>
        prev.map((x) =>
          x.$id === u.$id
            ? { ...x, isActive: res?.isActive ?? !(u.isActive === false) }
            : x,
        ),
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update status";
      setMessage(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  const removeAdmin = async (u: AdminUser) => {
    if (!profile?.$id) return;
    const ok = window.confirm(
      `Delete admin "${u.name || u.email || u.$id}"? This cannot be undone.`,
    );
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
      const msg =
        error instanceof Error ? error.message : "Failed to delete admin";
      setMessage(msg);
    } finally {
      setBusyUserId(null);
    }
  };

  if (!isMainAdmin) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Admin accounts
          </h1>
          <p className="mt-1 text-sm text-slate-600">Main admin only.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Admin accounts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Only the main admin can create and review admin accounts.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setScreen("create")}
            className={
              "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition " +
              (screen === "create"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100")
            }
          >
            Create admin
          </button>
          <button
            type="button"
            onClick={() => setScreen("list")}
            className={
              "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition " +
              (screen === "list"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100")
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
        <div className="space-y-4">
          {/* Main Admin - Prominent Display */}
          {mainAdmin && (
            <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-6 shadow-lg">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-md">
                    <EmojiEventsOutlinedIcon
                      className="text-white"
                      sx={{ fontSize: 32 }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                        <i className="fa-solid fa-crown"></i>
                        Main Administrator
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {mainAdmin.name || "—"}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {mainAdmin.email || "—"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Created:{" "}
                      {mainAdmin.createdAt
                        ? new Date(mainAdmin.createdAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Active
                  </span>
                  <p className="text-xs font-semibold text-amber-700">
                    <i className="fa-solid fa-shield-halved mr-1"></i>
                    Protected Account
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-white/60 p-3 backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-600">
                  <i className="fa-solid fa-info-circle mr-1 text-amber-600"></i>
                  This account has full administrative privileges and cannot be
                  deleted or deactivated.
                </p>
              </div>
            </div>
          )}

          {/* Regular Admins List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Regular Admins
              </h2>
              <button
                type="button"
                onClick={loadAdmins}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {sortedAdmins.length === 0 && !loading && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">No admins found.</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {sortedAdmins.map((u) => (
                    <tr key={u.$id} className="hover:bg-slate-50 transition">
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
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          admin
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold " +
                            (u.isActive === false
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200")
                          }
                        >
                          <span
                            className={
                              "h-1.5 w-1.5 rounded-full " +
                              (u.isActive === false
                                ? "bg-amber-500"
                                : "bg-emerald-500")
                            }
                          ></span>
                          {u.isActive === false
                            ? "Pending Activation"
                            : "Active"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
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
                                {u.isActive === false
                                  ? "Activate"
                                  : "Deactivate"}
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
        </div>
      )}
    </section>
  );
}
