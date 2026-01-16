"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/useSession";
import { Switch, Button, Empty, Spin, App } from "antd";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FollowedStore {
  storeId: string;
  storeName: string;
  storeSlug: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export default function FollowedStoresPage() {
  const { authenticated, loading: sessionLoading } = useSession();
  const { message: msg } = App.useApp();
  const queryClient = useQueryClient();

  // 1. Fetch stores using React Query
  const { data, isLoading: loading } = useQuery({
    queryKey: ["followedStores"],
    queryFn: async () => {
      const res = await fetch("/api/follows/list");
      if (!res.ok) throw new Error("Failed to fetch stores");
      return res.json();
    },
    enabled: authenticated,
  });

  const stores: FollowedStore[] = data?.stores || [];

  // 2. Toggle Preference Mutation
  const prefMutation = useMutation({
    mutationFn: async ({
      storeId,
      field,
      value,
    }: {
      storeId: string;
      field: string;
      value: boolean;
    }) => {
      const res = await fetch("/api/follows/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update preferences");
      return { storeId, field, value };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followedStores"] });
      msg.success("Preferences updated.");
    },
    onError: () => msg.error("Failed to update preferences."),
  });

  // 3. Unfollow Mutation
  const unfollowMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action: "unfollow" }),
      });
      if (!res.ok) throw new Error("Failed to unfollow");
      return storeId;
    },
    onSuccess: (storeId) => {
      queryClient.invalidateQueries({ queryKey: ["followedStores"] });
      queryClient.invalidateQueries({ queryKey: ["followStatus", storeId] });
      msg.success("Unfollowed store.");
    },
    onError: () => msg.error("Failed to unfollow store."),
  });

  const handleTogglePreference = (
    storeId: string,
    field: string,
    value: boolean
  ) => {
    prefMutation.mutate({ storeId, field, value });
  };

  const handleUnfollow = (storeId: string) => {
    unfollowMutation.mutate(storeId);
  };

  // No longer blocking on sessionLoading to allow rehydrated cache to render instantly.
  if (!authenticated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-bold">
          Please login to view followed stores
        </h1>
        <Link href="/auth/login">
          <Button type="primary">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f4f1e9] min-h-screen">
      <div className="mx-auto w-full md:max-w-10/12 px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { title: "Account", href: "/account" },
            { title: "Followed Stores" },
          ]}
        />

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-slate-900">
            My Followed Stores
          </h1>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Spin />
            </div>
          ) : stores.length > 0 ? (
            stores.map((store) => (
              <div
                key={store.storeId}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-black/5"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/stores/${store.storeSlug}`}
                    className="text-lg font-bold text-slate-900 hover:text-orange-500 hover:underline"
                  >
                    {store.storeName}
                  </Link>
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => handleUnfollow(store.storeId)}
                  >
                    Unfollow
                  </Button>
                </div>

                <div className="mt-4 space-y-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <i className="fa-regular fa-bell text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">
                        In-app alerts
                      </span>
                    </div>
                    <Switch
                      size="small"
                      checked={store.inAppEnabled}
                      onChange={(val) =>
                        handleTogglePreference(
                          store.storeId,
                          "inAppEnabled",
                          val
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <i className="fa-regular fa-envelope text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">
                        Email deals
                      </span>
                    </div>
                    <Switch
                      size="small"
                      checked={store.emailEnabled}
                      onChange={(val) =>
                        handleTogglePreference(
                          store.storeId,
                          "emailEnabled",
                          val
                        )
                      }
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Link href={`/stores/${store.storeSlug}`}>
                    <Button
                      block
                      className="rounded-full border-slate-200 font-bold hover:border-orange-500 hover:text-orange-500"
                    >
                      Visit Store
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12">
              <Empty
                description="You are not following any stores yet"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Link href="/stores">
                  <Button
                    type="primary"
                    shape="round"
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Explore Stores
                  </Button>
                </Link>
              </Empty>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
