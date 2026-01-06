import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  databasesClient,
  appwriteClientConfig,
  storageClient,
} from "@/lib/appwrite";
import { Query, ID, Models } from "appwrite";
import { ProductDocument } from "@/lib/types/product";

// Helper to build image URL
export function getProductImageUrl(fileId: string | null) {
  if (!fileId) return null;
  const bucketId =
    process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID ||
    "products-bucket-id-placeholder";
  const result = storageClient.getFileView(bucketId, fileId);
  return result?.toString();
}

interface UseProductsParams {
  sellerId?: string;
  search?: string;
  category?: string | null;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export function useProducts({
  sellerId,
  search,
  category,
  minPrice,
  maxPrice,
  page = 1,
  limit = 20,
}: UseProductsParams) {
  return useQuery({
    queryKey: [
      "products",
      { sellerId, search, category, minPrice, maxPrice, page, limit },
    ],
    queryFn: async () => {
      // If sellerId is provided, we use our secure server-side API
      if (sellerId) {
        const url = new URL("/api/seller/products", window.location.origin);
        if (search) url.searchParams.append("search", search);
        if (category) url.searchParams.append("category", category);
        url.searchParams.append("page", page.toString());
        url.searchParams.append("limit", limit.toString());

        const res = await fetch(url.toString());
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to fetch seller products");
        }
        const data = await res.json();
        return {
          products: data.items.map((item: any) => ({
            ...item,
            imageUrl: getProductImageUrl(
              item.imageId || (item.imageIds && item.imageIds[0]) || null
            ),
          })),
          total: data.total || data.items.length,
        };
      }

      // Public listing logic remains using client SDK (or could also be refactored later)
      const queries = [];
      if (category) queries.push(Query.equal("mainCategoryId", category));
      if (minPrice !== undefined)
        queries.push(Query.greaterThanEqual("price", minPrice));
      if (maxPrice !== undefined)
        queries.push(Query.lessThanEqual("price", maxPrice));

      queries.push(Query.limit(limit));
      queries.push(Query.offset((page - 1) * limit));
      queries.push(Query.orderDesc("$createdAt"));

      const response = await databasesClient.listDocuments<ProductDocument>(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        queries
      );

      let documents = response.documents;

      if (search) {
        const lowerSearch = search.toLowerCase();
        documents = documents.filter(
          (doc) =>
            doc.name.toLowerCase().includes(lowerSearch) ||
            (doc.description &&
              doc.description.toLowerCase().includes(lowerSearch))
        );
      }

      const productsWithImages = documents.map((doc) => ({
        ...doc,
        imageUrl: getProductImageUrl(
          doc.imageId || (doc.imageIds && doc.imageIds[0]) || null
        ),
      }));

      return {
        products: productsWithImages,
        total: search ? documents.length : response.total,
      };
    },
    placeholderData: (previousData: any) => previousData,
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const doc = await databasesClient.getDocument<ProductDocument>(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        productId
      );
      return {
        ...doc,
        imageUrl: getProductImageUrl(
          doc.imageId || (doc.imageIds && doc.imageIds[0]) || null
        ),
      };
    },
    enabled: !!productId,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await databasesClient.deleteDocument(
        appwriteClientConfig.databaseId,
        appwriteClientConfig.productsCollectionId,
        productId
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
      }
    ) => {
      let imageId = data.imageId;

      // Upload image if provided
      if (data.imageFile) {
        const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCT_BUCKET_ID!;
        const upload = await storageClient.createFile(
          bucketId,
          ID.unique(),
          data.imageFile
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
        }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
