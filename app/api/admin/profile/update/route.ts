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

    // Store phone - DB likely expects Number (Integer) based on TS type, but Auth needs E.164 String
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      // Schema likely Integer: store just the digits as number
      updates.phone = parseInt(cleanPhone, 10);
    }

    // Update avatar - ensure we're setting it properly
    if (avatarId) {
      updates.avatarId = avatarId;
      updates.avatarSource = "user";
    }

    console.log("Updating profile with:", updates);

    // 3. Update Database
    const updatedDoc = await databasesServer.updateDocument(
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
    if (phone && userDoc.appwriteUserId) {
      try {
        const cleanPhone = phone.replace(/\D/g, "");
        // Auth requires E.164 format (+252...)
        await usersServer.updatePhone(
          userDoc.appwriteUserId,
          `+252${cleanPhone}`,
        );
      } catch (e) {
        console.warn("Failed to update Appwrite Auth phone:", e);
      }
    }

    return NextResponse.json({
      success: true,
      user: { ...userDoc, ...updates },
    });
  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error?.message || error?.response?.message || "Server error" },
      { status: 500 },
    );
  }
}
