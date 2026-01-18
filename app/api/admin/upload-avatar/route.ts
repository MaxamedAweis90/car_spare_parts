import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { sanitizeUser } from "@/lib/auth/auth-utils";
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
    const { profile, account } = await requireAdmin(req);
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
    const filename =
      typeof providedName === "string" && providedName
        ? providedName
        : (file as File).name || "admin-avatar";

    const newFileId = await uploadUserAvatar(bytes, filename, account.$id);
    await updateUserProfileDocument(profile.$id, { avatarId: newFileId });

    // Clean up old avatar if exists
    if (profile.avatarId && profile.avatarId !== newFileId) {
      await deleteUserAvatar(profile.avatarId);
    }

    const updated = await getUserProfileById(profile.$id);
    const safe = sanitizeUser(updated);
    const avatarUrl = buildUserAvatarUrl(updated.avatarId);

    // Return format consistent with other APIs, though Admin UI might expect different
    // The previous implementation returned { fileId, viewUrl }
    // The Admin UI I built expects: if (res.ok) window.dispatchEvent...
    // It doesn't strictly use the JSON response for the image preview immediately (it relies on refresh).
    // EXCEPT: The definition of `avatarUrl` in admin/settings/page.tsx relies on `profile.avatarId`.
    // So standardized response is fine.

    return NextResponse.json({
      fileId: newFileId, // Keep for compatibility if needed
      viewUrl: avatarUrl,
      profile: { ...safe, avatarUrl },
    });
  } catch (error: any) {
    console.error("POST /api/admin/upload-avatar error", error);
    const status = error?.status || 500;
    return jsonError(error?.message || "Failed to upload avatar", status);
  }
}

