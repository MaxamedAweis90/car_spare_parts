import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createUserProfile,
  ensureAppwriteUser,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
} from "@/lib/auth-utils";
import { appwriteConfig } from "@/lib/appwrite-server";
import { isValidEmailDomain } from "@/lib/email-validator";
import {
  createAppwriteEmailSession,
  triggerAppwriteVerification,
} from "@/lib/server/appwrite-auth-actions";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, becomeSeller } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        {
          error:
            "This email provider is not allowed. Please use a trusted provider like Gmail.",
        },
        { status: 400 }
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

    // Create Appwrite auth user (email/password).
    const appwriteUser = await ensureAppwriteUser({ name, email, password });

    // Persist profile in the existing users collection; default role = customer.
    const profile = await createUserProfile({
      name,
      email,
      role: becomeSeller ? "seller" : "customer",
      sellerApproved: becomeSeller ? false : undefined,
      passwordHash,
      appwriteUserId: appwriteUser.$id,
    });

    // 3. Trigger Verification Email automatically (for customers) or Approval Email (for sellers)
    if (becomeSeller) {
      // Send custom email for successful account creation but pending approval
      try {
        const { messagingServer } = await import("@/lib/appwrite-server");
        // Using Create Email from Messaging service
        // Required: defined provider in Appwrite console.
        // We'll Create an email message. Targets the user by userId.
        const subject = "Seller Account Created - Pending Approval";
        const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f7f7f7; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; text-decoration: none; border-radius: 5px; font-weight: bold; color: white !important; }
    .btn-whatsapp { background-color: #25D366; }
    .btn-telegram { background-color: #0088cc; }
    .status-badge { background: #FFA500; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Welcome to Our Seller Platform!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>Thank you for registering as a seller on our platform. Your account has been created successfully!</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <span class="status-badge">⏳ Pending Admin Approval</span>
      </div>
      
      <p>Your seller account is currently <strong>waiting for admin approval</strong>. Once approved, you will gain full access to:</p>
      
      <ul style="line-height: 2;">
        <li>Product management dashboard</li>
        <li>Order tracking and fulfillment</li>
        <li>Sales analytics and reports</li>
        <li>Customer communication tools</li>
      </ul>
      
      <p><strong>What happens next?</strong></p>
      <p>Our admin team will review your application shortly. You will receive a confirmation email once your account is approved.</p>
      
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
      
      <p style="text-align: center; font-size: 16px;"><strong>Need help or want to expedite the process?</strong></p>
      <p style="text-align: center;">Contact our admin team directly:</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://wa.me/25261XXXXXXX" class="button btn-whatsapp">📱 Contact via WhatsApp</a>
        <a href="https://t.me/admin_handle" class="button btn-telegram">✈️ Contact via Telegram</a>
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        <em>Please do not reply to this email. For support, use the contact buttons above.</em>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 SomaParts. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
        `;

        // Check availability of providers or just attempt send
        // Note: In newer Appwrite Messaging, we create a message which can trigger emails if targets are set.
        // Or simpler: Create a message directly to a target.
        // Assuming "email" provider is set up and default.

        // We need to create a target first? Or can we send to a user ID?
        // documentation: createEmail(messageId, subject, content, topics[], users[], targets[], cc[], bcc[], draft, html, scheduledAt)
        // Messaging.createEmail(ID.unique(), subject, content, [], [appwriteUser.$id]);

        // Get provider ID from environment (optional)
        // If not set, Appwrite will use the first enabled email provider
        // Note: createEmail signature: (messageId, subject, content, topics, users, targets, cc, bcc, attachments, draft, html, scheduledAt)

        await messagingServer.createEmail(
          ID.unique(), // messageId
          subject, // subject
          content, // content
          [], // topics (optional)
          [appwriteUser.$id], // users (optional)
          [], // targets (optional)
          [], // cc (optional)
          [], // bcc (optional)
          [], // attachments (optional)
          false, // draft
          true, // html
          undefined // scheduledAt (undefined = send immediately)
        );

        console.log("Seller pending approval email sent.");
      } catch (msgErr) {
        console.error("Failed to send seller approval email:", msgErr);
        // Do not fail registration
      }
    } else {
      // Customer: Trigger verification email
      try {
        const { cookieHeader } = await createAppwriteEmailSession(
          email,
          password
        );
        const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        await triggerAppwriteVerification(cookieHeader, origin);
      } catch (vErr) {
        console.warn("Failed to trigger automatic verification email:", vErr);
        // We don't fail the registration if only verification toast fails
      }
    }

    const isCustomer = profile.role === "customer";

    return NextResponse.json(
      {
        user: sanitizeUser(profile),
        appwriteUserId: appwriteUser.$id,
        databaseId: appwriteConfig.databaseId,
        usersCollectionId: appwriteConfig.usersCollectionId,
        mustVerify: isCustomer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
