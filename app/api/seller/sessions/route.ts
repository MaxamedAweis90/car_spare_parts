import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/server/requireSeller";
import { createSessionClient } from "@/lib/server/appwrite-admin";
import { messagingServer } from "@/lib/api/appwrite-server";
import { ID } from "node-appwrite";

export async function GET(req: NextRequest) {
  try {
    await requireSeller(req);
    const jwt = req.cookies.get("appwrite_jwt")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    const { account } = createSessionClient(jwt);
    const sessions = await account.listSessions();

    return NextResponse.json({ sessions: sessions.sessions });
  } catch (error: any) {
    console.error("List seller sessions error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSeller(req);
    const { sessionId, all } = await req.json().catch(() => ({}));
    const jwt = req.cookies.get("appwrite_jwt")?.value;

    if (!jwt) {
      return NextResponse.json({ error: "Session not found" }, { status: 401 });
    }

    const { account } = createSessionClient(jwt);

    // Fetch user details for email (before deleting sessions)
    const user = await account.get();
    const email = user.email;
    const name = user.name || "Seller";

    if (all) {
      await account.deleteSessions();
      await sendSecurityEmail(
        email,
        name,
        "All devices have been signed out from your account."
      );

      const res = NextResponse.json({ message: "All sessions revoked" });
      res.cookies.delete("appwrite_jwt");
      return res;
    } else if (sessionId) {
      await account.deleteSession(sessionId);
      await sendSecurityEmail(
        email,
        name,
        "A device has been signed out from your account."
      );
      return NextResponse.json({ message: "Session revoked" });
    } else {
      return NextResponse.json(
        { error: "sessionId or all is required" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Revoke seller session error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

async function sendSecurityEmail(email: string, name: string, message: string) {
  try {
    const subject = "Security Alert: Session Updated";
    const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
    .header { background: #000; color: #fff; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Security Alert</h2>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>${message}</p>
      <p>If this was you, no further action is needed.</p>
      <p>If you did not authorize this action, please <strong>change your password immediately</strong> and contact support.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SomaParts. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    await messagingServer.createEmail(
      ID.unique(),
      subject,
      content,
      [],
      [email]
    );
  } catch (error) {
    console.error("Failed to send security email", error);
  }
}

