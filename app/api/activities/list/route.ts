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

    // Support limit parameter from query
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Default queries
    const queries = [
      Query.orderDesc("$createdAt"),
      Query.limit(Math.min(limit, 100)), // Cap at 100
    ];

    const list = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      collectionId,
      queries,
    );

    return NextResponse.json({ items: list.documents, total: list.total });
  } catch (error: any) {
    console.error("Fetch activities error:", error);

    // If collection doesn't exist yet, return empty array
    if (error.code === 404 || error.message?.includes("not found")) {
      return NextResponse.json({ items: [], total: 0 });
    }

    // For other errors, return empty array to prevent UI breaking
    return NextResponse.json({ items: [], total: 0 });
  }
}
