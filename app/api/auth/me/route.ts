import { NextRequest, NextResponse } from "next/server";
import { findUserByEmail, sanitizeUser } from "@/lib/auth-utils";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

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
    const profile = account?.email ? await findUserByEmail(account.email) : undefined;

    return NextResponse.json({
      authenticated: true,
      account,
      profile: profile ? sanitizeUser(profile) : null,
    });
  } catch (error: any) {
    console.error("Me error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
