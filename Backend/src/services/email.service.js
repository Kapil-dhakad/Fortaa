const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter if SMTP credentials are provided
function createTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: cleanPass,
      },
    });
  }
  return null;
}

/**
 * Send 6-digit OTP to user's email
 * @param {string} toEmail 
 * @param {string} otp 
 */
async function sendOtpEmail(toEmail, otp) {
  const transporter = createTransporter();

  // If SMTP is not yet configured, log to console for instant developer testing
  if (!transporter) {
    console.log('\n==============================================');
    console.log(`📩 [FORTAA EMAIL OTP]: ${otp}`);
    console.log(`👉 Sent to: ${toEmail}`);
    console.log('⏰ Valid for: 10 minutes');
    console.log('💡 (To send real emails, add SMTP_USER & SMTP_PASS in Backend/.env)');
    console.log('==============================================\n');
    return { success: true, simulated: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
        .body { padding: 32px 28px; text-align: center; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px; }
        .otp-box { background: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 18px 24px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #5b21b6; margin: 0 auto 24px; display: inline-block; font-family: monospace; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>FORTAA</h1>
          <p>Discover, Easy and Grow</p>
        </div>
        <div class="body">
          <p class="text">Hello,<br>Use the verification code below to verify your email address on Fortaa:</p>
          <div class="otp-box">${otp}</div>
          <p class="text" style="font-size: 13px; color: #64748b; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
        </div>
        <div class="footer">
          If you didn't request this verification code, please ignore this email.<br>
          &copy; ${new Date().getFullYear()} Fortaa. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const senderAddress = process.env.SMTP_USER
    ? `"Fortaa Security" <${process.env.SMTP_USER}>`
    : (process.env.EMAIL_FROM || '"Fortaa Security" <noreply@fortaa.com>');

  const mailOptions = {
    from: senderAddress,
    to: toEmail,
    subject: `Your Fortaa Verification Code: ${otp}`,
    text: `Your Fortaa email verification code is: ${otp}. It will expire in 10 minutes.`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] MessageId: ${info.messageId} to ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Nodemailer Error]:', error.message);
    throw error;
  }
}

/**
 * Send Welcome Email to newly registered user
 * @param {string} toEmail 
 * @param {string} userName 
 */
async function sendWelcomeEmail(toEmail, userName) {
  const transporter = createTransporter();
  const displayName = userName || 'Leader';

  if (!transporter) {
    console.log('\n==============================================');
    console.log(`📩 [FORTAA WELCOME EMAIL (SIMULATION)]`);
    console.log(`👉 Sent to: ${toEmail}`);
    console.log(`👤 Name: ${displayName}`);
    console.log(`💬 Message: Welcome! Your account has been successfully created on FORTAA.`);
    console.log('==============================================\n');
    return { success: true, simulated: true };
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 1px; }
        .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.95; }
        .body { padding: 36px 32px; text-align: left; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .highlight-box { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; color: #5b21b6; line-height: 1.5; font-weight: 500; }
        .btn-wrap { text-align: center; margin: 32px 0 16px; }
        .btn { display: inline-block; background: #6D28D9; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>FORTAA</h1>
          <p>Discover, Easy and Grow</p>
        </div>
        <div class="body">
          <p class="greeting">Welcome, ${displayName}! 🎉</p>
          <p class="text">
            Congratulations! You have successfully created your account on <strong>FORTAA</strong>.
          </p>
          <div class="highlight-box">
            🚀 Your leadership journey starts today. Connect with top business mentors, grow your network, and unlock premium opportunities across India.
          </div>
          <p class="text">
            Log in to complete your profile, explore trending posts, and chat with fellow leaders.
          </p>
          <div class="btn-wrap">
            <a href="https://fortaa.com/login" class="btn">Explore Fortaa Dashboard</a>
          </div>
        </div>
        <div class="footer">
          You received this email because you registered on Fortaa.<br>
          &copy; ${new Date().getFullYear()} Fortaa. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const senderAddress = process.env.SMTP_USER
    ? `"Fortaa Team" <${process.env.SMTP_USER}>`
    : (process.env.EMAIL_FROM || '"Fortaa Team" <noreply@fortaa.com>');

  const mailOptions = {
    from: senderAddress,
    to: toEmail,
    subject: `Welcome to FORTAA, ${displayName}! Your account is ready 🚀`,
    text: `Hello ${displayName}, Welcome to FORTAA! Your account has been successfully created. Explore leadership opportunities and grow your network: https://fortaa.com`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Welcome Email Sent] MessageId: ${info.messageId} to ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Welcome Email Error]:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
};
