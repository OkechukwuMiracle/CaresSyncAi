const express = require('express');
const supabase = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Get clinic dashboard overview - OPTIMIZED VERSION
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const clinicId = req.clinic.id;

    // Calculate dates once
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // ✅ CRITICAL FIX: Run ALL queries in parallel using Promise.all
    const [
      patientCountResult,
      upcomingFollowUpsResult,
      pendingRemindersResult,
      recentResponsesResult,
      urgentCasesResult,
      todayInsightResult
    ] = await Promise.all([
      // Get patient count
      supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('is_active', true),

      // Get upcoming follow-ups (next 7 days)
      supabase
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .not('next_follow_up_date', 'is', null)
        .lte('next_follow_up_date', nextWeekStr)
        .order('next_follow_up_date', { ascending: true }),

      // Get pending reminders
      supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('clinic_id', clinicId)
        .eq('status', 'pending'),

      // Get recent responses
      supabase
        .from('patient_responses')
        .select(`
          *,
          patients (
            id,
            name
          )
        `)
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .limit(5),

      // Get urgent cases
      supabase
        .from('patient_responses')
        .select(`
          *,
          patients (
            id,
            name,
            phone,
            email
          )
        `)
        .eq('clinic_id', clinicId)
        .eq('ai_status', 'Urgent')
        .order('created_at', { ascending: false })
        .limit(5),

      // Get today's insights
      supabase
        .from('ai_insights')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('date', today)
        .single()
    ]);

    // Check for errors
    if (patientCountResult.error) {
      console.error('Patient count error:', patientCountResult.error);
      return res.status(400).json({ error: patientCountResult.error.message });
    }
    if (upcomingFollowUpsResult.error) {
      console.error('Follow-ups error:', upcomingFollowUpsResult.error);
      return res.status(400).json({ error: upcomingFollowUpsResult.error.message });
    }
    if (pendingRemindersResult.error) {
      console.error('Reminders error:', pendingRemindersResult.error);
      return res.status(400).json({ error: pendingRemindersResult.error.message });
    }
    if (recentResponsesResult.error) {
      console.error('Responses error:', recentResponsesResult.error);
      return res.status(400).json({ error: recentResponsesResult.error.message });
    }
    if (urgentCasesResult.error) {
      console.error('Urgent cases error:', urgentCasesResult.error);
      return res.status(400).json({ error: urgentCasesResult.error.message });
    }
    // Note: todayInsightResult.error is acceptable (PGRST116 = no rows)

    const dashboard = {
      overview: {
        totalPatients: patientCountResult.count || 0,
        upcomingFollowUps: upcomingFollowUpsResult.data?.length || 0,
        pendingReminders: pendingRemindersResult.count || 0,
        urgentCases: urgentCasesResult.data?.length || 0
      },
      todayInsights: todayInsightResult.data || {
        total_responses: 0,
        fine_count: 0,
        mild_issue_count: 0,
        urgent_count: 0
      },
      upcomingFollowUps: upcomingFollowUpsResult.data || [],
      recentResponses: recentResponsesResult.data || [],
      urgentCases: urgentCasesResult.data || []
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get clinic statistics - OPTIMIZED VERSION
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    const clinicId = req.clinic.id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // ✅ Run all queries in parallel
    const [patientsResult, remindersResult, responsesResult] = await Promise.all([
      supabase
        .from('patients')
        .select('created_at, is_active')
        .eq('clinic_id', clinicId),

      supabase
        .from('reminders')
        .select('status, contact_method, created_at')
        .eq('clinic_id', clinicId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      supabase
        .from('patient_responses')
        .select('ai_status, created_at')
        .eq('clinic_id', clinicId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ]);

    if (patientsResult.error) {
      return res.status(400).json({ error: patientsResult.error.message });
    }
    if (remindersResult.error) {
      return res.status(400).json({ error: remindersResult.error.message });
    }
    if (responsesResult.error) {
      return res.status(400).json({ error: responsesResult.error.message });
    }

    const patients = patientsResult.data || [];
    const reminders = remindersResult.data || [];
    const responses = responsesResult.data || [];

    const stats = {
      period,
      patients: {
        total: patients.length,
        active: patients.filter(p => p.is_active).length,
        newThisPeriod: patients.filter(p => new Date(p.created_at) >= startDate).length
      },
      reminders: {
        total: reminders.length,
        sent: reminders.filter(r => r.status === 'sent').length,
        pending: reminders.filter(r => r.status === 'pending').length,
        failed: reminders.filter(r => r.status === 'failed').length,
        byMethod: {
          email: reminders.filter(r => r.contact_method === 'email').length,
          sms: reminders.filter(r => r.contact_method === 'sms').length,
          whatsapp: reminders.filter(r => r.contact_method === 'whatsapp').length
        }
      },
      responses: {
        total: responses.length,
        fine: responses.filter(r => r.ai_status === 'Fine').length,
        mild: responses.filter(r => r.ai_status === 'Mild issue').length,
        urgent: responses.filter(r => r.ai_status === 'Urgent').length
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
