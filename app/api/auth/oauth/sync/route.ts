import { NextRequest, NextResponse } from "next/server";
import {
  createUserProfile,
  findUserByEmail,
  sanitizeUser,
} from "@/lib/auth-utils";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import {
  buildUserAvatarUrl,
  updateUserProfileDocument,
  uploadUserAvatar,
} from "@/lib/server/userProfileService";
import { sendWelcomeEmail } from "@/lib/notifications";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

const isDev = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const authHeader = req.headers.get("authorization");
  const bearerJwt = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  const jwtCookie = req.cookies.get("appwrite_jwt")?.value;

  try {
    const headers: Record<string, string> = { "X-Appwrite-Project": projectId };
    if (bearerJwt || jwtCookie) {
      headers["X-Appwrite-JWT"] = bearerJwt || jwtCookie!;
    } else if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const accountRes = await fetch(`${endpoint}/account`, {
      headers,
      cache: "no-store",
    });

    if (!accountRes.ok) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const account = await accountRes.json();
    const email = account?.email as string | undefined;

    if (!email) {
      return NextResponse.json({ error: "Email missing" }, { status: 400 });
    }

    // Get a fresh JWT tied to this session (usable server-side via X-Appwrite-JWT).
    let sessionJwt: string | undefined = bearerJwt || jwtCookie;
    try {
      const jwtRes = await fetch(`${endpoint}/account/jwt`, {
        method: "POST",
        headers,
        cache: "no-store",
      });
      if (jwtRes.ok) {
        const jwtBody = await jwtRes.json();
        sessionJwt = jwtBody?.jwt || sessionJwt;
      }
    } catch {
      // best effort; fall back to bearerJwt if available
    }

    // Check for Google identity to override verification if necessary
    const sessionHeaders: Record<string, string> = {
      "X-Appwrite-Project": projectId,
    };
    if (sessionJwt) {
      sessionHeaders["X-Appwrite-JWT"] = sessionJwt;
    } else if (cookieHeader) {
      sessionHeaders.Cookie = cookieHeader;
    }

    let isGoogleAuth = false;
    let identities: any[] = [];
    try {
      const identitiesRes = await fetch(`${endpoint}/account/identities`, {
        headers: sessionHeaders,
        cache: "no-store",
      });
      if (identitiesRes.ok) {
        const identitiesPayload = await identitiesRes.json().catch(() => null);
        identities = Array.isArray(identitiesPayload?.identities)
          ? identitiesPayload.identities
          : Array.isArray(identitiesPayload)
          ? identitiesPayload
          : [];

        isGoogleAuth = !!identities.find(
          (id) => String(id?.provider || "").toLowerCase() === "google"
        );
      }
    } catch (e) {
      console.warn("Failed to fetch identities", e);
    }

    const isVerified = account?.emailVerification || isGoogleAuth;

    const existing = await findUserByEmail(email);

    const trySyncGoogleAvatar = async (
      profileDoc: any,
      appwriteAccountId: string,
      fetchedIdentities: any[]
    ) => {
      try {
        if (!profileDoc) return;
        if (profileDoc.role !== "customer") return;
        // Don't check avatarSource, check if we need to set it (removed avatarSource check for simplicity)
        // if (profileDoc.avatarSource === "user") return;
        if (profileDoc.avatarId) return;

        const googleIdentity = fetchedIdentities.find(
          (id) => String(id?.provider || "").toLowerCase() === "google"
        );

        if (!googleIdentity) {
          return;
        }

        const providerAvatarUrl: string | undefined =
          typeof googleIdentity?.providerAvatar === "string"
            ? googleIdentity.providerAvatar
            : undefined;
        // ... (rest of avatar logic is similar but we used fetchedIdentities)

        let pictureUrl: string | undefined = providerAvatarUrl;

        // Short-circuiting the manual fetch for now as it's complex to re-implement inline safely
        // rely on providerAvatarUrl which is usually present for Google

        if (!pictureUrl) return;

        const pictureRes = await fetch(pictureUrl, { cache: "no-store" });
        if (!pictureRes.ok) return;

        const contentType = pictureRes.headers.get("content-type") || "";
        const ext = contentType.includes("png")
          ? "png"
          : contentType.includes("webp")
          ? "webp"
          : contentType.includes("jpeg") || contentType.includes("jpg")
          ? "jpg"
          : "jpg";

        const bytes = new Uint8Array(await pictureRes.arrayBuffer());
        if (!bytes.length) return;

        const newFileId = await uploadUserAvatar(
          bytes,
          `google-avatar-${appwriteAccountId}.${ext}`,
          appwriteAccountId
        );
        // Removed avatarSource
        await updateUserProfileDocument(profileDoc.$id, {
          avatarId: newFileId,
        });
      } catch (error) {
        console.error("Google avatar sync failed", error);
      }
    };

    if (existing) {
      // Update missing linkage if needed.
      if (!existing.appwriteUserId && account?.$id) {
        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          existing.$id,
          { appwriteUserId: account.$id }
        );
      }

      // Best-effort: if this was a Google OAuth login check avatar
      if (account?.$id && isGoogleAuth) {
        await trySyncGoogleAvatar(existing, account.$id, identities);
      }

      // Dynamic Sync: If verified (or isGoogleAuth) and NOT active, activate them now.
      // This handles 'deactivated' users AND Reactivates 'terminated' users if they verify via OAuth.
      if (isVerified && existing.status !== "active") {
        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          existing.$id,
          { status: "active", isActive: true }
        );

        // Only send welcome email if they were specifically 'deactivated' (newly verified)
        // to avoid spamming terminated users who are re-activating.
        if (existing.status === "deactivated") {
          // Send Welcome Email
          await sendWelcomeEmail({
            email: existing.email,
            name: existing.name,
          });
        }

        existing.status = "active";
        existing.isActive = true;
      }

      const refreshed = await findUserByEmail(email);
      const safeRefreshed = refreshed
        ? sanitizeUser(refreshed)
        : sanitizeUser(existing);
      const avatarUrl = buildUserAvatarUrl((refreshed || existing)?.avatarId);

      // Check if user needs to verify email
      if (!isVerified && existing.status === "deactivated") {
        return NextResponse.json(
          {
            error: "Email not verified",
            mustVerify: true,
            email: existing.email,
          },
          { status: 403 }
        );
      }

      const res = NextResponse.json({
        user: {
          ...safeRefreshed,
          appwriteUserId: safeRefreshed.appwriteUserId || account.$id,
          avatarUrl,
        },
      });

      if (sessionJwt) {
        res.cookies.set({
          name: "appwrite_jwt",
          value: sessionJwt,
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
      }

      return res;
    }

    const profile = await createUserProfile({
      name: account?.name || account?.email,
      email,
      role: "customer",
      passwordHash: undefined,
      appwriteUserId: account?.$id,
      status: isVerified ? "active" : "deactivated",
    });

    if (isVerified) {
      // Send Welcome Email for new active user
      await sendWelcomeEmail({
        email: profile.email,
        name: profile.name,
      });
    }

    if (account?.$id && isGoogleAuth) {
      await trySyncGoogleAvatar(profile, account.$id, identities);
    }

    const refreshed = await findUserByEmail(email);
    const safeProfile = sanitizeUser(refreshed || profile);
    const avatarUrl = buildUserAvatarUrl((refreshed || profile)?.avatarId);

    if (!account?.emailVerification) {
      return NextResponse.json(
        {
          error: "Email not verified",
          mustVerify: true,
          email: refreshed?.email || profile.email,
        },
        { status: 403 }
      );
    }

    const res = NextResponse.json({ user: { ...safeProfile, avatarUrl } });

    if (sessionJwt) {
      res.cookies.set({
        name: "appwrite_jwt",
        value: sessionJwt,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return res;
  } catch (error: any) {
    console.error("OAuth sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
