import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import { NotificationDocument } from "@/lib/types/follow";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return jsonError("Unauthorized", 401);
    }

    const userId = session.profile.$id;

    // Fetch notifications
    const notifications =
      await databasesServer.listDocuments<NotificationDocument>(
        appwriteConfig.databaseId,
        appwriteConfig.notificationsCollectionId,
        [
          Query.equal("userId", userId),
          Query.orderDesc("$createdAt"),
          Query.limit(20),
        ]
      );

    // Get unread count
    const unread = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.notificationsCollectionId,
      [
        Query.equal("userId", userId),
        Query.equal("isRead", false),
        Query.limit(1),
      ]
    );

    return NextResponse.json({
      notifications: notifications.documents,
      unreadCount: unread.total,
    });
  } catch (error: any) {
    console.error("Notifications GET error", error);
    return jsonError(error?.message || "Server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return jsonError("Unauthorized", 401);
    }

    const { notificationId, markAll } = await req.json();
    const userId = session.profile.$id;

    if (markAll) {
      // Mark all as read
      const unread = await databasesServer.listDocuments<NotificationDocument>(
        appwriteConfig.databaseId,
        appwriteConfig.notificationsCollectionId,
        [Query.equal("userId", userId), Query.equal("isRead", false)]
      );

      for (const doc of unread.documents) {
        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.notificationsCollectionId,
          doc.$id,
          { isRead: true }
        );
      }
    } else if (notificationId) {
      // Mark single as read
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.notificationsCollectionId,
        notificationId,
        { isRead: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notifications PATCH error", error);
    return jsonError(error?.message || "Server error", 500);
  }
}
