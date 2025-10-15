const express = require('express');
const supabase = require('../config/database');
const { analyzePatientResponse } = require('../config/openai');
const router = express.Router();

// Public endpoint for patients to submit responses
router.post('/submit', async (req, res) => {
  try {
    const { reminder_id, response_text, patient_id } = req.body;

    if (!reminder_id || !response_text) {
      return res.status(400).json({ error: 'Reminder ID and response text are required' });
    }

    // Verify reminder exists and get patient info
    const { data: reminder, error: reminderError } = await supabase
      .from('reminders')
      .select(`
        *,
        patients (
          id,
          name,
          clinic_id
        )
      `)
      .eq('id', reminder_id)
      .single();

    if (reminderError || !reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Analyze response with AI
    const aiAnalysis = await analyzePatientResponse(response_text);

    // Store patient response
    const { data: response, error: responseError } = await supabase
      .from('patient_responses')
      .insert({
        reminder_id,
        patient_id: reminder.patients.id,
        clinic_id: reminder.patients.clinic_id,
        response_text,
        ai_summary: aiAnalysis.summary,
        ai_status: aiAnalysis.status,
        ai_confidence: aiAnalysis.confidence,
        ai_keywords: aiAnalysis.keywords
      })
      .select()
      .single();

    if (responseError) {
      return res.status(400).json({ error: responseError.message });
    }

    // Update reminder status
    await supabase
      .from('reminders')
      .update({ 
        status: 'delivered',
        response_received_at: new Date().toISOString()
      })
      .eq('id', reminder_id);

    // Update daily insights
    await updateDailyInsights(reminder.patients.clinic_id, aiAnalysis.status);

    res.json({
      message: 'Response submitted successfully',
      response: {
        ...response,
        ai_analysis: aiAnalysis
      }
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get responses for a clinic (authenticated)
router.get('/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;
    const { page = 1, limit = 20, status, patient_id } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('patient_responses')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone
        ),
        reminders (
          id,
          message,
          contact_method
        )
      `)
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('ai_status', status);
    }

    if (patient_id) {
      query = query.eq('patient_id', patient_id);
    }

    const { data: responses, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      responses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Get single response
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: response, error } = await supabase
      .from('patient_responses')
      .select(`
        *,
        patients (
          id,
          name,
          email,
          phone
        ),
        reminders (
          id,
          message,
          contact_method
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json(response);
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

// Update response (for manual corrections)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { ai_summary, ai_status, ai_confidence } = req.body;

    const updates = {};
    if (ai_summary) updates.ai_summary = ai_summary;
    if (ai_status) updates.ai_status = ai_status;
    if (ai_confidence !== undefined) updates.ai_confidence = ai_confidence;

    const { data: response, error } = await supabase
      .from('patient_responses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({
      message: 'Response updated successfully',
      response
    });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
});

// Re-analyze response with AI
router.post('/:id/reanalyze', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the response
    const { data: response, error: responseError } = await supabase
      .from('patient_responses')
      .select('*')
      .eq('id', id)
      .single();

    if (responseError || !response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    // Re-analyze with AI
    const aiAnalysis = await analyzePatientResponse(response.response_text);

    // Update the response
    const { data: updatedResponse, error: updateError } = await supabase
      .from('patient_responses')
      .update({
        ai_summary: aiAnalysis.summary,
        ai_status: aiAnalysis.status,
        ai_confidence: aiAnalysis.confidence,
        ai_keywords: aiAnalysis.keywords
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.json({
      message: 'Response re-analyzed successfully',
      response: updatedResponse,
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Re-analyze response error:', error);
    res.status(500).json({ error: 'Failed to re-analyze response' });
  }
});

// Helper function to update daily insights
const updateDailyInsights = async (clinicId, status) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's insight record
    const { data: existingInsight, error: fetchError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw fetchError;
    }

    if (existingInsight) {
      // Update existing record
      const updates = {
        total_responses: existingInsight.total_responses + 1
      };

      if (status === 'Fine') {
        updates.fine_count = existingInsight.fine_count + 1;
      } else if (status === 'Mild issue') {
        updates.mild_issue_count = existingInsight.mild_issue_count + 1;
      } else if (status === 'Urgent') {
        updates.urgent_count = existingInsight.urgent_count + 1;
      }

      await supabase
        .from('ai_insights')
        .update(updates)
        .eq('id', existingInsight.id);
    } else {
      // Create new record
      const newInsight = {
        clinic_id: clinicId,
        date: today,
        total_responses: 1,
        fine_count: status === 'Fine' ? 1 : 0,
        mild_issue_count: status === 'Mild issue' ? 1 : 0,
        urgent_count: status === 'Urgent' ? 1 : 0
      };

      await supabase
        .from('ai_insights')
        .insert(newInsight);
    }
  } catch (error) {
    console.error('Update daily insights error:', error);
    // Don't throw error as this is a background operation
  }
};

module.exports = router;
