export function getVerificationEmailTemplate(
  userName: string,
  userEmail: string,
  verifyLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Verify your email</h2>
        <p>Hello ${userName},</p>
        <p>Please verify your email address <strong>${userEmail}</strong> by clicking the button below.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" class="button">Verify Email Address</a>
        </p>
        <p>If you didn't request this, please contact support immediately.</p>
      </div>
    </body>
    </html>
  `;
}

export function getEmailUpdateVerificationTemplate(
  userName: string,
  newEmail: string,
  verifyLink: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
        .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Verify your email</h2>
        <p>Hello ${userName},</p>
        <p>Your email address has been updated to <strong>${newEmail}</strong>. Please verify this change by clicking the button below.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" class="button">Verify Email Address</a>
        </p>
        <p>If you didn't request this change, please contact support immediately.</p>
      </div>
    </body>
    </html>
  `;
}

export function getSellerApprovalEmailTemplate(
  userName: string,
  loginUrl: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { background-color: #f8fafc; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 60px 40px; text-align: center; color: white; }
    .header-icon { font-size: 48px; margin-bottom: 20px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    p { margin-bottom: 20px; font-size: 16px; }
    .feature-list { background: #f8fafc; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .feature-item { display: flex; align-items: center; margin-bottom: 15px; font-weight: 600; font-size: 15px; }
    .feature-item:last-child { margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🎉</div>
        <h1>You're Approved!</h1>
        <p style="opacity: 0.9; margin-top: 10px;">Welcome to our Marketplace Family</p>
      </div>
      <div class="content">
        <p>Dear <strong>${userName}</strong>,</p>
        
        <p>We are thrilled to inform you that your seller application has been <strong>approved</strong>! We've reviewed your account and everything looks great.</p>
        
        <p>You can now log in to your seller dashboard and start listing your products. We're excited to see the amazing car parts you'll bring to our community.</p>
        
        <div class="feature-list">
          <div class="feature-item">✅ List & Manage Products</div>
          <div class="feature-item">✅ Track Your Orders</div>
          <div class="feature-item">✅ Access Sales Analytics</div>
          <div class="feature-item">✅ Direct Customer Communication</div>
        </div>
        
        <p style="text-align: center;">
          <a href="${loginUrl}" class="button">Go to Seller Console</a>
        </p>
        
        <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #94a3b8;">
          If you have any questions, feel free to contact our support team.
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

export function getAdminInvitationTemplate(
  userName: string,
  userEmail: string,
  tempPass: string,
  activationLink: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .wrapper { background-color: #f8fafc; padding: 40px 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 60px 40px; text-align: center; color: white; }
    .header-icon { font-size: 48px; margin-bottom: 20px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 16px 32px; background-color: #0f172a; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 25px; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.2); }
    h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
    p { margin-bottom: 20px; font-size: 16px; }
    .credentials { background: #f8fafc; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .cred-item { margin-bottom: 10px; font-family: monospace; font-size: 15px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🛡️</div>
        <h1>Admin Invitation</h1>
        <p style="opacity: 0.9; margin-top: 10px;">Welcome to SomaParts Administration</p>
      </div>
      <div class="content">
        <p>Hello <strong>${userName}</strong>,</p>
        
        <p>You have been invited to join the <strong>SomaParts Administration Team</strong>. Your account has been prepared, and you can now activate it to get started.</p>
        
        <p>Below are your temporary login credentials:</p>
        
        <div class="credentials">
          <div class="cred-item"><strong>Email:</strong> ${userEmail}</div>
          <div class="cred-item"><strong>Temp Password:</strong> ${tempPass}</div>
        </div>

        <p>For security reasons, you will be required to change your password during the activation process.</p>
        
        <p style="text-align: center;">
          <a href="${activationLink}" class="button">Activate Admin Account</a>
        </p>
        
        <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #94a3b8;">
          If you were not expecting this invitation, please ignore this email.
        </p>
      </div>
      <div class="footer">
        <p>© 2026 SomaParts. All rights reserved.</p>
        <p>Secure Marketplace Management</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
