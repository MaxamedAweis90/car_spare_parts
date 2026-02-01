"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  Tag,
  Card,
  Tabs,
  Spin,
  Empty,
  Input,
  Select,
  Result,
  Button,
} from "antd";
import { useSession } from "@/lib/auth/useSession";
import { checkIsMainAdmin } from "@/lib/auth/checkIsMainAdmin";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function AdminActivityPage() {
  const { profile } = useSession();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  const isMainAdmin = checkIsMainAdmin(profile);

  const {
    data: logs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin_activities", filterType, filterRole],
    queryFn: async () => {
      // In a real app, pass filters to query string
      const res = await fetch("/api/activities/list"); // We need to build this endpoint next
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    // Only fetch if Main Admin
    enabled: isMainAdmin,
  });

  const columns = [
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-700">{text}</span>
          <span className="text-xs text-slate-400 capitalize">
            {record.userRole}
          </span>
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        let color = "blue";
        if (action.includes("CREATE")) color = "green";
        if (action.includes("DELETE")) color = "red";
        if (action.includes("UPDATE")) color = "orange";
        if (action.includes("APPROVE")) color = "cyan";
        return <Tag color={color}>{action.replace(/_/g, " ")}</Tag>;
      },
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      render: (details: string | object) => {
        try {
          const obj =
            typeof details === "string" ? JSON.parse(details) : details;
          return (
            <span className="text-xs text-slate-500 font-mono">
              {JSON.stringify(obj).slice(0, 50)}
              {JSON.stringify(obj).length > 50 ? "..." : ""}
            </span>
          );
        } catch {
          return <span className="text-xs text-slate-400">-</span>;
        }
      },
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">
            {dayjs(date).format("DD MMM YYYY, h:mm A")}
          </span>
          <span className="text-xs text-slate-400">
            {dayjs(date).fromNow()}
          </span>
        </div>
      ),
    },
  ];

  if (!isMainAdmin) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Result
          status="403"
          title="403"
          subTitle="Sorry, you are not authorized to access this page."
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            System Activities
          </h1>
          <p className="text-slate-500">
            Audit trail of admin and seller actions.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex gap-4">
          {/* Filters could go here */}
          <Select
            defaultValue="all"
            style={{ width: 150 }}
            onChange={setFilterRole}
            options={[
              { value: "all", label: "All Roles" },
              { value: "admin", label: "Admins" },
              { value: "seller", label: "Sellers" },
            ]}
          />
        </div>
        <Table
          dataSource={logs?.items || []}
          columns={columns}
          loading={isLoading}
          rowKey="$id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
