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
    .info-box { background: #f8fafc; border-radius: 16px; padding: 25px; margin: 30px 0; border: 1px solid #e2e8f0; }
    .info-item { margin-bottom: 10px; font-size: 15px; }
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
        
        <p>You have been invited to join the <strong>SomaParts Administration Team</strong>. We're excited to have you on board!</p>
        
        <div class="info-box">
          <div class="info-item"><strong>Your Email:</strong> ${userEmail}</div>
          <div class="info-item" style="color: #64748b; font-size: 14px; margin-top: 15px;">
            ℹ️ You'll set your own secure password during the activation process
          </div>
        </div>

        <p>Click the button below to activate your account and set your password. This link will expire in 24 hours for security reasons.</p>
        
        <p style="text-align: center;">
          <a href="${activationLink}" class="button">Activate Admin Account</a>
        </p>
        
        <p style="margin-top: 40px; font-size: 14px; text-align: center; color: #94a3b8;">
          If you were not expecting this invitation, please ignore this email or contact support.
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
export function getOrderConfirmationTemplate(
  userName: string,
  orderId: string,
  totalPrice: number,
  items: any[],
  shippingAddress: any,
  viewOrderLink: string,
): string {
  const itemsHtml = items
    .map(
      (item) => `
    <div style="display: flex; align-items: center; border-bottom: 1px solid #e2e8f0; padding: 15px 0;">
      <div style="flex: 1;">
         <div style="font-weight: 600; font-size: 15px;">${item.name}</div>
         <div style="color: #64748b; font-size: 13px;">Qty: ${item.quantity}</div>
      </div>
      <div style="font-weight: 600;">$${item.price}</div>
    </div>
  `,
    )
    .join("");

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
    .header { background: linear-gradient(135deg, #000000 0%, #1e1e1e 100%); padding: 40px; text-align: center; color: white; }
    .header-icon { font-size: 40px; margin-bottom: 10px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 25px; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .order-info { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0; }
    .total-row { display: flex; justify-content: space-between; font-weight: 800; font-size: 18px; margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">🛍️</div>
        <h1>Order Confirmed!</h1>
        <p style="opacity: 0.8; margin-top: 5px;">Order #${orderId.slice(-6).toUpperCase()}</p>
      </div>
      <div class="content">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Thank you for your purchase! We've received your order and are getting it ready.</p>
        
        <div class="order-info">
          <div style="font-weight: 700; margin-bottom: 15px; text-transform: uppercase; font-size: 12px; color: #64748b; letter-spacing: 1px;">Items Ordered</div>
          ${itemsHtml}
          <div class="total-row">
            <div>Total</div>
            <div>$${totalPrice.toFixed(2)}</div>
          </div>
        </div>

        <p style="text-align: center;">
          <a href="${viewOrderLink}" class="button">View Order Status</a>
        </p>
      </div>
      <div class="footer">
        <p>© 2026 SomaParts. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function getOrderDeliveredTemplate(
  userName: string,
  orderId: string,
  viewOrderLink: string,
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
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px; text-align: center; color: white; }
    .header-icon { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 40px; }
    .footer { background: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; }
    .button { display: inline-block; padding: 14px 28px; background-color: #16a34a; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: bold; margin-top: 25px; }
    h1 { margin: 0; font-size: 24px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-icon">📦</div>
        <h1>Your Order Arrived!</h1>
        <p style="opacity: 0.9; margin-top: 5px;">Delivered Successfully</p>
      </div>
      <div class="content">
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Great news! Your order <strong>#${orderId.slice(-6).toUpperCase()}</strong> has been delivered.</p>
        
        <p>We hope you enjoy your purchase. If you have a moment, we'd love to hear your feedback.</p>

        <p style="text-align: center;">
          <a href="${viewOrderLink}" class="button">View Order & Leave Review</a>
        </p>
      </div>
      <div class="footer">
        <p>© 2026 SomaParts. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
