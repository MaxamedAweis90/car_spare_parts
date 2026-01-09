import { NextRequest, NextResponse } from "next/server";
import { findStoreBySlug } from "@/lib/server/sellerStoreService";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const excludeStoreId = searchParams.get("excludeStoreId");

  if (!slug) {
    return NextResponse.json({ exists: false });
  }

  const store = await findStoreBySlug(slug);

  if (!store) {
    return NextResponse.json({ exists: false });
  }

  // If the slug belongs to the current store, it doesn't "exist" as an obstacle
  if (excludeStoreId && store.$id === excludeStoreId) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({ exists: true });
}
