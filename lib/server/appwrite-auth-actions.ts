import setCookieParser from "set-cookie-parser";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

function buildCookieHeader(cookies: any[]) {
  if (!cookies.length) return "";
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

/**
 * Creates an Appwrite session on the server and retrieves cookies/JWT.
 */
export async function createAppwriteEmailSession(
  email: string,
  password: string,
) {
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
  const split = (setCookieParser as any).splitCookiesString(rawSetCookie);
  const parsed = split.map((cookieStr: string) =>
    (setCookieParser as any).parseString(cookieStr),
  );

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

  return { session, cookies: parsed, jwt, cookieHeader };
}

/**
 * Triggers an email verification using a temporary session cookie.
 */
export async function triggerAppwriteVerification(
  cookieHeader: string,
  origin: string,
) {
  const cleanOrigin = origin.endsWith("/") ? origin.slice(0, -1) : origin;
  const url = `${cleanOrigin}/auth/verify`;

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[Auth] Triggering verification email with redirect URL: ${url}`,
    );
  }

  const res = await fetch(`${endpoint}/account/verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ url }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    console.warn("Verification trigger failed:", body);
    return false;
  }

  return true;
}
