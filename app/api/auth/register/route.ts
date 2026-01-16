import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";
import {
  createUserProfile,
  ensureAppwriteUser,
  findUserByEmail,
  hashPassword,
  sanitizeUser,
} from "@/lib/auth-utils";
import {
  appwriteConfig,
  usersServer,
  messagingServer,
} from "@/lib/appwrite-server";
import { isValidEmailDomain } from "@/lib/email-validator";
import { createAdminClient } from "@/lib/server/appwrite-admin";

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
      const verifyLink = `${origin}/auth/verify?userId=${appwriteUser.$id}&token=${verificationToken}`;

      let subject = "Verify your email address - SomaParts";
      let content = "";

      if (becomeSeller) {
        subject = "Seller Account Created - Action Required";
        content = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background: #1e293b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>SomaParts</h1></div>
            <div style="padding: 20px;">
              <h2>Welcome, ${name}!</h2>
              <p>Your seller account has been created successfully and is now <b>pending admin approval</b>.</p>
              <p>While we review your application, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verifyLink}" class="button">Verify Email Address</a>
              </p>
              <p>After verification, you will receive another email once your store is fully approved.</p>
              <hr/>
              <p style="font-size: 12px; color: #666;">If you didn't create this account, please ignore this email.</p>
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
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: #fff !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>SomaParts</h1></div>
            <div style="padding: 20px;">
              <h2>Welcome to SomaParts!</h2>
              <p>Thank you for joining our community. Please verify your email address to get started:</p>
              <p style="text-align: center;">
                <a href="${verifyLink}" class="button">Verify Email Address</a>
              </p>
              <p>Once verified, you'll have full access to browse and purchase car parts.</p>
              <hr/>
              <p style="font-size: 12px; color: #666;">If you didn't create this account, please ignore this email.</p>
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
        true
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
