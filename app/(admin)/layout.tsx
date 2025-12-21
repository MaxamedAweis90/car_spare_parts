"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useSession } from "@/lib/useSession";
import { performLogout } from "@/lib/logout";

const allowedRoles = new Set(["main_admin", "admin"]);

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  mainAdminOnly?: boolean;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: "Seller approvals", href: "/admin/approvals", icon: <VerifiedUserOutlinedIcon fontSize="small" /> },
  { label: "Admin accounts", href: "/admin/admins", icon: <AdminPanelSettingsOutlinedIcon fontSize="small" />, mainAdminOnly: true },
  { label: "Catalog", href: "/admin/catalog", icon: <Inventory2OutlinedIcon fontSize="small" /> },
  { label: "Seller settings", href: "/admin/seller-settings", icon: <SettingsOutlinedIcon fontSize="small" /> },
] satisfies readonly NavItem[];

function getPageTitle(pathname: string) {
  if (!pathname) return "Admin";
  const match = NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label || "Admin";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, profile, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAllowed = authenticated && allowedRoles.has(profile?.role);
  const mainAdminId = (process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID || "").trim();
  const isMainAdmin = profile?.role === "main_admin" || (Boolean(mainAdminId) && profile?.$id === mainAdminId);

  const redirectTarget = !authenticated
    ? "/auth/admin/login"
    : !isAllowed
      ? profile?.role === "seller"
        ? "/auth/seller/login"
        : profile?.role === "customer"
          ? "/"
          : "/auth/admin/login"
      : null;

  const handleLogout = async () => {
    await performLogout();
    router.replace("/auth/admin/login");
    router.refresh();
  };

  useEffect(() => {
    if (loading) return;
    if (!redirectTarget) return;
    if (pathname !== redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [loading, pathname, redirectTarget, router]);

  if (loading) {
    return (
      <AdminAccessGate
        title="Verifying permissions"
        description="Please wait while we confirm your admin access."
        loading
      />
    );
  }

  if (redirectTarget) {
    return (
      <AdminAccessGate
        title="Redirecting"
        description={`Taking you to ${describeAdminDestination(redirectTarget)}...`}
        loading
        actionLabel="Open now"
        onAction={() => router.replace(redirectTarget)}
      />
    );
  }

  const pageTitle = getPageTitle(pathname);
  const initials = profile?.name?.split(" ").map((n: string) => n[0]).join("")?.slice(0, 2) || "AD";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Fixed sidebar on large screens */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-72 flex-col bg-slate-950 text-white">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Avatar sx={{ width: 40, height: 40, bgcolor: "#ffffff", color: "#0f172a", fontWeight: 900, borderRadius: 2 }}>
              {initials}
            </Avatar>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Admin Console</p>
              <p className="text-xs text-slate-300">Restricted access</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.filter((item) => !item.mainAdminOnly || isMainAdmin).map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition " +
                  (active ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5 hover:text-white")
                }
              >
                <span className={"inline-flex h-8 w-8 items-center justify-center rounded-lg " + (active ? "bg-white/10" : "bg-white/5")}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <Link href="/" className="text-sm font-semibold text-slate-200 hover:text-white">Back home</Link>
        </div>
      </aside>

      {/* Spacer so content doesn't sit under the fixed sidebar */}
      <div className="hidden lg:block w-72 shrink-0" aria-hidden="true" />

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest text-slate-500">ADMIN</p>
              <p className="text-lg font-semibold text-slate-900 truncate">{pageTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-slate-900 truncate max-w-[16rem]">{profile?.name || "Admin"}</p>
                <p className="text-xs text-slate-500 truncate max-w-[16rem]">{profile?.email || profile?.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

function describeAdminDestination(path: string) {
  if (path.startsWith("/auth/admin/login")) {
    return "the admin login page";
  }
  if (path.startsWith("/auth/seller/login")) {
    return "the seller portal";
  }
  if (path === "/") {
    return "the storefront";
  }
  return "the previous page";
}

type AdminAccessGateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

function AdminAccessGate({ title, description, actionLabel, onAction, loading }: AdminAccessGateProps) {
  const accent = "#2563eb";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <LockOutlinedIcon />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        {loading && (
          <div className="mt-4 flex justify-center">
            <CircularProgress size={24} sx={{ color: accent }} />
          </div>
        )}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
