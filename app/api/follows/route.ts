import { NextRequest, NextResponse } from "next/server";
import { ID, Query, Permission, Role } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import { FollowDocument } from "@/lib/types/follow";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    if (!storeId) {
      return jsonError("storeId is required", 400);
    }

    const session = await getServerSession(req);
    const userId = session?.profile?.$id;

    // Get follower count
    const followers = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("storeId", storeId),
        Query.equal("isFollowing", true),
        Query.limit(1),
      ]
    );

    let isFollowing = false;
    let inAppEnabled = true;
    let emailEnabled = false;

    if (userId) {
      const followDoc = await databasesServer.listDocuments<FollowDocument>(
        appwriteConfig.databaseId,
        appwriteConfig.followsCollectionId,
        [Query.equal("storeId", storeId), Query.equal("userId", userId)]
      );

      if (followDoc.total > 0) {
        isFollowing = followDoc.documents[0].isFollowing;
        inAppEnabled = followDoc.documents[0].inAppEnabled;
        emailEnabled = followDoc.documents[0].emailEnabled;
      }
    }

    return NextResponse.json({
      followerCount: followers.total,
      isFollowing,
      preferences: {
        inAppEnabled,
        emailEnabled,
      },
    });
  } catch (error: any) {
    console.error("Follows GET error", error);
    return jsonError(error?.message || "Server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return jsonError("Unauthorized", 401);
    }

    const { storeId, action } = await req.json();

    if (!storeId) {
      return jsonError("storeId is required", 400);
    }

    const userId = session.profile.$id;

    // Check if user is trying to follow their own store
    const store = await databasesServer.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.storeCollectionId,
      storeId
    );

    if (store.sellerId === userId) {
      return jsonError("You cannot follow your own store", 400);
    }

    // Find existing follow record
    const existing = await databasesServer.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("storeId", storeId), Query.equal("userId", userId)]
    );

    const isFollowing = action === "follow";

    if (existing.total > 0) {
      const docId = existing.documents[0].$id;
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.followsCollectionId,
        docId,
        { isFollowing }
      );
    } else {
      await databasesServer.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.followsCollectionId,
        ID.unique(),
        {
          userId,
          storeId,
          isFollowing,
          inAppEnabled: true,
          emailEnabled: false,
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    }

    return NextResponse.json({ success: true, isFollowing });
  } catch (error: any) {
    console.error("Follows POST error", error);
    return jsonError(error?.message || "Server error", 500);
  }
}
