import { randomUUID } from "crypto";
import { Buffer } from "node:buffer";
import { Permission, Role } from "node-appwrite";
import { appwriteConfig, databasesServer, storageServer } from "@/lib/appwrite-server";
import type { UserProfile } from "@/lib/auth-utils";

const { databaseId, usersCollectionId, avatarBucketId, endpoint, projectId, apiKey } = appwriteConfig;

function ensureAvatarBucketId() {
  if (!avatarBucketId) {
    throw new Error("Missing Appwrite avatar bucket id");
  }
  return avatarBucketId;
}

function ensureUploadBasics() {
  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite endpoint, project id, or API key for uploads");
  }
  return { endpoint, projectId, apiKey } as const;
}

export async function getUserProfileById(userId: string) {
  const document = await databasesServer.getDocument<UserProfile>(databaseId, usersCollectionId, userId);
  return document as UserProfile;
}

export async function updateUserProfileDocument(userId: string, payload: Partial<UserProfile>) {
  const updated = await databasesServer.updateDocument<UserProfile>(databaseId, usersCollectionId, userId, payload);
  return updated as UserProfile;
}

export async function deleteUserAvatar(fileId: string) {
  if (!fileId) return;
  const bucketId = ensureAvatarBucketId();
  try {
    await storageServer.deleteFile(bucketId, fileId);
  } catch (error) {
    console.error("Failed to delete previous user avatar", error);
  }
}

export async function uploadUserAvatar(fileBytes: Uint8Array, filename: string, accountId: string) {
  const bucketId = ensureAvatarBucketId();
  const { endpoint: apiEndpoint, projectId: project, apiKey: key } = ensureUploadBasics();
  const uploadUrl = `${apiEndpoint}/storage/buckets/${bucketId}/files`;
  const form = new FormData();
  const blob = new Blob([Buffer.from(fileBytes)], { type: "application/octet-stream" });

  form.append("fileId", "unique()");
  form.append("file", blob, filename || `user-avatar-${randomUUID()}`);
  form.append("permissions[]", Permission.read(Role.any()));
  form.append("permissions[]", Permission.update(Role.user(accountId)));
  form.append("permissions[]", Permission.delete(Role.user(accountId)));

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Appwrite-Project": project,
      "X-Appwrite-Key": key,
    },
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.message || "Failed to upload user avatar";
    throw new Error(message);
  }

  const uploadedId: unknown = payload?.$id ?? payload?.fileId ?? payload?.id;
  if (typeof uploadedId !== "string" || !uploadedId) {
    throw new Error("Appwrite upload succeeded but returned an invalid file id");
  }

  return uploadedId;
}

export function buildUserAvatarUrl(fileId: string | null | undefined) {
  if (!fileId) {
    return null;
  }
  const bucketId = ensureAvatarBucketId();
  if (!endpoint || !projectId) {
    console.warn("Missing Appwrite endpoint or project id for avatar URL");
    return null;
  }
  try {
    const base = endpoint.replace(/\/?$/, "");
    const url = new URL(`/storage/buckets/${bucketId}/files/${fileId}/view`, base);
    url.searchParams.set("project", projectId);
    return url.toString();
  } catch (error) {
    console.error("Failed to build user avatar URL", error);
    return null;
  }
}
