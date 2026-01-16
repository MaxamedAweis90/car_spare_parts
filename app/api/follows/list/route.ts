import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import { FollowDocument } from "@/lib/types/follow";
import { SellerStoreDocument } from "@/lib/types/seller-store";

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

    // Fetch followed records
    const follows = await databasesServer.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("userId", userId), Query.equal("isFollowing", true)]
    );

    if (follows.total === 0) {
      return NextResponse.json({ stores: [] });
    }

    const storeIds = follows.documents.map((f) => f.storeId);

    // Fetch store details
    // Appwrite doesn't support easy joins, so we'll fetch stores in batches or one by one
    // For simplicity with potentially many follows, let's fetch by IDs if possible or filter
    const storesList = await databasesServer.listDocuments<SellerStoreDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.storeCollectionId,
      [Query.equal("$id", storeIds)]
    );

    const storeMap = new Map(storesList.documents.map((s) => [s.$id, s]));

    const result = follows.documents
      .map((f) => {
        const store = storeMap.get(f.storeId);
        if (!store) return null;
        return {
          storeId: f.storeId,
          storeName: store.storeName,
          storeSlug: store.storeSlug,
          inAppEnabled: f.inAppEnabled,
          emailEnabled: f.emailEnabled,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ stores: result });
  } catch (error: any) {
    console.error("Follows List GET error", error);
    return jsonError(error?.message || "Server error", 500);
  }
}
