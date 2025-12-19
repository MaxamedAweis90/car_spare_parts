import { NextRequest, NextResponse } from "next/server";
import { findStoreBySlug, serializeStoreDocument } from "@/lib/server/sellerStoreService";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const store = await findStoreBySlug(slug);
    if (!store || store.isActive === false) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({ store: serializeStoreDocument(store) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load store" }, { status: 500 });
  }
}
