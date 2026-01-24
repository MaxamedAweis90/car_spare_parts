"use client";

import { useQuery } from "@tanstack/react-query";
import { List, Avatar, Typography, Badge, Empty, Button } from "antd";
import { BellOutlined, UserOutlined, ShopOutlined } from "@ant-design/icons";
import { useSession } from "@/lib/auth/useSession";
import { checkIsMainAdmin } from "@/lib/auth/checkIsMainAdmin";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";

dayjs.extend(relativeTime);

const { Text } = Typography;

export default function NotificationsPopover() {
  const { profile } = useSession();
  const isMainAdmin = checkIsMainAdmin(profile);

  const { data, isLoading } = useQuery({
    queryKey: ["admin_notifications"],
    queryFn: async () => {
      const res = await fetch("/api/activities/list?limit=5");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: isMainAdmin, // Only fetch for Main Admin
    refetchInterval: 30000, // Poll every 30s
  });

  const activities = data?.items || [];

  // For non-main admins, or future use
  if (!isMainAdmin) {
    return (
      <div className="w-80 p-4 text-center text-slate-500">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No new notifications"
        />
      </div>
    );
  }

  return (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="p-3 border-b flex justify-between items-center bg-slate-50">
        <Text strong>Recent Activity</Text>
        <Link
          href="/admin/activities"
          className="text-xs text-blue-600 hover:underline"
        >
          View All
        </Link>
      </div>

      {isLoading && <div className="p-4 text-center">Loading...</div>}

      {!isLoading && activities.length === 0 && (
        <div className="p-8 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="All caught up!"
          />
        </div>
      )}

      <List
        itemLayout="horizontal"
        dataSource={activities}
        renderItem={(item: any) => (
          <List.Item className="px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <List.Item.Meta
              avatar={
                <Avatar
                  icon={
                    item.userRole === "seller" ? (
                      <ShopOutlined />
                    ) : (
                      <UserOutlined />
                    )
                  }
                  className={
                    item.userRole === "seller"
                      ? "bg-purple-100 text-purple-600"
                      : "bg-blue-100 text-blue-600"
                  }
                />
              }
              title={
                <Text className="text-sm font-medium">
                  {item.action.replace(/_/g, " ")}
                </Text>
              }
              description={
                <div className="flex flex-col gap-0.5">
                  <Text className="text-xs text-slate-500">
                    <span className="font-bold">{item.userName}</span>
                    {item.details &&
                    typeof item.details === "string" &&
                    item.details.includes("details")
                      ? ` - ${item.details}`
                      : ""}
                  </Text>
                  <Text className="text-[10px] text-slate-400">
                    {dayjs(item.createdAt).fromNow()}
                  </Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
