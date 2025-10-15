const { Resend } = require('resend');
const twilio = require('twilio');

const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Email notification service
const sendEmailReminder = async (email, message, patientName) => {
  try {
    const result = await resend.emails.send({
      from: 'CareSync AI <noreply@caresync.ai>',
      to: [email],
      subject: 'Follow-up Reminder from Your Healthcare Provider',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">CareSync AI</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Health Follow-up Reminder</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${patientName},</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              ${message}
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #333; font-weight: 500;">
                Please take a moment to respond to this follow-up. Your feedback helps us provide better care.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/patient/respond" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Respond to Follow-up
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
              This is an automated message from CareSync AI. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    });

    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email: ' + error.message);
  }
};

// SMS notification service
const sendSMSReminder = async (phone, message) => {
  try {
    const result = await twilioClient.messages.create({
      body: `CareSync AI Follow-up: ${message}\n\nReply to this message or visit: ${process.env.CLIENT_URL}/patient/respond`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    return result;
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS: ' + error.message);
  }
};

// WhatsApp notification service
const sendWhatsAppReminder = async (phone, message) => {
  try {
    // Format phone number for WhatsApp (remove + and add country code if needed)
    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
    
    const result = await twilioClient.messages.create({
      body: `🏥 *CareSync AI Follow-up*\n\n${message}\n\nPlease respond to this message or visit: ${process.env.CLIENT_URL}/patient/respond`,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:+${formattedPhone}`
    });

    return result;
  } catch (error) {
    console.error('WhatsApp sending error:', error);
    throw new Error('Failed to send WhatsApp message: ' + error.message);
  }
};

// Send daily summary email to clinic
const sendDailySummary = async (clinicEmail, clinicName, summary) => {
  try {
    const result = await resend.emails.send({
      from: 'CareSync AI <insights@caresync.ai>',
      to: [clinicEmail],
      subject: `Daily Patient Insights - ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">CareSync AI</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Daily Patient Insights Report</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${clinicName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Here's your daily summary of patient responses and insights:
            </p>
            
            <div style="display: flex; gap: 20px; margin: 30px 0;">
              <div style="flex: 1; background: #d4edda; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #28a745;">
                <h3 style="margin: 0; color: #155724; font-size: 24px;">${summary.fineCount}</h3>
                <p style="margin: 5px 0 0 0; color: #155724; font-weight: 500;">✅ Doing Well</p>
              </div>
              
              <div style="flex: 1; background: #fff3cd; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #ffc107;">
                <h3 style="margin: 0; color: #856404; font-size: 24px;">${summary.mildIssueCount}</h3>
                <p style="margin: 5px 0 0 0; color: #856404; font-weight: 500;">⚠️ Mild Issues</p>
              </div>
              
              <div style="flex: 1; background: #f8d7da; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #dc3545;">
                <h3 style="margin: 0; color: #721c24; font-size: 24px;">${summary.urgentCount}</h3>
                <p style="margin: 5px 0 0 0; color: #721c24; font-weight: 500;">🚨 Urgent</p>
              </div>
            </div>
            
            ${summary.urgentCount > 0 ? `
              <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <h4 style="margin: 0 0 10px 0; color: #721c24;">⚠️ Urgent Cases Requiring Attention</h4>
                <p style="margin: 0; color: #721c24;">
                  You have ${summary.urgentCount} patient(s) with urgent concerns. Please review these cases immediately.
                </p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL}/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                View Full Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
              This is an automated daily summary from CareSync AI.
            </p>
          </div>
        </div>
      `
    });

    return result;
  } catch (error) {
    console.error('Daily summary email error:', error);
    throw new Error('Failed to send daily summary: ' + error.message);
  }
};

module.exports = {
  sendEmailReminder,
  sendSMSReminder,
  sendWhatsAppReminder,
  sendDailySummary
};
