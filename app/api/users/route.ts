import { NextRequest, NextResponse } from "next/server";
import {
  databasesServer,
  appwriteConfig,
  usersServer,
  messagingServer,
} from "@/lib/appwrite-server";
import { Models, Query, ID } from "node-appwrite";
import {
  createUserProfile,
  ensureAppwriteUser,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
} from "@/lib/auth-utils";

const appwriteEndpoint = (
  process.env.APPWRITE_ENDPOINT ||
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
  ""
).trim();
const appwriteProjectId = (
  process.env.APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  ""
).trim();
const mainAdminId = (
  process.env.APPWRITE_MAIN_ADMIN_USER_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_MAIN_ADMIN_USER_ID ||
  ""
).trim();

async function getAppwriteAccountFromRequest(req: NextRequest) {
  if (!appwriteEndpoint || !appwriteProjectId) return null;

  const cookieHeader = req.headers.get("cookie");
  const jwtCookie = req.cookies.get("appwrite_jwt")?.value;
  if (!cookieHeader && !jwtCookie) return null;

  const headers: Record<string, string> = {
    "X-Appwrite-Project": appwriteProjectId,
  };
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
      } else if (
        creator.appwriteUserId &&
        mainAdminId &&
        creator.appwriteUserId === mainAdminId
      ) {
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
    const {
      userId,
      name,
      email,
      role,
      isActive,
      updaterId,
      avatarId,
      sellerApproved,
      phone,
    } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
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
    if (typeof sellerApproved === "boolean") {
      updatedData.sellerApproved = sellerApproved;
      if (sellerApproved === true && user.role === "seller") {
        updatedData.isActive = true;
        //@ts-ignore - status exists in our schema
        updatedData.status = "active";
      }
    }
    if (typeof phone === "number" && Number.isFinite(phone))
      updatedData.phone = Math.trunc(phone);

    const updatedUser = await databasesServer.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userId,
      updatedData
    );

    // Send Approval Email if seller is approved
    if (
      sellerApproved === true &&
      user.role === "seller" &&
      user.sellerApproved !== true
    ) {
      try {
        const subject =
          "Congratulations! Your Seller account has been approved";
        const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { background-color: #f8fafc; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 60px 40px; text-align: center; color: white; }
    .header-icon { font-size: 48px; margin-bottom: 20px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    p { margin-bottom: 20px; font-size: 16px; }
    .feature-list { background: #f8fafc; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .feature-item { display: flex; align-items: center; margin-bottom: 15px; font-weight: 600; font-size: 15px; }
    .feature-item:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🎉</div>
        <h1>You're Approved!</h1>
        <p style="opacity: 0.9; margin-top: 10px;">Welcome to our Marketplace Family</p>
      </div>
      <div class="content">
        <p>Dear <strong>${user.name}</strong>,</p>
        
        <p>We are thrilled to inform you that your seller application has been <strong>approved</strong>! We've reviewed your account and everything looks great.</p>
        
        <p>You can now log in to your seller dashboard and start listing your products. We're excited to see the amazing car parts you'll bring to our community.</p>
        
        <div class="feature-list">
          <div class="feature-item">✅ List & Manage Products</div>
          <div class="feature-item">✅ Track Your Orders</div>
          <div class="feature-item">✅ Access Sales Analytics</div>
          <div class="feature-item">✅ Direct Customer Communication</div>
        </div>
        
        <p style="text-align: center;">
          <a href="${req.nextUrl.origin}/auth/seller/login" class="button">Go to Seller Console</a>
        </p>
        
        <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #94a3b8;">
          If you have any questions, feel free to contact our support team.
        </p>
      </div>
      <div class="footer">
        <p>© 2026 SomaParts. All rights reserved.</p>
        <p>Transforming the way car enthusiasts find parts.</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        await messagingServer.createEmail(
          ID.unique(),
          subject,
          content,
          [], // topics
          [user.appwriteUserId || user.$id], // users
          [], // targets
          [], // cc
          [], // bcc
          [], // attachments
          false, // draft
          true // html
        );
        console.log("Seller approval email sent successfully.");
      } catch (emailErr) {
        console.error("Failed to send seller approval email:", emailErr);
        // Don't fail the update if email fails
      }
    }

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
