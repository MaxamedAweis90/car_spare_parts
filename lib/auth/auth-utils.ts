import bcrypt from "bcryptjs";
import { ID, Models, Query } from "node-appwrite";
import {
  appwriteConfig,
  databasesServer,
  usersServer,
} from "@/lib/api/appwrite-server";

export type RoleType = "main_admin" | "admin" | "seller" | "customer";
export type AvatarSource = "google" | "user";
export type AdminStatus = "active" | "deactivated" | "terminated";

export interface UserProfile extends Models.Document {
  name: string;
  email: string;
  role: RoleType;
  createdAt: string;
  isActive: boolean;
  status: AdminStatus;
  avatarId?: string;
  avatarSource?: AvatarSource;
  phone?: number | null;
  passwordHash?: string;
  appwriteUserId?: string;
  sellerApproved?: boolean;
}

const DEFAULT_ROLE: RoleType = "customer";

export function sanitizeUser(user: UserProfile) {
  // Strip sensitive fields before sending to the client.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  const list = await databasesServer.listDocuments<UserProfile>(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    [Query.equal("email", email)]
  );

  return list.total > 0 ? (list.documents[0] as UserProfile) : undefined;
}

export async function createUserProfile(params: {
  name: string;
  email: string;
  role?: RoleType;
  passwordHash?: string;
  appwriteUserId?: string;
  sellerApproved?: boolean;
  status?: AdminStatus;
}) {
  const {
    name,
    email,
    role = DEFAULT_ROLE,
    passwordHash,
    appwriteUserId,
    sellerApproved,
    status = "deactivated",
  } = params;
  const createdAt = new Date().toISOString();

  const profile = await databasesServer.createDocument<UserProfile>(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    ID.unique(),
    {
      name,
      email,
      role,
      createdAt,
      isActive: status === "active",
      status,
      passwordHash,
      appwriteUserId,
      sellerApproved,
    }
  );

  return profile as UserProfile;
}

export async function ensureAppwriteUser(params: {
  name: string;
  email: string;
  password: string;
}) {
  const { name, email, password } = params;

  // Create Appwrite auth user with admin key; errors if user already exists with the same email.
  const appwriteUser = await usersServer.create(
    ID.unique(),
    email,
    undefined,
    password,
    name
  );

  return appwriteUser;
}

export async function ensureUserProfile(params: {
  name: string;
  email: string;
  role?: RoleType;
  passwordHash?: string;
  appwriteUserId?: string;
}) {
  const existing = await findUserByEmail(params.email);
  if (existing) return existing;
  return createUserProfile(params);
}

