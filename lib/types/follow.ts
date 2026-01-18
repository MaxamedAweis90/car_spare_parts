import type { Models } from "node-appwrite";

export type FollowDocument = Models.Document & {
  userId: string;
  storeId: string;
  isFollowing: boolean;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export type NotificationType = "new_product" | "new_deal";

export type NotificationDocument = Models.Document & {
  userId: string;
  storeId: string; // The store that triggered the notification
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
};

