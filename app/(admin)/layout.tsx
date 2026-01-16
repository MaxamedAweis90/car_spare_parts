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
import { useSession } from "@/lib/useSession";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, profile, account, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Use local state for collapse, or zustand if global
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
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
  const mainAdminId = (
    process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID || ""
  ).trim();
  const isMainAdmin =
    profile?.role === "main_admin" ||
    (Boolean(mainAdminId) && profile?.$id === mainAdminId);

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Spin size="large" tip="Verifying access..." fullscreen />
      </div>
    );
  }

  if (redirectTarget) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Result
          status="info"
          title="Redirecting"
          subTitle="Taking you to the appropriate page..."
        />
      </div>
    );
  }

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
    (item) => !item.mainAdminOnly || isMainAdmin
  ).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: <Link href={item.key}>{item.label}</Link>,
  }));

  // Find active key
  const activeKey =
    NAV_ITEMS.filter(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`)
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
          {authenticated && account?.emailVerification === false && (
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-4">
              <div className="text-orange-500 text-2xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h4 className="text-orange-900 font-bold m-0">
                  Verify your Email
                </h4>
                <p className="text-orange-700 text-sm m-0">
                  We sent a verification link to your new email. Please check
                  your inbox.
                </p>
              </div>
              <div className="ml-auto">
                <Link
                  href="/admin/settings"
                  className="text-orange-900 font-bold underline text-sm"
                >
                  Settings
                </Link>
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
