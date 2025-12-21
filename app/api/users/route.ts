import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig, usersServer } from "@/lib/appwrite-server";
import { Models, Query } from "node-appwrite";
import { createUserProfile, ensureAppwriteUser, findUserByEmail, hashPassword, sanitizeUser } from "@/lib/auth-utils";

const appwriteEndpoint = (process.env.APPWRITE_ENDPOINT || process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "").trim();
const appwriteProjectId = (process.env.APPWRITE_PROJECT_ID || process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "").trim();
const mainAdminId = (process.env.APPWRITE_MAIN_ADMIN_USER_ID || process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID || "").trim();

async function getAppwriteAccountFromRequest(req: NextRequest) {
  if (!appwriteEndpoint || !appwriteProjectId) return null;

  const cookieHeader = req.headers.get("cookie");
  const jwtCookie = req.cookies.get("appwrite_jwt")?.value;
  if (!cookieHeader && !jwtCookie) return null;

  const headers: Record<string, string> = { "X-Appwrite-Project": appwriteProjectId };
  if (jwtCookie) {
    headers["X-Appwrite-JWT"] = jwtCookie;
  } else if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const accountRes = await fetch(`${appwriteEndpoint}/account`, {
    headers,
    cache: "no-store",
  });

  if (!accountRes.ok) return null;
  return accountRes.json();
}

interface UserDocument extends Models.Document {
  name: string;
  email: string;
  role: "main_admin" | "admin" | "seller" | "customer";
  createdAt: string;
  isActive: boolean;
  avatarId?: string; // new field
  sellerApproved?: boolean; // whether seller has been approved
  passwordHash?: string;
  appwriteUserId?: string;
  phone?: number;
}

const allowedRoles = ["main_admin", "admin", "seller", "customer"] as const;

async function getUserById(id: string): Promise<UserDocument> {
  return (await databasesServer.getDocument(
    appwriteConfig.databaseId,
    appwriteConfig.usersCollectionId,
    id
  )) as UserDocument;
}

// CREATE USER
export async function POST(req: NextRequest) {
  try {
    const { name, email, role, creatorId, password } = await req.json();

    if (!name || !email || !role || !creatorId || !password) {
      return NextResponse.json(
        { error: "name, email, password, role, creatorId are required" },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Authorize using the current Appwrite session (most reliable), falling back to creatorId checks.
    let isMainAdmin = false;
    const account = await getAppwriteAccountFromRequest(req);
    if (account?.$id && mainAdminId && account.$id === mainAdminId) {
      isMainAdmin = true;
    }

    // Some setups store the main admin id as the profile document id instead of the Appwrite auth user id.
    if (!isMainAdmin && mainAdminId && creatorId === mainAdminId) {
      isMainAdmin = true;
    }

    if (!isMainAdmin) {
      const creator = await getUserById(creatorId);
      if (creator.role === "main_admin") {
        isMainAdmin = true;
      } else if (creator.appwriteUserId && mainAdminId && creator.appwriteUserId === mainAdminId) {
        isMainAdmin = true;
      }
    }

    if (!isMainAdmin) {
      return NextResponse.json(
        { error: "Only the main admin can create admin accounts" },
        { status: 403 }
      );
    }

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only admin accounts can be created here" },
        { status: 403 }
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const appwriteUser = await ensureAppwriteUser({ name, email, password });

    const profile = await createUserProfile({
      name,
      email,
      role: "admin",
      passwordHash,
      appwriteUserId: appwriteUser.$id,
    });

    return NextResponse.json(sanitizeUser(profile), { status: 201 });
  } catch (error: unknown) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// UPDATE USER (including avatarId)
export async function PUT(req: NextRequest) {
  try {
    const { userId, name, email, role, isActive, updaterId, avatarId, sellerApproved, phone } =
      await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await getUserById(userId);
    const updater = updaterId ? await getUserById(updaterId) : null;
    if (updater && updater.role !== "main_admin" && updater.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update users" },
        { status: 403 }
      );
    }

    const updatedData: Partial<UserDocument> = {};

    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (role && allowedRoles.includes(role)) updatedData.role = role;
    if (typeof isActive === "boolean") updatedData.isActive = isActive;
    if (avatarId) updatedData.avatarId = avatarId; // update avatar
    if (typeof sellerApproved === "boolean") updatedData.sellerApproved = sellerApproved;
    if (typeof phone === "number" && Number.isFinite(phone)) updatedData.phone = Math.trunc(phone);

    const updatedUser = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userId,
      updatedData
    );

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// LIST USERS (basic filter by role and sellerApproved)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const sellerApproved = searchParams.get("sellerApproved");

    const queries: string[] = [];
    if (role) queries.push(Query.equal("role", role));
    if (sellerApproved !== null) {
      const val = sellerApproved === "true";
      queries.push(Query.equal("sellerApproved", val));
    }

    const list = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      queries
    );

    return NextResponse.json(list);
  } catch (error: unknown) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

// DELETE USER (profile doc; main_admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { userId, deleterId } = await req.json();

    if (!userId || !deleterId) {
      return NextResponse.json(
        { error: "userId and deleterId are required" },
        { status: 400 }
      );
    }

    const deleter = await getUserById(deleterId);
    if (deleter.role !== "main_admin") {
      return NextResponse.json(
        { error: "Only the main admin can delete admin accounts" },
        { status: 403 }
      );
    }

    const target = await getUserById(userId);
    if (target.role === "main_admin") {
      return NextResponse.json(
        { error: "The main admin account cannot be deleted" },
        { status: 403 }
      );
    }

    await databasesServer.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userId
    );

    // Best-effort: also delete the Appwrite auth user if linked.
    if (target.appwriteUserId) {
      try {
        await usersServer.delete(target.appwriteUserId);
      } catch (error: unknown) {
        console.warn("Appwrite auth user delete failed:", error);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
