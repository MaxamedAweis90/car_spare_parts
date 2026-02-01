import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { getServerSession } from "@/lib/auth/get-server-session";
import { findUserByEmail } from "@/lib/auth/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const { targetEmail } = await req.json();

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Target email is required" },
        { status: 400 },
      );
    }

    // 1. Verify Caller Verification (Must be logged in as Main Admin)
    const session = await getServerSession();
    const caller = session?.profile;
    if (!session?.authenticated || !caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check specific Main Admin ID/Role from Env or DB
    const adminId = process.env.APPWRITE_MAIN_ADMIN_USER_ID;
    // Also check standard role in case of DB flag
    // Fetch full profile for caller to be sure
    const callerProfile = await findUserByEmail(caller.email);

    const isMainAdmin =
      callerProfile?.role === "main_admin" ||
      caller.$id === adminId ||
      (adminId && adminId.includes(caller.$id));

    if (!isMainAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Main Admin only" },
        { status: 403 },
      );
    }

    // 2. Perform Reset (Trigger Email)
    const { account } = createAdminClient();
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const url = `${origin}/auth/reset-password`;

    // Checks if target exists implicitly by creating recovery
    await account.createRecovery(targetEmail, url);

    return NextResponse.json({
      message: `Password reset email sent to ${targetEmail}`,
    });
  } catch (error: any) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
