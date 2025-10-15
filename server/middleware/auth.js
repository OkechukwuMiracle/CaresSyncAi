const supabase = require('../config/database');

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get clinic information
    const { data: clinic, error: clinicError } = await supabase
      .from('clinics')
      .select('*')
      .eq('email', user.email)
      .single();

    if (clinicError || !clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    req.user = user;
    req.clinic = clinic;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const requireSubscription = (requiredPlan) => {
  return (req, res, next) => {
    const planHierarchy = {
      'free': 0,
      'basic': 1,
      'pro': 2,
      'enterprise': 3
    };

    const userPlanLevel = planHierarchy[req.clinic.subscription_plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return res.status(403).json({ 
        error: 'Subscription upgrade required',
        currentPlan: req.clinic.subscription_plan,
        requiredPlan: requiredPlan
      });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  requireSubscription
};
