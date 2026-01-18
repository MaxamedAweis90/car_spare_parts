import { NextRequest, NextResponse } from "next/server";

const endpoint = process.env.APPWRITE_ENDPOINT!;
const projectId = process.env.APPWRITE_PROJECT_ID!;

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");

  try {
    if (cookieHeader) {
      await fetch(`${endpoint}/account/sessions/current`, {
        method: "DELETE",
        headers: {
          "X-Appwrite-Project": projectId,
          Cookie: cookieHeader,
        },
        cache: "no-store",
      }).catch(() => undefined);
    }

    const res = NextResponse.json({ success: true });

    const cookieNames = cookieHeader
      ? cookieHeader.split(";").map((part) => part.trim().split("=")[0])
      : [];

    // Always clear our JWT cookie as well.
    cookieNames.push("appwrite_jwt");

    cookieNames.forEach((name) => {
      res.cookies.set({ name, value: "", path: "/", maxAge: 0 });
    });

    return res;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}

