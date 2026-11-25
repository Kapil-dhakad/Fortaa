const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const db = require('../db/db');
require('dotenv').config();

const LOGO_PATH = path.join(__dirname, '../assets/fortaa-logo.png');

function getLogoAttachments() {
  if (fs.existsSync(LOGO_PATH)) {
    return [
      {
        filename: 'fortaa-logo.png',
        path: LOGO_PATH,
        cid: 'fortaa-logo',
      },
    ];
  }
  return [];
}

const SENDER_EMAIL = 'No-reply@fortaa.com';
function getSender(label = 'FORTAA') {
  return `"${label}" <${SENDER_EMAIL}>`;
}

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
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #4E1AD9 0%, #320CA0 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .logo-box { display: inline-block; background: #ffffff; padding: 10px 22px; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .logo-img { width: 140px; height: 32px; vertical-align: middle; display: block; image-rendering: -webkit-optimize-contrast; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #E9D5FF; font-weight: 500; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; text-align: center; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px; }
        .otp-box { background: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 18px 24px; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4E1AD9; margin: 0 auto 24px; display: inline-block; font-family: monospace; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-box">
            <img src="cid:fortaa-logo" alt="FORTAA" class="logo-img" onerror="this.onerror=null; this.src='https://fortaa.com/fortaa-logo.png';" />
          </div>
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

  const senderAddress = getSender('FORTAA Security');

  const mailOptions = {
    from: senderAddress,
    replyTo: 'No-reply@fortaa.com',
    to: toEmail,
    subject: `Your Fortaa Verification Code: ${otp}`,
    text: `Your Fortaa email verification code is: ${otp}. It will expire in 10 minutes.`,
    html: htmlContent,
    attachments: getLogoAttachments(),
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
        .header { background: linear-gradient(135deg, #4E1AD9 0%, #320CA0 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
        .logo-box { display: inline-block; background: #ffffff; padding: 10px 22px; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .logo-img { width: 140px; height: 32px; vertical-align: middle; display: block; image-rendering: -webkit-optimize-contrast; }
        .header p { margin: 6px 0 0; font-size: 13.5px; color: #E9D5FF; font-weight: 500; letter-spacing: 0.5px; }
        .body { padding: 36px 32px; text-align: left; }
        .greeting { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
        .text { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .highlight-box { background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 16px 20px; border-radius: 8px; margin: 24px 0; font-size: 14px; color: #5b21b6; line-height: 1.5; font-weight: 500; }
        .btn-wrap { text-align: center; margin: 32px 0 16px; }
        .btn { display: inline-block; background: #4E1AD9; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-box">
            <img src="cid:fortaa-logo" alt="FORTAA" class="logo-img" onerror="this.onerror=null; this.src='https://fortaa.com/fortaa-logo.png';" />
          </div>
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

  const senderAddress = getSender('FORTAA Team');

  const mailOptions = {
    from: senderAddress,
    replyTo: 'No-reply@fortaa.com',
    to: toEmail,
    subject: `Welcome to FORTAA, ${displayName}! Your account is ready 🚀`,
    text: `Hello ${displayName}, Welcome to FORTAA! Your account has been successfully created. Explore leadership opportunities and grow your network: https://fortaa.com`,
    html: htmlContent,
    attachments: getLogoAttachments(),
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

/**
 * -------------------------------------------------------------
 * 1. Profile View Email Notification (LinkedIn-Style)
 * -------------------------------------------------------------
 */
async function sendProfileViewEmail({ targetEmail, targetName, viewerName, viewerRole, viewerCompany, viewerAvatar, viewerId }) {
  const transporter = createTransporter();
  const targetDisplayName = targetName || 'Leader';
  const vName = viewerName || 'A Fortaa Member';
  const vRole = viewerRole || 'Leader';
  const vCompany = viewerCompany || 'Fortaa';
  const vInitial = vName.charAt(0).toUpperCase();

  if (!transporter) {
    console.log('\n==============================================');
    console.log(`👀 [FORTAA PROFILE VIEW EMAIL (SIMULATION)]`);
    console.log(`👉 Sent to: ${targetEmail} (${targetDisplayName})`);
    console.log(`👤 Viewed by: ${vName} (${vRole} at ${vCompany})`);
    console.log('💡 (SMTP_USER & SMTP_PASS in .env will send live emails)');
    console.log('==============================================\n');
    return { success: true, simulated: true };
  }

  const avatarHtml = viewerAvatar
    ? `<img src="${viewerAvatar}" alt="${vName}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid #2E0362;" />`
    : `<div style="width: 60px; height: 60px; border-radius: 50%; background: #2E0362; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; text-align: center; line-height: 60px;">${vInitial}</div>`;

  const profileUrl = viewerId ? `https://fortaa.com/leader/${viewerId}` : 'https://fortaa.com/network';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #4E1AD9 0%, #320CA0 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .logo-box { display: inline-block; background: #ffffff; padding: 10px 22px; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .logo-img { width: 140px; height: 32px; vertical-align: middle; display: block; image-rendering: -webkit-optimize-contrast; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #E9D5FF; font-weight: 500; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; text-align: left; }
        .greeting { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0 0 12px; }
        .text { font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .viewer-card { background: #FAF5FF; border: 1.5px solid #E9D5FF; border-radius: 12px; padding: 18px 20px; margin: 24px 0; display: table; width: 100%; box-sizing: border-box; }
        .vc-cell-avatar { display: table-cell; vertical-align: middle; width: 70px; }
        .vc-cell-info { display: table-cell; vertical-align: middle; padding-left: 14px; }
        .vc-name { font-size: 16px; font-weight: 800; color: #2E0362; margin: 0 0 4px; }
        .vc-sub { font-size: 13px; color: #64748B; margin: 0; }
        .btn-wrap { text-align: center; margin: 28px 0 12px; }
        .btn { display: inline-block; background: #4E1AD9; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11.5px; color: #94a3b8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-box">
            <img src="cid:fortaa-logo" alt="FORTAA" class="logo-img" onerror="this.onerror=null; this.src='https://fortaa.com/fortaa-logo.png';" />
          </div>
          <p>Discover, Easy and Grow</p>
        </div>
        <div class="body">
          <p class="greeting">Hello, ${targetDisplayName}! 👋</p>
          <p class="text">
            Someone recently visited your profile on <strong>FORTAA</strong>. Keep your network active and connect back!
          </p>
          <div class="viewer-card">
            <div class="vc-cell-avatar">
              ${avatarHtml}
            </div>
            <div class="vc-cell-info">
              <h3 class="vc-name">${vName}</h3>
              <p class="vc-sub">${vRole} • ${vCompany}</p>
            </div>
          </div>
          <p class="text" style="font-size: 13.5px; color: #64748b;">
            Connect with ${vName} to collaborate, build business opportunities, and expand your reach.
          </p>
          <div class="btn-wrap">
            <a href="${profileUrl}" class="btn">View ${vName}'s Profile →</a>
          </div>
        </div>
        <div class="footer">
          You received this notification because your profile was viewed on Fortaa.<br>
          &copy; ${new Date().getFullYear()} Fortaa Network. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const senderAddress = getSender('FORTAA Network');

  const mailOptions = {
    from: senderAddress,
    replyTo: 'No-reply@fortaa.com',
    to: targetEmail,
    subject: `👀 ${vName} viewed your Fortaa profile`,
    text: `Hello ${targetDisplayName}, ${vName} (${vRole} at ${vCompany}) viewed your profile on Fortaa. Connect back: ${profileUrl}`,
    html: htmlContent,
    attachments: getLogoAttachments(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Profile View Email Sent] MessageId: ${info.messageId} to ${targetEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Profile View Email Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * -------------------------------------------------------------
 * 2. New Message Email Notification (Instagram / LinkedIn Chat Alert)
 * -------------------------------------------------------------
 */
async function sendMessageNotificationEmail({ receiverEmail, receiverName, senderName, senderAvatar, senderRole, messagePreview, senderId }) {
  const transporter = createTransporter();
  const recDisplayName = receiverName || 'Leader';
  const sName = senderName || 'A Fortaa Member';
  const sRole = senderRole || 'Member';
  const sInitial = sName.charAt(0).toUpperCase();
  const chatUrl = senderId ? `https://fortaa.com/messages?partnerId=${senderId}` : 'https://fortaa.com/messages';

  if (!transporter) {
    console.log('\n==============================================');
    console.log(`💬 [FORTAA MESSAGE EMAIL (SIMULATION)]`);
    console.log(`👉 Sent to: ${receiverEmail} (${recDisplayName})`);
    console.log(`👤 From: ${sName} (${sRole})`);
    console.log(`💬 Preview: "${messagePreview}"`);
    console.log('==============================================\n');
    return { success: true, simulated: true };
  }

  const avatarHtml = senderAvatar
    ? `<img src="${senderAvatar}" alt="${sName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #2E0362;" />`
    : `<div style="width: 50px; height: 50px; border-radius: 50%; background: #2E0362; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; text-align: center; line-height: 50px;">${sInitial}</div>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #4E1AD9 0%, #320CA0 100%); padding: 30px 24px; text-align: center; color: #ffffff; }
        .logo-box { display: inline-block; background: #ffffff; padding: 10px 22px; border-radius: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
        .logo-img { width: 140px; height: 32px; vertical-align: middle; display: block; image-rendering: -webkit-optimize-contrast; }
        .header p { margin: 6px 0 0; font-size: 13px; color: #E9D5FF; font-weight: 500; letter-spacing: 0.5px; }
        .body { padding: 32px 28px; text-align: left; }
        .greeting { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0 0 12px; }
        .text { font-size: 14.5px; line-height: 1.6; color: #475569; margin: 0 0 20px; }
        .sender-box { display: table; width: 100%; margin-bottom: 16px; }
        .sb-avatar { display: table-cell; vertical-align: middle; width: 60px; }
        .sb-info { display: table-cell; vertical-align: middle; padding-left: 10px; }
        .sb-name { font-size: 15px; font-weight: 800; color: #1e293b; margin: 0; }
        .sb-role { font-size: 12px; color: #64748B; margin: 2px 0 0; }
        .quote-bubble { background: #F8FAFC; border-left: 4px solid #4E1AD9; border-radius: 4px; padding: 14px 16px; font-size: 14px; color: #334155; line-height: 1.5; font-style: italic; margin-bottom: 24px; }
        .btn-wrap { text-align: center; margin: 28px 0 12px; }
        .btn { display: inline-block; background: #4E1AD9; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; }
        .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11.5px; color: #94a3b8; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo-box">
            <img src="cid:fortaa-logo" alt="FORTAA" class="logo-img" onerror="this.onerror=null; this.src='https://fortaa.com/fortaa-logo.png';" />
          </div>
          <p>Discover, Easy and Grow</p>
        </div>
        <div class="body">
          <p class="greeting">Hi, ${recDisplayName}! 💬</p>
          <p class="text">
            You received a new direct message while you were away:
          </p>
          <div class="sender-box">
            <div class="sb-avatar">${avatarHtml}</div>
            <div class="sb-info">
              <p class="sb-name">${sName}</p>
              <p class="sb-role">${sRole}</p>
            </div>
          </div>
          <div class="quote-bubble">
            "${messagePreview}"
          </div>
          <div class="btn-wrap">
            <a href="${chatUrl}" class="btn">Reply in Fortaa Messages →</a>
          </div>
        </div>
        <div class="footer">
          You received this email because you have unread messages on Fortaa.<br>
          &copy; ${new Date().getFullYear()} Fortaa Network. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const senderAddress = getSender('FORTAA Messages');

  const mailOptions = {
    from: senderAddress,
    replyTo: 'No-reply@fortaa.com',
    to: receiverEmail,
    subject: `💬 ${sName} sent you a message on Fortaa`,
    text: `Hello ${recDisplayName}, ${sName} sent you a message: "${messagePreview}". Reply here: ${chatUrl}`,
    html: htmlContent,
    attachments: getLogoAttachments(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Message Email Sent] MessageId: ${info.messageId} to ${receiverEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Message Email Error]:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * -------------------------------------------------------------
 * 3. Smart Throttled Handlers (LinkedIn-style 24hr & 30min cooldown)
 * -------------------------------------------------------------
 */
async function handleProfileViewNotification(viewerId, targetId) {
  if (!viewerId || !targetId || Number(viewerId) === Number(targetId)) return;
  if (!db.isDBConnected()) return;

  try {
    // 1. Fetch Target user
    const targetRes = await db.query('SELECT id, name, email FROM users WHERE id = $1', [Number(targetId)]);
    if (targetRes.rows.length === 0 || !targetRes.rows[0].email) return;
    const target = targetRes.rows[0];

    // 2. Fetch Viewer user
    const viewerRes = await db.query(
      'SELECT id, name, designation, company_brand, business_name, avatar_url FROM users WHERE id = $1',
      [Number(viewerId)]
    );
    if (viewerRes.rows.length === 0) return;
    const viewer = viewerRes.rows[0];

    // 3. Ensure profile_views table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS profile_views (
        id SERIAL PRIMARY KEY,
        viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        views_count INTEGER DEFAULT 1,
        last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(viewer_id, target_id)
      );
    `);

    // 4. Check throttle: 24-hour cooldown per viewer
    const viewCheck = await db.query(
      'SELECT id, views_count, last_email_sent_at FROM profile_views WHERE viewer_id = $1 AND target_id = $2',
      [Number(viewerId), Number(targetId)]
    );

    const now = new Date();
    let shouldSend = false;

    if (viewCheck.rows.length === 0) {
      // First view ever
      await db.query(
        `INSERT INTO profile_views (viewer_id, target_id, views_count, last_viewed_at, last_email_sent_at)
         VALUES ($1, $2, 1, NOW(), NOW())`,
        [Number(viewerId), Number(targetId)]
      );
      shouldSend = true;
    } else {
      const lastSent = new Date(viewCheck.rows[0].last_email_sent_at || 0);
      const diffHours = (now - lastSent) / (1000 * 60 * 60);

      if (diffHours >= 24) {
        // Cooldown passed: send email and update timestamp
        await db.query(
          `UPDATE profile_views
           SET views_count = views_count + 1, last_viewed_at = NOW(), last_email_sent_at = NOW()
           WHERE viewer_id = $1 AND target_id = $2`,
          [Number(viewerId), Number(targetId)]
        );
        shouldSend = true;
      } else {
        // Under 24h: update count only, do not spam
        await db.query(
          `UPDATE profile_views
           SET views_count = views_count + 1, last_viewed_at = NOW()
           WHERE viewer_id = $1 AND target_id = $2`,
          [Number(viewerId), Number(targetId)]
        );
        shouldSend = false;
      }
    }

    if (shouldSend) {
      sendProfileViewEmail({
        targetEmail: target.email,
        targetName: target.name,
        viewerName: viewer.name || 'A Fortaa Leader',
        viewerRole: viewer.designation || 'Leader',
        viewerCompany: viewer.company_brand || viewer.business_name || 'Fortaa Network',
        viewerAvatar: viewer.avatar_url || null,
        viewerId: viewer.id,
      }).catch((e) => console.warn('[Profile View Email Non-blocking Error]:', e.message));
    }
  } catch (err) {
    console.warn('[handleProfileViewNotification Error]:', err.message);
  }
}

async function handleNewMessageEmailNotification({ senderId, receiverId, text, isReceiverOnline }) {
  // If receiver is currently online and active in chat, no email spam needed
  if (isReceiverOnline) return;
  if (!senderId || !receiverId || Number(senderId) === Number(receiverId)) return;
  if (!db.isDBConnected()) return;

  try {
    // 1. Fetch Receiver
    const recRes = await db.query('SELECT id, name, email FROM users WHERE id = $1', [Number(receiverId)]);
    if (recRes.rows.length === 0 || !recRes.rows[0].email) return;
    const receiver = recRes.rows[0];

    // 2. Fetch Sender
    const sendRes = await db.query(
      'SELECT id, name, designation, avatar_url FROM users WHERE id = $1',
      [Number(senderId)]
    );
    if (sendRes.rows.length === 0) return;
    const sender = sendRes.rows[0];

    // 3. Ensure throttle table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS message_email_throttles (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_email_sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sender_id, receiver_id)
      );
    `);

    // 4. Check throttle: 30-minute cooldown per sender
    const throttleCheck = await db.query(
      'SELECT last_email_sent_at FROM message_email_throttles WHERE sender_id = $1 AND receiver_id = $2',
      [Number(senderId), Number(receiverId)]
    );

    const now = new Date();
    let shouldSend = false;

    if (throttleCheck.rows.length === 0) {
      await db.query(
        `INSERT INTO message_email_throttles (sender_id, receiver_id, last_email_sent_at)
         VALUES ($1, $2, NOW())`,
        [Number(senderId), Number(receiverId)]
      );
      shouldSend = true;
    } else {
      const lastSent = new Date(throttleCheck.rows[0].last_email_sent_at || 0);
      const diffMins = (now - lastSent) / (1000 * 60);

      if (diffMins >= 30) {
        await db.query(
          `UPDATE message_email_throttles SET last_email_sent_at = NOW() WHERE sender_id = $1 AND receiver_id = $2`,
          [Number(senderId), Number(receiverId)]
        );
        shouldSend = true;
      }
    }

    if (shouldSend) {
      let preview = text || 'Sent you an attachment';
      if (preview.length > 120) {
        preview = preview.substring(0, 117) + '...';
      }

      sendMessageNotificationEmail({
        receiverEmail: receiver.email,
        receiverName: receiver.name,
        senderName: sender.name || 'A Fortaa Leader',
        senderRole: sender.designation || 'Leader',
        senderAvatar: sender.avatar_url || null,
        messagePreview: preview,
        senderId: sender.id,
      }).catch((e) => console.warn('[Message Email Non-blocking Error]:', e.message));
    }
  } catch (err) {
    console.warn('[handleNewMessageEmailNotification Error]:', err.message);
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendProfileViewEmail,
  sendMessageNotificationEmail,
  handleProfileViewNotification,
  handleNewMessageEmailNotification,
};
