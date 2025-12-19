// lib/appwriteClient.ts
import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!) // browser-safe
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const accountClient = new Account(client);
export const databasesClient = new Databases(client);
export const storageClient = new Storage(client);
export const generateUniqueId = () => ID.unique();

export const appwriteClientConfig = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  usersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  productsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID!,
  ordersCollectionId: process.env.NEXT_PUBLIC_APPWRITE_ORDERS_COLLECTION_ID!,
  storeCollectionId: process.env.NEXT_PUBLIC_APPWRITE_STORE_COLLECTION_ID!,
  mainAdminId: process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID!,
  storeAvatarBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID!,
  storeBannerBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORE_BANNER_BUCKET_ID || process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID!,
};