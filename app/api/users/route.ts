import { NextRequest, NextResponse } from "next/server";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { Models, Query } from "node-appwrite";

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
    const { name, email, role, creatorId, sellerApproved } = await req.json();

    if (!name || !email || !role || !creatorId) {
      return NextResponse.json(
        { error: "name, email, role, creatorId are required" },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const creator = await getUserById(creatorId);
    if (creator.role !== "main_admin" && creator.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create users" },
        { status: 403 }
      );
    }

    if (role === "customer") {
      return NextResponse.json(
        { error: "Admins cannot create customers" },
        { status: 403 }
      );
    }

    const createdAt = new Date().toISOString();
    const isActive = true;

    const user = await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      "unique()",
      {
        name,
        email,
        role,
        createdAt,
        isActive,
        sellerApproved: role === "seller" ? Boolean(sellerApproved) : undefined,
      }
    );

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
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

    const user = await getUserById(userId);
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
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
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
  } catch (error: any) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
