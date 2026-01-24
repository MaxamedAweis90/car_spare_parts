import React from "react";
import { Avatar, Typography, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";
import DebounceSelect from "./DebounceSelect";

const { Text } = Typography;

interface UserValue {
  label: React.ReactNode;
  value: string;
  details?: any; // Full user object
}

interface CustomerSearchInputProps {
  value?: UserValue;
  onChange?: (value: UserValue) => void;
  style?: React.CSSProperties;
}

async function fetchUserList(username: string): Promise<UserValue[]> {
  const response = await fetch(`/api/users?role=customer&search=${username}`);
  const data = await response.json();

  if (!data.documents) return [];

  return data.documents.map((user: any) => ({
    label: (
      <div className="flex items-center gap-3 py-1">
        <Avatar
          size="small"
          src={user.avatarUrl}
          icon={<UserOutlined />}
          className="flex-shrink-0"
        >
          {user.name?.[0]}
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <Text strong className="truncate">
            {user.name}
          </Text>
          <Text type="secondary" className="text-xs truncate">
            ID: {user.$id}
          </Text>
        </div>
      </div>
    ),
    value: user.$id,
    details: user,
  }));
}

export default function CustomerSearchInput({
  value,
  onChange,
  style,
}: CustomerSearchInputProps) {
  return (
    <DebounceSelect
      showSearch
      value={value}
      placeholder="Search by name..."
      fetchOptions={fetchUserList}
      onChange={(newValue) => {
        onChange?.(newValue as UserValue);
      }}
      style={{ width: "100%", ...style }}
    />
  );
}
