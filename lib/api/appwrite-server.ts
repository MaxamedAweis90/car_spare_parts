// lib/appwriteServer.ts
import { Client, Databases, Users, Storage, Messaging } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!) // e.g., "https://fra.cloud.appwrite.io/v1"
  .setProject(process.env.APPWRITE_PROJECT_ID!) // public project ID is fine
  .setKey(process.env.APPWRITE_API_KEY!); // SERVER key only, do NOT expose

export const databasesServer = new Databases(client);
export const usersServer = new Users(client);
export const storageServer = new Storage(client);
export const messagingServer = new Messaging(client);

export const appwriteConfig = {
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID!,
  productsCollectionId: process.env.APPWRITE_PRODUCTS_COLLECTION_ID!,
  ordersCollectionId: process.env.APPWRITE_ORDERS_COLLECTION_ID!,
  mainAdminId: process.env.APPWRITE_MAIN_ADMIN_USER_ID!,
  storeCollectionId: process.env.APPWRITE_STORE_COLLECTION_ID!,
  storeAvatarBucketId: process.env.APPWRITE_STORE_AVATAR_BUCKET_ID!,
  storeBannerBucketId:
    process.env.APPWRITE_STORE_BANNER_BUCKET_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_STORE_AVATAR_BUCKET_ID!,
  avatarBucketId:
    process.env.APPWRITE_AVATAR_BUCKET_ID ||
    process.env.NEXT_PUBLIC_APPWRITE_AVATAR_BUCKET_ID!,
  endpoint: process.env.APPWRITE_ENDPOINT!,
  projectId: process.env.APPWRITE_PROJECT_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
  followsCollectionId: process.env.APPWRITE_FOLLOWS_COLLECTION_ID!,
  notificationsCollectionId: process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID!,
  activitiesCollectionId:
    process.env.APPWRITE_ACTIVITIES_COLLECTION_ID || "activities",
  paymentMethodsCollectionId:
    process.env.APPWRITE_PAYMENT_METHODS_COLLECTION_ID || "payment_methods",
  paymentsCollectionId:
    process.env.APPWRITE_PAYMENTS_COLLECTION_ID || "payments",
  newsletterSubscribersCollectionId:
    process.env.APPWRITE_NEWSLETTER_SUBSCRIBERS_COLLECTION_ID ||
    "newsletter_subscribers",
  reviewsCollectionId: process.env.APPWRITE_REVIEWS_COLLECTION_ID!,
};
