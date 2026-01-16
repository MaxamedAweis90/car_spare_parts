"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/useSession";
import { useRouter, useSearchParams } from "next/navigation";
import { App } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FollowButtonProps {
  storeId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  storeId,
  onFollowChange,
}: FollowButtonProps) {
  const { authenticated, profile, loading } = useSession();
  const router = useRouter();
  const { message: msg } = App.useApp();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // 1. Fetch Follow Status using React Query
  const { data: followData, isLoading: isFetching } = useQuery({
    queryKey: ["followStatus", storeId, profile?.$id],
    queryFn: async () => {
      const res = await fetch(`/api/follows?storeId=${storeId}`);
      if (!res.ok) throw new Error("Failed to fetch follow status");
      return res.json();
    },
    enabled: !!storeId,
  });

  // 2. Toggle Follow using Mutation
  const mutation = useMutation({
    mutationFn: async (action: "follow" | "unfollow") => {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update follow status");
      }
      return res.json();
    },
    onMutate: async (action) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["followStatus", storeId] });

      // Snapshot the previous value
      const previousStatus = queryClient.getQueryData([
        "followStatus",
        storeId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(["followStatus", storeId], (old: any) => ({
        ...old,
        isFollowing: action === "follow",
        followerCount:
          action === "follow"
            ? (old?.followerCount || 0) + 1
            : Math.max(0, (old?.followerCount || 0) - 1),
      }));

      // Return a context object with the snapshotted value
      return { previousStatus };
    },
    onError: (err: any, action, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStatus) {
        queryClient.setQueryData(
          ["followStatus", storeId],
          context.previousStatus
        );
      }
      msg.error(err.message || "Something went wrong.");
    },
    onSuccess: (data) => {
      msg.success(
        data.isFollowing
          ? "You are now following this store!"
          : "Unfollowed store."
      );
      if (onFollowChange) onFollowChange(data.isFollowing);
    },
    onSettled: () => {
      // Always refetch after error or success to promise that the server-side state is synced
      queryClient.invalidateQueries({ queryKey: ["followStatus", storeId] });
    },
  });

  const isFollowing = followData?.isFollowing || false;
  const followerCount = followData?.followerCount || 0;
  const isProcessing = mutation.isPending;

  useEffect(() => {
    // AUTO-FOLLOW LOGIC:
    if (
      searchParams.get("follow") === "true" &&
      authenticated &&
      profile?.role === "customer"
    ) {
      if (followData && !followData.isFollowing && !mutation.isPending) {
        // Clean URL
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.delete("follow");
        const newUrl =
          window.location.pathname +
          (newParams.toString() ? `?${newParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);

        mutation.mutate("follow");
      }
    }
  }, [followData, authenticated, profile?.role]);

  const handleToggleFollow = async () => {
    // 1. Guest Handling
    if (!authenticated) {
      msg.loading("Redirecting to login...", 1.5);
      const search = new URLSearchParams(window.location.search);
      search.set("follow", "true");
      const returnUrl = encodeURIComponent(
        `${window.location.pathname}?${search.toString()}`
      );
      router.push(`/auth/login?returnUrl=${returnUrl}&intent=follow`);
      return;
    }

    // 2. Role Restriction (Sellers/Admins)
    if (profile?.role !== "customer") {
      msg.info("Only customers can follow stores.");
      return;
    }

    // 3. Own Store Prevention
    if (profile?.$id === storeId) {
      msg.warning("You cannot follow your own store.");
      return;
    }

    mutation.mutate(isFollowing ? "unfollow" : "follow");
  };

  // We no longer return null if loading, to avoid the disappearing flicker.
  // Instead, the button will show its initial/cached state.

  return (
    <div className="flex items-center gap-3">
      {followerCount > 0 && (
        <span className="text-sm font-semibold text-slate-500">
          {followerCount} {followerCount === 1 ? "follower" : "followers"}
        </span>
      )}
      <button
        onClick={handleToggleFollow}
        disabled={isProcessing}
        className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${
          isFollowing
            ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-200"
        }`}
      >
        {isProcessing ? (
          <i className="fa-solid fa-spinner fa-spin" />
        ) : isFollowing ? (
          <>
            <i className="fa-solid fa-check" />
            Following
          </>
        ) : (
          <>
            <i className="fa-solid fa-plus" />
            Follow
          </>
        )}
      </button>
    </div>
  );
}
