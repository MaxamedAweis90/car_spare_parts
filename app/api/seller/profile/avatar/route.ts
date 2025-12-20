import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import { sanitizeUser } from "@/lib/auth-utils";
import {
  buildUserAvatarUrl,
  deleteUserAvatar,
  getUserProfileById,
  updateUserProfileDocument,
  uploadUserAvatar,
} from "@/lib/server/userProfileService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { profile, account } = await requireSeller(req);
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof Blob)) {
      return jsonError("No file received", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    if (!bytes.length) {
      return jsonError("Empty file", 400);
    }

    const providedName = formData.get("filename");
    const filename = typeof providedName === "string" && providedName ? providedName : (file as File).name || "user-avatar";

    const newFileId = await uploadUserAvatar(bytes, filename, account.$id);
    await updateUserProfileDocument(profile.$id, { avatarId: newFileId, avatarSource: "user" });

    if (profile.avatarId && profile.avatarId !== newFileId) {
      await deleteUserAvatar(profile.avatarId);
    }

    const updated = await getUserProfileById(profile.$id);
    const safe = sanitizeUser(updated);
    const avatarUrl = buildUserAvatarUrl(updated.avatarId);

    return NextResponse.json({ profile: { ...safe, avatarUrl } });
  } catch (error: any) {
    console.error("POST /api/seller/profile/avatar error", error);
    const status = error?.status || error?.code || 500;
    const message = error?.message || "Failed to update avatar";
    return jsonError(message, status);
  }
}
