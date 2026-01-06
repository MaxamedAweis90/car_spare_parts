"use client";

import { useState, useMemo } from "react";
import {
  Tabs,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Card,
  Typography,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// --- API Fetchers ---

const fetchAdminProducts = async () => {
  const res = await fetch("/api/admin/products?limit=200");
  if (!res.ok) throw new Error("Failed to load products");
  const data = await res.json();
  return data.items || [];
};

const fetchAdminCategories = async () => {
  const res = await fetch("/api/admin/categories?limit=200");
  if (!res.ok) throw new Error("Failed to load categories");
  const data = await res.json();
  return data.items || [];
};

const fetchCompatibilities = async (productId?: string) => {
  const url = productId
    ? `/api/admin/compatibilities?productId=${encodeURIComponent(
        productId
      )}&limit=200`
    : `/api/admin/compatibilities?limit=200`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load compatibilities");
  const data = await res.json();
  return data.items || [];
};

// --- Components ---

function ProductsTab() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: fetchAdminProducts,
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: "Seller ID",
      dataIndex: "sellerId",
      key: "sellerId",
      render: (id: string) => <Tag>{id.slice(-6)}</Tag>,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (p: number) => `$${Number(p).toFixed(2)}`,
    },
    { title: "Stock", dataIndex: "stock", key: "stock" },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Link href={`/admin/catalog/products/${record.$id}`}>
          <Button size="small" icon={<EditOutlined />}>
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={products}
      rowKey="$id"
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
}

function CategoriesTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchAdminCategories,
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      message.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      message.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (error: any) => {
      message.error(error.message);
    },
  });

  const categoryType = Form.useWatch("type", form);

  const parentOptions = useMemo(() => {
    if (!categories) return [];
    if (categoryType === "system") {
      return categories
        .filter((c: any) => c.type === "Vehicle" || c.type === "vehicle")
        .map((c: any) => ({ label: c.name, value: c.$id }));
    }
    if (categoryType === "sellable") {
      return categories
        .filter((c: any) => c.type === "System" || c.type === "system")
        .map((c: any) => ({ label: c.name, value: c.$id }));
    }
    return [];
  }, [categories, categoryType]);

  // Hierarchical Data Builders
  const vehicleTree = useMemo(() => {
    return (
      categories?.filter((c: any) => c.type?.toLowerCase() === "vehicle") || []
    );
  }, [categories]);

  const systemTree = useMemo(() => {
    const vehicles =
      categories?.filter((c: any) => c.type?.toLowerCase() === "vehicle") || [];
    const systems =
      categories?.filter((c: any) => c.type?.toLowerCase() === "system") || [];

    return vehicles
      .map((v: any) => ({
        ...v,
        isParent: true,
        children: systems.filter((s: any) => s.parentCategoryId === v.$id),
      }))
      .filter((v: any) => v.children.length > 0);
  }, [categories]);

  const sellableTree = useMemo(() => {
    const systems =
      categories?.filter((c: any) => c.type?.toLowerCase() === "system") || [];
    const sellables =
      categories?.filter((c: any) => c.type?.toLowerCase() === "sellable") ||
      [];

    return systems
      .map((s: any) => ({
        ...s,
        isParent: true,
        children: sellables.filter(
          (sel: any) => sel.parentCategoryId === s.$id
        ),
      }))
      .filter((s: any) => s.children.length > 0);
  }, [categories]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
      render: (text: string, record: any) => (
        <span
          style={{
            fontWeight: record.isParent ? "800" : "normal",
            color: record.isParent ? "#64748b" : "inherit",
          }}
        >
          {text}{" "}
          {record.isParent && (
            <Text
              type="secondary"
              style={{
                fontStyle: "italic",
                fontWeight: "400",
                fontSize: "11px",
              }}
            >
              {" "}
              (Parent Category)
            </Text>
          )}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (type: string) => {
        const t = type?.toLowerCase();
        return (
          <Tag
            color={
              t === "vehicle" ? "blue" : t === "system" ? "green" : "orange"
            }
          >
            {type}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_: any, record: any) => {
        if (record.isParent) return null;
        return (
          <Popconfirm
            title="Delete category?"
            description="This may affect products using this category."
            onConfirm={() => deleteMutation.mutate(record.$id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              type="text"
              icon={<DeleteOutlined />}
              loading={
                deleteMutation.isPending &&
                deleteMutation.variables === record.$id
              }
            />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Catalog taxonomy
          </Title>
          <Text type="secondary">
            Organize vehicles, systems, and sellable parts.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Category
        </Button>
      </div>

      <Tabs
        defaultActiveKey="vehicle"
        type="card"
        items={[
          {
            key: "vehicle",
            label: "1. Vehicles",
            children: (
              <Table
                columns={columns}
                dataSource={vehicleTree}
                rowKey="$id"
                loading={isLoading}
                pagination={{ pageSize: 20 }}
                size="middle"
              />
            ),
          },
          {
            key: "system",
            label: "2. Systems (by Vehicle)",
            children: (
              <Table
                columns={columns}
                dataSource={systemTree}
                rowKey="$id"
                loading={isLoading}
                pagination={{ pageSize: 20 }}
                size="middle"
                expandable={{ defaultExpandAllRows: true }}
              />
            ),
          },
          {
            key: "sellable",
            label: "3. Sellables (by System)",
            children: (
              <Table
                columns={columns}
                dataSource={sellableTree}
                rowKey="$id"
                loading={isLoading}
                pagination={{ pageSize: 20 }}
                size="middle"
                expandable={{ defaultExpandAllRows: true }}
              />
            ),
          },
        ]}
      />

      <Modal
        title="Add New Category"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          initialValues={{ type: "vehicle" }}
        >
          <Form.Item
            name="type"
            label="Category Type"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="vehicle">Vehicle (Root)</Option>
              <Option value="system">System (Parent: Vehicle)</Option>
              <Option value="sellable">Sellable (Parent: System)</Option>
            </Select>
          </Form.Item>

          {categoryType !== "vehicle" && (
            <Form.Item
              name="parentCategoryId"
              label={
                categoryType === "system" ? "Parent Vehicle" : "Parent System"
              }
              rules={[{ required: true, message: "Please select a parent" }]}
            >
              <Select
                showSearch
                placeholder="Select parent category"
                optionFilterProp="label"
                options={parentOptions}
              />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="Category Name(s)"
            help="Enter one or multiple names separated by commas or new lines."
            rules={[
              { required: true, message: "Please enter at least one name" },
            ]}
          >
            <TextArea rows={4} placeholder="Brakes, Engine, Transmission..." />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

function CompatibilitiesTab() {
  const [filterProductId, setFilterProductId] = useState<string>("");
  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: fetchAdminProducts,
  });

  const { data: compatibilities, isLoading } = useQuery({
    queryKey: ["admin", "compatibilities", filterProductId],
    queryFn: () => fetchCompatibilities(filterProductId),
    enabled: true,
  });

  const columns = [
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (text: string, rec: any) =>
        text || `${rec.vehicleType} ${rec.make}`,
    },
    { title: "Make", dataIndex: "make", key: "make" },
    { title: "Model", dataIndex: "model", key: "model" },
    {
      title: "Year",
      key: "year",
      render: (_: any, r: any) => `${r.yearFrom}-${r.yearTo}`,
    },
    {
      title: "Product",
      dataIndex: "productId",
      key: "prod",
      render: (pid: string) => (pid ? <Tag>{pid.slice(-6)}</Tag> : "Global"),
    },
  ];

  return (
    <Space orientation="vertical" style={{ width: "100%" }}>
      <Space orientation="horizontal">
        <Text>Filter by Product:</Text>
        <Select
          showSearch
          style={{ width: 200 }}
          value={filterProductId}
          onChange={setFilterProductId}
          allowClear
          placeholder="All Products"
          optionFilterProp="children"
        >
          {products?.map((p: any) => (
            <Option key={p.$id} value={p.$id}>
              {p.name}
            </Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />}>
          Add Compatibility
        </Button>
      </Space>
      <Table
        columns={columns}
        dataSource={compatibilities}
        rowKey="$id"
        loading={isLoading}
      />
    </Space>
  );
}

export default function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState("products");

  const items = [
    { key: "products", label: "Products", children: <ProductsTab /> },
    { key: "categories", label: "Categories", children: <CategoriesTab /> },
    {
      key: "compatibilities",
      label: "Compatibilities",
      children: <CompatibilitiesTab />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Title level={2} style={{ margin: 0 }}>
          Catalog Management
        </Title>
        <Text type="secondary">Centralized control of all platform data.</Text>
      </div>

      <Card variant="borderless" className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>
    </div>
  );
}
