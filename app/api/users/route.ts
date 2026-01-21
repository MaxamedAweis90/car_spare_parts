import { NextRequest, NextResponse } from "next/server";
import {
  databasesServer,
  appwriteConfig,
  usersServer,
  messagingServer,
} from "@/lib/api/appwrite-server";
import { Models, Query, ID } from "node-appwrite";
import {
  createUserProfile,
  ensureAppwriteUser,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
} from "@/lib/auth/auth-utils";
import { logActivity } from "@/lib/server/auditService";
import {
  getEmailUpdateVerificationTemplate,
  getSellerApprovalEmailTemplate,
  getAdminInvitationTemplate,
} from "@/lib/emails/templates";

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

// Parse main admin IDs (handles comma-separated and strips quotes)
const getMainAdminIds = () => {
  return mainAdminId
    .split(",")
    .map((id) => id.trim().replace(/^["'](.+)["']$/, "$1"))
    .filter(Boolean);
};

if (!mainAdminId) {
  console.warn(
    "⚠️ APPWRITE_MAIN_ADMIN_USER_ID is not set! Main Admin privileges will be limited to database roles only.",
  );
}

/**
 * Robust check to see if a user is the one and only Main Admin.
 * Checks against the Auth Session, the Profile's linked Auth ID, and the Profile Document ID.
 */
function checkIsMainAdmin(
  authId?: string | null,
  profileDocId?: string | null,
  profileLinkedAuthId?: string | null,
  profileRole?: string | null,
) {
  const allowedIds = getMainAdminIds();
  if (allowedIds.length === 0) return profileRole === "main_admin";

  const isMatch =
    (authId && allowedIds.includes(authId)) ||
    (profileDocId && allowedIds.includes(profileDocId)) ||
    (profileLinkedAuthId && allowedIds.includes(profileLinkedAuthId)) ||
    profileRole === "main_admin";

  return isMatch;
}

function getMaskedExpectedIds() {
  return getMainAdminIds()
    .map((id) =>
      id ? `${id.substring(0, 4)}...${id.substring(id.length - 4)}` : "???",
    )
    .join(", ");
}

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

  if (!accountRes.ok) {
    const errorText = await accountRes.text();
    console.warn("Appwrite session retrieval failed:", {
      status: accountRes.status,
      error: errorText,
      hasJwt: Boolean(jwtCookie),
      hasCookies: Boolean(cookieHeader),
    });
    return null;
  }
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
    id,
  )) as UserDocument;
}

