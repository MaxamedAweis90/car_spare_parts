import type { NextRequest } from "next/server";
import { findUserByEmail, sanitizeUser } from "@/lib/auth-utils";

type SessionResult = {
  account: any;
  profile: any | null;
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

    const account = await accountRes.json();
    const profile = account?.email ? await findUserByEmail(account.email) : undefined;

    return { account, profile: profile ? sanitizeUser(profile) : null };
  } catch (error) {
    console.error("Session fetch error", error);
    return null;
  }
}
