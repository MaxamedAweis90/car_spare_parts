"use client";

import { useState, useEffect } from "react";
import { Dropdown, Empty, Spin } from "antd";
import Link from "next/link";
import { useSession } from "@/lib/auth/useSession";
import { NotificationDocument } from "@/lib/types/follow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function NotificationBell() {
  const { authenticated, profile, loading: sessionLoading } = useSession();
  const queryClient = useQueryClient();

  // 1. Fetch Notifications using React Query
  const { data: notificationData, isLoading: loading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: authenticated && profile?.role === "customer",
    refetchInterval: 60000, // Poll every 60 seconds
  });

  const notifications: NotificationDocument[] =
    notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  // 2. Mark as Read Mutation
  const markReadMutation = useMutation({
    mutationFn: async (id?: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { markAll: true }),
      });
      if (!res.ok) throw new Error("Failed to mark read");
      return id;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["notifications"]);

      // Optimistically update the cache
      queryClient.setQueryData(["notifications"], (old: any) => {
        if (!old) return old;
        const newNotifications = old.notifications.map((n: any) =>
          id === undefined || n.$id === id ? { ...n, isRead: true } : n
        );
        const newUnreadCount = id ? Math.max(0, old.unreadCount - 1) : 0;

        return {
          ...old,
          notifications: newNotifications,
          unreadCount: newUnreadCount,
        };
      });

      return { previousData };
    },
    onError: (err, id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["notifications"], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleMarkAsRead = (id?: string) => {
    markReadMutation.mutate(id);
  };

  const renderDropdown = () => (
    <div className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
        <span className="text-sm font-black uppercase tracking-widest text-slate-900">
          Notifications
        </span>
        {unreadCount > 0 && (
          <button
            onClick={() => handleMarkAsRead()}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center p-8">
            <Spin size="small" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <Link
              key={n.$id}
              href={n.link || "#"}
              onClick={() => !n.isRead && handleMarkAsRead(n.$id)}
              className={`flex flex-col gap-1 border-b border-slate-50 px-4 py-3 transition hover:bg-slate-50 ${
                !n.isRead ? "bg-orange-50/30" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm ${
                    !n.isRead
                      ? "font-bold text-slate-900"
                      : "font-semibold text-slate-600"
                  }`}
                >
                  {n.title}
                </span>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
              <span className="text-[10px] text-slate-400">
                {new Date(n.$createdAt).toLocaleString()}
              </span>
            </Link>
          ))
        ) : (
          <div className="p-8">
            <Empty
              description="No notifications yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-2 text-center">
        <Link
          href="/account/notifications"
          className="text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );

  if (sessionLoading || !authenticated || profile?.role !== "customer")
    return null;

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      popupRender={renderDropdown}
      classNames={{ root: "z-[1002]" }}
    >
      <button
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-95 sm:h-auto sm:w-auto sm:bg-transparent"
        aria-label="Notifications"
      >
        <i className="fa-regular fa-bell text-xl sm:text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-orange-400 sm:-right-2 sm:-top-2">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </Dropdown>
  );
}

