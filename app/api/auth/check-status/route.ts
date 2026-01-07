import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth-utils";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find user in Database
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ status: "unknown" });
    }

    // 2. If already active, return immediately
    if (user.status === "active") {
      return NextResponse.json({ status: "active" });
    }

    // 3. Lazy Sync Check: Check Appwrite Auth directly
    // This handles the case where they clicked the link (Appwrite verified)
    // but haven't hit an endpoint that syncs the DB status yet.
    if (user.appwriteUserId) {
      const { users: serverUsers } = createAdminClient();
      try {
        const appwriteUser = await serverUsers.get(user.appwriteUserId);
        if (appwriteUser.emailVerification) {
          // Detected verification! Sync DB now.
          await databasesServer.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            user.$id,
            { status: "active", isActive: true }
          );
          return NextResponse.json({ status: "active" });
        }
      } catch (err) {
        console.warn("Failed to check Appwrite status:", err);
      }
    }

    return NextResponse.json({ status: user.status });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
