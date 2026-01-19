// services/notifications.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration with better error handling
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
  logger: process.env.NODE_ENV === 'development', // Enable logging in dev
  debug: process.env.NODE_ENV === 'development', // Enable debug in dev
});

// Verify SMTP connection on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
    console.error('Please check your SMTP credentials in .env file');
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ✅ FIXED: Include reminder_id in the response URL
const sendEmailReminder = async (to, message, patientName, reminderId) => {
  try {
    const responseUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/patient/respond?reminder_id=${reminderId}`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@caresync.com',
      to,
      subject: 'CareSync AI - Follow-up Reminder',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .message { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 CareSync AI</h1>
              <p>Follow-up Reminder</p>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>
              <div class="message">
                <p><strong>Your healthcare provider has sent you a follow-up message:</strong></p>
                <p>${message}</p>
              </div>
              <p>Please take a moment to respond to this follow-up by clicking the button below:</p>
              <center>
                <a href="${responseUrl}" class="button">📝 Respond Now</a>
              </center>
              <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link: <a href="${responseUrl}">${responseUrl}</a></p>
              <div class="footer">
                <p>This is an automated message from CareSync AI</p>
                <p>If you have urgent concerns, please contact your healthcare provider directly</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

// ✅ FIXED: Include reminder_id in the response URL
const sendSMSReminder = async (to, message, reminderId) => {
  try {
    const responseUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/patient/respond?reminder_id=${reminderId}`;
    
    const smsBody = `CareSync AI Reminder:\n\n${message}\n\nPlease respond: ${responseUrl}`;
    
    const messageResult = await twilioClient.messages.create({
      body: smsBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    console.log('✅ SMS sent:', messageResult.sid);
    return messageResult;
  } catch (error) {
    console.error('❌ SMS send error:', error);
    throw error;
  }
};

// ✅ FIXED: Include reminder_id in the response URL
const sendWhatsAppReminder = async (to, message, reminderId) => {
  try {
    const responseUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/patient/respond?reminder_id=${reminderId}`;
    
    // Format phone number for WhatsApp (must include country code with + prefix)
    const whatsappNumber = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;
    
    const whatsappBody = `🏥 *CareSync AI Reminder*\n\n${message}\n\n📝 Please respond here:\n${responseUrl}`;
    
    const messageResult = await twilioClient.messages.create({
      body: whatsappBody,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: whatsappNumber,
    });

    console.log('✅ WhatsApp sent:', messageResult.sid);
    return messageResult;
  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    throw error;
  }
};

// Daily summary email
const sendDailySummary = async (to, clinicName, summary) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@caresync.com',
      to,
      subject: `CareSync AI - Daily Summary for ${clinicName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; }
            .stat-card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stat-number { font-size: 32px; font-weight: bold; color: #667eea; }
            .stat-label { color: #6b7280; font-size: 14px; }
            .urgent { color: #ef4444; }
            .mild { color: #f59e0b; }
            .fine { color: #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Summary</h1>
              <p>${clinicName}</p>
            </div>
            <div class="content">
              <h2>Today's Patient Responses</h2>
              
              <div class="stat-card">
                <div class="stat-number">${summary.totalResponses}</div>
                <div class="stat-label">Total Responses</div>
              </div>

              <div class="stat-card">
                <div class="stat-number fine">${summary.fineCount}</div>
                <div class="stat-label">✅ Patients Doing Fine</div>
              </div>

              <div class="stat-card">
                <div class="stat-number mild">${summary.mildIssueCount}</div>
                <div class="stat-label">⚠️ Mild Issues Reported</div>
              </div>

              <div class="stat-card">
                <div class="stat-number urgent">${summary.urgentCount}</div>
                <div class="stat-label">🚨 Urgent Attention Required</div>
              </div>

              ${summary.overdueCount ? `
                <div class="stat-card">
                  <div class="stat-number urgent">${summary.overdueCount}</div>
                  <div class="stat-label">⏰ Overdue Follow-ups</div>
                  ${summary.overduePatients ? `
                    <div style="margin-top: 10px; font-size: 14px;">
                      <strong>Patients:</strong> ${summary.overduePatients.join(', ')}
                    </div>
                  ` : ''}
                </div>
              ` : ''}

              <p style="margin-top: 20px; text-align: center;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                  View Dashboard
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Daily summary sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Daily summary send error:', error);
    throw error;
  }
};

module.exports = {
  sendEmailReminder,
  sendSMSReminder,
  sendWhatsAppReminder,
  sendDailySummary,
};