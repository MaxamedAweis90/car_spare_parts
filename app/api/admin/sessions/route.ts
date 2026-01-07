import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { createSessionClient } from "@/lib/server/appwrite-admin";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const jwt = req.cookies.get("appwrite_jwt")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    const { account } = createSessionClient(jwt);
    const sessions = await account.listSessions();

    return NextResponse.json({ sessions: sessions.sessions });
  } catch (error: any) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { sessionId, all } = await req.json().catch(() => ({}));
    const jwt = req.cookies.get("appwrite_jwt")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    const { account } = createSessionClient(jwt);

    if (all) {
      await account.deleteSessions();
      // Also clear our own cookie in the response
      const res = NextResponse.json({ message: "All sessions revoked" });
      res.cookies.delete("appwrite_jwt");
      return res;
    } else if (sessionId) {
      await account.deleteSession(sessionId);
      return NextResponse.json({ message: "Session revoked" });
    } else {
      return NextResponse.json(
        { error: "sessionId or all is required" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Revoke session error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
