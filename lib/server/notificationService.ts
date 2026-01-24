import { Query, ID, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { FollowDocument } from "@/lib/types/follow";

export async function notifyFollowers(params: {
  storeId: string;
  storeName: string;
  type: "new_product" | "new_deal";
  title: string;
  message: string;
  link: string;
}) {
  const { storeId, type, title, message: msg, link } = params;

  try {
    // 1. Get all followers of this store
    const follows = await databasesServer.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("storeId", storeId), Query.equal("isFollowing", true)],
    );

    if (follows.total === 0) return;

    // Prepare all notification creation promises
    const notificationPromises = follows.documents
      .filter((follow) => follow.inAppEnabled)
      .map((follow) =>
        databasesServer
          .createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.notificationsCollectionId,
            ID.unique(),
            {
              userId: follow.userId,
              storeId,
              type,
              title,
              message: msg,
              link,
              isRead: false,
            },
            [
              Permission.read(Role.user(follow.userId)),
              Permission.update(Role.user(follow.userId)),
              Permission.delete(Role.user(follow.userId)),
            ],
          )
          .catch((error) => {
            // Log error but don't fail entire batch
            console.error(
              `Failed to create notification for user ${follow.userId}:`,
              error,
            );
            return null;
          }),
      );

    // Execute all notifications in parallel (fixes N+1 query problem)
    await Promise.all(notificationPromises);

    // TODO: Implement email notifications properly
    // Email notification feature is currently not implemented
  } catch (error) {
    console.error("Failed to notify followers", error);
  }
}
