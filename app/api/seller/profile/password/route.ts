import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import { findUserByEmail, hashPassword, verifyPassword } from "@/lib/auth/auth-utils";
import { usersServer } from "@/lib/api/appwrite-server";
import { updateUserProfileDocument } from "@/lib/server/userProfileService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { profile, account } = await requireSeller(req);
    const body = await req.json();

    const currentPassword: unknown = body?.currentPassword;
    const newPassword: unknown = body?.newPassword;
    const confirmPassword: unknown = body?.confirmPassword;

    if (typeof currentPassword !== "string" || !currentPassword) {
      return jsonError("Current password is required", 400);
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return jsonError("New password must be at least 8 characters", 400);
    }
    if (typeof confirmPassword !== "string" || confirmPassword !== newPassword) {
      return jsonError("Password confirmation does not match", 400);
    }

    const existing = await findUserByEmail(profile.email);
    if (!existing || !existing.passwordHash) {
      return jsonError("No password is set for this account", 400);
    }

    const matches = await verifyPassword(currentPassword, existing.passwordHash);
    if (!matches) {
      return jsonError("Current password is incorrect", 400);
    }

    const sameAsCurrent = await verifyPassword(newPassword, existing.passwordHash);
    if (sameAsCurrent) {
      return jsonError("Choose a password different from the current one", 400);
    }

    await usersServer.updatePassword(account.$id, newPassword);
    const hashed = await hashPassword(newPassword);
    await updateUserProfileDocument(existing.$id, { passwordHash: hashed });

    return NextResponse.json({ message: "Password updated" });
  } catch (error: any) {
    console.error("POST /api/seller/profile/password error", error);
    const status = error?.status || error?.code || 500;
    const message = error?.message || "Failed to update password";
    return jsonError(message, status);
  }
}

