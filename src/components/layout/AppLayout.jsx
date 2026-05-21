import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';
import { 
  LayoutDashboard, Stethoscope, FlaskConical, Activity, Settings, LogOut,
  Users, ClipboardList, History, Syringe, Droplet, Briefcase, HeartPulse, DollarSign 
} from 'lucide-react';

export default function AppLayout() {
  const { user, role } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return <Navigate to="/" />;

  const userRole = role?.toLowerCase() || ''; 
  
  const navLinks = [
	...(userRole === 'admin' ? [{ name: "Admin Console", path: "/", icon: LayoutDashboard }] : []),
	...(['admin', 'receptionist'].includes(userRole) ? [{ name: "Front Desk", path: "/reception", icon: Users }] : []),
	...(['admin', 'nurse'].includes(userRole) ? [{ name: "Nurse Station", path: "/nurse", icon: HeartPulse }] : []),
	...(['admin', 'doctor'].includes(userRole) ? [{ name: "Doctor Workspace", path: "/doctor", icon: Stethoscope }] : []),
	...(['admin', 'chemist'].includes(userRole) ? [{ name: "Pharmacy Unit", path: "/chemist", icon: FlaskConical }] : []),
	...(['admin', 'doctor', 'nurse'].includes(userRole) ? [{ name: "Operations OR", path: "/operations", icon: Activity }] : []),
	...(['admin', 'doctor', 'nurse', 'receptionist'].includes(userRole) ? [{ name: "Blood Bank", path: "/bloodbank", icon: Droplet }] : []),
	...(['admin', 'doctor', 'receptionist', 'nurse'].includes(userRole) ? [{ name: "Patient History", path: "/history", icon: History }] : []),
	...(userRole === 'admin' ? [{ name: "Human Resources", path: "/hr", icon: Briefcase }] : []),
	...(userRole === 'admin' ? [{ name: "Financial Controller", path: "/finance", icon: DollarSign }] : []),
  ];

  const handleLogout = async () => {
	await supabase.auth.signOut();
	localStorage.clear();
	window.location.href = '/login';
  };

  return (
	<div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
	  
	  {/* Sidebar - Upgraded Aesthetics */}
	  <aside className="w-64 bg-slate-900 dark:bg-black text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl">
		
		{/* Brand Header */}
		<div className="h-20 flex items-center gap-3 px-6 bg-slate-950 border-b border-slate-800/50">
		  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-blue-900/40">O</div>
		  <h2 className="font-black text-lg text-white tracking-tighter">OPERIX<span className="text-blue-500">.</span></h2>
		</div>

		{/* User Profile Badge */}
		<div className="px-6 py-6">
		  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
			<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Active Session</div>
			<div className="text-xs font-bold text-white truncate">{user.email}</div>
			<div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-2 px-2 py-0.5 rounded-md bg-blue-900/20 inline-block">{role}</div>
		  </div>
		</div>

		{/* Navigation */}
		<nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
		  {navLinks.map((link) => {
			const Icon = link.icon;
			const isActive = location.pathname === link.path;
			return (
			  <Link key={link.path} to={link.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
				<Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
				{link.name}
			  </Link>
			);
		  })}
		</nav>

		{/* Footer Actions */}
		<div className="p-4 border-t border-slate-800/50 space-y-1">
		  <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${location.pathname === '/settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
			<Settings className="w-5 h-5" /> {t('settings')}
		  </Link>
		  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all duration-200">
			<LogOut className="w-5 h-5" /> {t('logout')}
		  </button>
		</div>
	  </aside>

	  {/* Main Content Area */}
	  <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
		<Outlet /> 
	  </main>
	</div>
  );
}