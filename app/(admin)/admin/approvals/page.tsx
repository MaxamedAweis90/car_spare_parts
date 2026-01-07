"use client";

import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Popconfirm,
  Space,
  App,
} from "antd";
import { CheckOutlined, ReloadOutlined } from "@ant-design/icons";
import { useSession } from "@/lib/useSession";
import { usePendingSellers, useApproveSeller } from "@/hooks/queries/useUsers";

const { Title, Text } = Typography;

export default function AdminApprovalsPage() {
  const { profile } = useSession();
  const { message } = App.useApp();
  const { data: sellers, isLoading, refetch } = usePendingSellers();
  const approveMutation = useApproveSeller();

  const handleApprove = (userId: string) => {
    if (!profile?.$id) return;
    approveMutation.mutate(
      { userId, updaterId: profile.$id },
      {
        onSuccess: () => {
          message.success("Seller approved successfully");
        },
        onError: () => {
          message.error("Failed to approve seller");
        },
      }
    );
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: any) => (
        <Popconfirm
          title="Approve Seller"
          description={`Are you sure you want to approve ${record.name}?`}
          onConfirm={() => handleApprove(record.$id)}
          okText="Approve"
          cancelText="Cancel"
        >
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={approveMutation.isPending}
            className="bg-slate-900"
          >
            Approve
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Seller Approvals
          </Title>
          <Text type="secondary">Review and approve new seller accounts.</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      <Card variant="borderless" className="shadow-sm">
        <Table
          columns={columns}
          dataSource={sellers}
          rowKey="$id"
          loading={isLoading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No pending sellers found" }}
        />
      </Card>
    </div>
  );
}
