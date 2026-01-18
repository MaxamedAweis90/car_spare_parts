import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { appwriteConfig, databasesServer } from "@/lib/api/appwrite-server";
import { Query } from "node-appwrite";

export async function GET(req: NextRequest) {
  try {
    const { profile: currentAdmin } = await requireAdmin(req);

    if (currentAdmin.role !== "main_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const res = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [
        Query.or([
          Query.equal("role", "admin"),
          Query.equal("role", "main_admin"),
        ]),
      ]
    );

    return NextResponse.json({ admins: res.documents });
  } catch (error: any) {
    console.error("List admins error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

