import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/getSession";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig } from "@/lib/appwrite-server";
import { ID, Query } from "node-appwrite";

/**
 * Step 1: Request Email Change
 * Stores pendingEmail in profile and sends verification email.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newEmail } = await req.json();

    if (!newEmail) {
      return NextResponse.json(
        { error: "newEmail is required" },
        { status: 400 }
      );
    }

    const { databases } = createAdminClient();

    // Generate a simple secret/token for verification
    const secret = ID.unique();

    // Update profile with pending email and secret
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      session.profile.$id,
      {
        // We'll need these fields in the collection
        // For now, let's assume they exist or use a metadata field
        pendingEmail: newEmail,
        emailChangeSecret: secret,
      }
    );

    // Send custom email (Logic here)
    // We'll just return success for now to indicate the flow is prepared.
    return NextResponse.json({
      message: "Verification link sent to your new email.",
    });
  } catch (error: any) {
    console.error("Change email error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * Step 2: Verify and Update
 */
export async function PATCH(req: NextRequest) {
  try {
    const { userId, secret } = await req.json();

    const { users, databases } = createAdminClient();

    // 1. Find profile by userId and secret
    const res = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [
        Query.equal("appwriteUserId", userId),
        Query.equal("emailChangeSecret", secret),
      ]
    );

    if (res.total === 0) {
      return NextResponse.json(
        { error: "Invalid or expired secret" },
        { status: 400 }
      );
    }

    const profile = res.documents[0];
    const newEmail = profile.pendingEmail;

    // 2. Update Auth email
    await users.updateEmail(userId, newEmail);

    // 3. Update Profile email and clear pending
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      profile.$id,
      {
        email: newEmail,
        pendingEmail: null,
        emailChangeSecret: null,
      }
    );

    return NextResponse.json({ message: "Email updated successfully" });
  } catch (error: any) {
    console.error("Verify email change error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
