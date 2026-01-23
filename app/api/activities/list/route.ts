import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/auth/get-server-session";
import { Query } from "node-appwrite";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (
      !session.authenticated ||
      !session.profile ||
      !session.profile.role.includes("admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const collectionId =
      process.env.NEXT_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION_ID || "activities";

    // Default queries
    const queries = [
      Query.orderDesc("createdAt"),
      Query.limit(100), // Simple limit for now
    ];

    // TODO: Implement real filtering if needed using request queries

    const list = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      collectionId,
      queries,
    );

    return NextResponse.json(list);
  } catch (error: any) {
    if (error.code === 404) {
      // Collection might not exist yet if no activities logged
      return NextResponse.json({ items: [], total: 0 });
    }
    console.error("Fetch activities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}
