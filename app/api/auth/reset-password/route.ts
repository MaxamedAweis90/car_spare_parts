import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import {
  createAppwriteEmailSession,
  triggerAppwriteVerification,
} from "@/lib/server/appwrite-auth-actions";
import { findUserByEmail, hashPassword } from "@/lib/auth-utils";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

export async function POST(req: NextRequest) {
  try {
    const { userId, secret, password, name } = await req.json();

    if (!userId || !secret || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { users } = createAdminClient();

    // 1. Get user details before reset to get the email
    const appwriteUser = await users.get(userId);
    const email = appwriteUser.email;

    // 2. Complete the recovery process
    const { account } = createAdminClient();
    await account.updateRecovery(userId, secret, password);

    // 2.5 Update name if provided
    if (name) {
      await users.updateName(userId, name);
    }

    // 3. Update local database profile
    const user = await findUserByEmail(email);
    if (user) {
      const newPasswordHash = await hashPassword(password);
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        user.$id,
        {
          passwordHash: newPasswordHash,
          status: "active",
          isActive: true,
          ...(name ? { name } : {}),
        }
      );
    }

    // 4. Trigger Verification Email automatically
    // Since they just set their password, we can create a temp session.
    try {
      const { cookieHeader } = await createAppwriteEmailSession(
        email,
        password
      );
      const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      await triggerAppwriteVerification(cookieHeader, origin);
    } catch (vErr) {
      console.warn(
        "Failed to trigger verification after password reset:",
        vErr
      );
    }

    return NextResponse.json({
      message: "Password reset and account activated",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
