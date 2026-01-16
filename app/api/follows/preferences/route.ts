import { NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { getServerSession } from "@/lib/session-server";
import { FollowDocument } from "@/lib/types/follow";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(req);
    if (!session?.authenticated || !session?.profile) {
      return jsonError("Unauthorized", 401);
    }

    const { storeId, inAppEnabled, emailEnabled } = await req.json();

    if (!storeId) {
      return jsonError("storeId is required", 400);
    }

    const userId = session.profile.$id;

    // Find existing follow record
    const existing = await databasesServer.listDocuments<FollowDocument>(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [Query.equal("storeId", storeId), Query.equal("userId", userId)]
    );

    if (existing.total === 0) {
      return jsonError(
        "Follow record not found. Please follow the store first.",
        404
      );
    }

    const docId = existing.documents[0].$id;
    const updates: any = {};
    if (typeof inAppEnabled === "boolean") updates.inAppEnabled = inAppEnabled;
    if (typeof emailEnabled === "boolean") updates.emailEnabled = emailEnabled;

    await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      docId,
      updates
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Preferences PATCH error", error);
    return jsonError(error?.message || "Server error", 500);
  }
}
