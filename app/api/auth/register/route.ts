import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createUserProfile,
  ensureAppwriteUser,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
} from "@/lib/auth-utils";
import { appwriteConfig } from "@/lib/appwrite-server";
import { isValidEmailDomain } from "@/lib/email-validator";
import {
  createAppwriteEmailSession,
  triggerAppwriteVerification,
} from "@/lib/server/appwrite-auth-actions";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, becomeSeller } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        {
          error:
            "This email provider is not allowed. Please use a trusted provider like Gmail.",
        },
        { status: 400 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create Appwrite auth user (email/password).
    const appwriteUser = await ensureAppwriteUser({ name, email, password });

    // Persist profile in the existing users collection; default role = customer.
    const profile = await createUserProfile({
      name,
      email,
      role: becomeSeller ? "seller" : "customer",
      sellerApproved: becomeSeller ? false : undefined,
      passwordHash,
      appwriteUserId: appwriteUser.$id,
    });

    // 3. Trigger Verification Email automatically
    // Since Appwrite requires a session for createVerification, we'll create a temp session here.
    try {
      const { cookieHeader } = await createAppwriteEmailSession(
        email,
        password
      );
      const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      await triggerAppwriteVerification(cookieHeader, origin);
    } catch (vErr) {
      console.warn("Failed to trigger automatic verification email:", vErr);
      // We don't fail the registration if only verification toast fails
    }

    const isCustomer = profile.role === "customer";

    return NextResponse.json(
      {
        user: sanitizeUser(profile),
        appwriteUserId: appwriteUser.$id,
        databaseId: appwriteConfig.databaseId,
        usersCollectionId: appwriteConfig.usersCollectionId,
        mustVerify: isCustomer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
