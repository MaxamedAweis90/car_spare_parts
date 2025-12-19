import type { NextRequest } from "next/server";
import type { UserProfile } from "@/lib/auth-utils";
import { findUserByEmail, sanitizeUser } from "@/lib/auth-utils";
import { buildUserAvatarUrl } from "@/lib/server/userProfileService";

type AppwriteAccount = {
  $id: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

type SafeUserProfile = Omit<UserProfile, "passwordHash"> & { avatarUrl?: string | null };

type SessionResult = {
  account: AppwriteAccount;
  profile: SafeUserProfile | null;
};

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

export async function getSessionFromRequest(req: NextRequest): Promise<SessionResult | null> {
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

    const account = (await accountRes.json()) as AppwriteAccount;
    const profile = account?.email ? await findUserByEmail(account.email) : undefined;

    const safeProfile = profile ? (sanitizeUser(profile) as SafeUserProfile) : null;
    const avatarUrl = profile ? buildUserAvatarUrl(profile.avatarId) : null;

    return { account, profile: safeProfile ? { ...safeProfile, avatarUrl } : null };
  } catch (error) {
    console.error("Session fetch error", error);
    return null;
  }
}
