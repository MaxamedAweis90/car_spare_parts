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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] }); // Update stats too
    },
  });
}
