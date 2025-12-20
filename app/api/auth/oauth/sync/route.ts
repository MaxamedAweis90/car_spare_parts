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

    const existing = await findUserByEmail(email);

    const trySyncGoogleAvatar = async (profileDoc: any, appwriteAccountId: string) => {
      try {
        if (!profileDoc) return;
        if (profileDoc.role !== "customer") return;
        if (profileDoc.avatarSource === "user") return;
        if (profileDoc.avatarId) return;

        // Fetch OAuth identity details from Appwrite (more reliable than sessions for provider data).
        const sessionHeaders: Record<string, string> = { "X-Appwrite-Project": projectId };
        if (sessionJwt) {
          sessionHeaders["X-Appwrite-JWT"] = sessionJwt;
        } else if (cookieHeader) {
          sessionHeaders.Cookie = cookieHeader;
        }

        const identitiesRes = await fetch(`${endpoint}/account/identities`, {
          headers: sessionHeaders,
          cache: "no-store",
        });

        if (!identitiesRes.ok) {
          if (isDev) {
            console.info("[oauth/sync] identities fetch failed", {
              status: identitiesRes.status,
            });
          }
          return;
        }

        const identitiesPayload = await identitiesRes.json().catch(() => null);
        const identities: any[] =
          Array.isArray(identitiesPayload?.identities)
            ? identitiesPayload.identities
            : Array.isArray(identitiesPayload)
            ? identitiesPayload
            : [];

        const googleIdentity = identities.find(
          (id) => String(id?.provider || "").toLowerCase() === "google"
        );

        if (!googleIdentity) {
          if (isDev) console.info("[oauth/sync] no google identity present");
          return;
        }

        const providerAvatarUrl: string | undefined =
          typeof googleIdentity?.providerAvatar === "string" ? googleIdentity.providerAvatar : undefined;
        const providerAccessToken: string | undefined =
          typeof googleIdentity?.providerAccessToken === "string"
            ? googleIdentity.providerAccessToken
            : undefined;

        let pictureUrl: string | undefined = providerAvatarUrl;

        // If Appwrite doesn't provide providerAvatar, fall back to Google userinfo using access token.
        if (!pictureUrl && providerAccessToken) {
          const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { Authorization: `Bearer ${providerAccessToken}` },
            cache: "no-store",
          });

          if (!userInfoRes.ok) {
            if (isDev) {
              console.info("[oauth/sync] google userinfo failed", {
                status: userInfoRes.status,
              });
            }
            return;
          }

          const userInfo = await userInfoRes.json().catch(() => null);
          pictureUrl = typeof userInfo?.picture === "string" ? userInfo.picture : undefined;
        }

        if (!pictureUrl) {
          if (isDev) console.info("[oauth/sync] google picture url missing");
          return;
        }

        const pictureRes = await fetch(pictureUrl, { cache: "no-store" });
        if (!pictureRes.ok) {
          if (isDev) {
            console.info("[oauth/sync] google picture fetch failed", {
              status: pictureRes.status,
            });
          }
          return;
        }

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

        const newFileId = await uploadUserAvatar(bytes, `google-avatar-${appwriteAccountId}.${ext}`, appwriteAccountId);
        await updateUserProfileDocument(profileDoc.$id, { avatarId: newFileId, avatarSource: "google" });

        if (isDev) {
          console.info("[oauth/sync] google avatar synced", {
            userId: profileDoc.$id,
            fileId: newFileId,
          });
        }
      } catch (error) {
        // Best-effort; never fail OAuth sync because avatar sync failed.
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

      // Best-effort: if this was a Google OAuth login, use the Google profile picture as avatar.
      if (account?.$id) {
        await trySyncGoogleAvatar(existing, account.$id);
      }

      const refreshed = await findUserByEmail(email);
      const safeRefreshed = refreshed ? sanitizeUser(refreshed) : sanitizeUser(existing);
      const avatarUrl = buildUserAvatarUrl((refreshed || existing)?.avatarId);

      const res = NextResponse.json({
        user: { ...safeRefreshed, appwriteUserId: safeRefreshed.appwriteUserId || account.$id, avatarUrl },
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
    });

    if (account?.$id) {
      await trySyncGoogleAvatar(profile, account.$id);
    }

    const refreshed = await findUserByEmail(email);
    const safeProfile = sanitizeUser(refreshed || profile);
    const avatarUrl = buildUserAvatarUrl((refreshed || profile)?.avatarId);

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
