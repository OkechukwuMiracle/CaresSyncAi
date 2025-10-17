// import React from 'react';
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import { useAuth } from './contexts/AuthContext';

// import Login from './components/auth/Login';
// import Register from './components/auth/Register';
// import Dashboard from './components/dashboard/Dashboard';
// import Patients from './components/patients/Patients';
// import Reminders from './components/reminders/Reminders';
// import Insights from './components/insights/Insights';
// import Subscription from './components/subscription/Subscription';
// import Settings from './components/settings/Settings';
// import PatientPortal from './components/patient/PatientPortal';
// import Layout from './components/layout/Layout';
// import LoadingSpinner from './components/common/LoadingSpinner';

// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
  
//   if (loading) {
//     return <LoadingSpinner />;
//   }
  
//   return user ? children : <Navigate to="/login" replace />;
// };

// const PublicRoute = ({ children }) => {
//   const { user, loading } = useAuth();
  
//   if (loading) {
//     return <LoadingSpinner />;
//   }
  
//   return user ? <Navigate to="/dashboard" replace /> : children;
// };

// function App() {
//   const { loading } = useAuth();

//   // Show a single loading spinner while auth initializes
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <LoadingSpinner />
//       </div>
//     );
//   }

//   return (
//     <>
//       <Toaster position="top-right" />

//       <Routes>
//         {/* Public Routes */}
//         <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
//         <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

//         {/* Patient Portal (Public) */}
//         <Route path="/patient/respond" element={<PatientPortal />} />

//         {/* Protected Routes */}
//         <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
//         <Route path="/patients" element={<ProtectedRoute><Layout><Patients /></Layout></ProtectedRoute>} />
//         <Route path="/reminders" element={<ProtectedRoute><Layout><Reminders /></Layout></ProtectedRoute>} />
//         <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
//         <Route path="/subscription" element={<ProtectedRoute><Layout><Subscription /></Layout></ProtectedRoute>} />
//         <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

//         {/* Root redirect */}
//         <Route path="/" element={<Navigate to="/login" replace />} />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     </>
//   );
// }

// export default App;




import React, {memo} from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Patients from './components/patients/Patients';
import Reminders from './components/reminders/Reminders';
import Insights from './components/insights/Insights';
import Subscription from './components/subscription/Subscription';
import Settings from './components/settings/Settings';
import PatientPortal from './components/patient/PatientPortal';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';


// Memoize route components to prevent StrictMode re-renders
const ProtectedRoute = memo(({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  return user ? children : <Navigate to="/login" replace />;
});

const PublicRoute = memo(({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  return user ? <Navigate to="/dashboard" replace /> : children;
});

const App = memo(() => {
  const { loading } = useAuth(); // Remove user from deps to avoid re-renders

  console.log("🔷 App.js render - loading:", loading);

  if (loading) {
    console.log("⏳ App showing loading spinner");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  console.log("✅ App finished loading, rendering routes");

  return (
    <>
      {/* <Toaster position="top-right" /> */}

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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
})

export default App;