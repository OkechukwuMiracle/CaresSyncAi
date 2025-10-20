import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Patients from './components/patients/Patients';
import Reminders from './components/reminders/Reminders';
import Insights from './components/insights/Insights';
import Subscription from './components/subscription/Subscription';
import Settings from './components/settings/Settings';
import PatientPortal from './components/patientPortal/PatientPortal';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Memoized route protection to prevent re-renders
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  const { loading, user } = useAuth();

  // A global loading state for initial auth check.
  // This prevents route flickering before the user state is confirmed.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Patient Portal (Public) */}
      <Route path="/patient/respond" element={<PatientPortal />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/patients" element={<ProtectedRoute><Layout><Patients /></Layout></ProtectedRoute>} />
      <Route path="/reminders" element={<ProtectedRoute><Layout><Reminders /></Layout></ProtectedRoute>} />
      <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><Layout><Subscription /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
