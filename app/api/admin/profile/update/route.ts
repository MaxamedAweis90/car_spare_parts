import { NextRequest, NextResponse } from "next/server";
import {
  usersServer,
  databasesServer,
  appwriteConfig,
} from "@/lib/api/appwrite-server";
import { findUserByEmail } from "@/lib/auth/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const avatarId = formData.get("avatarId") as string;
    const email = formData.get("email") as string;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find the user profile in DB
    const userDoc = await findUserByEmail(email);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Prepare updates
    const updates: any = {};
    if (name) updates.name = name;
    if (phone) updates.phone = parseInt(phone.replace(/\D/g, ""), 10) || null; // Store as number
    if (avatarId) updates.avatarId = avatarId;

    // 3. Update Database
    await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userDoc.$id,
      updates,
    );

    // 4. Update Appwrite Auth Name if changed
    if (name && userDoc.appwriteUserId) {
      try {
        await usersServer.updateName(userDoc.appwriteUserId, name);
      } catch (e) {
        console.warn("Failed to update Appwrite Auth name:", e);
      }
    }

    // 5. Update Appwrite Auth Phone if changed
    // Phone in Appwrite Auth requires E.164 format (+1234567890)
    // We'll skip updating Auth phone for now to avoid validation hell,
    // unless strictly needed for 2FA. We store it in DB mainly.

    return NextResponse.json({
      success: true,
      user: { ...userDoc, ...updates },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
