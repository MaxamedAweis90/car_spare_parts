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

import { useSession } from "@/lib/useSession";
import { performLogout } from "@/lib/logout";
import { getImageUrl } from "@/lib/appwrite/storage"; // Assuming this exists as per original
import { SellerStoreProvider, useSellerStore } from "@/lib/SellerStoreProvider";
import {
  SellerProfileProvider,
  useSellerProfile,
} from "@/lib/SellerProfileProvider";

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
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const { store } = useSellerStore();
  const { profile: sellerProfile } = useSellerProfile();

  const isAllowed =
    authenticated &&
    allowedRoles.has(profile?.role) &&
    (profile?.sellerApproved === undefined || profile?.sellerApproved === true);

  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    let target: string | null = null;

    if (!authenticated) {
      target = "/auth/seller/login";
    } else if (
      profile?.role === "seller" &&
      profile?.sellerApproved === false
    ) {
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
  }, [
    authenticated,
    isAllowed,
    loading,
    pathname,
    profile?.role,
    profile?.sellerApproved,
    router,
  ]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f1e9]">
        <Spin size="large" tip="Loading seller portal..." fullscreen />
      </div>
    );
  }

  if (redirectTarget) {
    const title =
      redirectTarget === "/auth/seller/pending"
        ? "Account Pending"
        : "Redirecting";
    const subTitle =
      redirectTarget === "/auth/seller/pending"
        ? "Your account is pending approval."
        : "Taking you to the login page...";

    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f1e9]">
        <Result
          status={
            redirectTarget === "/auth/seller/pending" ? "warning" : "info"
          }
          title={title}
          subTitle={subTitle}
        />
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f1e9]">
        <Result
          status="403"
          title="Access Denied"
          subTitle="You do not have permission to view this page."
          extra={
            <Button type="primary" href="/">
              Go to Homepage
            </Button>
          }
        />
      </div>
    );
  }

  const userMenu = {
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

  const notificationsMenu = {
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
    ].filter(Boolean),
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
          width={260}
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
          {children}
        </Content>
      </Layout>
    </Layout>
  );

  function siderContent() {
    return (
      <>
        <div
          className={`h-[64px] border-b flex items-center ${
            collapsed && !isMobile ? "justify-center" : "px-4 gap-3"
          }`}
        >
          <Avatar
            src={storeAvatarUrl}
            style={{
              backgroundColor: "#f56a00",
              flexShrink: 0,
            }}
            shape="square"
            size={collapsed && !isMobile ? 32 : 36}
          >
            {storeDisplayName.slice(0, 1)}
          </Avatar>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden leading-tight">
              <Text strong className="block truncate text-sm">
                {storeDisplayName}
              </Text>
              <Text
                type="secondary"
                className="text-[10px] block uppercase tracking-wider font-bold opacity-60"
              >
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
