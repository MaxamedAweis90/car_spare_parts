"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Popconfirm,
  Typography,
  Card,
  Avatar,
  App,
  Switch,
  Modal,
  Form,
  InputNumber,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import {
  useProducts,
  useDeleteProduct,
  useUpdateProduct,
} from "@/hooks/queries/useProducts";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/queries/useCategories";
import { useSellerStore } from "@/lib/SellerStoreProvider";
import { useFilterStore } from "@/stores/ui-store"; // Use persisted store

const { Title } = Typography;
const { Option } = Select;

export default function SellerProductsPage() {
  const { store } = useSellerStore();
  const sellerId = store?.sellerId;
  const { message } = App.useApp();

  // Zustand Store for filters (Client side persistence)
  const { searchTerm, setSearchTerm, category, setCategory } = useFilterStore();

  // Local state for pagination since we probably don't need to persist page number strongly
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useProducts({
    sellerId,
    search: searchTerm,
    category,
    page: currentPage,
    limit: pageSize,
  });

  const { data: categories } = useCategories();
  const deleteMutation = useDeleteProduct();
  const updateProduct = useUpdateProduct();

  // Bulk actions state
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean | undefined>(undefined);

  const queryClient = useQueryClient(); // Add this to invalidate queries

  const handleBulkDiscount = async (values: any) => {
    setBulkLoading(true);
    try {
      const res = await fetch("/api/seller/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: selectedRowKeys,
          discountPercent: values.discountPercent,
          startDate: values.startDate?.toISOString(),
          expiryDate: values.expiryDate?.toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Bulk update failed");

      message.success("Bulk discount applied successfully");
      setIsBulkModalVisible(false);
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      message.error("Failed to apply bulk discount");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleStatusToggle = (id: string, checked: boolean) => {
    updateProduct.mutate(
      { productId: id, data: { isActive: checked } },
      {
        onSuccess: () =>
          message.success(`Product ${checked ? "activated" : "deactivated"}`),
        onError: () => message.error("Failed to update status"),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        message.success("Product deleted successfully");
      },
      onError: () => {
        message.error("Failed to delete product");
      },
    });
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <Space orientation="horizontal">
          <Avatar
            src={record.imageUrl}
            shape="square"
            size="large"
            icon={
              !record.imageUrl && (
                <span style={{ fontSize: 10 }}>{text[0]}</span>
              )
            }
          />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.brand}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Category",
      dataIndex: "mainCategoryId",
      key: "category",
      render: (catId: string) => {
        const cat = categories?.find((c) => c.id === catId);
        return <Tag>{cat?.name || catId || "Uncategorized"}</Tag>;
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number, record: any) => (
        <Space orientation="vertical" size={0}>
          <div className="font-bold">${Number(price).toFixed(2)}</div>
          {record.onSale && record.originalPrice && (
            <div className="text-xs text-gray-400 line-through">
              ${Number(record.originalPrice).toFixed(2)}
            </div>
          )}
          {record.onSale && (
            <Tag
              color="red"
              className="text-[10px] m-0 border-none px-1 h-4 leading-4"
            >
              SALE
            </Tag>
          )}
        </Space>
      ),
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: "Status & Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number, record: any) => {
        const isActive = record.isActive;

        return (
          <Space orientation="vertical" size={0}>
            <Space orientation="horizontal">
              <Switch
                size="small"
                checked={isActive}
                loading={
                  updateProduct.isPending &&
                  updateProduct.variables?.productId === record.$id
                }
                onChange={(checked) => handleStatusToggle(record.$id, checked)}
              />
              <span className="text-xs text-gray-500">
                {isActive ? "Active" : "Inactive"}
              </span>
            </Space>
            <span className="text-xs text-gray-500">
              {stock === 0 ? (
                <span className="text-red-500">Out of Stock</span>
              ) : (
                `${stock} units`
              )}
            </span>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Link href={`/seller/products/${record.$id}`}>
            <Button icon={<EditOutlined />} type="text" />
          </Link>
          <Popconfirm
            title="Delete product"
            description="Are you sure to delete this product?"
            onConfirm={() => handleDelete(record.$id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<DeleteOutlined />}
              type="text"
              danger
              loading={deleteMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-[80vh] space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Products
          </Title>
          <Typography.Text type="secondary">
            Manage your product catalog
          </Typography.Text>
        </div>
        <div>
          <Link href="/seller/products/new">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="rounded-xl"
            >
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <Card variant="borderless" className="shadow-sm rounded-2xl">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            className="h-11 rounded-xl"
            allowClear
          />
          <Select
            placeholder="All Categories"
            style={{ width: 220 }}
            className="h-11 rounded-xl"
            allowClear
            value={category}
            onChange={setCategory}
          >
            {categories?.map((c) => (
              <Option key={c.id} value={c.id}>
                {c.name}
              </Option>
            ))}
          </Select>

          <Select
            placeholder="Offer Status"
            style={{ width: 160 }}
            className="h-11 rounded-xl"
            allowClear
            value={onSaleOnly}
            onChange={setOnSaleOnly}
          >
            <Option value={true}>On Sale</Option>
            <Option value={false}>Regular Price</Option>
          </Select>

          {selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              danger
              className="h-11 rounded-xl font-semibold"
              onClick={() => setIsBulkModalVisible(true)}
            >
              Bulk Discount ({selectedRowKeys.length})
            </Button>
          )}
        </div>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={
            data?.products?.filter(
              (p: any) => onSaleOnly === undefined || p.onSale === onSaleOnly
            ) || []
          }
          rowKey="$id"
          loading={isLoading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.total || 0,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
          }}
        />
      </Card>

      <Modal
        title="Apply Bulk Discount"
        open={isBulkModalVisible}
        onCancel={() => setIsBulkModalVisible(false)}
        footer={null}
        destroyOnHidden
        className="rounded-2xl overflow-hidden"
      >
        <Form layout="vertical" onFinish={handleBulkDiscount} className="mt-4">
          <Form.Item
            name="discountPercent"
            label={
              <span className="font-semibold text-gray-700">
                Discount Percentage (%)
              </span>
            }
            rules={[
              { required: true, message: "Please enter discount percentage" },
            ]}
          >
            <InputNumber
              min={1}
              max={99}
              className="w-full h-12 rounded-xl"
              placeholder="e.g. 20"
              suffix="%"
            />
          </Form.Item>

          <Form.Item
            name="startDate"
            label={
              <span className="font-semibold text-gray-700">
                Start Date (Optional)
              </span>
            }
          >
            <DatePicker
              showTime
              className="w-full h-12 rounded-xl"
              placeholder="When should the offer start?"
            />
          </Form.Item>

          <Form.Item
            name="expiryDate"
            label={
              <span className="font-semibold text-gray-700">
                Expiry Date (Optional)
              </span>
            }
          >
            <DatePicker
              showTime
              className="w-full h-12 rounded-xl"
              placeholder="When should the offer end?"
            />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button
              className="h-12 rounded-xl px-8"
              onClick={() => setIsBulkModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="h-12 rounded-xl px-8 font-bold"
              loading={bulkLoading}
            >
              Apply to {selectedRowKeys.length} Products
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
