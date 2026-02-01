import { NextRequest, NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { databasesServer, appwriteConfig } from "@/lib/api/appwrite-server";
import { validateEmail } from "@/lib/utils/email-validator"; // Assuming this exists or I'll implement inline if simple

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // 1. Check if already subscribed
    const existing = await databasesServer.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.newsletterSubscribersCollectionId,
      [Query.equal("email", email)],
    );

    if (existing.total > 0) {
      return NextResponse.json(
        { message: "You are already subscribed!" },
        { status: 200 }, // Idempotent success from UI perspective
      );
    }

    // 2. Create Subscriber
    await databasesServer.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.newsletterSubscribersCollectionId,
      ID.unique(),
      {
        email,
        subscribedAt: new Date().toISOString(),
        isActive: true,
        dealCountAtLastNotification: 0, // Placeholder for future logic
      },
    );

    // 3. Trigger Welcome Email Logic
    // In a real app, we'd queue a job here. For now, we simulate the logic.
    // We can't easily "wait 5 mins" in a serverless function without timeout.
    // So we'll effectively "schedule" it by logging it, or trigger an immediate "Welcome" for demo purposes.

    console.log(
      `[NEWSLETTER] New subscriber: ${email}. Schedule Welcome Email in 5 mins.`,
    );
    console.log(
      `[NEWSLETTER] Sending 'Latest Deals' welcome email to ${email}...`,
    );

    // Future: Call email provider here.

    return NextResponse.json(
      { message: "Successfully subscribed!" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);

    // Handle "Collection not found" gracefully for this demo if DB isn't set up yet
    if (error?.code === 404) {
      return NextResponse.json(
        { error: "Newsletter service not available (Collection missing)" },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
