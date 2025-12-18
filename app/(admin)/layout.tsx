"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useSession } from "@/lib/useSession";
import { performLogout } from "@/lib/logout";

const allowedRoles = new Set(["main_admin", "admin"]);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, profile, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAllowed = authenticated && allowedRoles.has(profile?.role);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  const handleLogout = async () => {
    await performLogout();
    router.replace("/auth/admin/login");
    router.refresh();
  };

  useEffect(() => {
    if (loading) return;
    let target: string | null = null;

    if (!authenticated) {
      target = "/auth/admin/login";
    } else if (!isAllowed) {
      if (profile?.role === "seller") {
        target = "/auth/seller/login";
      } else if (profile?.role === "customer") {
        target = "/";
      } else {
        target = "/auth/admin/login";
      }
    }

    if (target) {
      setRedirectTarget(target);
      if (pathname !== target) {
        router.replace(target);
      }
      return;
    }

    setRedirectTarget(null);
  }, [authenticated, isAllowed, loading, pathname, profile?.role, router]);

  if (loading) {
    return (
      <AdminAccessGate
        title="Verifying permissions"
        description="Please wait while we confirm your admin access."
        loading
      />
    );
  }

  if (!isAllowed) {
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

    return (
      <AdminAccessGate
        title="Access denied"
        description="You do not have permission to view the admin area."
        actionLabel="Go home"
        onAction={() => router.replace("/")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">Admin Area</p>
          <p className="text-sm text-gray-600">Restricted to admins</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <a className="text-blue-600" href="/">Back home</a>
          <button type="button" onClick={handleLogout} className="rounded border border-gray-300 px-3 py-1 text-gray-700 hover:bg-gray-100">
            Logout
          </button>
        </div>
      </header>
      <main className="p-4">{children}</main>
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
