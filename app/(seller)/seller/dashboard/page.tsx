"use client";

import { useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Skeleton,
} from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  UserOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useSellerStore } from "@/lib/SellerStoreProvider";
import { useSellerStats } from "@/hooks/queries/useSellerStats";
import { useOrders } from "@/hooks/queries/useOrders";

const { Title, Text } = Typography;

export default function SellerDashboardPage() {
  const { store } = useSellerStore();
  const sellerId = store?.sellerId;

  const { data: stats, isLoading: statsLoading } = useSellerStats(sellerId);
  const { data: orders, isLoading: ordersLoading } = useOrders({ sellerId });

  // Chart References
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const customerChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const pieInstanceRef = useRef<any>(null);

  // Initialize Charts
  useEffect(() => {
    if (!stats || typeof window === "undefined") return;

    // We need to wait for Chart from CDN if it's not ready
    const init = () => {
      const Chart = (window as any).Chart;
      if (!Chart) {
        setTimeout(init, 500);
        return;
      }

      // Destroy old instances
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
      if (pieInstanceRef.current) pieInstanceRef.current.destroy();

      // Revenue Chart
      if (revenueChartRef.current) {
        const ctx = revenueChartRef.current.getContext("2d");
        if (ctx) {
          const labels = stats.revenueData.map((d) => {
            const date = new Date(d.date);
            return date.toLocaleDateString("en-US", { weekday: "short" });
          });

          chartInstanceRef.current = new Chart(ctx, {
            type: "line",
            data: {
              labels,
              datasets: [
                {
                  label: "This Week",
                  data: stats.revenueData.map((d) => d.revenue),
                  borderColor: "#52c41a",
                  backgroundColor: "rgba(82, 196, 26, 0.1)",
                  fill: true,
                  tension: 0.4,
                },
                {
                  label: "Last Week",
                  data: stats.lastWeekRevenue.map((d) => d.revenue),
                  borderColor: "#faad14",
                  backgroundColor: "rgba(250, 173, 20, 0.1)",
                  fill: true,
                  tension: 0.4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: "index",
                intersect: false,
              },
              plugins: {
                legend: { position: "top" },
              },
            },
          });
        }
      }

      // Customer Chart
      if (customerChartRef.current) {
        const ctx = customerChartRef.current.getContext("2d");
        if (ctx) {
          pieInstanceRef.current = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels: ["Returning", "New"],
              datasets: [
                {
                  data: [
                    stats.customerStats.returningCustomers,
                    stats.customerStats.newCustomers,
                  ],
                  backgroundColor: ["#52c41a", "#f0f0f0"],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: "70%",
            },
          });
        }
      }
    };

    init();

    return () => {
      if (chartInstanceRef.current) {
        // eslint-disable-next-line
        chartInstanceRef.current.destroy();
      }
      if (pieInstanceRef.current) {
        // eslint-disable-next-line
        pieInstanceRef.current.destroy();
      }
    };
  }, [stats]);

  const recentOrders = orders?.slice(0, 5) || [];

  const columns = [
    {
      title: "Order ID",
      dataIndex: "$id",
      key: "$id",
      render: (id: string) => (
        <Text copyable>#{id.slice(-6).toUpperCase()}</Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Amount",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (price: number) => <Text strong>£{price.toFixed(2)}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "completed" || status === "paid" || status === "shipped")
          color = "success";
        if (status === "pending") color = "warning";
        if (status === "cancelled") color = "error";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} style={{ marginBottom: 0 }}>
          Dashboard
        </Title>
        <Text type="secondary">Overview of your store's performance</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Stats Cards */}
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm">
            <Skeleton loading={statsLoading} active paragraph={{ rows: 1 }}>
              <Statistic
                title="Total Visits"
                value={stats?.totalVisits}
                styles={{ content: { color: "#3f8600" } }}
                prefix={<EyeOutlined />}
                suffix={
                  <Tag color="success" style={{ marginLeft: 8 }}>
                    <ArrowUpOutlined /> 14.5%
                  </Tag>
                }
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm">
            <Skeleton loading={statsLoading} active paragraph={{ rows: 1 }}>
              <Statistic
                title="Revenue (This Week)"
                value={stats?.revenueData.reduce((a, b) => a + b.revenue, 0)}
                precision={2}
                styles={{ content: { color: "#cf1322" } }}
                prefix={<DollarOutlined />}
                suffix={
                  <Tag color="error" style={{ marginLeft: 8 }}>
                    <ArrowDownOutlined /> 3.1%
                  </Tag>
                }
              />
            </Skeleton>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card variant="borderless" className="shadow-sm">
            <Skeleton loading={statsLoading} active paragraph={{ rows: 1 }}>
              <Statistic
                title="Returning Users"
                value={stats?.returningUsers}
                prefix={<UserOutlined />}
                suffix={
                  <Tag color="success" style={{ marginLeft: 8 }}>
                    <ArrowUpOutlined /> 23.8%
                  </Tag>
                }
              />
            </Skeleton>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Main Chart */}
        <Col xs={24} lg={16}>
          <Card
            title="Revenue Analytics"
            variant="borderless"
            className="shadow-sm"
          >
            <div style={{ height: 300, position: "relative" }}>
              {statsLoading && <Skeleton active />}
              <canvas ref={revenueChartRef} />
            </div>
          </Card>
        </Col>
        {/* Pie Chart */}
        <Col xs={24} lg={8}>
          <Card
            title="Customer Insights"
            variant="borderless"
            className="shadow-sm"
          >
            <div style={{ height: 300, position: "relative" }}>
              {statsLoading && <Skeleton active />}
              <canvas ref={customerChartRef} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card
        title="Recent Orders"
        extra={<Link href="/seller/orders">View All</Link>}
        variant="borderless"
        className="shadow-sm"
      >
        <Table
          columns={columns}
          dataSource={recentOrders}
          rowKey="$id"
          pagination={false}
          loading={ordersLoading}
        />
      </Card>
    </div>
  );
}
