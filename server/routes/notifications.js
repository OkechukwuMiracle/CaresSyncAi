const express = require('express');
const supabase = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const { sendEmailReminder, sendSMSReminder, sendWhatsAppReminder } = require('../services/notifications');
const router = express.Router();

// Get notification logs
router.get('/logs', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('notification_logs')
      .select(`
        *,
        patients (
          id,
          name
        )
      `)
      .eq('clinic_id', req.clinic.id)
      .order('sent_at', { ascending: false });

    if (type) {
      query = query.eq('notification_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: logs, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get notification logs error:', error);
    res.status(500).json({ error: 'Failed to fetch notification logs' });
  }
});

// Send test notification
router.post('/test', authenticateUser, async (req, res) => {
  try {
    const { type, recipient, message } = req.body;

    if (!type || !recipient || !message) {
      return res.status(400).json({ 
        error: 'Notification type, recipient, and message are required' 
      });
    }

    let result;
    switch (type) {
      case 'email':
        result = await sendEmailReminder(recipient, message, 'Test Patient');
        break;
      case 'sms':
        result = await sendSMSReminder(recipient, message);
        break;
      case 'whatsapp':
        result = await sendWhatsAppReminder(recipient, message);
        break;
      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }

    res.json({
      message: 'Test notification sent successfully',
      result
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ error: 'Failed to send test notification: ' + error.message });
  }
});

// Get notification statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
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

    const { data: logs, error } = await supabase
      .from('notification_logs')
      .select('notification_type, status, sent_at')
      .eq('clinic_id', req.clinic.id)
      .gte('sent_at', startDate.toISOString())
      .lte('sent_at', endDate.toISOString());

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const stats = {
      period,
      total: logs.length,
      byType: {
        email: logs.filter(l => l.notification_type === 'email').length,
        sms: logs.filter(l => l.notification_type === 'sms').length,
        whatsapp: logs.filter(l => l.notification_type === 'whatsapp').length
      },
      byStatus: {
        sent: logs.filter(l => l.status === 'sent').length,
        delivered: logs.filter(l => l.status === 'delivered').length,
        failed: logs.filter(l => l.status === 'failed').length,
        bounced: logs.filter(l => l.status === 'bounced').length
      },
      successRate: logs.length > 0 ? 
        ((logs.filter(l => l.status === 'sent' || l.status === 'delivered').length / logs.length) * 100).toFixed(2) : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch notification statistics' });
  }
});

module.exports = router;
