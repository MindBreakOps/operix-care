import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';
import logo from '../../assets/logo.jpg'; 
import { 
  LayoutDashboard, Users, HeartPulse, Stethoscope, 
  FlaskConical, Activity, Droplet, History, Briefcase, DollarSign, 
  Microscope, Settings, LogOut, Globe, ChevronLeft, ChevronRight, User
} from 'lucide-react';

export default function AppLayout() {
  const { user, role } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  
  const [profile, setProfile] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
	const fetchProfile = async () => {
	  if (!user) return;
	  const { data } = await supabase
		.from('profiles')
		.select(`full_name, id, employee_records(pro_id)`)
		.eq('id', user.id)
		.single();
	  
	  if (data) {
		setProfile({
		  full_name: data.full_name,
		  pro_id: Array.isArray(data.employee_records) 
			? data.employee_records[0]?.pro_id 
			: data.employee_records?.pro_id
		});
	  }
	};
	fetchProfile();
  }, [user]);
  
  if (!user) return <Navigate to="/login" />;

  const userRole = role?.toLowerCase() || ''; 
  
  // ADDED VIBRANT COLORS TO EACH MODULE ICON
  const navLinks = [
	...(userRole === 'admin' ? [{ name: t("Admin Console"), path: "/", icon: LayoutDashboard, color: "text-indigo-400" }] : []),
	...(['admin', 'receptionist'].includes(userRole) ? [{ name: t("Front Desk"), path: "/reception", icon: Users, color: "text-emerald-400" }] : []),
	...(['admin', 'nurse'].includes(userRole) ? [{ name: t("Nurse Station"), path: "/nurse", icon: HeartPulse, color: "text-blue-400" }] : []),
	...(['admin', 'doctor'].includes(userRole) ? [{ name: t("Doctor Workspace"), path: "/doctor", icon: Stethoscope, color: "text-indigo-400" }] : []),
	...(['admin', 'chemist'].includes(userRole) ? [{ name: t("Pharmacy Unit"), path: "/chemist", icon: FlaskConical, color: "text-amber-400" }] : []),
	...(['admin', 'doctor', 'nurse'].includes(userRole) ? [{ name: t("Operations OR"), path: "/operations", icon: Activity, color: "text-red-400" }] : []),
	...(['admin', 'doctor', 'nurse', 'receptionist'].includes(userRole) ? [{ name: t("Blood Bank"), path: "/bloodbank", icon: Droplet, color: "text-rose-400" }] : []),
	...(['admin', 'doctor', 'receptionist', 'nurse'].includes(userRole) ? [{ name: t("Patient History"), path: "/history", icon: History, color: "text-slate-300" }] : []),
	...(userRole === 'admin' ? [{ name: t("Human Resources"), path: "/hr", icon: Briefcase, color: "text-teal-400" }] : []),
	...(userRole === 'admin' ? [{ name: t("Financial Controller"), path: "/finance", icon: DollarSign, color: "text-purple-400" }] : []),
	...(['admin', 'pathologist', 'doctor'].includes(userRole) ? [{ name: t("Medical Labs"), path: "/pathology", icon: Microscope, color: "text-pink-400" }] : []),
	...(['admin', 'radiologist', 'doctor'].includes(userRole) ? [{ name: t("Radiography"), path: "/radiology", icon: Activity, color: "text-purple-400" }] : []),
  ];

  const handleLogout = async () => {
	await supabase.auth.signOut();
	window.location.href = '/login';
  };

  return (
	<div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
	  
	  <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 dark:bg-[#0a0a0a] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl transition-all duration-300 relative z-50`}>
		
		<button 
			onClick={() => setIsCollapsed(!isCollapsed)} 
			className="absolute -right-3 top-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1.5 shadow-lg z-[60] transition-colors"
		>
			{isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
		</button>

		<div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-6'} bg-slate-950/50 border-b border-slate-800/50 transition-all overflow-hidden`}>
		  <img src={logo} alt="OPERIX Care" className="w-10 h-10 object-contain rounded-lg shrink-0" />
		  {!isCollapsed && <h2 className="font-black text-lg text-white tracking-tighter whitespace-nowrap">OPERIX</h2>}
		</div>

		<div className={`py-6 ${isCollapsed ? 'px-2' : 'px-6'} transition-all`}>
		  <div className={`bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden transition-all ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
			{isCollapsed ? (
				<User className="w-6 h-6 text-slate-300" title={profile?.full_name || t('Staff Record')} />
			) : (
				<div className="whitespace-nowrap">
					<div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('Staff Record')}</div>
					<div className="text-sm font-bold text-white truncate">{profile?.full_name || t('Loading...')}</div>
					<div className="flex items-center gap-2 mt-2">
					<span className="text-[10px] font-black text-blue-300 uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-900/40">
						{t(role) || '---'}
					</span>
					<span className="text-[10px] font-mono text-slate-400 border-l border-slate-600 pl-2">
						ID: {profile?.pro_id || '---'}
					</span>
					</div>
				</div>
			)}
		  </div>
		</div>

		<nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar mt-2">
		  {navLinks.map((link) => {
			const Icon = link.icon;
			const isActive = location.pathname === link.path;
			return (
			  <Link 
				key={link.path} 
				to={link.path} 
				title={isCollapsed ? link.name : ''}
				className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
			  >
				<Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-white' : `${link.color} opacity-90 group-hover:opacity-100`}`} />
				{!isCollapsed && <span className="truncate">{link.name}</span>}
			  </Link>
			);
		  })}
		</nav>

		<div className="p-3 border-t border-slate-800/50 space-y-2">
		  <button 
			onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
			title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
			className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-center gap-3 px-4'} py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg active:scale-95`}
		  >
			<Globe className="w-5 h-5 shrink-0" /> 
			{!isCollapsed && <span className="truncate">{language === 'en' ? 'عربي' : 'English'}</span>}
		  </button>
		  
		  <Link 
			to="/settings" 
			title={isCollapsed ? t('settings') : ''}
			className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${location.pathname === '/settings' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
		  >
			<Settings className={`w-5 h-5 shrink-0 transition-colors ${location.pathname === '/settings' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} /> 
			{!isCollapsed && <span className="truncate">{t('settings')}</span>}
		  </Link>
		  
		  <button 
			onClick={handleLogout} 
			title={isCollapsed ? t('logout') : ''}
			className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group`}
		  >
			<LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-x-1" /> 
			{!isCollapsed && <span className="truncate">{t('logout')}</span>}
		  </button>
		</div>
	  </aside>

	  <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
		<Outlet /> 
	  </main>
	</div>
  );
}