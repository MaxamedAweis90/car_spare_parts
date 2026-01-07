import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/server/appwrite-admin";

export async function PATCH(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 }
      );
    }

    const jwt = req.cookies.get("appwrite_jwt")?.value;
    if (!jwt) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { account } = createSessionClient(jwt);
    await account.updatePassword(newPassword, currentPassword);

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
