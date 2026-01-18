import type { Models } from "appwrite";

export type ProductDocument = Models.Document & {
  name: string;
  description?: string | null;
  price?: number | null;
  stock?: number | null;
  mainCategoryId?: string | null;
  sellerId: string;
  brand?: string | null;
  condition?: string | null;
  partNumber?: string | null;
  compatibilityOptionIds?: string[];
  imageIds?: string[];
  imageId?: string | null;
  isActive?: boolean;
  originalPrice?: number | null;
  onSale?: boolean;
  discountStartDate?: string | null; // ISO string
  discountExpiry?: string | null; // ISO string
  // Computed fields
  imageUrl?: string | null;
};

