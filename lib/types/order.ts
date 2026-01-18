import type { Models } from "appwrite";

export interface OrderItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image: string | null;
  imageUrl?: string | null;
  sellerId: string;
}

export interface OrderDocument extends Models.Document {
  customerId: string;
  items: string[]; // JSON strings
  totalPrice: number;
  status: "pending" | "paid" | "shipped" | "cancelled";
  shippingAddress: string; // JSON string or plain text
  paymentMethod: string;
  paymentDetails?: string | null;
  // Computed on client
  parsedItems?: OrderItem[];
  parsedShippingAddress?: any;
}

