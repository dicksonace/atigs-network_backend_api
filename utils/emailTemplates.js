// utils/emailTemplates.js
const path = require('path');
const fs = require('fs');

const baseTemplate = (content, title = 'ATIGS Network') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.6; 
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f7f7f7;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .logo {
      max-width: 180px;
      height: auto;
    }
    .content {
      padding: 25px 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
      margin: 15px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eeeeee;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .otp-code {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      margin: 20px 0;
      padding: 15px;
      background: #f3f4f6;
      display: inline-block;
      border-radius: 4px;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 0;
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="cid:companylogo" alt="ATIGS Network Logo" class="logo">
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} ATIGS Network. All rights reserved.</p>
      <p>
        <a href="https://atigsnetwork.com/privacy" style="color: #2563eb;">Privacy Policy</a> | 
        <a href="https://atigsnetwork.com/terms" style="color: #2563eb;">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

module.exports = {
  verificationEmail: (name, url) => baseTemplate(`
    <h2 style="margin-top: 0;">Welcome to ATIGS Network, ${name}!</h2>
    <p>Thank you for registering with ATIGS Network. To complete your registration, please verify your email address by clicking the button below:</p>
    
    <div style="text-align: center;">
      <a href="${url}" class="button">Verify Email Address</a>
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; font-size: 13px; color: #666666;">${url}</p>
    
    <p style="color: #666666;">If you didn't create an account with ATIGS Network, please ignore this email.</p>
  `, "Verify Your Email"),

  passwordResetEmail: (name, url) => baseTemplate(`
    <h2 style="margin-top: 0;">Password Reset Request</h2>
    <p>Hello ${name},</p>
    <p>We received a request to reset your ATIGS Network account password. Click the button below to proceed:</p>
    
    <div style="text-align: center;">
      <a href="${url}" class="button">Reset Password</a>
    </div>
    
    <p>This link will expire in 1 hour. If you didn't request a password reset, please secure your account.</p>
    <p style="font-size: 13px; color: #666666;">Reset link: ${url}</p>
  `, "Password Reset Request"),

  loginNotificationEmail: (name, deviceInfo = "a new device") => baseTemplate(`
    <h2 style="margin-top: 0;">New Login Detected</h2>
    <p>Hello ${name},</p>
    <p>We noticed a recent login to your ATIGS Network account from ${deviceInfo} on ${new Date().toLocaleString()}.</p>
    
    <p>If this was you, you can safely ignore this email.</p>
    
    <p style="color: #dc2626; font-weight: bold;">If you don't recognize this activity, please secure your account immediately by changing your password.</p>
  `, "Security Notification"),

  otpEmail: (name, otp) => baseTemplate(`
    <h2 style="margin-top: 0;">Your Verification Code</h2>
    <p>Hello ${name},</p>
    <p>Your one-time verification code is:</p>
    
    <div style="text-align: center;">
      <div class="otp-code">${otp}</div>
    </div>
    
    <p>This code will expire in 10 minutes.</p>
    <p style="color: #666666;">If you didn't request this verification, please ignore this email.</p>
  `, "Verification Code"),

  emailVerified: (name) => baseTemplate(`
    <h2 style="margin-top: 0;">Email Verified Successfully</h2>
    <p>Hello ${name},</p>
    <p>Your email has been successfully verified. You now have full access to your ATIGS Network account.</p>
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
    </div>
    
    <p>Thank you for joining ATIGS Network!</p>
  `, "Email Verified"),

  // Add this new template function to your exports
  sendThankYouEmail: (name, amount, currency) => baseTemplate(`
  <h2 style="margin-top: 0;">Thank You for Your Donation!</h2>
  <p>Dear ${name},</p>
  
  <p>We are incredibly grateful for your generous donation of 
  <strong>${currency} ${amount.toFixed(2)}</strong> to ATIGS Network.</p>
  
  <p>Your support helps us continue our mission and make a real difference. 
  Here's what your contribution enables:</p>
  
  <ul>
    <li>Supporting community initiatives</li>
    <li>Funding educational programs</li>
    <li>Enabling technological advancements</li>
  </ul>
  
  <div style="text-align: center; margin: 25px 0;">
    <a href="${process.env.FRONTEND_URL}/impact" class="button">
      See Your Impact
    </a>
  </div>
  
  <p>You'll receive a receipt for your donation in a separate email.</p>
  
  <p>With gratitude,<br>The ATIGS Network Team</p>
`, "Thank You for Your Donation")
};

