import { NextRequest, NextResponse } from "next/server";
import { AppwriteException } from "node-appwrite";
import { requireSeller } from "@/lib/server/requireSeller";
import { findUserByEmail, sanitizeUser, type UserProfile } from "@/lib/auth-utils";
import { usersServer } from "@/lib/appwrite-server";
import { buildUserAvatarUrl, getUserProfileById, updateUserProfileDocument } from "@/lib/server/userProfileService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const { profile } = await requireSeller(req);
    const fresh = await getUserProfileById(profile.$id);
    const safe = sanitizeUser(fresh);
    const avatarUrl = buildUserAvatarUrl(fresh.avatarId);
    return NextResponse.json({ profile: { ...safe, avatarUrl } });
  } catch (error: any) {
    console.error("GET /api/seller/profile error", error);
    const status = error?.status || error?.code || 500;
    const message = error?.message || "Failed to load profile";
    return jsonError(message, status);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { profile, account } = await requireSeller(req);
    const body = await req.json();
    const rawName: unknown = body?.name;
    const rawEmail: unknown = body?.email;

    if (typeof rawName !== "string" || !rawName.trim()) {
      return jsonError("Name is required", 400);
    }
    if (typeof rawEmail !== "string" || !rawEmail.trim()) {
      return jsonError("Email is required", 400);
    }

    const nextName = rawName.trim();
    const nextEmail = rawEmail.trim().toLowerCase();

    const updates: Partial<UserProfile> = {};

    if (nextEmail !== profile.email) {
      const existing = await findUserByEmail(nextEmail);
      if (existing && existing.$id !== profile.$id) {
        return jsonError("Another user already uses this email", 409);
      }
      await usersServer.updateEmail(account.$id, nextEmail);
      updates.email = nextEmail;
    }

    if (nextName !== profile.name) {
      await usersServer.updateName(account.$id, nextName);
      updates.name = nextName;
    }

    let updatedProfile;
    if (Object.keys(updates).length > 0) {
      updatedProfile = await updateUserProfileDocument(profile.$id, updates);
    } else {
      updatedProfile = await getUserProfileById(profile.$id);
    }
    const safe = sanitizeUser(updatedProfile);
    const avatarUrl = buildUserAvatarUrl(updatedProfile.avatarId);
    return NextResponse.json({ profile: { ...safe, avatarUrl } });
  } catch (error: any) {
    console.error("PUT /api/seller/profile error", error);
    if (error instanceof AppwriteException) {
      const status = error.code || 500;
      const responseMessage =
        typeof error.response === "object" && error.response !== null && "message" in error.response
          ? (error.response as { message?: string }).message
          : undefined;
      const message = responseMessage || error.message || "Failed to update profile";
      return jsonError(message, status);
    }
    const status = error?.status || 500;
    const message = error?.message || "Failed to update profile";
    return jsonError(message, status);
  }
}
