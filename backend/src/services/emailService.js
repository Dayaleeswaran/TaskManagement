/**
 * Email Service
 * Handles transactional emails via Brevo (formerly Sendinblue) REST API.
 */

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Taskflow';

/**
 * Sends a welcome email with temporary credentials to a newly created user.
 * @param {string} email - The user's email address.
 * @param {string} name - The user's name.
 * @param {string} tempPassword - The generated temporary password.
 */
const sendWelcomeEmail = async (email, name, tempPassword) => {
  console.log("==========================================================");
  console.log(`[Email Service] Welcome Email triggered for ${name} (${email})`);
  console.log(`Temporary Password: ${tempPassword}`);
  console.log("==========================================================");
  
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    console.warn("[Brevo] BREVO_API_KEY or BREVO_SENDER_EMAIL is not defined. Skipping real email dispatch.");
    return { success: true, messageId: `stub-email-${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: email,
            name: name
          }
        ],
        subject: 'Welcome to Taskflow - Your Temporary Credentials',
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #2563eb; margin-bottom: 20px; font-weight: 800; font-size: 24px;">Welcome to Taskflow, ${name}!</h2>
            <p style="color: #334155; font-size: 15px;">Your Taskflow account has been successfully created. Below are your temporary login credentials:</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #475569;"><strong>Email Address:</strong> <span style="color: #0f172a; font-weight: 600;">${email}</span></p>
              <p style="margin: 0; font-size: 14px; color: #475569;"><strong>Temporary Password:</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: #0f172a; font-family: monospace;">${tempPassword}</code></p>
            </div>
            <p style="color: #334155; font-size: 15px;">Please click the button below to log in and configure your permanent password immediately:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/login" style="background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Log In to Taskflow</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">This is an automated system email. If you did not request this account, please ignore this message.</p>
          </div>
        `
      })
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error ${response.status}`);
    }

    console.log(`[Brevo] Welcome email successfully sent to ${email} (Message ID: ${responseData.messageId})`);
    return { success: true, messageId: responseData.messageId };
  } catch (err) {
    console.error("[Brevo] Failed to dispatch welcome email:", err.message);
    throw err;
  }
};

const sendPasswordResetCode = async (email, code) => {
  console.log("==========================================================");
  console.log(`[Email Service] Password Reset Code triggered for ${email}`);
  console.log(`Verification Code: ${code}`);
  console.log("==========================================================");
  
  if (!BREVO_API_KEY || !BREVO_SENDER_EMAIL) {
    console.warn("[Brevo] BREVO_API_KEY or BREVO_SENDER_EMAIL is not defined. Skipping real email dispatch.");
    return { success: true, messageId: `sa-reset-code-${Date.now()}` };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: BREVO_SENDER_NAME,
          email: BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: email
          }
        ],
        subject: 'Taskflow Password Reset Verification Code',
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #2563eb; margin-bottom: 20px; font-weight: 800; font-size: 24px;">Reset Your Password</h2>
            <p style="color: #334155; font-size: 15px;">Your password reset verification code is:</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #2563eb; font-family: monospace;">${code}</span>
            </div>
            <p style="color: #334155; font-size: 15px;">This code will expire in 10 minutes.</p>
            <p style="color: #334155; font-size: 15px;">If you did not request this reset, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">This is an automated system email. If you did not request this code, please ignore this message.</p>
          </div>
        `
      })
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || `HTTP error ${response.status}`);
    }

    console.log(`[Brevo] Reset code successfully sent to ${email} (Message ID: ${responseData.messageId})`);
    return { success: true, messageId: responseData.messageId };
  } catch (err) {
    console.error("[Brevo] Failed to dispatch reset code email:", err.message);
    throw err;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetCode,
};
