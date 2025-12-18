import { NextRequest, NextResponse } from "next/server";
import {
  createUserProfile,
  findUserByEmail,
  sanitizeUser,
} from "@/lib/auth-utils";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

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

      const res = NextResponse.json({
        user: sanitizeUser({ ...existing, appwriteUserId: existing.appwriteUserId || account.$id }),
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

    const res = NextResponse.json({ user: sanitizeUser(profile) });

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
