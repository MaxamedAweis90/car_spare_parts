import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers, updateUser } from "@/services/users";

export function usePendingSellers() {
  return useQuery({
    queryKey: ["users", "pending-sellers"],
    queryFn: async () => {
      const res = await getUsers({ role: "seller", sellerApproved: false });
      return res?.documents || [];
    },
  });
}

export function useApproveSeller() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      updaterId,
    }: {
      userId: string;
      updaterId: string;
    }) => {
      return await updateUser({ userId, sellerApproved: true, updaterId });
    },
    onMutate: async ({ userId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["users", "pending-sellers"],
      });

      // Snapshot the previous value
      const previousPending = queryClient.getQueryData([
        "users",
        "pending-sellers",
      ]);

      // Optimistically update the cache by removing the approved seller
      queryClient.setQueryData(["users", "pending-sellers"], (old: any) => {
        if (!old) return [];
        return old.filter((s: any) => s.$id !== userId);
      });

      return { previousPending };
    },
    onError: (err, variables, context) => {
      if (context?.previousPending) {
        queryClient.setQueryData(
          ["users", "pending-sellers"],
          context.previousPending
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
  });
}
