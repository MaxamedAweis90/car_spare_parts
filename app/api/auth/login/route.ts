import { NextRequest, NextResponse } from "next/server";
import setCookieParser from "set-cookie-parser";
import {
  ensureAppwriteUser,
  findUserByEmail,
  sanitizeUser,
  verifyPassword,
} from "@/lib/auth-utils";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

function buildCookieHeader(cookies: setCookieParser.Cookie[]) {
  if (!cookies.length) return "";
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

async function createAppwriteEmailSession(email: string, password: string) {
  const loginRes = await fetch(`${endpoint}/account/sessions/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  if (!loginRes.ok) {
    const body = await loginRes.json().catch(() => null);
    throw new Error(body?.message || "Invalid credentials");
  }

  const session = await loginRes.json();
  const rawSetCookie = loginRes.headers.get("set-cookie") || "";
  const split = setCookieParser.splitCookiesString(rawSetCookie);
  const parsed = split.map((cookieStr) => setCookieParser.parseString(cookieStr));

  let jwt: string | undefined;
  const cookieHeader = buildCookieHeader(parsed);

  if (cookieHeader) {
    const jwtRes = await fetch(`${endpoint}/account/jwt`, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": projectId,
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (jwtRes.ok) {
      const jwtBody = await jwtRes.json();
      jwt = jwtBody?.jwt;
    }
  }

  return { session, cookies: parsed, jwt };
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.isActive === false) {
      return NextResponse.json(
        { error: "User is inactive" },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Password not set for this user" },
        { status: 400 }
      );
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Ensure an Appwrite auth user exists for this email (helps legacy profiles).
    if (!user.appwriteUserId) {
      try {
        await ensureAppwriteUser({ name: user.name, email: user.email, password });
      } catch (err) {
        // If the auth user already exists, continue; otherwise surface error.
        const message = (err as any)?.message || "";
        const conflict = typeof message === "string" && message.toLowerCase().includes("exists");
        if (!conflict) throw err;
      }
    }

    const { session, cookies, jwt } = await createAppwriteEmailSession(
      email,
      password
    );

    const res = NextResponse.json({
      user: sanitizeUser(user),
      session,
      jwt,
    });

    cookies.forEach((cookie: setCookieParser.Cookie) => {
      res.cookies.set({
        name: cookie.name,
        value: cookie.value,
        path: cookie.path || "/",
        // Do not forward the domain from Appwrite; set host-only for this app.
        domain: undefined,
        httpOnly: cookie.httpOnly,
        // Allow cookies over HTTP in dev; enforce secure in production.
        secure: process.env.NODE_ENV === "production",
        sameSite: (cookie.sameSite as "lax" | "strict" | "none") || "lax",
        expires: cookie.expires ? new Date(cookie.expires) : undefined,
        maxAge: cookie.maxAge,
      });
    });

    if (jwt) {
      res.cookies.set({
        name: "appwrite_jwt",
        value: jwt,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
