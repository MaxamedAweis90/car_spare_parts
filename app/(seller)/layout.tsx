"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Badge, Divider, IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import TableRowsOutlinedIcon from "@mui/icons-material/TableRowsOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useSession } from "@/lib/useSession";
import { performLogout } from "@/lib/logout";
import { getImageUrl } from "@/lib/appwrite/storage";
import { SellerStoreProvider, useSellerStore } from "@/lib/SellerStoreProvider";
import { SellerProfileProvider, useSellerProfile } from "@/lib/SellerProfileProvider";

const allowedRoles = new Set(["seller"]);

const NAV_ITEMS = [
  { label: "Dashboard", href: "/seller/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
  { label: "Products", href: "/seller/products", icon: <Inventory2OutlinedIcon fontSize="small" /> },
  { label: "Add product", href: "/seller/products/new", icon: <AddBoxOutlinedIcon fontSize="small" /> },
  { label: "Categories", href: "/seller/products/categories", icon: <CategoryOutlinedIcon fontSize="small" /> },
  { label: "Orders", href: "/seller/orders", icon: <TableRowsOutlinedIcon fontSize="small" /> },
  { label: "Earnings", href: "/seller/earnings", icon: <MonetizationOnOutlinedIcon fontSize="small" /> },
  { label: "Store settings", href: "/seller/settings", icon: <StorefrontOutlinedIcon fontSize="small" /> },
  { label: "Profile", href: "/seller/profile", icon: <PersonOutlineOutlinedIcon fontSize="small" /> },
  { label: "Support", href: "/seller/support", icon: <HelpOutlineOutlinedIcon fontSize="small" /> },
];

function usePageTitle(pathname: string) {
  return useMemo(() => {
    if (!pathname) return "Seller";
    const match = NAV_ITEMS.find((item) => pathname.startsWith(item.href));
    return match?.label || "Seller";
  }, [pathname]);
}

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerStoreProvider>
      <SellerProfileProvider>
        <SellerLayoutShell>{children}</SellerLayoutShell>
      </SellerProfileProvider>
    </SellerStoreProvider>
  );
}

