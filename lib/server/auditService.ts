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
    const collectionId =
      process.env.APPWRITE_ACTIVITIES_COLLECTION_ID ||
      process.env.NEXT_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION_ID ||
      "activities";

    const activityId = payload.activityId || ID.unique();

    // Ensure details is a string if it's an object, or keep as is
    const details =
      typeof payload.details === "object"
        ? JSON.stringify(payload.details)
        : payload.details;

    await databasesServer.createDocument(
      appwriteConfig.databaseId,
      collectionId,
      activityId,
      {
        ...payload,
        details,
        activityId: activityId,
        createdAt: new Date().toISOString(), // Ensure timestamp
      },
    );
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
