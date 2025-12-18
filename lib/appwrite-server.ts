// lib/appwriteServer.ts
import { Client, Databases, Users } from "node-appwrite";

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!) // e.g., "https://fra.cloud.appwrite.io/v1"
  .setProject(process.env.APPWRITE_PROJECT_ID!) // public project ID is fine
  .setKey(process.env.APPWRITE_API_KEY!); // SERVER key only, do NOT expose

export const databasesServer = new Databases(client);
export const usersServer = new Users(client);

export const appwriteConfig = {
  databaseId: process.env.APPWRITE_DATABASE_ID!,
  usersCollectionId: process.env.APPWRITE_USERS_COLLECTION_ID!,
  productsCollectionId: process.env.APPWRITE_PRODUCTS_COLLECTION_ID!,
  ordersCollectionId: process.env.APPWRITE_ORDERS_COLLECTION_ID!,
  mainAdminId: process.env.APPWRITE_MAIN_ADMIN_USER_ID!,
};
