/**
 * Notification Service (Mock)
 * In a real production environment, this would use an SMTP transporter (Nodemailer),
 * an external service like SendGrid/AWS SES, or Appwrite Functions to send custom
 * HTML emails to users.
 */

import { AdminStatus } from "@/lib/auth/auth-utils";

export const sendStatusNotification = async (params: {
  email: string;
  name: string;
  status: AdminStatus;
}) => {
  const { email, name, status } = params;

  const templates: Record<AdminStatus, { subject: string; body: string }> = {
    active: {
      subject: "Your Administrator Account has been Reactivated",
      body: `Hello ${name}, your admin access to SomaAutoPart has been restored. You can now log in again.`,
    },
    deactivated: {
      subject: "Security Alert: Account Deactivated",
      body: `Hello ${name}, your administrator account has been deactivated by the system administrator. All active sessions have been terminated.`,
    },
    terminated: {
      subject: "Account Notice: Termination",
      body: `Hello ${name}, your administrator account has been terminated and access has been permanently revoked.`,
    },
  };

  const template = templates[status];
  if (!template) return;

  // MOCK: In practice, you'd trigger your email provider here.
  console.log(`[EMAIL DISPATCH] 
    TO: ${email}
    SUBJECT: ${template.subject}
    CONTENT: ${template.body}
  `);

  // Example of how you'd call a real service:
  // await transporter.sendMail({ from: 'admin@somaautopart.com', to: email, ... });
};

export const sendWelcomeEmail = async (params: {
  email: string;
  name: string;
}) => {
  const { email, name } = params;

  console.log(`[EMAIL DISPATCH] 
    TO: ${email}
    SUBJECT: Welcome to SomaAutoPart!
    CONTENT: Hello ${name}, your email has been verified. Welcome to SomaAutoPart using Appwrite!
  `);
};

