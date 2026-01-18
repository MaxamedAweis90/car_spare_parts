import { Query, ID, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { FollowDocument } from "@/lib/types/follow";
import { sendStatusNotification } from "@/lib/notifications"; // Mock email service

export async function notifyFollowers(params: {
  storeId: string;
  storeName: string;
  type: "new_product" | "new_deal";
  title: string;
  message: string;
  link: string;
}) {
  const { storeId, storeName, type, title, message: msg, link } = params;

  try {
    // 1. Get all followers of this store
    const follows = await databasesServer.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("storeId", storeId), Query.equal("isFollowing", true)]
    );

    if (follows.total === 0) return;

    for (const follow of follows.documents) {
      const userId = follow.userId;

      // 2. Send In-App Notification if enabled
      if (follow.inAppEnabled) {
        await databasesServer.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.notificationsCollectionId,
          ID.unique(),
          {
            userId,
            storeId,
            type,
            title,
            message: msg,
            link,
            isRead: false,
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      }

      // 3. Send Email Notification if enabled (Mocked)
      if (follow.emailEnabled && type === "new_deal") {
        // Fetch user email if needed, but for now we just use the mock service
        // In a real app, you'd fetch the user's email from the users collection
        console.log(
          `[EMAIL] Dispatching deal alert from ${storeName} to user ${userId}`
        );

        // Example of calling the mock notification service:
        // await sendStatusNotification({ email: userEmail, name: userName, status: 'active' });
      }
    }
  } catch (error) {
    console.error("Failed to notify followers", error);
  }
}

