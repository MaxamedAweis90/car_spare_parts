import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { requireCustomer } from "@/lib/server/requireCustomer";
import { findUserByEmail, sanitizeUser } from "@/lib/auth-utils";
import {
  buildUserAvatarUrl,
  getUserProfileById,
  updateUserProfileDocument,
} from "@/lib/server/userProfileService";
import { usersServer, messagingServer } from "@/lib/appwrite-server";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type PatchBody = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
};

export async function PATCH(req: NextRequest) {
  try {
    const { profile, account } = await requireCustomer(req);
    const body = (await req.json()) as PatchBody;

    const updates: { name?: string; email?: string; phone?: number | null } =
      {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") return jsonError("Invalid name", 400);
      const trimmed = body.name.trim();
      if (!trimmed) return jsonError("Name is required", 400);
      if (trimmed.length > 80) return jsonError("Name is too long", 400);
      updates.name = trimmed;
    }

    // Email update with verification
    if (body.email !== undefined) {
      if (typeof body.email !== "string")
        return jsonError("Invalid email", 400);
      const nextEmail = body.email.trim().toLowerCase();

      if (!nextEmail) return jsonError("Email is required", 400);

      if (nextEmail !== profile.email) {
        const existing = await findUserByEmail(nextEmail);
        if (existing && existing.$id !== profile.$id) {
          return jsonError("Another user already uses this email", 409);
        }

        await usersServer.updateEmail(account.$id, nextEmail);
        updates.email = nextEmail;

        // Send Verification Email
        try {
          const verificationToken = ID.unique();
          const prefs = await usersServer.getPrefs(account.$id);
          await usersServer.updatePrefs(account.$id, {
            ...prefs,
            emailVerificationToken: verificationToken,
          });

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
              <p>Hello ${updates.name || profile.name},</p>
              <p>You recently updated your email address to <strong>${nextEmail}</strong>. Please verify this change by clicking the button below.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verifyLink}" class="button">Verify Email Address</a>
              </p>
              <p>If you didn't request this change, please contact support immediately.</p>
            </div>
          </body>
          </html>
          `;

          console.log("📧 Sending verification email to customer:", {
            userId: account.$id,
            newEmail: nextEmail,
            oldEmail: profile.email,
            verifyLink,
          });

          const emailMessage = await messagingServer.createEmail(
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

          console.log("✅ Customer verification email sent successfully:", {
            messageId: emailMessage.$id,
            userId: account.$id,
            sentToEmail: nextEmail,
          });
        } catch (err: any) {
          console.error("Failed to send verification email to customer", err);
        }
      }
    }

    if (body.phone !== undefined) {
      if (body.phone === null || body.phone === "") {
        updates.phone = null;
      } else if (typeof body.phone === "number") {
        if (!Number.isFinite(body.phone))
          return jsonError("Invalid phone", 400);
        updates.phone = Math.trunc(body.phone);
      } else if (typeof body.phone === "string") {
        const trimmed = body.phone.trim();
        if (!trimmed) {
          updates.phone = null;
        } else if (!/^\d+$/.test(trimmed)) {
          return jsonError("Phone must be digits only", 400);
        } else {
          const parsed = Number.parseInt(trimmed, 10);
          if (!Number.isFinite(parsed)) return jsonError("Invalid phone", 400);
          updates.phone = parsed;
        }
      } else {
        return jsonError("Invalid phone", 400);
      }
    }

    if (!Object.keys(updates).length) {
      const current = await getUserProfileById(profile.$id);
      const safe = sanitizeUser(current);
      const avatarUrl = buildUserAvatarUrl(current.avatarId);
      return NextResponse.json({ profile: { ...safe, avatarUrl } });
    }

    await updateUserProfileDocument(profile.$id, updates);
    const updated = await getUserProfileById(profile.$id);
    const safe = sanitizeUser(updated);
    const avatarUrl = buildUserAvatarUrl(updated.avatarId);

    return NextResponse.json({ profile: { ...safe, avatarUrl } });
  } catch (error: unknown) {
    console.error("PATCH /api/customer/profile error", error);
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const message =
      error instanceof Error ? error.message : "Failed to update profile";
    return jsonError(message, status);
  }
}
