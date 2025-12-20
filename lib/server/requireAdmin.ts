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
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return { account, profile };
}