function SellerLayoutShell({ children }: { children: React.ReactNode }) {
  const { authenticated, profile, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);
  const { store } = useSellerStore();
  const { profile: sellerProfile } = useSellerProfile();

  const isAllowed =
    authenticated &&
    allowedRoles.has(profile?.role) &&
    (profile?.sellerApproved === undefined || profile?.sellerApproved === true);

  useEffect(() => {
    if (loading) return;
    let target: string | null = null;

    if (!authenticated) {
      target = "/auth/seller/login";
    } else if (profile?.role === "seller" && profile?.sellerApproved === false) {
      target = "/auth/seller/pending";
    } else if (!isAllowed) {
      if (profile?.role === "admin" || profile?.role === "main_admin") {
        target = "/auth/admin/login";
      } else if (profile?.role === "customer") {
        target = "/";
      } else {
        target = "/auth/seller/login";
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
  }, [authenticated, isAllowed, loading, pathname, profile?.role, profile?.sellerApproved, router]);

  const pageTitle = usePageTitle(pathname);
  const initials = profile?.name?.split(" ").map((n: string) => n[0]).join("")?.slice(0, 2) || "SE";
  const storeSlug = store?.storeSlug ?? null;
  const storeDisplayName = store?.storeName || "Seller Hub";
  const sellerAvatarUrl = useMemo(() => {
    if (!sellerProfile?.avatarId) return sellerProfile?.avatarUrl ?? null;
    try {
      return getImageUrl("avatars", sellerProfile.avatarId);
    } catch (error) {
      console.error("Failed to resolve seller avatar", error);
      return sellerProfile?.avatarUrl ?? null;
    }
  }, [sellerProfile?.avatarId, sellerProfile?.avatarUrl]);
  const storeAvatarUrl = useMemo(() => {
    if (!store?.storeAvatarId) return null;
    try {
      return getImageUrl("storeAvatars", store.storeAvatarId);
    } catch (error) {
      console.error("Failed to resolve store avatar", error);
      return null;
    }
  }, [store?.storeAvatarId]);

  const handleLogout = async () => {
    setMenuAnchor(null);
    await performLogout();
    router.replace("/auth/seller/login");
    router.refresh();
  };

  if (loading) {
    return (
      <AccessGate
        title="Validating access"
        description="Please wait while we confirm your seller permissions."
        loading
        accentColor="#f59e0b"
      />
    );
  }

  if (redirectTarget) {
    return (
      <AccessGate
        title="Redirecting"
        description={`Taking you to ${describeSellerDestination(redirectTarget)}...`}
        loading
        actionLabel="Open now"
        onAction={() => router.replace(redirectTarget)}
        accentColor="#f59e0b"
      />
    );
  }

  if (!isAllowed) {
    return (
      <AccessGate
        title="Access denied"
        description="You do not have permission to view the seller console."
        actionLabel="Go to homepage"
        onAction={() => router.replace("/")}
        accentColor="#f59e0b"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1e9] text-slate-900 flex">
      <aside
        className={`${sidebarOpen ? "w-68" : "w-18"} hidden lg:flex flex-col lg:sticky lg:top-0 lg:h-screen shrink-0 bg-[#161616] text-white transition-all duration-200 shadow-xl`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-3">
            <Avatar src={storeAvatarUrl || sellerAvatarUrl || undefined} sx={{ width: 40, height: 40, bgcolor: "#f5f5f5", color: "#111" }}>
              {storeDisplayName.slice(0, 2).toUpperCase()}
            </Avatar>
            {sidebarOpen && (
              <div className="leading-tight">
                <p className="text-sm font-semibold">{storeDisplayName}</p>
                <p className="text-xs text-gray-400">Welcome back</p>
              </div>
            )}
          </div>
          {/* <IconButton size="small" onClick={() => setSidebarOpen((v) => !v)} sx={{ color: "#e5e7eb" }}>
            <MenuOpenIcon fontSize="small" />
          </IconButton> */}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors relative ${
                  active ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/10"
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full bg-[#fbbf24]" aria-hidden />}
                <span className="text-gray-400">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-[#1f1f1f]">
          {sidebarOpen ? (
            <div className="rounded-xl bg-white/5 p-3 text-xs text-gray-200">
              <p className="font-semibold text-white">Need help?</p>
              <p className="mt-1 text-gray-300">Visit Support or contact admin.</p>
              <Link href="/seller/support" className="text-[#fbbf24] font-semibold mt-2 inline-block">
                Support
              </Link>
            </div>
          ) : (
            <Tooltip title="Support">
              <IconButton size="small" sx={{ bgcolor: "white", color: "#111" }} href="/seller/support" component={Link as any}>
                <HelpOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </aside>

      <div className="flex-1 flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[#f4f1e9]/90 backdrop-blur border-b border-[#e3ddcf] px-4 py-3">
          <div className="flex items-center gap-2">
            <IconButton onClick={() => setSidebarOpen((v) => !v)}>
              <MenuOpenIcon />
            </IconButton>
            <div>
              <p className="text-sm text-slate-500">Seller</p>
              <p className="text-lg font-semibold">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tooltip title="Notifications">
              <IconButton size="small">
                <Badge color="error" variant="dot">
                  <NotificationsNoneOutlinedIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider flexItem orientation="vertical" />

            <div>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
                <Avatar src={sellerAvatarUrl || undefined} sx={{ bgcolor: "#2563eb", width: 36, height: 36, fontSize: 14 }}>
                  {initials}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => router.push("/seller/profile")}>Profile</MenuItem>
                <MenuItem onClick={() => router.push("/seller/settings")}>Store settings</MenuItem>
                {storeSlug && <MenuItem onClick={() => router.push(`/stores/${storeSlug}`)}>View storefront</MenuItem>}
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function describeSellerDestination(path: string) {
  if (path === "/auth/seller/pending") {
    return "your seller approval status";
  }
  if (path.startsWith("/auth/seller/login")) {
    return "the seller login page";
  }
  if (path.startsWith("/auth/admin/login")) {
    return "the admin login";
  }
  if (path === "/") {
    return "the storefront";
  }
  return "the previous page";
}

type AccessGateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  accentColor?: string;
};

function AccessGate({ title, description, actionLabel, onAction, loading, accentColor = "#2563eb" }: AccessGateProps) {
  const accent = accentColor;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1e9] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#ece8de] bg-white p-8 text-center shadow-[0_20px_60px_rgba(17,24,39,0.12)]">
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
