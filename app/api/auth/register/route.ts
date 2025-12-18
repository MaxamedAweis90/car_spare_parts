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

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, becomeSeller } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
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

    return NextResponse.json(
      {
        user: sanitizeUser(profile),
        appwriteUserId: appwriteUser.$id,
        databaseId: appwriteConfig.databaseId,
        usersCollectionId: appwriteConfig.usersCollectionId,
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
