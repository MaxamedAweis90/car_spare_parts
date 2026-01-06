"use client";

import { useEffect, useState } from "react";
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
} from "antd";
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
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authenticated, profile, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Use local state for collapse, or zustand if global
  const [collapsed, setCollapsed] = useState(false);
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

  const userMenu = {
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
        }}
      >
        <div className="demo-logo-vertical p-4 flex items-center justify-center gap-2 border-b border-gray-700 mb-2">
          <div className="bg-white/10 p-1 rounded">
            <Avatar
              shape="square"
              size="small"
              style={{ backgroundColor: "#1890ff" }}
            >
              A
            </Avatar>
          </div>
          {!collapsed && (
            <span className="text-white font-bold text-lg">Admin</span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />

          <div className="flex items-center gap-4">
            {/* @ts-expect-error Antd Dropdown menu prop type issue in some versions */}
            <Dropdown menu={userMenu} trigger={["click"]}>
              <div className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded-md transition-colors">
                <Avatar style={{ backgroundColor: "#f56a00" }}>
                  {userInitials}
                </Avatar>
                <span className="hidden sm:block font-medium">
                  {profile?.name}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
