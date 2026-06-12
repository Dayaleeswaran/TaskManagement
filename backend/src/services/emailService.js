/**
 * Email Service Stub
 * Simulates sending transactional emails.
 */

/**
 * Sends a welcome email with temporary credentials to a newly created user.
 * @param {string} email - The user's email address.
 * @param {string} name - The user's name.
 * @param {string} tempPassword - The generated temporary password.
 */
const sendWelcomeEmail = async (email, name, tempPassword) => {
  console.log("==========================================================");
  console.log(`[Email Service Stub] Sending Welcome Email to ${name} (${email})`);
  console.log(`Temporary Password: ${tempPassword}`);
  console.log(`Please log in and reset your password immediately.`);
  console.log("==========================================================");
  
  // Return resolved promise to simulate async email delivery success
  return Promise.resolve({ success: true, messageId: `stub-email-${Date.now()}` });
};

module.exports = {
  sendWelcomeEmail,
};
