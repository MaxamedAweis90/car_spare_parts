"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";

import Link from "next/link";
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Typography,
  Space,
  Skeleton,
  List,
  Avatar,
  Badge,
  Empty,
  Tag,
} from "antd";
import {
  UserOutlined,
  ShopOutlined,
  ReloadOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  SafetyCertificateOutlined,
  UserDeleteOutlined,
  UserAddOutlined,
  LoginOutlined,
  StopOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import { useAdminStats } from "@/hooks/queries/useAdminStats";

const { Title, Text } = Typography;

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

export default function AdminPage() {
  const { data: stats, isLoading, refetch, isRefetching } = useAdminStats();

  // Helper to determine if we should show skeleton
  // We only show it if it's loading AND we have no cached data
  const showSkeleton = isLoading && !stats;

  // Revenue Chart Data
  const revenueData = {
    labels: (stats?.revenueHistory || []).map((d) =>
      new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })
    ),
    datasets: [
      {
        label: "Revenue ($)",
        data: (stats?.revenueHistory || []).map((d) => d.revenue),
        borderColor: "#1890ff",
        backgroundColor: "rgba(24, 144, 255, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Transaction Volume Data
  const volumeData = {
    labels: (stats?.revenueHistory || []).map((d) =>
      new Date(d.date).toLocaleDateString("en-US", { weekday: "short" })
    ),
    datasets: [
      {
        label: "Order Volume",
        data: (stats?.revenueHistory || []).map((d) => d.count),
        backgroundColor: (stats?.revenueHistory || []).map((d, i, arr) => {
          if (i === 0) return "#52c41a";
          const prev = arr[i - 1]?.count || 0;
          return d.count >= prev ? "#52c41a" : "#ff4d4f";
        }),
        borderRadius: 4,
      },
    ],
  };

  const distributionData = {
    labels: ["Active", "Pending", "Inactive"],
    datasets: [
      {
        data: [
          stats?.sellers.active || 0,
          stats?.sellers.pendingApproval || 0,
          stats?.sellers.inactive || 0,
        ],
        backgroundColor: ["#52c41a", "#faad14", "#d9d9d9"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <Title level={2} style={{ margin: 0, color: "#1e293b" }}>
            Admin Dashboard
          </Title>
          <Text type="secondary" className="text-sm">
            Real-time analytics and platform oversight.{" "}
            {stats?.generatedAt &&
              `Last updated: ${new Date(
                stats.generatedAt
              ).toLocaleTimeString()}`}
          </Text>
        </div>
        <Space size="middle">
          <Button
            shape="round"
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isRefetching}
            className="hover:scale-105 transition-transform"
          >
            Refresh Data
          </Button>
          <Link href="/admin/seller-settings">
            <Button type="primary" shape="round" className="bg-blue-600">
              Platform Settings
            </Button>
          </Link>
        </Space>
      </div>

      {/* Primary Stats Grid */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-t-4 border-blue-500 h-full"
          >
            <Skeleton loading={showSkeleton} active paragraph={{ rows: 1 }}>
              <div suppressHydrationWarning className="py-2">
                <Statistic
                  title={
                    <Text strong type="secondary">
                      Total Platform Users
                    </Text>
                  }
                  value={stats?.users.total}
                  prefix={<UserOutlined className="text-blue-500 mr-2" />}
                  styles={{ content: { fontSize: "28px", fontWeight: "bold" } }}
                />
                <div className="mt-4 flex items-center justify-between">
                  <Badge
                    status="success"
                    text={`${stats?.users.active} Active`}
                  />
                  <Text type="secondary" className="text-xs">
                    {stats?.users.total
                      ? (
                          (stats.users.active / stats.users.total) *
                          100
                        ).toFixed(0)
                      : 0}
                    %
                  </Text>
                </div>
              </div>
            </Skeleton>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-t-4 border-emerald-500 h-full"
          >
            <Skeleton loading={showSkeleton} active paragraph={{ rows: 1 }}>
              <div suppressHydrationWarning className="py-2">
                <Statistic
                  title={
                    <Text strong type="secondary">
                      Verified Sellers
                    </Text>
                  }
                  value={stats?.sellers.total}
                  prefix={<ShopOutlined className="text-emerald-500 mr-2" />}
                  styles={{ content: { fontSize: "28px", fontWeight: "bold" } }}
                />
                <div className="mt-4 flex items-center gap-4">
                  <Text
                    type="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    <CheckCircleOutlined className="text-emerald-500" />{" "}
                    {stats?.sellers.active} Active
                  </Text>
                  <Text
                    type="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    <ClockCircleOutlined className="text-gray-400" />{" "}
                    {stats?.sellers.inactive} Inactive
                  </Text>
                </div>
              </div>
            </Skeleton>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-t-4 border-amber-500 h-full"
          >
            <Skeleton loading={showSkeleton} active paragraph={{ rows: 1 }}>
              <div suppressHydrationWarning className="py-2">
                <Statistic
                  title={
                    <Text strong type="secondary">
                      Seller Approvals
                    </Text>
                  }
                  value={stats?.sellers.pendingApproval}
                  styles={{
                    content: {
                      color: "#d97706",
                      fontSize: "28px",
                      fontWeight: "bold",
                    },
                  }}
                  suffix={
                    <Link href="/admin/approvals">
                      <Button
                        size="small"
                        type="link"
                        className="text-amber-600 font-semibold p-0 ml-2"
                      >
                        Review
                      </Button>
                    </Link>
                  }
                />
                <Text type="secondary" className="text-xs block mt-4">
                  New store applications
                </Text>
              </div>
            </Skeleton>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            variant="borderless"
            className="shadow-md hover:shadow-lg transition-shadow rounded-xl border-t-4 border-indigo-500 h-full"
          >
            <Skeleton loading={showSkeleton} active paragraph={{ rows: 1 }}>
              <div suppressHydrationWarning className="py-2">
                <Statistic
                  title={
                    <Text strong type="secondary">
                      Daily Visitors
                    </Text>
                  }
                  value={stats?.visitors.day}
                  prefix={<ReloadOutlined className="text-indigo-500 mr-2" />}
                  styles={{ content: { fontSize: "28px", fontWeight: "bold" } }}
                />
                <div className="mt-4 flex items-center justify-between">
                  <Text type="secondary" className="text-xs">
                    Weekly: {stats?.visitors.week}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    Yearly: {stats?.visitors.year}
                  </Text>
                </div>
              </div>
            </Skeleton>
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <LineChartOutlined className="text-blue-500" />{" "}
                <span className="font-bold">Growth Intelligence</span>
              </Space>
            }
            variant="borderless"
            className="shadow-md rounded-xl h-full"
            extra={
              <Text type="secondary" className="text-xs">
                7-Day Trend
              </Text>
            }
          >
            <div style={{ height: 350 }}>
              {showSkeleton ? (
                <Skeleton active className="mt-10" />
              ) : (
                <Line
                  data={revenueData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: { backgroundColor: "#1e293b" },
                    },
                    scales: {
                      y: {
                        grid: { color: "#f1f5f9" },
                        ticks: { color: "#64748b" },
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: "#64748b" },
                      },
                    },
                  }}
                />
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={<span className="font-bold">Recent Activity</span>}
            variant="borderless"
            className="shadow-md rounded-xl h-full"
            extra={
              <Badge
                count={stats?.activities?.length || 0}
                className="bg-blue-500"
              />
            }
          >
            <div
              style={{ height: 350, overflowY: "auto" }}
              className="custom-scrollbar"
            >
              {showSkeleton ? (
                <Skeleton active />
              ) : !stats?.activities || stats.activities.length === 0 ? (
                <Empty
                  description="No recent activity"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={stats.activities}
                  renderItem={(item) => (
                    <List.Item className="px-0 py-3 border-b border-gray-50 last:border-0">
                      <List.Item.Meta
                        avatar={
                          <div
                            className={`p-2 rounded-full ${
                              item.action.includes("DELETE")
                                ? "bg-red-50 text-red-500"
                                : item.action.includes("DEACTIVATE")
                                ? "bg-orange-50 text-orange-500"
                                : item.action.includes("APPROVE")
                                ? "bg-emerald-50 text-emerald-500"
                                : "bg-blue-50 text-blue-500"
                            }`}
                          >
                            {item.action === "INVITE_ADMIN" && (
                              <UserAddOutlined />
                            )}
                            {item.action === "DELETE_ADMIN" && (
                              <UserDeleteOutlined />
                            )}
                            {item.action === "DELETE_SELLER" && (
                              <UserDeleteOutlined />
                            )}
                            {item.action === "APPROVE_SELLER" && (
                              <CheckCircleOutlined />
                            )}
                            {item.action === "DEACTIVATE_SELLER" && (
                              <StopOutlined />
                            )}
                            {item.action === "DEACTIVATE_ADMIN" && (
                              <StopOutlined />
                            )}
                            {item.action === "UPDATE_PASSWORD_ADMIN" && (
                              <KeyOutlined />
                            )}
                            {item.action === "LOGIN_ADMIN" && <LoginOutlined />}
                            {/* Fallback */}
                            {![
                              "INVITE_ADMIN",
                              "DELETE_ADMIN",
                              "DELETE_SELLER",
                              "APPROVE_SELLER",
                              "DEACTIVATE_SELLER",
                              "DEACTIVATE_ADMIN",
                              "UPDATE_PASSWORD_ADMIN",
                              "LOGIN_ADMIN",
                            ].includes(item.action) && (
                              <SafetyCertificateOutlined />
                            )}
                          </div>
                        }
                        title={
                          <Text className="text-sm">
                            <Text strong>{item.adminName}</Text>{" "}
                            <Text
                              type="secondary"
                              className="text-xs lowercase"
                            >
                              {item.action.replace(/_/g, " ")}
                            </Text>
                          </Text>
                        }
                        description={
                          <div className="flex flex-col">
                            <Text strong className="text-xs text-slate-700">
                              {item.targetName || item.details}
                            </Text>
                            <Text type="secondary" className="text-[10px]">
                              {dayjs(item.createdAt).fromNow()}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Pending Admins & Density Section */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-bold">Pending Admin Invitations</span>}
            variant="borderless"
            className="shadow-md rounded-xl h-full"
            extra={
              <Badge
                count={stats?.pendingAdmins.length || 0}
                className="bg-blue-500"
              />
            }
          >
            {showSkeleton ? (
              <Skeleton active />
            ) : !stats?.pendingAdmins || stats.pendingAdmins.length === 0 ? (
              <div className="py-10 text-center">
                <Empty
                  description="No pending invitations"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Button type="primary" shape="round" className="mt-4">
                  Invite New Admin
                </Button>
              </div>
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={stats.pendingAdmins}
                renderItem={(item) => (
                  <List.Item className="px-2">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.name}`}
                        />
                      }
                      title={<Text strong>{item.name}</Text>}
                      description={
                        <Space>
                          <MailOutlined className="text-gray-400" />
                          <Text type="secondary" className="text-xs">
                            {item.email}
                          </Text>
                        </Space>
                      }
                    />
                    <Tag icon={<ClockCircleOutlined />} color="warning">
                      Awaiting Action
                    </Tag>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<span className="font-bold">Seller Distribution</span>}
            variant="borderless"
            className="shadow-md rounded-xl h-full"
          >
            <div
              style={{
                height: 350, // kept consistent
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showSkeleton ? (
                <Skeleton.Node active style={{ width: 250, height: 250 }} />
              ) : (
                <Doughnut
                  data={distributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "70%",
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { padding: 20, font: { weight: "bold" } },
                      },
                    },
                  }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
