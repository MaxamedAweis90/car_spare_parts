"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  Tag,
  Button,
  Select,
  Typography,
  Space,
  Card,
  Popconfirm,
  App,
} from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useSellerStore } from "@/lib/SellerStoreProvider";
import { useOrders, useUpdateOrder } from "@/hooks/queries/useOrders";
import { client, appwriteClientConfig } from "@/lib/appwrite";
import { useQueryClient } from "@tanstack/react-query";

const { Title, Text } = Typography;
const { Option } = Select;

type Status = "New" | "Accepted" | "Shipped" | "Completed" | "Cancelled";

// Logic from previous implementation
function mapStatus(dbStatus: string): Status {
  if (dbStatus === "pending") return "New";
  if (dbStatus === "paid") return "Accepted";
  if (dbStatus === "shipped") return "Shipped";
  if (dbStatus === "completed") return "Completed";
  if (dbStatus === "cancelled") return "Cancelled";
  return "New";
}

function mapStatusToDb(status: Status): string {
  if (status === "New") return "pending";
  if (status === "Accepted") return "paid";
  if (status === "Shipped") return "shipped";
  if (status === "Completed") return "completed";
  if (status === "Cancelled") return "cancelled";
  return "pending";
}

function nextActions(status: Status): Status[] {
  switch (status) {
    case "New":
      return ["Accepted", "Cancelled"];
    case "Accepted":
      return ["Shipped", "Cancelled"];
    case "Shipped":
      return ["Completed"];
    default:
      return [];
  }
}

export default function SellerOrdersPage() {
  const { store } = useSellerStore();
  const sellerId = store?.sellerId;
  const { message } = App.useApp();
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const { data: ordersData, isLoading } = useOrders({ sellerId });
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    if (!sellerId) return;

    const channel = `databases.${appwriteClientConfig.databaseId}.collections.${appwriteClientConfig.ordersCollectionId}.documents`;

    const unsubscribe = client.subscribe(channel, (response) => {
      // Ideally we check if the event relates to us, but simple invalidation is safer
      const event = response.events[0];
      if (
        event.endsWith(".update") ||
        event.endsWith(".create") ||
        event.endsWith(".delete")
      ) {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sellerId, queryClient]);

  const handleUpdateStatus = (
    orderId: string,
    fullId: string,
    newStatus: Status
  ) => {
    updateOrder.mutate(
      {
        orderId: fullId,
        status: mapStatusToDb(newStatus),
      },
      {
        onSuccess: () => {
          message.success(`Order #${orderId} updated to ${newStatus}`);
        },
        onError: (err) => {
          message.error(`Failed to update order: ${err.message}`);
        },
      }
    );
  };

  const filteredOrders = useMemo(() => {
    if (!ordersData) return [];

    // Map API data to Table format
    const mapped = ordersData.map((o) => {
      const items = o.parsedItems || [];
      const firstItem = items[0];
      const productLabel =
        items.length > 1
          ? `${firstItem?.name || "Product"} + ${items.length - 1} more`
          : firstItem?.name || "Unnamed Product";

      const quantity = items.reduce((sum, it) => sum + (it.quantity || 0), 0);

      return {
        key: o.$id,
        id: o.$id.slice(-6).toUpperCase(),
        fullId: o.$id,
        product: productLabel,
        buyer: o.customerId.slice(-6),
        qty: quantity,
        total: o.totalPrice,
        status: mapStatus(o.status),
        date: new Date(o.$createdAt).toLocaleDateString(),
        rawItems: items,
        shippingAddress: o.parsedShippingAddress,
      };
    });

    if (statusFilter === "all") return mapped;
    return mapped.filter((o) => o.status === statusFilter);
  }, [ordersData, statusFilter]);

  const columns = [
    {
      title: "Order ID",
      dataIndex: "id",
      key: "id",
      render: (text: string) => (
        <Text copyable strong>
          {text}
        </Text>
      ),
    },
    {
      title: "Product",
      dataIndex: "product",
      key: "product",
    },
    {
      title: "Buyer",
      dataIndex: "buyer",
      key: "buyer",
    },
    {
      title: "Msg",
      key: "msg",
      render: (_: any, record: any) => {
        // simplified logic from original or just standard layout
        return <Tag>{record.qty} items</Tag>;
      },
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total: number) => `$${total.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: Status) => {
        let color = "default";
        if (status === "New") color = "blue";
        if (status === "Accepted") color = "orange";
        if (status === "Shipped") color = "purple";
        if (status === "Completed") color = "green";
        if (status === "Cancelled") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => {
        const actions = nextActions(record.status);
        if (actions.length === 0) return <Text type="secondary">Locked</Text>;

        return (
          <Space>
            {actions.map((action) => (
              <Popconfirm
                key={action}
                title={`Mark as ${action}?`}
                onConfirm={() =>
                  handleUpdateStatus(record.id, record.fullId, action)
                }
              >
                <Button
                  size="small"
                  type={action === "Cancelled" ? "default" : "primary"}
                  danger={action === "Cancelled"}
                >
                  {action}
                </Button>
              </Popconfirm>
            ))}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 min-h-[80vh]">
      <div>
        <Title level={2} style={{ margin: 0 }}>
          Orders
        </Title>
        <Text type="secondary">Manage customer orders and shipments.</Text>
      </div>

      <Card variant="borderless" className="shadow-sm">
        <div className="mb-4">
          <Select
            defaultValue="all"
            style={{ width: 200 }}
            onChange={(val) => setStatusFilter(val as Status | "all")}
          >
            <Option value="all">All Statuses</Option>
            <Option value="New">New</Option>
            <Option value="Accepted">Accepted</Option>
            <Option value="Shipped">Shipped</Option>
            <Option value="Completed">Completed</Option>
            <Option value="Cancelled">Cancelled</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          loading={isLoading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-4 bg-gray-50 rounded">
                <Text strong>Shipping Address:</Text>
                <div className="mb-2">
                  {typeof record.shippingAddress === "string"
                    ? record.shippingAddress
                    : JSON.stringify(record.shippingAddress, null, 2)}
                </div>
                <Text strong>Items:</Text>
                <ul>
                  {record.rawItems.map((item: any, idx: number) => (
                    <li key={idx}>
                      {item.name} x {item.quantity} - ${item.price}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
