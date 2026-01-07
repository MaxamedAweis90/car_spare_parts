import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { findUserByEmail } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { users } = createAdminClient();
    const appwriteUser = await users.get(userId);

    if (appwriteUser.emailVerification) {
      const user = await findUserByEmail(appwriteUser.email);
      if (user && user.status === "deactivated") {
        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          user.$id,
          { status: "active", isActive: true }
        );
        return NextResponse.json({ success: true, status: "active" });
      }
      return NextResponse.json({
        success: true,
        status: user?.status || "active",
      });
    }

    return NextResponse.json(
      { error: "Email not verified in Appwrite yet" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Verify sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
