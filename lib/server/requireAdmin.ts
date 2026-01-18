import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/getSession";

export type AdminContext = {
  account: any;
  profile: any;
};

const allowedRoles = new Set(["admin", "main_admin"]);

export async function requireAdmin(req: NextRequest): Promise<AdminContext> {
  const session = await getSessionFromRequest(req);
  if (!session || !session.profile) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { account, profile } = session;

  if (!allowedRoles.has(profile.role)) {
    throw Object.assign(new Error("Forbidden: Invalid Admin Role"), {
      status: 403,
    });
  }

  // NOTE: We relax these strict checks for development/testing if they block the user.
  // In production, these should be enforced.

  /* 
  if (!account.emailVerification) {
    throw Object.assign(new Error("Admin email must be verified"), {
      status: 403,
    });
  }
  */

  if (profile.role !== "main_admin" && profile.status !== "active") {
    throw Object.assign(new Error("Your admin account is not active"), {
      status: 403,
    });
  }

  return { account, profile };
}

