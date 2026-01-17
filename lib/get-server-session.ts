import { cookies } from "next/headers";
import { findUserByEmail, sanitizeUser } from "@/lib/auth-utils";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig, databasesServer } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const mainAdminId = (
  process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
  ""
).trim();

export async function getServerSession() {
  console.log("[getServerSession] Starting...");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_id")?.value;

  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies
    .map((c: any) => `${c.name}=${c.value}`)
    .join("; ");
  const jwtCookie = cookieStore.get("appwrite_jwt")?.value;

  console.log(
    `[getServerSession] Cookies: count=${
      allCookies.length
    }, hasJWT=${!!jwtCookie}, headerLen=${cookieHeader.length}`
  );

  if (!cookieHeader && !jwtCookie) {
    console.log(
      "[getServerSession] No cookies/JWT found. Returning unauthenticated."
    );
    return { authenticated: false, account: null, profile: null };
  }

  try {
    const headers: Record<string, string> = {
      "X-Appwrite-Project": projectId,
      "Content-Type": "application/json",
    };

    if (jwtCookie) {
      headers["X-Appwrite-JWT"] = jwtCookie;
      // headers["X-Appwrite-Response-Format"] = "0.14.0";
    } else {
      headers.Cookie = cookieHeader;
    }

    // Direct REST call to Appwrite Account API
    const accountRes = await fetch(`${endpoint}/account`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!accountRes.ok) {
      console.error(
        `[getServerSession] Account fetch failed: ${accountRes.status} ${accountRes.statusText}`
      );
      try {
        const text = await accountRes.text();
        console.error(`[getServerSession] Error Body: ${text.slice(0, 200)}`);
      } catch {}
      return { authenticated: false, account: null, profile: null };
    }

    const account = await accountRes.json();
    console.log(
      `[getServerSession] Account OK: ${account.$id} (${account.email})`
    );

    let profile = account?.email
      ? await findUserByEmail(account.email)
      : undefined;

    // Dynamic Sync logic
    if (
      account?.emailVerification &&
      profile &&
      profile.status === "deactivated"
    ) {
      try {
        console.log("[getServerSession] Syncing activated profile status...");
        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          profile.$id,
          { status: "active", isActive: true }
        );
        profile = await findUserByEmail(account.email);
      } catch (err) {
        console.warn("[getServerSession] Failed to sync profile status", err);
      }
    }

    const safeProfile = profile ? sanitizeUser(profile) : null;

    const isMainAdminAccount =
      Boolean(mainAdminId) && account?.$id === mainAdminId;
    if (safeProfile && isMainAdminAccount) {
      safeProfile.role = "main_admin";
    }

    console.log(
      `[getServerSession] Returning success. Role: ${safeProfile?.role}`
    );

    return {
      authenticated: true,
      account,
      profile: safeProfile,
    };
  } catch (error) {
    console.error("[getServerSession] Unexpected error:", error);
    return { authenticated: false, account: null, profile: null };
  }
}
