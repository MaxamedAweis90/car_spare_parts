import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { findUserByEmail } from "@/lib/auth-utils";
import { createAdminClient } from "@/lib/server/appwrite-admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();

    console.log("🔍 Email verification attempt:", {
      userId,
      hasToken: !!token,
    });

    if (!userId || !token) {
      return NextResponse.json(
        { error: "User ID and Token are required" },
        { status: 400 }
      );
    }

    const { users: serverUsers } = createAdminClient();

    // 1. Get User Preferences to check token
    const prefs = await serverUsers.getPrefs(userId);
    const storedToken = prefs.emailVerificationToken;

    console.log("📋 Token comparison:", {
      receivedToken: token.substring(0, 10) + "...",
      storedToken: storedToken ? storedToken.substring(0, 10) + "..." : "none",
      match: storedToken === token,
    });

    if (!storedToken || storedToken !== token) {
      console.log("❌ Token validation failed");
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // 2. Mark Email as Verified in Appwrite Auth
    console.log("✅ Token valid for user:", userId);

    // Explicitly update verification status
    await serverUsers.updateEmailVerification(userId, true);
    console.log("🛠️ Appwrite updateEmailVerification(true) called");

    // Give Appwrite a moment to persist (slight delay)
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify update worked by fetching fresh user data
    let appwriteUser = await serverUsers.get(userId);
    console.log(
      "📊 Appwrite Email Verification Status:",
      appwriteUser.emailVerification
    );

    if (!appwriteUser.emailVerification) {
      // Retry once if not verified yet
      console.log("⚠️ Verification status not reflected yet, retrying once...");
      await serverUsers.updateEmailVerification(userId, true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      appwriteUser = await serverUsers.get(userId);
      if (!appwriteUser.emailVerification) {
        // One final attempt if it's still not showing up
        console.log("🚨 Still not verified, one last try...");
        await serverUsers.updateEmailVerification(userId, true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        appwriteUser = await serverUsers.get(userId);

        if (!appwriteUser.emailVerification) {
          throw new Error(
            "Appwrite failed to persist email verification status after multiple retries"
          );
        }
      }
    }

    // 3. Sync with local database status
    try {
      const userDoc = await findUserByEmail(appwriteUser.email);
      if (userDoc) {
        const updateData: any = {};
        if (userDoc.status === "deactivated") {
          updateData.status = "active";
          updateData.isActive = true;
        }

        if (Object.keys(updateData).length > 0) {
          await databasesServer.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.usersCollectionId,
            userDoc.$id,
            updateData
          );
          console.log("✅ Local user document synced");
        }
      }
    } catch (syncErr) {
      console.warn(
        "⚠️ Sync after verification failed (non-critical):",
        syncErr
      );
    }

    // 4. Clear Token
    await serverUsers.updatePrefs(userId, {
      ...prefs,
      emailVerificationToken: null,
    });
    console.log("✅ Verification token cleared from preferences");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Custom Verification Error:", error);
    return NextResponse.json(
      { error: error?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
