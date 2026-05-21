import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Import Layout & Pages
import AppLayout from './components/layout/AppLayout';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ReceptionPortal from "./pages/reception/ReceptionPortal";
import NursePortal from "./pages/nurse/NursePortal";
import DoctorWorkspace from './pages/doctor/DoctorWorkspace';
import ChemistPortal from './pages/chemist/ChemistPortal';
import PatientPortal from './pages/patient/PatientPortal';

// Advanced & Shared Modules
import Appointments from './pages/shared/Appointments';
import PatientHistory from "./pages/shared/PatientHistory"; 
import OperationsBoard from './pages/doctor/OperationsBoard';
import BloodBank from "./pages/bloodbank/BloodBank";
import HumanResources from './pages/hr/HumanResources';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import Settings from './pages/settings/Settings';

// Route Protector
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center"><div className="loader border-t-blue-600"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" />;
  return children;
};

function AppRoutes() {
  const { user, role } = useAuth();

  return (
    <Routes>
      {/* If logged in, redirect to their specific dashboard, otherwise show Login screen */}
      <Route path="/login" element={user ? <Navigate to={`/${role}`} /> : <Login />} />
      <Route path="/" element={user ? <Navigate to={`/${role}`} /> : <Login />} />

      <Route element={<AppLayout />}>
        {/* Core Hospital Workflows */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/reception" element={<ProtectedRoute allowedRoles={['receptionist', 'admin']}><ReceptionPortal /></ProtectedRoute>} />
        <Route path="/nurse" element={<ProtectedRoute allowedRoles={['nurse', 'admin']}><NursePortal /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DoctorWorkspace /></ProtectedRoute>} />
        <Route path="/chemist" element={<ProtectedRoute allowedRoles={['chemist', 'admin']}><ChemistPortal /></ProtectedRoute>} />
        
        {/* Advanced Medical Modules */}
        <Route path="/operations" element={<ProtectedRoute allowedRoles={['doctor', 'admin', 'nurse']}><OperationsBoard /></ProtectedRoute>} />
        <Route path="/bloodbank" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}><BloodBank /></ProtectedRoute>} />
       <Route path="/hr" element={<ProtectedRoute allowedRoles={['admin']}><HumanResources /></ProtectedRoute>} />
       <Route path="/finance" element={<ProtectedRoute allowedRoles={['admin']}><FinanceDashboard /></ProtectedRoute>} />
        
        {/* Shared / Cross-Department Workflows */}
        <Route path="/appointments" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist']}><Appointments /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}><PatientHistory /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'chemist', 'patient', 'nurse', 'receptionist']}><Settings /></ProtectedRoute>} />
        
        {/* Patient Only Workflow */}
        <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient']}><PatientPortal /></ProtectedRoute>} />
        
        {/* Access Denied Page */}
        <Route path="/unauthorized" element={
          <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">Access Denied</h1>
            <p className="text-slate-500 font-medium">You do not have the required clinical clearance to view this portal.</p>
          </div>
        } />
      </Route>

      {/* Catch-all route */}
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