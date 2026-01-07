"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/useSession";
import {
  Table,
  Tag,
  Space,
  Button,
  Card,
  Form,
  Input,
  Select,
  Typography,
  Alert,
  Modal,
  message,
} from "antd";
import {
  UserAddOutlined,
  UserDeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

interface AdminUser {
  $id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "deactivated" | "terminated";
  appwriteUserId: string;
}

export default function AdminManagement() {
  const { profile } = useSession();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [form] = Form.useForm();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/list-admins");
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins);
      }
    } catch (err) {
      message.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInvite = async (values: any) => {
    setInviting(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (res.ok) {
        message.success("Admin invited successfully!");
        form.resetFields();
        fetchAdmins();
      } else {
        message.error(data.error || "Failed to invite admin");
      }
    } catch (err) {
      message.error("Server error");
    } finally {
      setInviting(false);
    }
  };

  const handleStatusUpdate = (
    adminId: string,
    status: "active" | "deactivated" | "terminated"
  ) => {
    const labels = {
      active: "activate",
      deactivated: "deactivate",
      terminated: "terminate",
    };

    Modal.confirm({
      title: `Confirm ${labels[status]}`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to ${labels[status]} this administrator?`,
      okText: "Yes",
      okType: status === "terminated" ? "danger" : "primary",
      cancelText: "No",
      onOk: async () => {
        try {
          const res = await fetch("/api/admin/status", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminId, status }),
          });
          if (res.ok) {
            message.success(`Admin ${status}d successfully`);
            fetchAdmins();
          } else {
            const data = await res.json();
            message.error(data.error || "Update failed");
          }
        } catch (err) {
          message.error("Server error");
        }
      },
    });
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
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
      render: (role: string) => (
        <Tag color={role === "main_admin" ? "purple" : "blue"}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AdminUser["status"]) => {
        const config: Record<
          AdminUser["status"],
          { color: string; text: string; icon: any }
        > = {
          active: {
            color: "success",
            text: "Active",
            icon: <CheckCircleOutlined />,
          },
          deactivated: {
            color: "warning",
            text: "Deactivated",
            icon: <StopOutlined />,
          },
          terminated: {
            color: "error",
            text: "Terminated",
            icon: <UserDeleteOutlined />,
          },
        };
        const item = config[status] || {
          color: "default",
          text: "Unknown",
          icon: null,
        };
        return (
          <Tag icon={item.icon} color={item.color}>
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: AdminUser) => (
        <Space size="middle">
          {record.status === "active" ? (
            <Button
              size="small"
              danger
              onClick={() =>
                handleStatusUpdate(record.appwriteUserId, "deactivated")
              }
            >
              Deactivate
            </Button>
          ) : record.status === "deactivated" ? (
            <Button
              size="small"
              type="primary"
              ghost
              onClick={() =>
                handleStatusUpdate(record.appwriteUserId, "active")
              }
            >
              Reactivate
            </Button>
          ) : null}

          {record.status !== "terminated" && (
            <Button
              size="small"
              danger
              type="text"
              onClick={() =>
                handleStatusUpdate(record.appwriteUserId, "terminated")
              }
            >
              Terminate
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (profile?.role !== "main_admin") {
    return (
      <div className="p-8">
        <Alert
          message="Access Denied"
          description="Only the Main Admin can manage administrator accounts."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Title level={2}>Admin Management</Title>
        <Space>
          <Tag color="success">Active</Tag>
          <Tag color="warning">Deactivated</Tag>
          <Tag color="error">Terminated</Tag>
        </Space>
      </div>

      <Card
        title={
          <>
            <UserAddOutlined /> Invite New Admin
          </>
        }
        variant="outlined"
      >
        <Form
          form={form}
          layout="inline"
          onFinish={handleInvite}
          initialValues={{ role: "admin" }}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, type: "email", message: "Invalid email" },
            ]}
          >
            <Input placeholder="Email Address" style={{ width: 300 }} />
          </Form.Item>
          <Form.Item name="role">
            <Select style={{ width: 150 }}>
              <Option value="admin">Admin</Option>
              <Option value="main_admin">Main Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={inviting}>
              Send Invitation
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={admins}
        rowKey="$id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="shadow-sm border border-slate-100 rounded-lg overflow-hidden"
      />
    </div>
  );
}
