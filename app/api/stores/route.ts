import { NextRequest, NextResponse } from "next/server";
import { listActiveStores } from "@/lib/server/sellerStoreService";

export async function GET(_req: NextRequest) {
  try {
    const stores = await listActiveStores();
    return NextResponse.json({ stores });
  } catch (error: any) {
    console.error("GET /api/stores error", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch stores" },
      { status: 500 }
    );
  }
}