// CREATE USER
export async function POST(req: NextRequest) {
  try {
    const { name, email, role, creatorId, password } = await req.json();

    if (!name || !email || !role || !creatorId || !password) {
      return NextResponse.json(
        { error: "name, email, password, role, creatorId are required" },
        { status: 400 },
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Authorize: Is the requester the one and only Main Admin?
    const account = await getAppwriteAccountFromRequest(req);
    const creator = await getUserById(creatorId);

    const isMainAdmin = checkIsMainAdmin(
      account?.$id,
      creatorId,
      creator.appwriteUserId,
      creator.role,
    );

    console.log("Create Admin Permission Check (Production Diagnostics):", {
      isAuthorized: isMainAdmin,
      expectedIds_Masked: getMaskedExpectedIds(),
      currentUser_AuthId: account?.$id || "none",
      currentUser_DocId: creatorId,
      profile_LinkedAuthId: creator.appwriteUserId || "none",
    });

    if (!isMainAdmin) {
      return NextResponse.json(
        {
          error: `Only the main admin can create admin accounts. Identified as: ${account?.$id || creatorId}. Expected one of: ${getMaskedExpectedIds()}`,
        },
        { status: 403 },
      );
    }

    if (role !== "admin") {
      return NextResponse.json(
        { error: "Only admin accounts can be created here" },
        { status: 403 },
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const appwriteUser = await ensureAppwriteUser({ name, email, password });

    // Generate activation token
    const activationToken = ID.unique();
    await usersServer.updatePrefs(appwriteUser.$id, {
      adminActivationToken: activationToken,
    });

    const profile = await createUserProfile({
      name,
      email,
      role: "admin",
      passwordHash,
      appwriteUserId: appwriteUser.$id,
    });

    // Send Invitation Email
    try {
      const activationLink = `${req.nextUrl.origin}/auth/admin/activate?userId=${appwriteUser.$id}&token=${activationToken}`;
      const subject = "Invitation to join SomaParts Admin Team";
      const content = getAdminInvitationTemplate(
        name,
        email,
        password,
        activationLink,
      );

      console.log("📧 Attempting to send admin invitation email...", {
        userId: appwriteUser.$id,
        toEmail: email,
        origin: req.nextUrl.origin,
        activationLink,
      });

      const messageRes = await messagingServer.createEmail(
        ID.unique(),
        subject,
        content,
        [], // topics
        [appwriteUser.$id], // users
        [], // targets
        [], // cc
        [], // bcc
        [], // attachments
        false, // draft
        true, // html
      );

      console.log(
        "✅ Admin invitation email sent successfully:",
        messageRes.$id,
      );
    } catch (emailErr) {
      console.error("❌ Failed to send admin invitation email:", emailErr);
    }

    // Log Activity
    if (role === "admin") {
      try {
        const creator = await getUserById(creatorId);
        await logActivity({
          adminId: creatorId,
          adminName: creator.name || "Main Admin",
          action: "INVITE_ADMIN",
          targetId: appwriteUser.$id,
          targetName: name,
          details: `Invited new admin: ${email}`,
        });
      } catch (err) {
        console.warn("Failed to log activity", err);
      }
    }

    return NextResponse.json(sanitizeUser(profile), { status: 201 });
  } catch (error: unknown) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
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
        { status: 400 },
      );
    }

    const user = await getUserById(userId);
    const updater = updaterId ? await getUserById(updaterId) : null;

    // Authorize Check: Is the updater the Main Admin?
    const account = await getAppwriteAccountFromRequest(req);
    const isMainAdminUpdater = checkIsMainAdmin(
      account?.$id,
      updaterId,
      updater?.appwriteUserId,
      updater?.role,
    );

    console.log("Update User Permission Check (Production Diagnostics):", {
      isAuthorized: isMainAdminUpdater,
      expectedIds_Masked: getMaskedExpectedIds(),
      updater_AuthId: account?.$id || "none",
      updater_DocId: updaterId,
    });

    if (updater && !isMainAdminUpdater && updater.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update users" },
        { status: 403 },
      );
    }

    // Protection for Main Admin profile
    const isTargetMainAdmin = checkIsMainAdmin(
      user.appwriteUserId,
      userId,
      null, // we don't need linked auth here as we have both
      user.role,
    );

    if (isTargetMainAdmin) {
      if (!isMainAdminUpdater) {
        return NextResponse.json(
          { error: "Only the main admin can update a main admin profile" },
          { status: 403 },
        );
      }
      if (typeof isActive === "boolean" && isActive === false) {
        return NextResponse.json(
          { error: "The main admin account cannot be deactivated" },
          { status: 403 },
        );
      }
      if (role && role !== "admin" && role !== "main_admin") {
        return NextResponse.json(
          {
            error:
              "The main admin role cannot be changed to anything other than admin",
          },
          { status: 403 },
        );
      }
    }

    const updatedData: Partial<UserDocument> = {};

    if (name) updatedData.name = name;

    // Sync Email with Appwrite Auth
    if (email && email !== user.email && user.appwriteUserId) {
      try {
        await usersServer.updateEmail(user.appwriteUserId, email);

        // If main_admin, auto-verify (no need for verification)
        if (user.role === "main_admin") {
          await usersServer.updateEmailVerification(user.appwriteUserId, true);
        } else {
          // Send Verification Email for others
          try {
            const verificationToken = ID.unique();
            const prefs = await usersServer.getPrefs(user.appwriteUserId);
            await usersServer.updatePrefs(user.appwriteUserId, {
              ...prefs,
              emailVerificationToken: verificationToken,
            });

            // Send Email
            const verifyLink = `${req.nextUrl.origin}/api/auth/verify-link?userId=${user.appwriteUserId}&token=${verificationToken}`;
            const subject = "Verify your new email address";
            const content = getEmailUpdateVerificationTemplate(
              name || user.name,
              email,
              verifyLink,
            );

            console.log("📧 Sending verification email to admin:", {
              userId: user.appwriteUserId,
              newEmail: email,
              oldEmail: user.email,
              verifyLink,
            });

            // Send to the user ID - Appwrite will use the NEW email we just updated
            const emailMessage = await messagingServer.createEmail(
              ID.unique(),
              subject,
              content,
              [], // topics
              [user.appwriteUserId], // users - send to this user (uses their updated email)
              [], // targets
              [], // cc
              [], // bcc
              [], // attachments
              false, // draft
              true, // html
            );

            console.log("✅ Admin verification email sent successfully:", {
              messageId: emailMessage.$id,
              userId: user.appwriteUserId,
              sentToEmail: email,
            });
          } catch (err: any) {
            console.error(
              "Failed to send verification email for admin update",
              err,
            );
          }
        }
      } catch (err: any) {
        console.error("Failed to update Appwrite email:", err);
        return NextResponse.json(
          {
            error:
              err?.message || "Failed to update email address in Auth system",
          },
          { status: 400 },
        );
      }
    }

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
      updatedData,
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
        const content = getSellerApprovalEmailTemplate(
          user.name,
          `${req.nextUrl.origin}/auth/seller/login`,
        );

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
          true, // html
        );
        console.log("Seller approval email sent successfully.");
      } catch (emailErr) {
        console.error("Failed to send seller approval email:", emailErr);
        // Don't fail the update if email fails
      }
    }

    // Log Activity
    try {
      if (updater) {
        // Seller Approval
        if (
          sellerApproved === true &&
          user.role === "seller" &&
          user.sellerApproved !== true
        ) {
          await logActivity({
            adminId: updater.$id,
            adminName: updater.name,
            action: "APPROVE_SELLER",
            targetId: user.$id,
            targetName: user.name,
            details: "Approved seller application",
          });
        }

        // Deactivate/Activate
        if (typeof isActive === "boolean" && isActive !== user.isActive) {
          const action =
            user.role === "seller"
              ? isActive
                ? "APPROVE_SELLER"
                : "DEACTIVATE_SELLER" // Re-activating acts like approval/reset
              : isActive
                ? "UPDATE_PASSWORD_ADMIN"
                : "DEACTIVATE_ADMIN"; // Re-using UPDATE_PASSWORD_ADMIN as placeholder for 'REACTIVATE' isn't great, let's Stick to checking role.

          // Correct logic:
          let act = "";
          if (user.role === "seller")
            act = isActive ? "APPROVE_SELLER" : "DEACTIVATE_SELLER";
          else if (user.role.includes("admin"))
            act = isActive ? "INVITE_ADMIN" : "DEACTIVATE_ADMIN"; // 'INVITE_ADMIN' implies active? Maybe just use generic.

          // Let's simple it down:
          if (user.role === "seller" && !isActive) {
            await logActivity({
              adminId: updater.$id,
              adminName: updater.name,
              action: "DEACTIVATE_SELLER",
              targetId: user.$id,
              targetName: user.name,
              details: "Deactivated seller account",
            });
          }
          if (user.role.includes("admin") && !isActive) {
            await logActivity({
              adminId: updater.$id,
              adminName: updater.name,
              action: "DEACTIVATE_ADMIN",
              targetId: user.$id,
              targetName: user.name,
              details: "Deactivated admin account",
            });
          }
        }
      }
    } catch (e) {
      console.warn("Log error", e);
    }

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
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
      queries,
    );

    return NextResponse.json(list);
  } catch (error: unknown) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
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
        { status: 400 },
      );
    }

    // Authorize: Is the requester the Main Admin?
    const account = await getAppwriteAccountFromRequest(req);
    const deleter = await getUserById(deleterId);

    const isMainAdmin = checkIsMainAdmin(
      account?.$id,
      deleterId,
      deleter.appwriteUserId,
      deleter.role,
    );

    console.log("Delete Admin Permission Check (Production Diagnostics):", {
      isAuthorized: isMainAdmin,
      expectedIds_Masked: getMaskedExpectedIds(),
      currentUser_AuthId: account?.$id || "none",
      currentUser_DocId: deleterId,
    });

    if (!isMainAdmin) {
      return NextResponse.json(
        {
          error: `Only the main admin can delete admin accounts. Identified as: ${account?.$id || deleterId}. Expected one of: ${getMaskedExpectedIds()}`,
        },
        { status: 403 },
      );
    }

    const target = await getUserById(userId);
    const isTargetMainAdmin = checkIsMainAdmin(
      target.appwriteUserId,
      userId,
      null,
      target.role,
    );

    if (isTargetMainAdmin) {
      return NextResponse.json(
        { error: "The main admin account cannot be deleted" },
        { status: 403 },
      );
    }

    await databasesServer.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      userId,
    );

    // Best-effort: also delete the Appwrite auth user if linked.
    if (target.appwriteUserId) {
      try {
        await usersServer.delete(target.appwriteUserId);
      } catch (error: unknown) {
        console.warn("Appwrite auth user delete failed:", error);
      }
    }

    // Log Activity
    try {
      await logActivity({
        adminId: deleterId,
        adminName: deleter.name || "Admin",
        action: target.role === "seller" ? "DELETE_SELLER" : "DELETE_ADMIN",
        targetId: userId,
        targetName: target.name,
        details: `Deleted ${target.role} account`,
      });
    } catch (e) {
      console.warn("Log error", e);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
