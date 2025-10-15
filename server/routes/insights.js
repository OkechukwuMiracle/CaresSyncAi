const express = require('express');
const supabase = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const { sendDailySummary } = require('../services/notifications');
const router = express.Router();

// Get AI insights dashboard data
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
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
        startDate.setDate(endDate.getDate() - 7);
    }

    // Get insights data
    const { data: insights, error: insightsError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (insightsError) {
      return res.status(400).json({ error: insightsError.message });
    }

    // Get recent responses
    const { data: recentResponses, error: responsesError } = await supabase
      .from('patient_responses')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .eq('clinic_id', req.clinic.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (responsesError) {
      return res.status(400).json({ error: responsesError.message });
    }

    // Calculate summary statistics
    const summary = insights.reduce((acc, insight) => {
      acc.totalResponses += insight.total_responses;
      acc.fineCount += insight.fine_count;
      acc.mildIssueCount += insight.mild_issue_count;
      acc.urgentCount += insight.urgent_count;
      return acc;
    }, { totalResponses: 0, fineCount: 0, mildIssueCount: 0, urgentCount: 0 });

    // Get urgent cases that need attention
    const { data: urgentCases, error: urgentError } = await supabase
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
      .eq('clinic_id', req.clinic.id)
      .eq('ai_status', 'Urgent')
      .order('created_at', { ascending: false })
      .limit(5);

    if (urgentError) {
      return res.status(400).json({ error: urgentError.message });
    }

    res.json({
      summary,
      insights,
      recentResponses,
      urgentCases,
      period
    });
  } catch (error) {
    console.error('Get insights dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch insights data' });
  }
});

// Get insights by date range
router.get('/range', authenticateUser, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const { data: insights, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .gte('date', start_date)
      .lte('date', end_date)
      .order('date', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(insights);
  } catch (error) {
    console.error('Get insights range error:', error);
    res.status(500).json({ error: 'Failed to fetch insights range' });
  }
});

// Get response trends
router.get('/trends', authenticateUser, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const { data: responses, error } = await supabase
      .from('patient_responses')
      .select('ai_status, created_at')
      .eq('clinic_id', req.clinic.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Group by date and status
    const trends = {};
    responses.forEach(response => {
      const date = response.created_at.split('T')[0];
      if (!trends[date]) {
        trends[date] = { date, fine: 0, mild: 0, urgent: 0 };
      }
      
      if (response.ai_status === 'Fine') {
        trends[date].fine++;
      } else if (response.ai_status === 'Mild issue') {
        trends[date].mild++;
      } else if (response.ai_status === 'Urgent') {
        trends[date].urgent++;
      }
    });

    const trendArray = Object.values(trends).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(trendArray);
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get keyword analysis
router.get('/keywords', authenticateUser, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const { data: responses, error } = await supabase
      .from('patient_responses')
      .select('ai_keywords, ai_status')
      .eq('clinic_id', req.clinic.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Count keywords
    const keywordCounts = {};
    responses.forEach(response => {
      if (response.ai_keywords && Array.isArray(response.ai_keywords)) {
        response.ai_keywords.forEach(keyword => {
          if (!keywordCounts[keyword]) {
            keywordCounts[keyword] = { count: 0, statuses: { fine: 0, mild: 0, urgent: 0 } };
          }
          keywordCounts[keyword].count++;
          
          if (response.ai_status === 'Fine') {
            keywordCounts[keyword].statuses.fine++;
          } else if (response.ai_status === 'Mild issue') {
            keywordCounts[keyword].statuses.mild++;
          } else if (response.ai_status === 'Urgent') {
            keywordCounts[keyword].statuses.urgent++;
          }
        });
      }
    });

    // Sort by count and return top keywords
    const topKeywords = Object.entries(keywordCounts)
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json(topKeywords);
  } catch (error) {
    console.error('Get keywords error:', error);
    res.status(500).json({ error: 'Failed to fetch keyword analysis' });
  }
});

// Send daily summary email
router.post('/send-daily-summary', authenticateUser, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's insights
    const { data: todayInsight, error: insightError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .eq('date', today)
      .single();

    if (insightError && insightError.code !== 'PGRST116') {
      return res.status(400).json({ error: insightError.message });
    }

    const summary = {
      fineCount: todayInsight?.fine_count || 0,
      mildIssueCount: todayInsight?.mild_issue_count || 0,
      urgentCount: todayInsight?.urgent_count || 0,
      totalResponses: todayInsight?.total_responses || 0
    };

    // Send email
    await sendDailySummary(req.clinic.email, req.clinic.name, summary);

    res.json({
      message: 'Daily summary sent successfully',
      summary
    });
  } catch (error) {
    console.error('Send daily summary error:', error);
    res.status(500).json({ error: 'Failed to send daily summary' });
  }
});

// Get patient response patterns
router.get('/patterns/:patientId', authenticateUser, async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient belongs to clinic
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('clinic_id', req.clinic.id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get patient's response history
    const { data: responses, error } = await supabase
      .from('patient_responses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Analyze patterns
    const patterns = {
      totalResponses: responses.length,
      statusDistribution: {
        fine: responses.filter(r => r.ai_status === 'Fine').length,
        mild: responses.filter(r => r.ai_status === 'Mild issue').length,
        urgent: responses.filter(r => r.ai_status === 'Urgent').length
      },
      averageConfidence: responses.reduce((sum, r) => sum + (r.ai_confidence || 0), 0) / responses.length,
      commonKeywords: {},
      timeline: responses.map(r => ({
        date: r.created_at,
        status: r.ai_status,
        confidence: r.ai_confidence,
        summary: r.ai_summary
      }))
    };

    // Count keywords
    responses.forEach(response => {
      if (response.ai_keywords && Array.isArray(response.ai_keywords)) {
        response.ai_keywords.forEach(keyword => {
          patterns.commonKeywords[keyword] = (patterns.commonKeywords[keyword] || 0) + 1;
        });
      }
    });

    res.json(patterns);
  } catch (error) {
    console.error('Get patient patterns error:', error);
    res.status(500).json({ error: 'Failed to fetch patient patterns' });
  }
});

module.exports = router;
