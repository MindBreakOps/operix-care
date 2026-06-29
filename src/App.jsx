import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { supabase } from './config/supabaseClient'; // Ensure path is correct

// Import Layout & Pages
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing'; 
import Subscription from './pages/Subscription';
import WorkspaceDiscovery from './pages/auth/WorkspaceDiscovery'; 
import Login from './pages/auth/Login';
import SuperAdminLogin from './pages/auth/SuperAdminLogin'; 

import AdminDashboard from './pages/admin/AdminDashboard';
import SuperAdminPortal from './pages/admin/SuperAdminPortal'; 
import ReceptionPortal from "./pages/reception/ReceptionPortal";
import NursePortal from "./pages/nurse/NursePortal";
import DoctorWorkspace from './pages/doctor/DoctorWorkspace';
import ChemistPortal from './pages/chemist/ChemistPortal';
import PatientPortal from './pages/patient/PatientPortal';
import DiagnosticLab from './pages/DiagnosticLab'; 

// Shared Modules
import Appointments from './pages/shared/Appointments';
import PatientHistory from "./pages/shared/PatientHistory"; 
import OperationsBoard from './pages/doctor/OperationsBoard';
import BloodBank from "./pages/bloodbank/BloodBank";
import HumanResources from './pages/hr/HumanResources';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import Settings from './pages/settings/Settings';

// Upgraded Route Protector with Enterprise Feature Flag Checking
const ProtectedRoute = ({ children, allowedRoles, requiredFeature }) => {
  const { user, role, loading } = useAuth();
  const { t } = useLanguage(); 
  const [featureAllowed, setFeatureAllowed] = useState(null);

  useEffect(() => {
    const verifyWorkspaceEntitlements = async () => {
      // Super admins bypass all feature locks, and routes with no requiredFeature auto-pass
      if (!requiredFeature || role === 'super_admin') {
        setFeatureAllowed(true);
        return;
      }
      try {
        const { data: profile } = await supabase.from('profiles').select('workspace_id').eq('id', user.id).single();
        if (profile?.workspace_id) {
          const { data: ws } = await supabase.from('workspaces').select(requiredFeature).eq('id', profile.workspace_id).single();
          setFeatureAllowed(ws?.[requiredFeature] === true);
        } else {
          setFeatureAllowed(false);
        }
      } catch (error) {
        console.error("Entitlement verification failed:", error);
        setFeatureAllowed(false);
      }
    };

    if (user && !loading) {
      verifyWorkspaceEntitlements();
    }
  }, [user, loading, requiredFeature, role]);
  
  if (loading || (requiredFeature && featureAllowed === null)) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  if (requiredFeature && !featureAllowed) return <Navigate to="/unauthorized" replace />;
  
  return children;
};

function AppRoutes() {
  const { user, role } = useAuth();
  const { t } = useLanguage();

  const getRedirectPath = (userRole) => {
    if (userRole === 'super_admin') return '/superadmin'; 
    if (userRole === 'admin') return '/admin';
    if (userRole === 'receptionist') return '/reception';
    if (userRole === 'nurse') return '/nurse';
    if (userRole === 'doctor') return '/doctor';
    if (userRole === 'chemist') return '/chemist';
    if (userRole === 'patient') return '/patient';
    return '/'; 
  };

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<Landing />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route path="/discovery" element={<WorkspaceDiscovery />} />
      
      {/* STRICT SEPARATION AUTH ROUTES */}
      <Route path="/saas-login" element={user && role === 'super_admin' ? <Navigate to="/superadmin" replace /> : <SuperAdminLogin />} />
      <Route path="/login" element={user ? <Navigate to={getRedirectPath(role)} replace /> : <Login />} />

      {/* PROTECTED HOSPITAL WORKFLOWS */}
      <Route element={<AppLayout />}>
        {/* SAAS CONTROL PLANE */}
        <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminPortal /></ProtectedRoute>} />
        
        {/* CLINICAL CORE MODULES */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/reception" element={<ProtectedRoute allowedRoles={['receptionist', 'admin', 'super_admin']}><ReceptionPortal /></ProtectedRoute>} />
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['nurse', 'admin', 'super_admin']}><NursePortal /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor', 'admin', 'super_admin']}><DoctorWorkspace /></ProtectedRoute>} />
        <Route path="/chemist" element={<ProtectedRoute allowedRoles={['chemist', 'admin', 'super_admin']}><ChemistPortal /></ProtectedRoute>} />
        <Route path="/operations" element={<ProtectedRoute allowedRoles={['doctor', 'admin', 'nurse', 'super_admin']}><OperationsBoard /></ProtectedRoute>} />
        <Route path="/bloodbank" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'super_admin']}><BloodBank /></ProtectedRoute>} />
        
        {/* PREMIUM ENTERPRISE MODULES (Protected by Feature Flags) */}
        <Route path="/hr" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredFeature="has_hr_board"><HumanResources /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']} requiredFeature="has_finance_board"><FinanceDashboard /></ProtectedRoute>} />
        
        <Route path="/pathology" element={<DiagnosticLab labTypeOverride="Pathology" />} />
        <Route path="/radiology" element={<DiagnosticLab labTypeOverride="Radiology" />} />
        
        <Route path="/appointments" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'super_admin']}><Appointments /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist', 'super_admin']}><PatientHistory /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'chemist', 'patient', 'nurse', 'receptionist', 'super_admin']}><Settings /></ProtectedRoute>} />
        
        <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientPortal /></ProtectedRoute>} />
        
        <Route path="/unauthorized" element={
          <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">{t('Access Denied')}</h1>
            <p className="text-slate-500 font-medium">{t('You do not have the required clinical clearance to view this portal.')}</p>
          </div>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Router>
  );
}