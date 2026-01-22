import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createUserProfile,
  ensureAppwriteUser,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
} from "@/lib/auth/auth-utils";
import {
  appwriteConfig,
  usersServer,
  messagingServer,
} from "@/lib/api/appwrite-server";
import { isValidEmailDomain } from "@/lib/email-validator";
import { createAdminClient } from "@/lib/server/appwrite-admin";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, becomeSeller } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 },
      );
    }

    if (!isValidEmailDomain(email)) {
      return NextResponse.json(
        {
          error:
            "This email provider is not allowed. Please use a trusted provider like Gmail.",
        },
        { status: 400 },
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

    // Create Appwrite auth user (email/password).
    const appwriteUser = await ensureAppwriteUser({ name, email, password });

    // Persist profile in our database
    const profile = await createUserProfile({
      name,
      email,
      role: becomeSeller ? "seller" : "customer",
      sellerApproved: becomeSeller ? false : undefined,
      passwordHash,
      appwriteUserId: appwriteUser.$id,
    });

    const { messaging } = createAdminClient();

    // 3. Trigger CUSTOM Verification Email
    try {
      const verificationToken = ID.unique();
      // Store token in user prefs
      const prefs = await usersServer.getPrefs(appwriteUser.$id);
      await usersServer.updatePrefs(appwriteUser.$id, {
        ...prefs,
        emailVerificationToken: verificationToken,
      });

      const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
      // Use the correct /api/auth/verify-link endpoint
      const verifyLink = `${origin}/api/auth/verify-link?userId=${appwriteUser.$id}&token=${verificationToken}`;

      let subject = "Verify your email address - SomaParts";
      let content = "";

      if (becomeSeller) {
        subject = "Seller Account Created - Action Required";
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { background-color: #f8fafc; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 60px 40px; text-align: center; color: white; }
    .header-icon { font-size: 48px; margin-bottom: 20px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    p { margin-bottom: 20px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🚀</div>
        <h1>Welcome to SomaParts!</h1>
        <p style="opacity: 0.9; margin-top: 10px;">Your Seller Journey Begins</p>
      </div>
      <div class="content">
        <p>Hello <strong>${name}</strong>,</p>
        
        <p>Your seller account has been created successfully and is now <strong>pending admin approval</strong>.</p>
        
        <p>While we review your application, please verify your email address by clicking the button below:</p>
        
        <p style="text-align: center;">
          <a href="${verifyLink}" class="button">Verify Email Address</a>
        </p>
        
        <p>After verification, you will receive another email once your store is fully approved.</p>
        
        <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #94a3b8;">
          If you didn't create this account, please ignore this email.
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
      } else {
        content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { background-color: #f8fafc; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 60px 40px; text-align: center; color: white; }
    .header-icon { font-size: 48px; margin-bottom: 20px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 16px 32px; background-color: #059669; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2); }
    h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    p { margin-bottom: 20px; font-size: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🎉</div>
        <h1>Welcome to SomaParts!</h1>
        <p style="opacity: 0.9; margin-top: 10px;">Your Car Parts Marketplace</p>
      </div>
      <div class="content">
        <p>Hello <strong>${name}</strong>,</p>
        
        <p>Thank you for joining our community! We're excited to have you on board.</p>
        
        <p>Please verify your email address to get started:</p>
        
        <p style="text-align: center;">
          <a href="${verifyLink}" class="button">Verify Email Address</a>
        </p>
        
        <p>Once verified, you'll have full access to browse and purchase car parts from our trusted sellers.</p>
        
        <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #94a3b8;">
          If you didn't create this account, please ignore this email.
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
      }

      await messaging.createEmail(
        ID.unique(),
        subject,
        content,
        [],
        [appwriteUser.$id],
        [],
        [],
        [],
        [],
        false,
        true,
      );

      console.log(`✅ Verification email sent to ${email} (${profile.role})`);
    } catch (vErr) {
      console.warn("Failed to trigger custom verification email:", vErr);
    }

    const isCustomer = profile.role === "customer";

    return NextResponse.json(
      {
        user: sanitizeUser(profile),
        appwriteUserId: appwriteUser.$id,
        databaseId: appwriteConfig.databaseId,
        usersCollectionId: appwriteConfig.usersCollectionId,
        mustVerify: true, // both roles should see verify notice now
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Server error" },
      { status: 500 },
    );
  }
}
