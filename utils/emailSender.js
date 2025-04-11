// utils/emailSender.js
const nodemailer = require('nodemailer');
const { verificationEmail, passwordResetEmail, loginNotificationEmail, otpEmail, emailVerified } = require('./emailTemplates');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: [{
        filename: 'logo.png',
        path: path.join(__dirname, '../public/images/logo.png'),
        cid: 'companylogo'
      }]
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendVerificationEmail: async (user, verificationUrl) => {
    return sendEmail({
      to: user.email,
      subject: 'Verify Your ATIGS Network Account',
      html: verificationEmail(user.firstName, verificationUrl)
    });
  },

  sendPasswordResetEmail: async (user, resetUrl) => {
    return sendEmail({
      to: user.email,
      subject: 'ATIGS Network Password Reset',
      html: passwordResetEmail(user.firstName, resetUrl)
    });
  },

  sendLoginNotification: async (user, deviceInfo) => {
    return sendEmail({
      to: user.email,
      subject: 'New Login to Your ATIGS Network Account',
      html: loginNotificationEmail(user.firstName, deviceInfo)
    });
  },

  sendOTPEmail: async (user, otp) => {
    return sendEmail({
      to: user.email,
      subject: 'Your ATIGS Network Verification Code',
      html: otpEmail(user.firstName, otp)
    });
  },

  sendEmailVerified: async (user) => {
    return sendEmail({
      to: user.email,
      subject: 'Welcome to ATIGS Network - Email Verified',
      html: emailVerified(user.firstName)
    });
  }
};