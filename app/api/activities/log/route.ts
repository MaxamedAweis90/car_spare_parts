import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { getServerSession } from "@/lib/auth/get-server-session";
import { ID } from "node-appwrite";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session.authenticated || !session.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, details, targetId, targetType } = await req.json();

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    // Create Activity Log
    await databasesServer.createDocument(
      appwriteConfig.databaseId,
      // We assume an "activities" collection exists or we map to it.
      // For now, let's use a specific variable or fallback string if not in config yet.
      // Ideally, add 'activitiesCollectionId' to appwriteConfig type.
      process.env.NEXT_PUBLIC_APPWRITE_ACTIVITIES_COLLECTION_ID || "activities",
      ID.unique(),
      {
        userId: session.profile.$id,
        userName: session.profile.name,
        userRole: session.profile.role,
        action,
        details: JSON.stringify(details || {}),
        targetId,
        targetType,
        createdAt: new Date().toISOString(),
      },
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Activity logging error:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 },
    );
  }
}
