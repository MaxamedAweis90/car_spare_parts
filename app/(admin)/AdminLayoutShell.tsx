"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Result,
  Spin,
  theme,
  Typography,
  Drawer,
  Grid,
} from "antd";
import type { MenuProps } from "antd";
const { useBreakpoint } = Grid;
import {
  DashboardOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  ShopOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useSession } from "@/lib/auth/useSession";
import { performLogout } from "@/lib/logout";
import { useUIStore } from "@/stores/ui-store";
import { getImageUrl } from "@/lib/appwrite/storage";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const allowedRoles = new Set(["main_admin", "admin"]);

const NAV_ITEMS = [
  {
    key: "/admin",
    label: "Dashboard",
    icon: <DashboardOutlined />,
  },
  {
    key: "/admin/approvals",
    label: "Seller approvals",
    icon: <SafetyCertificateOutlined />,
  },
  {
    key: "/admin/admins",
    label: "Admin accounts",
    icon: <UserOutlined />,
    mainAdminOnly: true,
  },
  {
    key: "/admin/catalog",
    label: "Catalog",
    icon: <ShopOutlined />,
  },
  {
    key: "/admin/seller-settings",
    label: "Seller settings",
    icon: <SettingOutlined />,
  },
  {
    key: "/admin/settings",
    label: "Settings",
    icon: <SettingOutlined />,
  },
];

export default function AdminLayoutShell({
  children,
  emailVerified,
}: {
  children: React.ReactNode;
  emailVerified: boolean;
}) {
  const { authenticated, profile, account, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Use local state for collapse, or zustand if global
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const adminAvatarUrl = useMemo(() => {
    if (profile?.avatarId) {
      return getImageUrl("avatars", profile.avatarId);
    }
    return null;
  }, [profile?.avatarId]);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const isAllowed = authenticated && allowedRoles.has(profile?.role);
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

  // Client-side redirects removed - handled by Server Layout
  // We only keep basic user data via useSession for UI purposes (Avatar, etc)

  const handleLogout = async () => {
    await performLogout();
    router.replace("/auth/admin/login");
    router.refresh();
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendStatus("idle");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setResendStatus("success");
        setTimeout(() => setResendStatus("idle"), 5000);
      } else {
        setResendStatus("error");
      }
    } catch (err) {
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  };

  // Loading/Redirect states removed - Server Layout handles protection
  // Client layout just renders the dashboard once permitted

  const userInitials =
    profile?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      ?.slice(0, 2) || "AD";

  const userMenu: MenuProps = {
    items: [
      {
        key: "profile",
        label: (
          <div className="flex flex-col">
            <Text strong>{profile?.name}</Text>
            <Text type="secondary" className="text-xs">
              {profile?.email}
            </Text>
          </div>
        ),
      },
      {
        type: "divider",
      },
      {
        key: "logout",
        label: "Logout",
        icon: <LogoutOutlined />,
        onClick: handleLogout,
        danger: true,
      },
    ],
  };

  // Filter items
  const menuItems = NAV_ITEMS.filter(
    (item) => !item.mainAdminOnly || isMainAdmin,
  ).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: <Link href={item.key}>{item.label}</Link>,
  }));

  // Find active key
  const activeKey =
    NAV_ITEMS.filter(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`),
    ).sort((a, b) => b.key.length - a.key.length)[0]?.key || "/admin";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="dark"
          width={250}
          collapsedWidth={80}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 20,
          }}
        >
          {siderContent()}
        </Sider>
      )}

      {/* Drawer for Mobile */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          styles={{ body: { padding: 0 } }}
          size="default"
          closable={false}
        >
          <div className="bg-[#001529] h-full text-white">{siderContent()}</div>
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 250,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: isMobile ? "0 12px" : "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 10,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={() =>
              isMobile ? setDrawerVisible(true) : setCollapsed(!collapsed)
            }
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          <div className="flex items-center gap-4">
            <Dropdown menu={userMenu} trigger={["click"]}>
              <div className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors">
                <Avatar
                  style={{ backgroundColor: "#f56a00" }}
                  src={adminAvatarUrl}
                >
                  <span suppressHydrationWarning>{userInitials}</span>
                </Avatar>
                {!isMobile && (
                  <span
                    className="hidden sm:block font-medium"
                    suppressHydrationWarning
                  >
                    {profile?.name}
                  </span>
                )}
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: isMobile ? "16px 8px" : "24px 16px",
            padding: isMobile ? 12 : 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {emailVerified === false && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-top duration-500">
              <div className="text-amber-500 text-2xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-amber-900 font-bold m-0">
                  Verify your Email
                </h4>
                <p className="text-amber-800/80 text-sm m-0">
                  You have read-only access. Please verify your email to perform
                  actions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className={`text-sm font-bold px-4 py-2 rounded-lg transition-colors border ${
                    resendStatus === "success"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : resendStatus === "error"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200"
                  }`}
                >
                  {resending
                    ? "Sending..."
                    : resendStatus === "success"
                      ? "✓ Link Sent"
                      : resendStatus === "error"
                        ? "Failed to send"
                        : "Resend Link"}
                </button>
              </div>
            </div>
          )}
          {children}
        </Content>
      </Layout>
    </Layout>
  );

  function siderContent() {
    return (
      <>
        <div className="demo-logo-vertical p-4 flex flex-col items-center justify-center gap-2 border-b border-gray-700 mb-2">
          <div className="flex items-center justify-center bg-white rounded-lg p-0 w-full max-w-[200px]">
            <img
              src="/spartpartslogo-01.png"
              alt="SomaParts"
              className="h-20 object-contain"
            />
          </div>
          {(!collapsed || isMobile) && (
            <span className="text-white/80 font-bold text-xs uppercase tracking-widest mt-0">
              Admin Portal
            </span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={() => isMobile && setDrawerVisible(false)}
        />
      </>
    );
  }
}
