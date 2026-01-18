import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import {
  deleteStoreAvatar,
  findStoreBySellerId,
  updateStoreDocument,
  uploadStoreAvatar,
} from "@/lib/server/sellerStoreService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { profile, account } = await requireSeller(req);
    const store = await findStoreBySellerId(profile.$id);
    if (!store) {
      return jsonError("Store not found", 404);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return jsonError("No file received", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (!buffer.length) {
      return jsonError("Empty file", 400);
    }

    const providedName = formData.get("filename");
    const filename = typeof providedName === "string" && providedName ? providedName : (file as any)?.name || "store-avatar";

    const newFileId = await uploadStoreAvatar(buffer, filename, account.$id);
    const updated = await updateStoreDocument(store.$id, { storeAvatarId: newFileId });

    if (store.storeAvatarId && store.storeAvatarId !== newFileId) {
      await deleteStoreAvatar(store.storeAvatarId);
    }

    return NextResponse.json({ store: updated });
  } catch (error: any) {
    console.error("POST /api/seller/store/avatar error", error);
    const status = error?.status || 500;
    return jsonError(error?.message || "Failed to upload avatar", status);
  }
}

