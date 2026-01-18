"use client";

import { useEffect, useMemo, useState } from "react";
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
  Badge,
  Drawer,
  Grid,
} from "antd";
import type { MenuProps } from "antd";
const { useBreakpoint } = Grid;
import {
  DashboardOutlined,
  AppstoreOutlined,
  PlusSquareOutlined,
  TagsOutlined,
  UnorderedListOutlined,
  DollarOutlined,
  ShopOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  BellOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import { useSession } from "@/lib/auth/useSession";
import { performLogout } from "@/lib/logout";
import { getImageUrl } from "@/lib/appwrite/storage"; // Assuming this exists as per original
import { SellerStoreProvider, useSellerStore } from "@/lib/providers/SellerStoreProvider";
import {
  SellerProfileProvider,
  useSellerProfile,
} from "@/lib/providers/SellerProfileProvider";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const allowedRoles = new Set(["seller"]);

const NAV_ITEMS = [
  {
    key: "/seller/dashboard",
    label: "Dashboard",
    icon: <DashboardOutlined />,
  },
  {
    key: "/seller/products",
    label: "Products",
    icon: <AppstoreOutlined />,
  },
  {
    key: "/seller/products/new",
    label: "Add product",
    icon: <PlusSquareOutlined />,
  },
  // {
  //   key: "/seller/products/categories",
  //   label: "Categories",
  //   icon: <TagsOutlined />,
  // },
  {
    key: "/seller/orders",
    label: "Orders",
    icon: <UnorderedListOutlined />,
  },
  {
    key: "/seller/earnings",
    label: "Earnings",
    icon: <DollarOutlined />,
  },
  {
    key: "/seller/settings",
    label: "Store settings",
    icon: <ShopOutlined />,
  },
  {
    key: "/seller/profile",
    label: "Profile",
    icon: <UserOutlined />,
  },
  {
    key: "/seller/support",
    label: "Support",
    icon: <QuestionCircleOutlined />,
  },
];

export default function SellerLayout({
  children,
  emailVerified,
}: {
  children: React.ReactNode;
  emailVerified?: boolean; // Made optional to avoid breaking other usages if any, but server layout passes it.
}) {
  const { account } = useSession();
  // Use passed prop if available, otherwise fallback to client session
  const isVerified = emailVerified ?? account?.emailVerification ?? false;

  return (
    <SellerStoreProvider>
      <SellerProfileProvider>
        <SellerLayoutShell emailVerified={isVerified}>
          {children}
        </SellerLayoutShell>
      </SellerProfileProvider>
    </SellerStoreProvider>
  );
}

function SellerLayoutShell({
  children,
  emailVerified,
}: {
  children: React.ReactNode;
  emailVerified: boolean;
}) {
  const { authenticated, profile, account, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { store } = useSellerStore();
  const { profile: sellerProfile } = useSellerProfile();

  // Client-side redirects removed - handled by Server Layout

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
    await performLogout();
    router.replace("/auth/seller/login");
    router.refresh();
  };

  // Loading/Blocking states removed - Server Layout handles protection
  // Basic validation that user data is present, otherwise showing generic loading
  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f1e9]">
        <Spin size="large" tip="Loading seller portal..." fullscreen />
      </div>
    );
  }

  const userMenu: MenuProps = {
    items: [
      {
        key: "profile",
        label: (
          <div className="flex flex-col">
            <Text strong>{profile?.name}</Text>
            <Text type="secondary" className="text-xs">
              {storeDisplayName}
            </Text>
          </div>
        ),
      },
      { type: "divider" },
      {
        key: "settings",
        label: "Store Settings",
        icon: <ShopOutlined />,
        onClick: () => router.push("/seller/settings"),
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

  const notificationsMenu: MenuProps = {
    items: [
      !store?.isOnboarded && {
        key: "onboarding",
        label: (
          <Link href="/seller/settings" className="flex flex-col py-1">
            <Text strong className="block text-sm">
              Complete Store Setup
            </Text>
            <Text type="secondary" className="block text-xs">
              Set up your shop to start selling
            </Text>
          </Link>
        ),
        icon: <InfoCircleOutlined className="text-blue-500" />,
      },
      store?.isOnboarded && {
        key: "welcome",
        label: (
          <div className="flex flex-col py-1">
            <Text strong className="block text-sm">
              Welcome back!
            </Text>
            <Text type="secondary" className="block text-xs">
              Your store is live and ready.
            </Text>
          </div>
        ),
      },
    ].filter(Boolean) as MenuProps["items"],
  };

  // Menu items config
  const menuItems = NAV_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: <Link href={item.key}>{item.label}</Link>,
  }));

  const activeKey =
    NAV_ITEMS.filter(
      (item) => pathname === item.key || pathname.startsWith(`${item.key}/`)
    ).sort((a, b) => b.key.length - a.key.length)[0]?.key ||
    "/seller/dashboard";

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar for Desktop */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="light"
          width={260}
          collapsedWidth={80}
          className="shadow-md z-10"
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
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
          {siderContent()}
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 80 : 260,
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
            zIndex: 1,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}
        >
          <Button
            type="text"
            icon={
              isMobile ? (
                <UnorderedListOutlined />
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
            <Dropdown
              menu={notificationsMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Badge dot={!store?.isOnboarded}>
                <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
              </Badge>
            </Dropdown>
            <Dropdown menu={userMenu} trigger={["click"]}>
              <div className="cursor-pointer flex items-center gap-2 hover:bg-gray-50 px-3 py-1 rounded-full transition-colors">
                <Avatar
                  src={sellerAvatarUrl}
                  style={{ backgroundColor: "#87d068" }}
                >
                  {profile?.name?.[0]}
                </Avatar>
                {!isMobile && (
                  <Text strong className="hidden sm:inline">
                    {profile?.name}
                  </Text>
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
          {/* Warning Banner for Unverified Email */}
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
        <div
          className={`py-5 border-b border-gray-100 flex items-center transition-all duration-300 ${
            collapsed && !isMobile
              ? "justify-center px-2"
              : "px-5 gap-3 bg-gradient-to-r from-gray-50 to-white"
          }`}
        >
          {/* Store Logo */}
          <div
            className={`relative flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center transition-all duration-300 ${
              collapsed && !isMobile ? "w-10 h-10" : "w-11 h-11"
            }`}
          >
            {storeAvatarUrl ? (
              <img
                src={storeAvatarUrl}
                alt={storeDisplayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-orange-50 w-full h-full flex items-center justify-center">
                <ShopOutlined className="text-orange-500 text-lg" />
              </div>
            )}
          </div>

          {/* Store Name & Portal Label */}
          {(!collapsed || isMobile) && (
            <div className="flex flex-col overflow-hidden">
              <Text
                strong
                className="truncate text-slate-800 leading-tight text-[15px]"
                title={storeDisplayName}
              >
                {storeDisplayName}
              </Text>
              <Text className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                Seller Portal
              </Text>
            </div>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          style={{ borderRight: 0 }}
          onClick={() => isMobile && setDrawerVisible(false)}
        />
      </>
    );
  }
}

