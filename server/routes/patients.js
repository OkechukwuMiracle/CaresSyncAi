const express = require('express');
const supabase = require('../config/database');
const { authenticateUser, requireSubscription } = require('../middleware/auth');
const router = express.Router();

// Get all patients for a clinic
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get single patient
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .eq('clinic_id', req.clinic.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// Create new patient
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, email, phone, date_of_birth, last_visit_date, next_follow_up_date, notes, preferred_contact_method } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }

    // Check patient limit based on subscription
    const { count: patientCount, error: countError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', req.clinic.id)
      .eq('is_active', true);

    if (countError) {
      return res.status(400).json({ error: 'Failed to check patient limit' });
    }

    if (patientCount >= req.clinic.max_patients) {
      return res.status(403).json({ 
        error: 'Patient limit reached',
        currentCount: patientCount,
        maxAllowed: req.clinic.max_patients,
        upgradeRequired: true
      });
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        clinic_id: req.clinic.id,
        name,
        email,
        phone,
        date_of_birth,
        last_visit_date,
        next_follow_up_date,
        notes,
        preferred_contact_method: preferred_contact_method || 'email'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Patient created successfully',
      patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

// Update patient
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, date_of_birth, last_visit_date, next_follow_up_date, notes, preferred_contact_method } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (date_of_birth) updates.date_of_birth = date_of_birth;
    if (last_visit_date) updates.last_visit_date = last_visit_date;
    if (next_follow_up_date) updates.next_follow_up_date = next_follow_up_date;
    if (notes !== undefined) updates.notes = notes;
    if (preferred_contact_method) updates.preferred_contact_method = preferred_contact_method;

    const { data: patient, error } = await supabase
      .from('patients')
      .update(updates)
      .eq('id', id)
      .eq('clinic_id', req.clinic.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

// Delete patient (soft delete)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: patient, error } = await supabase
      .from('patients')
      .update({ is_active: false })
      .eq('id', id)
      .eq('clinic_id', req.clinic.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Failed to delete patient' });
  }
});

// Get patients with upcoming follow-ups
router.get('/upcoming-followups', authenticateUser, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .eq('is_active', true)
      .not('next_follow_up_date', 'is', null)
      .lte('next_follow_up_date', futureDate.toISOString().split('T')[0])
      .order('next_follow_up_date', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(patients);
  } catch (error) {
    console.error('Get upcoming follow-ups error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming follow-ups' });
  }
});

// Get patient statistics
router.get('/stats/overview', authenticateUser, async (req, res) => {
  try {
    const { data: stats, error } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', req.clinic.id)
      .eq('is_active', true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const overview = {
      totalPatients: stats.length,
      upcomingFollowUps: stats.filter(p => p.next_follow_up_date && p.next_follow_up_date <= nextWeekStr).length,
      overdueFollowUps: stats.filter(p => p.next_follow_up_date && p.next_follow_up_date < today).length,
      patientsWithEmail: stats.filter(p => p.email).length,
      patientsWithPhone: stats.filter(p => p.phone).length
    };

    res.json(overview);
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ error: 'Failed to fetch patient statistics' });
  }
});

module.exports = router;
