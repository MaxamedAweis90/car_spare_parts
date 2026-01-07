import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { createUserProfile, hashPassword } from "@/lib/auth-utils";
import { ID } from "node-appwrite";

export async function POST(req: NextRequest) {
  try {
    const { profile: currentAdmin } = await requireAdmin(req);

    // Only main_admin can create other admins
    if (currentAdmin.role !== "main_admin") {
      return NextResponse.json(
        { error: "Only main admin can invite other admins" },
        { status: 403 }
      );
    }

    const { email, name: providedName, role = "admin" } = await req.json();
    const name =
      providedName ||
      email.split("@")[0].charAt(0).toUpperCase() +
        email.split("@")[0].slice(1);

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    if (!["admin", "main_admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { users, account } = createAdminClient();

    // 1. Create user in Appwrite Auth (without password initially)
    // We'll use a random dummy password because Appwrite requires one for email/pass auth type
    // but the user will reset it via recovery link.
    const dummyPassword = ID.unique() + ID.unique();
    const appwriteUser = await users.create(
      ID.unique(),
      email,
      undefined,
      dummyPassword,
      name
    );

    // 2. Create profile in database
    const passwordHash = await hashPassword(dummyPassword);
    await createUserProfile({
      name,
      email,
      role,
      status: "deactivated",
      appwriteUserId: appwriteUser.$id,
      passwordHash,
    });

    // 3. Trigger Invitation/Recovery email
    // This will send an email to the user so they can set their own password
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const url = `${origin}/auth/setup-password`;

    // We use regular account recovery flow as the invitation flow
    await account.createRecovery(email, url);

    return NextResponse.json(
      {
        message: "Admin invited successfully. Invitation email sent.",
        userId: appwriteUser.$id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
