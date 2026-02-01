"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar, Typography, Empty, Skeleton } from "antd";
import {
  UserOutlined,
  ShopOutlined,
  AlertOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  KeyOutlined,
  LoginOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

interface RecentActivityListProps {
  limit?: number;
  className?: string; // Allow styling injection
}

export default function RecentActivityList({
  limit = 5,
  className = "",
}: RecentActivityListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin_recent_activities", limit],
    queryFn: async () => {
      const res = await fetch(`/api/activities/list?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const getIcon = (action: string) => {
    if (action.includes("INVITE")) return <UserAddOutlined />;
    if (action.includes("DELETE")) return <UserDeleteOutlined />;
    if (action.includes("APPROVE")) return <CheckCircleOutlined />;
    if (action.includes("DEACTIVATE")) return <StopOutlined />;
    if (action.includes("PASSWORD")) return <KeyOutlined />;
    if (action.includes("LOGIN")) return <LoginOutlined />;
    return <SafetyCertificateOutlined />;
  };

  const getColor = (action: string) => {
    if (action.includes("DELETE")) return "bg-red-50 text-red-500";
    if (action.includes("DEACTIVATE")) return "bg-orange-50 text-orange-500";
    if (action.includes("APPROVE")) return "bg-emerald-50 text-emerald-500";
    return "bg-blue-50 text-blue-500";
  };

  if (isLoading) return <Skeleton active paragraph={{ rows: 3 }} />;

  if (error || !data?.items || data.items.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={error ? "Failed to load" : "No recent activity"}
      />
    );
  }

  return (
    <div className={className}>
      {data.items.map((item: any, index: number) => (
        <div
          key={item.$id || index}
          className="px-2 py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg flex items-start gap-3"
        >
          <div
            className={`p-2 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(item.action)}`}
          >
            {getIcon(item.action)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <Text strong className="text-sm">
                {item.adminName || item.userName}
              </Text>
              <div className="flex flex-col items-end">
                <Text className="text-[10px] text-slate-500">
                  {dayjs(item.createdAt).format("DD MMM, h:mm A")}
                </Text>
                <Text className="text-[9px] text-slate-400">
                  {dayjs(item.createdAt).fromNow()}
                </Text>
              </div>
            </div>
            <div className="flex flex-col mt-1">
              <Text className="text-xs text-slate-600 capitalize">
                {item.action.replace(/_/g, " ").toLowerCase()}
              </Text>
              <Text
                type="secondary"
                className="text-[10px] truncate max-w-[200px]"
                title={item.details}
              >
                {item.targetName ||
                  (typeof item.details === "string"
                    ? item.details
                    : JSON.stringify(item.details))}
              </Text>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
