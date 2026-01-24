import React from "react";
import { Avatar, Typography, Badge } from "antd";
import { FileImageOutlined } from "@ant-design/icons";
import DebounceSelect from "./DebounceSelect";

const { Text } = Typography;

interface ProductValue {
  label: React.ReactNode;
  value: string;
  details?: any;
}

interface ProductSearchInputProps {
  value?: ProductValue;
  onChange?: (value: ProductValue) => void;
  style?: React.CSSProperties;
}

async function fetchProductList(search: string): Promise<ProductValue[]> {
  const response = await fetch(`/api/products?search=${search}`);
  const data = await response.json();

  if (!data.items) return [];

  return data.items.map((product: any) => ({
    label: (
      <div className="flex items-center gap-3 py-1">
        <Avatar
          shape="square"
          size="large"
          src={product.imageUrl}
          icon={<FileImageOutlined />}
          className="flex-shrink-0"
        />
        <div className="flex flex-col overflow-hidden w-full">
          <div className="flex justify-between w-full">
            <Text strong className="truncate">
              {product.name}
            </Text>
            <Text strong className="text-green-600">
              ${product.price}
            </Text>
          </div>
          <div className="flex justify-between w-full">
            <Text type="secondary" className="text-xs truncate">
              Qty: {product.stock}
            </Text>
            {product.onSale && (
              <Badge status="processing" text="On Sale" className="text-xs" />
            )}
          </div>
        </div>
      </div>
    ),
    value: product.$id,
    details: product,
  }));
}

export default function ProductSearchInput({
  value,
  onChange,
  style,
}: ProductSearchInputProps) {
  return (
    <DebounceSelect
      showSearch
      value={value}
      placeholder="Search products..."
      fetchOptions={fetchProductList}
      onChange={(newValue) => {
        onChange?.(newValue as ProductValue);
      }}
      style={{ width: "100%", ...style }}
    />
  );
}
