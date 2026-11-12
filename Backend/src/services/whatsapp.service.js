const https = require('https');
require('dotenv').config();

/**
 * Format phone number to international standard (E.164)
 * For Indian numbers (10 digits starting with 6-9), prepends '91'
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';
  const digitsOnly = phone.toString().replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Send WhatsApp Message via Meta WhatsApp Cloud API (v21.0)
 * Fallback to Developer Simulation if credentials are not configured.
 *
 * @param {string} toPhone - Recipient phone number (with or without country code)
 * @param {string} messageText - Message body
 */
async function sendMetaWhatsAppMessage(toPhone, messageText) {
  const formattedPhone = formatPhoneNumber(toPhone);
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  // 1. If Meta WhatsApp credentials are not yet added to .env, use developer simulation
  if (!phoneNumberId || !accessToken) {
    console.log('\n==============================================');
    console.log(`📱 [FORTAA WHATSAPP MESSAGE (SIMULATION)]`);
    console.log(`👉 To: +${formattedPhone}`);
    console.log(`💬 Message:\n${messageText}`);
    console.log('💡 (To send real messages, add WHATSAPP_PHONE_NUMBER_ID & WHATSAPP_ACCESS_TOKEN in Backend/.env)');
    console.log('==============================================\n');
    return { success: true, simulated: true, to: formattedPhone };
  }

  // 2. Dispatch real Meta WhatsApp Cloud API request
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: messageText,
      },
    });

    const options = {
      hostname: 'graph.facebook.com',
      path: `/v21.0/${phoneNumberId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[Meta WhatsApp Sent] MessageId: ${parsed?.messages?.[0]?.id} to +${formattedPhone}`);
            resolve({ success: true, messageId: parsed?.messages?.[0]?.id });
          } else {
            console.error('[Meta WhatsApp Cloud API Error]:', parsed);
            // Fallback gracefully so registration does not break if API error occurs
            resolve({ success: false, error: parsed });
          }
        } catch (e) {
          resolve({ success: false, raw: rawData });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Meta WhatsApp Request Error]:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send 6-Digit Verification Code via WhatsApp
 */
async function sendWhatsAppOtp(toPhone, otp) {
  const message = `🔐 *FORTAA Verification Code*\n\nYour 6-digit WhatsApp verification code is: *${otp}*\n\nThis code is valid for 10 minutes. Please do not share this code with anyone.\n\n_Fortaa - Discover, Easy and Grow_`;
  return sendMetaWhatsAppMessage(toPhone, message);
}

/**
 * Send Welcome Message to New Registered User via WhatsApp
 */
async function sendWhatsAppWelcomeMessage(toPhone, userName) {
  const displayName = userName || 'Leader';
  const message = `🎉 *Welcome to FORTAA, ${displayName}!*\n\nYour account has been successfully created.\n\nStart connecting with top leaders, exploring high-earning opportunities, and building your network.\n\n🌐 Visit: https://fortaa.com\n\n_Fortaa Team - Discover, Easy and Grow_`;
  return sendMetaWhatsAppMessage(toPhone, message);
}

module.exports = {
  formatPhoneNumber,
  sendMetaWhatsAppMessage,
  sendWhatsAppOtp,
  sendWhatsAppWelcomeMessage,
};
