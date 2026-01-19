const cron = require('node-cron');
const supabase = require('../config/database');
const { sendEmailReminder, sendSMSReminder, sendWhatsAppReminder, sendDailySummary } = require('./notifications');

console.log('📅 Scheduler module loaded');

// ✅ Process reminders every 5 minutes (or every minute for more precision)
cron.schedule('*/5 * * * *', async () => {
  console.log('🔄 Running scheduled reminder check...');
  await processDueReminders();
});

// Schedule daily summary emails at 6 PM
cron.schedule('0 18 * * *', async () => {
  console.log('📧 Sending daily summary emails...');
  await sendDailySummaries();
});

// ✅ NEW: Process reminders that are due NOW (not just today)
const processDueReminders = async () => {
  try {
    const now = new Date().toISOString();
    
    console.log(`⏰ Checking for reminders due at or before: ${now}`);
    
    // Get all pending reminders where scheduled_date <= now
    const { data: reminders, error } = await supabase
      .from('reminders')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone,
          preferred_contact_method
        )
      `)
      .lte('scheduled_date', now)
      .eq('status', 'pending')
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('❌ Error fetching reminders:', error);
      return;
    }

    const reminderCount = reminders?.length || 0;
    console.log(`📅 Found ${reminderCount} reminder(s) to process`);

    if (!reminders || reminderCount === 0) {
      console.log('✅ No pending reminders due at this time');
      return;
    }

    // Process each reminder
    for (const reminder of reminders) {
      await processReminder(reminder);
    }

    console.log('✅ Reminder processing completed');
  } catch (error) {
    console.error('❌ Error in processDueReminders:', error);
  }
};

// Update the processReminder function in scheduler.js to pass reminderId
const processReminder = async (reminder) => {
  try {
    const patient = reminder.patients;
    
    if (!patient) {
      console.error(`❌ No patient data for reminder ${reminder.id}`);
      return;
    }

    let notificationResult;
    let success = false;

    // Determine contact method
    const contactMethod = reminder.contact_method || patient.preferred_contact_method;

    console.log(`📤 Sending ${contactMethod} reminder to ${patient.name}...`);

    switch (contactMethod) {
      case 'email':
        if (patient.email) {
          // ✅ FIXED: Pass reminder.id to sendEmailReminder
          notificationResult = await sendEmailReminder(
            patient.email, 
            reminder.message, 
            patient.name,
            reminder.id  // <- ADD THIS
          );
          success = true;
        } else {
          console.log(`⚠️ No email for patient ${patient.name}`);
        }
        break;

      case 'sms':
        if (patient.phone) {
          // ✅ FIXED: Pass reminder.id to sendSMSReminder
          notificationResult = await sendSMSReminder(
            patient.phone, 
            reminder.message,
            reminder.id  // <- ADD THIS
          );
          success = true;
        } else {
          console.log(`⚠️ No phone for patient ${patient.name}`);
        }
        break;

      case 'whatsapp':
        if (patient.phone) {
          // ✅ FIXED: Pass reminder.id to sendWhatsAppReminder
          notificationResult = await sendWhatsAppReminder(
            patient.phone, 
            reminder.message,
            reminder.id  // <- ADD THIS
          );
          success = true;
        } else {
          console.log(`⚠️ No phone for patient ${patient.name}`);
        }
        break;

      default:
        console.log(`⚠️ Unknown contact method: ${contactMethod}`);
    }

    if (success) {
      // Update reminder status
      await supabase
        .from('reminders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      // Log notification
      await supabase
        .from('notification_logs')
        .insert({
          reminder_id: reminder.id,
          patient_id: patient.id,
          clinic_id: reminder.clinic_id,
          notification_type: contactMethod,
          recipient: contactMethod === 'email' ? patient.email : patient.phone,
          message: reminder.message,
          status: 'sent',
          external_id: notificationResult?.id || notificationResult?.sid || notificationResult?.messageId
        });

      console.log(`✅ Sent ${contactMethod} reminder to ${patient.name}`);
    } else {
      // Mark as failed
      await supabase
        .from('reminders')
        .update({ status: 'failed' })
        .eq('id', reminder.id);

      // Log failed notification
      await supabase
        .from('notification_logs')
        .insert({
          reminder_id: reminder.id,
          patient_id: patient.id,
          clinic_id: reminder.clinic_id,
          notification_type: contactMethod,
          recipient: contactMethod === 'email' ? patient.email : patient.phone,
          message: reminder.message,
          status: 'failed',
          error_message: 'No contact information available'
        });

      console.log(`❌ Failed to send reminder to ${patient.name}`);
    }
  } catch (error) {
    console.error(`❌ Error processing reminder ${reminder.id}:`, error);
    
    // Mark as failed
    await supabase
      .from('reminders')
      .update({ status: 'failed' })
      .eq('id', reminder.id);

    // Log error
    await supabase
      .from('notification_logs')
      .insert({
        reminder_id: reminder.id,
        patient_id: reminder.patients?.id,
        clinic_id: reminder.clinic_id,
        notification_type: reminder.contact_method,
        recipient: reminder.contact_method === 'email' ? reminder.patients?.email : reminder.patients?.phone,
        message: reminder.message,
        status: 'failed',
        error_message: error.message
      });
  }
};

// Send daily summaries to clinics
const sendDailySummaries = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all active clinics
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('*')
      .eq('subscription_status', 'active');

    if (error) {
      console.error('Error fetching clinics:', error);
      return;
    }

    console.log(`📧 Sending daily summaries to ${clinics.length} clinics`);

    for (const clinic of clinics) {
      try {
        // Get today's insights
        const { data: todayInsight, error: insightError } = await supabase
          .from('ai_insights')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('date', today)
          .single();

        if (insightError && insightError.code !== 'PGRST116') {
          console.error(`Error fetching insights for clinic ${clinic.id}:`, insightError);
          continue;
        }

        const summary = {
          fineCount: todayInsight?.fine_count || 0,
          mildIssueCount: todayInsight?.mild_issue_count || 0,
          urgentCount: todayInsight?.urgent_count || 0,
          totalResponses: todayInsight?.total_responses || 0
        };

        // Only send if there are responses
        if (summary.totalResponses > 0) {
          await sendDailySummary(clinic.email, clinic.name, summary);
          console.log(`✅ Sent daily summary to ${clinic.name}`);
        } else {
          console.log(`⏭️ Skipped ${clinic.name} - no responses today`);
        }
      } catch (error) {
        console.error(`Error sending summary to clinic ${clinic.id}:`, error);
      }
    }

    console.log('✅ Daily summary sending completed');
  } catch (error) {
    console.error('Error in sendDailySummaries:', error);
  }
};

// Process overdue follow-ups (run every 6 hours)
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Checking for overdue follow-ups...');
  await processOverdueFollowUps();
});

const processOverdueFollowUps = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get patients with overdue follow-ups
    const { data: overduePatients, error } = await supabase
      .from('patients')
      .select(`
        *,
        clinics (
          id,
          name,
          email
        )
      `)
      .eq('is_active', true)
      .not('next_follow_up_date', 'is', null)
      .lt('next_follow_up_date', today);

    if (error) {
      console.error('Error fetching overdue patients:', error);
      return;
    }

    if (overduePatients.length === 0) {
      console.log('✅ No overdue follow-ups found');
      return;
    }

    console.log(`⚠️ Found ${overduePatients.length} overdue follow-ups`);

    // Group by clinic for batch processing
    const clinicGroups = {};
    overduePatients.forEach(patient => {
      const clinicId = patient.clinic_id;
      if (!clinicGroups[clinicId]) {
        clinicGroups[clinicId] = {
          clinic: patient.clinics,
          patients: []
        };
      }
      clinicGroups[clinicId].patients.push(patient);
    });

    // Send notifications to clinics about overdue patients
    for (const [clinicId, group] of Object.entries(clinicGroups)) {
      try {
        const { clinic, patients } = group;
        
        // Create overdue summary
        const overdueSummary = {
          fineCount: 0,
          mildIssueCount: 0,
          urgentCount: 0,
          totalResponses: 0,
          overdueCount: patients.length,
          overduePatients: patients.map(p => p.name)
        };

        // Send email to clinic about overdue patients
        await sendDailySummary(clinic.email, clinic.name, overdueSummary);
        console.log(`📧 Sent overdue notification to ${clinic.name}`);
      } catch (error) {
        console.error(`Error sending overdue notification to clinic ${clinicId}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in processOverdueFollowUps:', error);
  }
};

// Clean up old notification logs (run weekly)
cron.schedule('0 0 * * 0', async () => {
  console.log('🧹 Cleaning up old notification logs...');
  await cleanupOldLogs();
});

const cleanupOldLogs = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from('notification_logs')
      .delete()
      .lt('sent_at', thirtyDaysAgo.toISOString());

    if (error) {
      console.error('Error cleaning up logs:', error);
    } else {
      console.log('✅ Old notification logs cleaned up');
    }
  } catch (error) {
    console.error('Error in cleanupOldLogs:', error);
  }
};

module.exports = {
  processDueReminders,
  processReminder,
  sendDailySummaries,
  processOverdueFollowUps,
  cleanupOldLogs
};
