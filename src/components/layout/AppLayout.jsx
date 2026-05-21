// src/components/layout/AppLayout.jsx
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';
import { 
  LayoutDashboard, Stethoscope, FlaskConical, Activity, Settings, LogOut,
  Users, ClipboardList, History, Syringe, CalendarIcon, Droplet, Briefcase, HeartPulse, DollarSign 
} from 'lucide-react';

export default function AppLayout() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return <Navigate to="/" />;

  // Using t() to translate the sidebar dynamically!
// Force the role to lowercase to prevent capitalization bugs
	const userRole = role?.toLowerCase() || ''; 
  
	const navLinks = [
	  // Core Dashboards
	  ...(userRole === 'admin' ? [{ name: "Admin Console", path: "/admin", icon: LayoutDashboard }] : []),
	  ...(['admin', 'receptionist'].includes(userRole) ? [{ name: "Front Desk", path: "/reception", icon: Users }] : []),
	  ...(['admin', 'nurse'].includes(userRole) ? [{ name: "Nurse Station", path: "/nurse", icon: HeartPulse }] : []),
	  ...(['admin', 'doctor'].includes(userRole) ? [{ name: "Doctor Workspace", path: "/doctor", icon: Stethoscope }] : []),
	  ...(['admin', 'chemist'].includes(userRole) ? [{ name: "Pharmacy Unit", path: "/chemist", icon: FlaskConical }] : []),
	  
	  // Advanced Modules
	  ...(['admin', 'doctor', 'nurse'].includes(userRole) ? [{ name: "Operations OR", path: "/operations", icon: Activity }] : []),
	  ...(['admin', 'doctor', 'nurse', 'receptionist'].includes(userRole) ? [{ name: "Blood Bank", path: "/bloodbank", icon: Droplet }] : []),
	  ...(['admin', 'doctor', 'receptionist', 'nurse'].includes(userRole) ? [{ name: "Patient History", path: "/history", icon: History }] : []),
	  
	  // High-Level Security Modules
	...(userRole === 'admin' ? [{ name: "Human Resources", path: "/hr", icon: Users }] : []),
	...(userRole === 'admin' ? [{ name: "Financial Controller", path: "/finance", icon: DollarSign }] : []),
	];

  const handleLogout = async () => {
	await supabase.auth.signOut();
	localStorage.clear();
	window.location.href = '/';
  };

  return (
	// Added dark:bg-slate-900 and text transitions here!
	<div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
	  
	  {/* Sidebar */}
	  <aside className="w-64 bg-slate-900 dark:bg-black text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
		<div className="h-16 flex items-center gap-3 px-6 bg-slate-950/50 border-b border-slate-800">
		  <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold shadow-lg shadow-blue-900/20">O</div>
		  <h2 className="font-bold text-lg text-white tracking-tight">OPERIX Care</h2>
		</div>

		<div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
		  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Logged in as</div>
		  <div className="text-sm font-bold text-white truncate">{user.email}</div>
		  <div className="text-xs text-blue-400 font-medium capitalize mt-0.5">{role}</div>
		</div>

		<nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
		  {navLinks.map((link) => {
			const Icon = link.icon;
			const isActive = location.pathname === link.path;
			return (
			  <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}>
				<Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
				{link.name}
			  </Link>
			);
		  })}
		</nav>

		<div className="p-4 border-t border-slate-800 space-y-1">
		  <Link to="/settings" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === '/settings' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'}`}>
			<Settings className="w-5 h-5 text-slate-400" /> {t('settings')}
		  </Link>
		  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-left">
			<LogOut className="w-5 h-5 text-slate-400" /> {t('logout')}
		  </button>
		</div>
	  </aside>

	  {/* Main Content Area */}
	  <main className="flex-1 overflow-y-auto p-6 md:p-10 transition-colors duration-300">
		<Outlet /> 
	  </main>
	</div>
  );
}