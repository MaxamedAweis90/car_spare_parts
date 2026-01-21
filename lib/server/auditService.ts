import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { ID } from "node-appwrite";

export type ActivityAction =
  | "INVITE_ADMIN"
  | "DEACTIVATE_ADMIN"
  | "DELETE_ADMIN"
  | "UPDATE_PASSWORD_ADMIN"
  | "APPROVE_SELLER"
  | "DEACTIVATE_SELLER"
  | "DELETE_SELLER"
  | "LOGIN_ADMIN";

export interface ActivityPayload {
  activityId?: string; // Appwrite might require this as an attribute
  adminId: string;
  adminName: string;
  action: ActivityAction;
  targetId?: string;
  targetName?: string;
  details?: string;
}

export async function logActivity(payload: ActivityPayload) {
  try {
    // Only attempt if the collection ID is provided in env
    if (!process.env.APPWRITE_ACTIVITIES_COLLECTION_ID) {
      console.warn("APPWRITE_ACTIVITIES_COLLECTION_ID not set, skipping log.");
      return;
    }

    const activityId = payload.activityId || ID.unique();
    await databasesServer.createDocument(
      appwriteConfig.databaseId,
      process.env.APPWRITE_ACTIVITIES_COLLECTION_ID,
      activityId,
      {
        ...payload,
        activityId: activityId,
      },
    );
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
