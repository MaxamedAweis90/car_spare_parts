import { NextRequest, NextResponse } from "next/server";
import {
  usersServer,
  databasesServer,
  appwriteConfig,
} from "@/lib/api/appwrite-server";
import { hashPassword } from "@/lib/auth/auth-utils";
import { Query } from "node-appwrite";

export async function POST(req: NextRequest) {
  try {
    const { userId, token, password } = await req.json();

    if (!userId || !token || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // 1. Get user preferences to verify token
    const prefs = await usersServer.getPrefs(userId);
    if (prefs.adminActivationToken !== token) {
      return NextResponse.json(
        { error: "Invalid or expired activation token" },
        { status: 400 },
      );
    }

    // 2. Update password in Appwrite Auth
    await usersServer.updatePassword(userId, password);

    // 2b. Verify email in Appwrite Auth (so admin doesn't need to verify email)
    await usersServer.updateEmailVerification(userId, true);

    // 3. Update Profile: isActive = true and update passwordHash
    const newHash = await hashPassword(password);

    // Find the profile document ID
    const profiles = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("appwriteUserId", userId)],
    );

    if (profiles.total === 0) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const profileDocId = profiles.documents[0].$id;

    await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      profileDocId,
      {
        isActive: true,
        passwordHash: newHash,
      },
    );

    // 4. Clear the activation token
    const nextPrefs = { ...prefs };
    delete nextPrefs.adminActivationToken;
    await usersServer.updatePrefs(userId, nextPrefs);

    return NextResponse.json({
      ok: true,
      message: "Account activated successfully",
    });
  } catch (error: any) {
    console.error("Admin activation error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error during activation" },
      { status: 500 },
    );
  }
}
