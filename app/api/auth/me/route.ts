import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, sanitizeUser } from "@/lib/auth/auth-utils";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import { buildUserAvatarUrl } from "@/lib/server/userProfileService";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const mainAdminId = (
  process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
  ""
).trim();

// Parse main admin IDs
const getMainAdminIds = () => {
  return mainAdminId
    .split(",")
    .map((id) => id.trim().replace(/^["'](.+)["']$/, "$1"))
    .filter(Boolean);
};

function checkIsMainAdmin(
  authId?: string | null,
  profileDocId?: string | null,
  profileLinkedAuthId?: string | null,
  profileRole?: string | null,
) {
  const allowedIds = getMainAdminIds();
  if (allowedIds.length === 0) return profileRole === "main_admin";

  const isMatch =
    (authId && allowedIds.includes(authId)) ||
    (profileDocId && allowedIds.includes(profileDocId)) ||
    (profileLinkedAuthId && allowedIds.includes(profileLinkedAuthId)) ||
    profileRole === "main_admin";

  return isMatch;
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const jwtCookie = req.cookies.get("appwrite_jwt")?.value;

  if (!cookieHeader && !jwtCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const headers: Record<string, string> = { "X-Appwrite-Project": projectId };
    if (jwtCookie) {
      headers["X-Appwrite-JWT"] = jwtCookie;
    } else if (cookieHeader) {
      headers.Cookie = cookieHeader;
    }

    const accountRes = await fetch(`${endpoint}/account`, {
      headers,
      cache: "no-store",
    });

    if (!accountRes.ok) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const account = await accountRes.json();
    let profile = account?.email
      ? await findUserByEmail(account.email)
      : undefined;

    // Dynamic Sync: If verified by Appwrite but still deactivated in our DB, activate them now.
    if (
      account?.emailVerification &&
      profile &&
      profile.status === "deactivated"
    ) {
      await databasesServer.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        profile.$id,
        { status: "active", isActive: true },
      );
      // Fetch fresh profile after update
      profile = await findUserByEmail(account.email);
    }

    const safeProfile = profile ? sanitizeUser(profile) : null;
    const avatarUrl = profile ? buildUserAvatarUrl(profile.avatarId) : null;

    const isMainAdminAccount = checkIsMainAdmin(
      account?.$id,
      profile?.$id,
      profile?.appwriteUserId,
      profile?.role,
    );
    const hydratedProfile =
      safeProfile && isMainAdminAccount
        ? { ...safeProfile, role: "main_admin" as const }
        : safeProfile;

    return NextResponse.json({
      authenticated: true,
      account,
      profile: hydratedProfile ? { ...hydratedProfile, avatarUrl } : null,
    });
  } catch (error: unknown) {
    console.error("Me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
