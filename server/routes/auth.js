const express = require('express');
const supabase = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const router = express.Router();

// Register new clinic
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and clinic name are required' });
    }
    console.log("REGISTER BODY:", req.body);

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          clinic_name: name
        }
      }
    });
    
    console.log("SUPABASE AUTH ERROR:", authError);
    console.log("SUPABASE AUTH DATA:", authData);

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create clinic record
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .insert({
        name,
        email,
        phone,
        address,
        subscription_plan: 'free',
        subscription_status: 'active'
      })
      .select()
      .single();

      console.log("CLINIC INSERT ERROR:", clinicError);


    if (clinicError) {
      // If clinic creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: "Failed to create clinic profile!" });
    }
    console.log('Received body:', req.body);

    res.status(201).json({
      message: 'Clinic registered successfully',
      user: authData.user,
      clinic
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Get clinic information
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', email)
      .single();

    if (clinicError) {
      return res.status(404).json({ error: 'Clinic profile not found' });
    }

    res.json({
      message: 'Login successful',
      user: data.user,
      session: data.session,
      token: data.session.access_token,
      clinic
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    console.log("AUTH USER:", req.user);
    console.log("AUTH CLINIC:", req.clinic);
    res.json({
      user: req.user,
      clinic: req.clinic
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update clinic profile
router.put('/profile', authenticateUser, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    const { data: clinic, error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', req.clinic.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Failed to update profile' });
    }

    res.json({
      message: 'Profile updated successfully',
      clinic
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CLIENT_URL}/reset-password`
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

module.exports = router;
