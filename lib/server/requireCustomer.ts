import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/getSession";

export type CustomerContext = {
  account: { $id: string; [key: string]: unknown };
  profile: { $id: string; role: "customer"; avatarId?: string; [key: string]: unknown };
};

export async function requireCustomer(req: NextRequest): Promise<CustomerContext> {
  const session = await getSessionFromRequest(req);
  if (!session || !session.profile) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { account, profile } = session;
  if (profile.role !== "customer") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  return { account, profile: profile as CustomerContext["profile"] };
}
