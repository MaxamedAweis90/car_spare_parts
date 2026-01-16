import { NextRequest, NextResponse } from "next/server";
import { AppwriteException, ID } from "node-appwrite";
import { requireSeller } from "@/lib/server/requireSeller";
import {
  findUserByEmail,
  sanitizeUser,
  type UserProfile,
} from "@/lib/auth-utils";
import {
  usersServer,
  appwriteConfig,
  databasesServer,
} from "@/lib/appwrite-server";
import {
  buildUserAvatarUrl,
  getUserProfileById,
  updateUserProfileDocument,
} from "@/lib/server/userProfileService";
import { createAdminClient } from "@/lib/server/appwrite-admin";

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
    const nextName = typeof body?.name === "string" ? body.name.trim() : null;
    const nextEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    const { users: serverUsers, messaging } = createAdminClient();
    const updates: Partial<UserProfile> = {};

    if (nextEmail && nextEmail !== profile.email) {
      const existing = await findUserByEmail(nextEmail);
      if (existing && existing.$id !== profile.$id) {
        return jsonError("Another user already uses this email", 409);
      }

      console.log(
        `🔐 Seller Email Update: Setting ${account.$id} to ${nextEmail}`
      );
      await serverUsers.updateEmail(account.$id, nextEmail);
      updates.email = nextEmail;

      // START Verification Logic
      try {
        const verificationToken = ID.unique();
        const prefs = await serverUsers.getPrefs(account.$id);
        await serverUsers.updatePrefs(account.$id, {
          ...prefs,
          emailVerificationToken: verificationToken,
        });

        // Send Email
        const verifyLink = `${req.nextUrl.origin}/auth/verify?userId=${account.$id}&token=${verificationToken}`;
        const subject = "Verify your new email address";
        const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Verify your email</h2>
            <p>Hello ${nextName || profile.name},</p>
            <p>You recently updated your email address to <strong>${nextEmail}</strong>. Please verify this change by clicking the button below.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" class="button">Verify Email Address</a>
            </p>
            <p>If you didn't request this change, please contact support immediately.</p>
          </div>
        </body>
        </html>
        `;

        console.log("📧 Sending verification email to seller:", {
          userId: account.$id,
          newEmail: nextEmail,
          verifyLink,
        });

        const emailMessage = await messaging.createEmail(
          ID.unique(),
          subject,
          content,
          [],
          [account.$id],
          [],
          [],
          [],
          [],
          false,
          true
        );

        console.log("✅ Seller verification email sent:", emailMessage.$id);
      } catch (err: any) {
        console.error("❌ Failed to send verification email:", err);
      }
    }

    if (nextName && nextName !== profile.name) {
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
        typeof error.response === "object" &&
        error.response !== null &&
        "message" in error.response
          ? (error.response as { message?: string }).message
          : undefined;
      const message =
        responseMessage || error.message || "Failed to update profile";
      return jsonError(message, status);
    }
    const status = error?.status || 500;
    const message = error?.message || "Failed to update profile";
    return jsonError(message, status);
  }
}
