import { useInfiniteQuery } from "@tanstack/react-query";
import { appwriteClientConfig, databasesClient } from "@/lib/api/appwrite";
import { Query } from "appwrite";

interface UseInfiniteProductsOptions {
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  category?: string;
}

export function useInfiniteProducts({
  limit = 20,
  sort = "newest",
  category,
}: UseInfiniteProductsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ["products", "infinite", { limit, sort, category }],
    queryFn: async ({ pageParam }) => {
      const queries = [];

      // Sorting
      if (sort === "newest") {
        queries.push(Query.orderDesc("$createdAt"));
      } else if (sort === "price_asc") {
        queries.push(Query.orderAsc("price"));
      } else if (sort === "price_desc") {
        queries.push(Query.orderDesc("price"));
      }

      // Filtering (only active products)
      queries.push(Query.equal("isActive", true));

      if (category && category !== "all") {
        queries.push(Query.equal("category", category));
      }

      // Pagination
      queries.push(Query.limit(limit));
      if (pageParam) {
        queries.push(Query.cursorAfter(pageParam as string));
      }

      const res = await databasesClient.listDocuments(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        queries,
      );

      return {
        products: res.documents,
        total: res.total,
        nextCursor:
          res.documents.length === limit
            ? res.documents[res.documents.length - 1].$id
            : undefined,
      };
    },
    initialPageParam: undefined as string | undefined, // explicitly typed
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}
