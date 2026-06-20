import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - recipient email
 * @param {string} options.subject - email subject
 * @param {string} options.html - email HTML body
 * @param {Array} [options.attachments] - optional nodemailer attachments
 */
export async function sendEmail({ to, subject, html, attachments = [] }) {
  // If credentials are not configured, log to console and simulate success in dev
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("----------------------------------------");
    console.log(`[EMAIL DEV LOG] To: ${to}`);
    console.log(`[EMAIL DEV LOG] Subject: ${subject}`);
    console.log(`[EMAIL DEV LOG] Content Preview: ${html.substring(0, 200)}...`);
    console.log("----------------------------------------");
    return { messageId: "dev-simulated-id" };
  }

  const mailOptions = {
    from: `"Sai Saree Pre-Pleating" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}: ${info.messageId}`);
  return info;
}

/**
 * Send Meet link email to a user after payment approval
 */
export async function sendMeetLinkEmail({ userName, userEmail, eventTitle, eventDate, eventTime, meetLink }) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #e8437f, #f06292); padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Payment Confirmed! 🎉</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.5;">Your payment for the workshop <strong>${eventTitle}</strong> has been approved. Below are your joining details:</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e8437f;">
          <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>📅 Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0; font-size: 14px; color: #4a5568;"><strong>🕐 Time:</strong> ${eventTime || "TBA"}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetLink}" 
             style="background: #1a73e8; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            🔗 Join Google Meet
          </a>
        </div>

        <p style="font-size: 12px; color: #718096; margin-top: 30px;">If the button above does not work, copy and paste this link into your browser: <br>${meetLink}</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `✅ Payment Confirmed: Join ${eventTitle}`,
    html,
  });
}

/**
 * Send certificate email with PDF attachment
 */
export async function sendCertificateEmail({ userName, userEmail, eventTitle, pdfBuffer }) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #c29a3b, #d4af37); padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">🏆 Congratulations!</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.5;">
          Thank you for attending <strong>${eventTitle}</strong>. 
          Your certificate of completion has been generated and is attached to this email.
        </p>
        <p style="font-size: 14px; color: #4a5568; margin-top: 20px;">We hope to see you in our upcoming sessions! 🌟</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `🏆 Certificate of Completion: ${eventTitle}`,
    html,
    attachments: [
      {
        filename: `Certificate_${userName.replace(/\s+/g, "_")}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      },
    ],
  });
}

/**
 * Send Drive access email
 */
export async function sendDriveAccessEmail({ userName, userEmail, eventTitle, driveFolderLink, expiryDate }) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #34a853, #0f9d58); padding: 30px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">📂 Lecture Recording Access Granted!</h1>
      </div>
      <div style="padding: 30px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hi <strong>${userName}</strong>,</p>
        <p style="font-size: 15px; color: #555; line-height: 1.5;">
          You have been granted 30-day access to the recorded lectures for <strong>${eventTitle}</strong>.
        </p>
        
        <div style="background: #fffaf0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dd6b20;">
          <p style="margin: 0; font-size: 14px; color: #dd6b20; font-weight: 500;">
            ⏰ Access Expiry: ${expiryDate.toLocaleDateString()} (at ${expiryDate.toLocaleTimeString()})
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${driveFolderLink}" 
             style="background: #34a853; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            📂 View Recordings on Google Drive
          </a>
        </div>
        
        <p style="font-size: 13px; color: #718096; line-height: 1.4;">Note: Your access will be automatically revoked after the 30-day period. Make sure to review the lectures before the expiration date.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `📂 Recorded Lecture Access: ${eventTitle}`,
    html,
  });
}
