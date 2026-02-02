import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  databasesClient,
  appwriteClientConfig,
  storageClient,
} from "@/lib/api/appwrite";
import { Query, ID, Models } from "appwrite";
import { ProductDocument } from "@/lib/types/product";
import { getProductImageUrl as getImageUrl } from "@/lib/utils/product-image";

// Re-export or use the utility
export const getProductImageUrl = getImageUrl;

interface UseProductsParams {
  sellerId?: string;
  search?: string;
  category?: string | null;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc";
}

export function useProducts({
  sellerId,
  search,
  category,
  onSale,
  minPrice,
  maxPrice,
  page = 1,
  limit = 20,
  sort,
}: UseProductsParams) {
  return useQuery({
    queryKey: [
      "products",
      {
        sellerId,
        search,
        category,
        onSale,
        minPrice,
        maxPrice,
        page,
        limit,
        sort,
      },
    ],
    queryFn: async () => {
      // Build URL for API endpoint
      const url = new URL(
        sellerId ? "/api/seller/products" : "/api/products",
        window.location.origin,
      );

      if (search) url.searchParams.append("search", search);
      if (category) url.searchParams.append("category", category);
      if (onSale) url.searchParams.append("onSale", "true");
      if (minPrice !== undefined)
        url.searchParams.append("minPrice", minPrice.toString());
      if (maxPrice !== undefined)
        url.searchParams.append("maxPrice", maxPrice.toString());
      if (sort) url.searchParams.append("sort", sort);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      const res = await fetch(url.toString());
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch products");
      }

      const data = await res.json();
      return {
        products: data.items || data.products || [],
        total: data.total || (data.items || data.products || []).length,
      };
    },
    placeholderData: (previousData: any) => previousData,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Product not found");
        throw new Error("Failed to load product");
      }
      const data = await res.json();
      if (
        !data.imageUrl &&
        (data.imageId || (data.imageIds && data.imageIds.length > 0))
      ) {
        data.imageUrl = getProductImageUrl(
          data.imageId || (data.imageIds && data.imageIds[0]) || null,
        );
      }
      return data as ProductDocument & { imageUrl: string | null };
    },
    enabled: !!productId,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", "slug", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/slug/${slug}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Product not found");
        throw new Error("Failed to load product");
      }
      const data = await res.json();
      if (
        !data.imageUrl &&
        (data.imageId || (data.imageIds && data.imageIds.length > 0))
      ) {
        data.imageUrl = getProductImageUrl(
          data.imageId || (data.imageIds && data.imageIds[0]) || null,
        );
      }
      return data as ProductDocument & { imageUrl: string | null };
    },
    enabled: !!slug,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await databasesClient.deleteDocument(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        productId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      data: Omit<ProductDocument, keyof Models.Document | "imageUrl"> & {
        imageFile?: File;
      },
    ) => {
      let imageId = data.imageId;

      // Upload image if provided
      if (data.imageFile) {
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID!;
        const upload = await storageClient.createFile(
          bucketId,
          ID.unique(),
          data.imageFile,
        );
        imageId = upload.$id;
      }

      // Remove imageFile from data before saving to DB
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { imageFile, ...documentData } = data;

      return databasesClient.createDocument(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        ID.unique(),
        {
          ...documentData,
          imageId,
        },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      productId: string;
      data: Partial<ProductDocument>;
    }) => {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: payload.productId, ...payload.data }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product");
      }
      return res.json();
    },
    onMutate: async (payload) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({
        queryKey: ["product", payload.productId],
      });

      // Snapshot the previous value
      const previousProducts = queryClient.getQueryData(["products"]);
      const previousProduct = queryClient.getQueryData([
        "product",
        payload.productId,
      ]);

      // Optimistically update "products" list cache
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) => {
        if (!old || !old.products) return old;
        return {
          ...old,
          products: old.products.map((p: any) =>
            p.$id === payload.productId ? { ...p, ...payload.data } : p,
          ),
        };
      });

      // Optimistically update single "product" cache
      if (previousProduct) {
        queryClient.setQueryData(
          ["product", payload.productId],
          (old: any) => ({
            ...old,
            ...payload.data,
          }),
        );
      }

      return { previousProducts, previousProduct };
    },
    onError: (err, payload, context) => {
      // Rollback to previous state
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(
          ["product", payload.productId],
          context.previousProduct,
        );
      }
    },
    onSettled: (data, error, payload) => {
      // Always refetch to stay in sync with server
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({
        queryKey: ["product", payload.productId],
      });
    },
  });
}
