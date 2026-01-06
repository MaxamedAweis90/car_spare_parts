import { NextRequest } from "next/server";
import { findUserByEmail, sanitizeUser } from "@/lib/auth-utils";
import { buildUserAvatarUrl } from "@/lib/server/userProfileService";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const mainAdminId = (
  process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
  ""
).trim();

export async function getServerSession(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const jwtCookie = req.cookies.get("appwrite_jwt")?.value;

  if (!cookieHeader && !jwtCookie) {
    return null;
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
      return null;
    }

    const account = await accountRes.json();
    const profile = account?.email
      ? await findUserByEmail(account.email)
      : undefined;

    const safeProfile = profile ? sanitizeUser(profile) : null;
    const avatarUrl = profile ? buildUserAvatarUrl(profile.avatarId) : null;

    const isMainAdminAccount =
      Boolean(mainAdminId) && account?.$id === mainAdminId;

    // If main admin, override role only for the session object, not in DB
    const finalRole =
      safeProfile && isMainAdminAccount ? "main_admin" : safeProfile?.role;

    const hydratedProfile = safeProfile
      ? { ...safeProfile, role: finalRole, avatarUrl }
      : null;

    return {
      authenticated: true,
      account,
      profile: hydratedProfile,
    };
  } catch (error) {
    console.error("getServerSession error:", error);
    return null;
  }
}
