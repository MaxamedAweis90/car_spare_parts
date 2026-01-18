import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/server/getSession";

export type SellerContext = {
  account: any;
  profile: any;
};

export async function requireSeller(req: NextRequest): Promise<SellerContext> {
  const session = await getSessionFromRequest(req);
  if (!session || !session.profile) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }

  const { account, profile } = session;
  if (profile.role !== "seller") {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  if (profile.sellerApproved === false) {
    throw Object.assign(new Error("Seller pending approval"), { status: 403 });
  }

  return { account, profile };
}

