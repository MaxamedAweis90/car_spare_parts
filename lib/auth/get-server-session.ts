import { cookies } from "next/headers";
import { findUserByEmail, sanitizeUser } from "@/lib/auth/auth-utils";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import { Query } from "node-appwrite";
import { log } from "@/lib/utils/logger";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;
const mainAdminId = (
  process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
  ""
).trim();

export async function getServerSession() {
  log.debug("Starting server session check");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_id")?.value;

  const allCookies = cookieStore.getAll();
  const cookieHeader = allCookies
    .map((c: any) => `${c.name}=${c.value}`)
    .join("; ");
  const jwtCookie = cookieStore.get("appwrite_jwt")?.value;

  log.debug("Session cookies retrieved", {
    cookieCount: allCookies.length,
    hasJWT: !!jwtCookie,
  });

  if (!cookieHeader && !jwtCookie) {
    log.debug("No authentication cookies found");
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
      if (accountRes.status === 401) {
        log.debug("User not authenticated (401)");
      } else {
        log.error("Account fetch failed", {
          status: accountRes.status,
          statusText: accountRes.statusText,
        });
        try {
          const text = await accountRes.text();
          log.debug("Error response body", { body: text.slice(0, 200) });
        } catch {}
      }
      return { authenticated: false, account: null, profile: null };
    }

    const account = await accountRes.json();
    log.debug("Account authenticated", {
      userId: account.$id,
      email: account.email,
    });

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
        log.debug("Syncing activated profile status");
        await databasesServer.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          profile.$id,
          { status: "active", isActive: true },
        );
        profile = await findUserByEmail(account.email);
      } catch (err) {
        log.warn("Failed to sync profile status", { error: err });
      }
    }

    const safeProfile = profile ? sanitizeUser(profile) : null;

    const isMainAdminAccount =
      Boolean(mainAdminId) && account?.$id === mainAdminId;
    if (safeProfile && isMainAdminAccount) {
      safeProfile.role = "main_admin";
    }

    log.debug("Session check complete", { role: safeProfile?.role });

    return {
      authenticated: true,
      account,
      profile: safeProfile,
    };
  } catch (error) {
    log.error("Unexpected error in session check", error);
    return { authenticated: false, account: null, profile: null };
  }
}
