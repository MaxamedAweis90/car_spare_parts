import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { createAdminClient } from "@/lib/server/appwrite-admin";
import { databasesServer, appwriteConfig } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { sendStatusNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest) {
  try {
    const { profile: currentAdmin } = await requireAdmin(req);

    if (currentAdmin.role !== "main_admin") {
      return NextResponse.json(
        { error: "Only main admin can manage other admins" },
        { status: 403 }
      );
    }

    const { adminId, status } = await req.json(); // status: active, deactivated, terminated

    if (!adminId || !status) {
      return NextResponse.json(
        { error: "adminId and status are required" },
        { status: 400 }
      );
    }

    const { users, databases } = createAdminClient();

    // 1. Get the admin profile
    const profileRes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal("appwriteUserId", adminId)]
    );

    if (profileRes.total === 0) {
      return NextResponse.json(
        { error: "Admin profile not found" },
        { status: 404 }
      );
    }

    const profile = profileRes.documents[0];

    // 2. Perform actions based on status
    if (status === "deactivated") {
      // Deactivated
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        profile.$id,
        { isActive: false, status: "deactivated" }
      );
      // Revoke all sessions
      await users.deleteSessions(adminId);
      // Block user login
      await users.updateStatus(adminId, false);

      await sendStatusNotification({
        email: profile.email as string,
        name: profile.name as string,
        status: "deactivated",
      });
    } else if (status === "active") {
      // Active
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        profile.$id,
        { isActive: true, status: "active" }
      );
      await users.updateStatus(adminId, true);

      await sendStatusNotification({
        email: profile.email as string,
        name: profile.name as string,
        status: "active",
      });
    } else if (status === "terminated") {
      // Terminated
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        profile.$id,
        { isActive: false, status: "terminated" }
      );
      await users.deleteSessions(adminId);
      await users.updateStatus(adminId, false); // Block login

      await sendStatusNotification({
        email: profile.email as string,
        name: profile.name as string,
        status: "terminated",
      });
    } else {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: `Admin status updated to ${status}` });
  } catch (error: any) {
    console.error("Manage admin error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
