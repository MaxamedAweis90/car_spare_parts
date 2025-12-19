import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/server/requireCustomer";
import { sanitizeUser } from "@/lib/auth-utils";
import { buildUserAvatarUrl, getUserProfileById, updateUserProfileDocument } from "@/lib/server/userProfileService";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type PatchBody = {
  name?: unknown;
  phone?: unknown;
};

export async function PATCH(req: NextRequest) {
  try {
    const { profile } = await requireCustomer(req);
    const body = (await req.json()) as PatchBody;

    const updates: { name?: string; phone?: number | null } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string") return jsonError("Invalid name", 400);
      const trimmed = body.name.trim();
      if (!trimmed) return jsonError("Name is required", 400);
      if (trimmed.length > 80) return jsonError("Name is too long", 400);
      updates.name = trimmed;
    }

    if (body.phone !== undefined) {
      if (body.phone === null || body.phone === "") {
        updates.phone = null;
      } else if (typeof body.phone === "number") {
        if (!Number.isFinite(body.phone)) return jsonError("Invalid phone", 400);
        updates.phone = Math.trunc(body.phone);
      } else if (typeof body.phone === "string") {
        const trimmed = body.phone.trim();
        if (!trimmed) {
          updates.phone = null;
        } else if (!/^\d+$/.test(trimmed)) {
          return jsonError("Phone must be digits only", 400);
        } else {
          const parsed = Number.parseInt(trimmed, 10);
          if (!Number.isFinite(parsed)) return jsonError("Invalid phone", 400);
          updates.phone = parsed;
        }
      } else {
        return jsonError("Invalid phone", 400);
      }
    }

    if (!Object.keys(updates).length) {
      const current = await getUserProfileById(profile.$id);
      const safe = sanitizeUser(current);
      const avatarUrl = buildUserAvatarUrl(current.avatarId);
      return NextResponse.json({ profile: { ...safe, avatarUrl } });
    }

    await updateUserProfileDocument(profile.$id, updates);
    const updated = await getUserProfileById(profile.$id);
    const safe = sanitizeUser(updated);
    const avatarUrl = buildUserAvatarUrl(updated.avatarId);

    return NextResponse.json({ profile: { ...safe, avatarUrl } });
  } catch (error: unknown) {
    console.error("PATCH /api/customer/profile error", error);
    const status =
      typeof error === "object" && error && "status" in error && typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return jsonError(message, status);
  }
}
