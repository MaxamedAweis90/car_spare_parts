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
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useSellerStore } from "@/lib/providers/SellerStoreProvider";
import { useOrders, useUpdateOrder } from "@/hooks/queries/useOrders";
import { client, appwriteClientConfig } from "@/lib/api/appwrite";
import { useQueryClient } from "@tanstack/react-query";

import {
  getStatusLabel,
  getStatusColor,
  getAllowedNextStatuses,
} from "@/lib/utils/orderStatusTransitions";
import type { OrderStatus } from "@/lib/types/order";

const { Title, Text } = Typography;
const { Option } = Select;

// Map database status to display label
function getDisplayStatus(dbStatus: OrderStatus): string {
  return getStatusLabel(dbStatus);
}

// Get allowed next statuses for current status
function getNextActions(
  dbStatus: OrderStatus,
  userRole: string = "seller",
): OrderStatus[] {
  return getAllowedNextStatuses(dbStatus, userRole as any);
}

export default function SellerOrdersPage() {
  const { store } = useSellerStore();
  const sellerId = store?.sellerId;
  const { message } = App.useApp();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

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
    newStatus: OrderStatus,
  ) => {
    updateOrder.mutate(
      {
        orderId: fullId,
        status: newStatus,
      },
      {
        onSuccess: () => {
          message.success(
            `Order #${orderId} updated to ${getDisplayStatus(newStatus)}`,
          );
        },
        onError: (err) => {
          message.error(`Failed to update order: ${err.message}`);
        },
      },
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
        status: o.status as OrderStatus,
        statusLabel: getDisplayStatus(o.status as OrderStatus),
        date: new Date(o.$createdAt).toLocaleDateString(),
        rawItems: items,
        shippingAddress: o.parsedShippingAddress,
        paymentMethod: o.paymentMethod,
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
      dataIndex: "statusLabel",
      key: "status",
      render: (_: string, record: any) => {
        const color = getStatusColor(record.status);
        return <Tag color={color}>{record.statusLabel}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      width: 200,
      render: (_: any, record: any) => {
        const isTerminal = ["delivered", "cancelled", "rejected"].includes(
          record.status,
        );
        const actions = getNextActions(record.status);

        if (isTerminal) {
          if (record.status === "delivered") {
            return (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Completed
              </Tag>
            );
          }
          return <Text type="secondary">Closed</Text>;
        }

        return (
          <Select
            placeholder="Change Status"
            style={{ width: "100%" }}
            onChange={(value) =>
              value &&
              handleUpdateStatus(record.id, record.fullId, value as OrderStatus)
            }
            value={undefined} // Reset after selection to show placeholder
            options={actions.map((status) => ({
              label: getDisplayStatus(status),
              value: status,
              className:
                status === "cancelled" || status === "rejected"
                  ? "text-red-500"
                  : "",
            }))}
          />
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
            style={{ width: 250 }}
            onChange={(val) => setStatusFilter(val as OrderStatus | "all")}
          >
            <Option value="all">All Statuses</Option>
            <Option value="pending_verification">Needs Verification</Option>
            <Option value="awaiting_payment">Awaiting Payment</Option>
            <Option value="paid">Paid</Option>
            <Option value="approved_for_fulfillment">
              Approved for Fulfillment
            </Option>
            <Option value="packing">Packing</Option>
            <Option value="shipped">Shipped</Option>
            <Option value="delivered">Delivered</Option>
            <Option value="cancelled">Cancelled</Option>
            <Option value="rejected">Rejected</Option>
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
