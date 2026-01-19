const express = require("express");
const supabase = require("../config/database");
const { authenticateUser, requireSubscription } = require("../middleware/auth");
const {
  sendEmailReminder,
  sendSMSReminder,
  sendWhatsAppReminder,
} = require("../services/notifications");
const { processReminder } = require("../services/scheduler");
const router = express.Router();

// Get all reminders for a clinic
router.get("/", authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patient_id } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reminders")
      .select(
        `
        *,
        patients (
          id,
          name,
          email,
          phone
        )
      `,
        { count: 'exact' }
      )
      .eq("clinic_id", req.clinic.id)
      .order("scheduled_date", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (patient_id) {
      query = query.eq("patient_id", patient_id);
    }

    const {
      data: reminders,
      error,
      count,
    } = await query.range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      reminders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get reminders error:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// Create a new reminder
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { patient_id, scheduled_date, message, contact_method } = req.body;

    if (!patient_id || !scheduled_date || !message || !contact_method) {
      return res.status(400).json({
        error:
          "Patient ID, scheduled date, message, and contact method are required",
      });
    }

    // Verify patient belongs to clinic
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patient_id)
      .eq("clinic_id", req.clinic.id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Check subscription limits for reminders
    if (req.clinic.subscription_plan === "free") {
      const { count: reminderCount, error: countError } = await supabase
        .from("reminders")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", req.clinic.id)
        .gte(
          "created_at",
          new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()
        );

      if (countError) {
        return res
          .status(400)
          .json({ error: "Failed to check reminder limit" });
      }

      if (reminderCount >= 50) {
        return res.status(403).json({
          error: "Monthly reminder limit reached for free plan",
          upgradeRequired: true,
        });
      }
    }

    const { data: reminder, error } = await supabase
      .from("reminders")
      .insert({
        patient_id,
        clinic_id: req.clinic.id,
        scheduled_date,
        message,
        contact_method,
      })
      .select(
        `
        *,
        patients (
          id,
          name,
          email,
          phone,
          preferred_contact_method
        )
      `
      )
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // ✅ NEW: If scheduled time is in the past or within next 5 minutes, send immediately
    const scheduledTime = new Date(scheduled_date);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (scheduledTime <= fiveMinutesFromNow) {
      console.log(`⚡ Reminder scheduled for immediate/near-term delivery`);
      
      // Process the reminder immediately in the background
      setImmediate(async () => {
        try {
          await processReminder(reminder);
          console.log(`✅ Immediate reminder processed for patient ${patient.name}`);
        } catch (err) {
          console.error(`❌ Error processing immediate reminder:`, err);
        }
      });
    }

    res.status(201).json({
      message: "Reminder created successfully",
      reminder,
      willSendImmediately: scheduledTime <= fiveMinutesFromNow
    });
  } catch (error) {
    console.error("Create reminder error:", error);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

// Update reminder
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_date, message, contact_method, status } = req.body;

    const updates = {};
    if (scheduled_date) updates.scheduled_date = scheduled_date;
    if (message) updates.message = message;
    if (contact_method) updates.contact_method = contact_method;
    if (status) updates.status = status;

    const { data: reminder, error } = await supabase
      .from("reminders")
      .update(updates)
      .eq("id", id)
      .eq("clinic_id", req.clinic.id)
      .select(
        `
        *,
        patients (
          id,
          name,
          email,
          phone
        )
      `
      )
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.json({
      message: "Reminder updated successfully",
      reminder,
    });
  } catch (error) {
    console.error("Update reminder error:", error);
    res.status(500).json({ error: "Failed to update reminder" });
  }
});

// Delete reminder
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reminder, error } = await supabase
      .from("reminders")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("clinic_id", req.clinic.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    res.json({ message: "Reminder cancelled successfully" });
  } catch (error) {
    console.error("Delete reminder error:", error);
    res.status(500).json({ error: "Failed to cancel reminder" });
  }
});

// Send reminder immediately (for testing or manual sending)
router.post("/:id/send", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: reminder, error } = await supabase
      .from("reminders")
      .select(
        `
        *,
        patients (
          id,
          name,
          email,
          phone,
          preferred_contact_method
        )
      `
      )
      .eq("id", id)
      .eq("clinic_id", req.clinic.id)
      .single();

    if (error || !reminder) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    if (reminder.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Reminder has already been sent or cancelled" });
    }

    // Use the unified processReminder function
    await processReminder(reminder);

    res.json({
      message: "Reminder sent successfully"
    });
  } catch (error) {
    console.error("Send reminder error:", error);
    res
      .status(500)
      .json({ error: "Failed to send reminder: " + error.message });
  }
});

// Get reminder statistics
router.get("/stats/overview", authenticateUser, async (req, res) => {
  try {
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("status, contact_method, created_at")
      .eq("clinic_id", req.clinic.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const stats = {
      total: reminders.length,
      pending: reminders.filter((r) => r.status === "pending").length,
      sent: reminders.filter((r) => r.status === "sent").length,
      delivered: reminders.filter((r) => r.status === "delivered").length,
      failed: reminders.filter((r) => r.status === "failed").length,
      byMethod: {
        email: reminders.filter((r) => r.contact_method === "email").length,
        sms: reminders.filter((r) => r.contact_method === "sms").length,
        whatsapp: reminders.filter((r) => r.contact_method === "whatsapp")
          .length,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error("Get reminder stats error:", error);
    res.status(500).json({ error: "Failed to fetch reminder statistics" });
  }
});

// Manual trigger for testing
router.post('/trigger-scheduler', authenticateUser, async (req, res) => {
  try {
    const { processDueReminders } = require('../services/scheduler');
    
    console.log('🔄 Manually triggering reminder processing...');
    await processDueReminders();
    
    res.json({ 
      message: 'Reminder processing triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;