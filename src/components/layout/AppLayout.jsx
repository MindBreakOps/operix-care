import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';
import logo from '../../assets/logo.jpg'; 
import { 
  LayoutDashboard, Users, HeartPulse, Stethoscope, 
  FlaskConical, Activity, Droplet, History, Briefcase, DollarSign, 
  Microscope, Settings, LogOut, Globe, ChevronLeft, ChevronRight, User, ShieldPlus, Network
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
	  // Fetching Name AND pro_id from employee_records
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
  
  const navLinks = [
	...(userRole === 'admin' ? [{ name: t("Admin Console"), path: "/", icon: LayoutDashboard, color: "text-indigo-400", bg: "bg-indigo-500" }] : []),
	...(['admin', 'receptionist'].includes(userRole) ? [{ name: t("Front Desk"), path: "/reception", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500" }] : []),
	...(['admin', 'nurse'].includes(userRole) ? [{ name: t("Nurse Station"), path: "/nurse", icon: HeartPulse, color: "text-blue-400", bg: "bg-blue-500" }] : []),
	...(['admin', 'doctor'].includes(userRole) ? [{ name: t("Doctor Workspace"), path: "/doctor", icon: Stethoscope, color: "text-indigo-400", bg: "bg-indigo-500" }] : []),
	...(['admin', 'chemist'].includes(userRole) ? [{ name: t("Pharmacy Unit"), path: "/chemist", icon: FlaskConical, color: "text-amber-400", bg: "bg-amber-500" }] : []),
	...(['admin', 'doctor', 'nurse'].includes(userRole) ? [{ name: t("Operations OR"), path: "/operations", icon: Activity, color: "text-red-400", bg: "bg-red-500" }] : []),
	...(['admin', 'doctor', 'nurse', 'receptionist'].includes(userRole) ? [{ name: t("Blood Bank"), path: "/bloodbank", icon: Droplet, color: "text-rose-400", bg: "bg-rose-500" }] : []),
	...(['admin', 'doctor', 'receptionist', 'nurse'].includes(userRole) ? [{ name: t("Patient History"), path: "/history", icon: History, color: "text-slate-300", bg: "bg-slate-500" }] : []),
	...(userRole === 'admin' ? [{ name: t("Human Resources"), path: "/hr", icon: Briefcase, color: "text-teal-400", bg: "bg-teal-500" }] : []),
	...(userRole === 'admin' ? [{ name: t("Financial Controller"), path: "/finance", icon: DollarSign, color: "text-purple-400", bg: "bg-purple-500" }] : []),
	...(['admin', 'pathologist', 'doctor'].includes(userRole) ? [{ name: t("Medical Labs"), path: "/pathology", icon: Microscope, color: "text-pink-400", bg: "bg-pink-500" }] : []),
	...(['admin', 'radiologist', 'doctor'].includes(userRole) ? [{ name: t("Radiography"), path: "/radiology", icon: Activity, color: "text-purple-400", bg: "bg-purple-500" }] : []),
	...(userRole === 'super_admin' ? [{ name: t("Network Control"), path: "/superadmin", icon: Network, color: "text-blue-400", bg: "bg-blue-500" }] : []),
  ];

  return (
	
	<div className="flex h-screen bg-slate-100 dark:bg-[#0a0a0a] text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300 p-4 gap-6">

	  <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-slate-800 dark:bg-slate-800/90 backdrop-blur-2xl text-slate-300 flex flex-col shrink-0 border border-slate-700/50 shadow-2xl transition-all duration-300 relative z-50 rounded-[2rem] overflow-hidden`}>
		
		<button 
			onClick={() => setIsCollapsed(!isCollapsed)} 
			className={`absolute ${language === 'ar' ? '-left-3' : '-right-3'} top-10 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1.5 shadow-lg z-[60] transition-transform`}
		>
			{isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
		</button>

		{/* LOGO AREA - Updated to "OPERIX Care" */}
		<div className={`pt-8 pb-4 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-6'} transition-all`}>
		  <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
			<ShieldPlus className="w-6 h-6 text-white" />
		  </div>
		  {!isCollapsed && (
			<div className="whitespace-nowrap animate-in fade-in zoom-in duration-300">
				<h1 className="text-xl font-black tracking-tighter text-white leading-none">OPERIX Care</h1>
				<p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Health Care</p>
			</div>
		  )}
		</div>

		{/* RESTORED PROFILE CARD - Left exactly as requested */}
		<div className={`py-6 ${isCollapsed ? 'px-2' : 'px-6'} transition-all`}>
		  <div className={`bg-slate-900/40 rounded-2xl border border-slate-700/50 overflow-hidden shadow-inner transition-all ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
			{isCollapsed ? (
				<User className="w-6 h-6 text-slate-300" title={profile?.full_name || t('EMO Record')} />
			) : (
				<div className="whitespace-nowrap">
					<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t('EMP Record')}</div>
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

		<nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar mt-2 pb-4">
		  {!isCollapsed && <div className="px-3 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('Modules')}</div>}
		  
		  {navLinks.map((link) => {
			const isActive = location.pathname === link.path;
			return (
			  <Link 
				key={link.path} 
				to={link.path} 
				title={isCollapsed ? link.name : ''}
				className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-4 px-5 py-3.5'} rounded-2xl text-sm font-black transition-all duration-200 group relative overflow-hidden ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-slate-200 hover:bg-white/5 hover:text-white'}`}
			  >
				{isActive && <div className={`absolute left-0 top-0 w-1.5 h-full ${link.bg} shadow-[0_0_10px_rgba(255,255,255,0.5)]`}></div>}
				<link.icon className={`w-6 h-6 shrink-0 transition-all ${isActive ? link.color : `${link.color} opacity-80 group-hover:opacity-100 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}`} />
				{!isCollapsed && <span className="truncate tracking-wide">{link.name}</span>}
			  </Link>
			);
		  })}
		</nav>

		{/* BOTTOM USER/SETTINGS AREA */}
		<div className="p-3 bg-slate-900/30 border-t border-slate-700/50 space-y-2 backdrop-blur-md">
		  
		  <button 
			onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
			title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
			className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-center gap-3 px-4'} py-3 rounded-xl text-sm font-black text-white bg-blue-600/80 hover:bg-blue-600 transition-all active:scale-95`}
		  >
			<Globe className="w-5 h-5 shrink-0" /> 
			{!isCollapsed && <span className="truncate">{language === 'en' ? 'عربي' : 'English'}</span>}
		  </button>
		  
		  <Link 
			to="/settings" 
			title={isCollapsed ? t('settings') : ''}
			className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold transition-all duration-200 ${location.pathname === '/settings' ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
		  >
			<Settings className={`w-5 h-5 shrink-0 transition-colors ${location.pathname === '/settings' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} /> 
			{!isCollapsed && <span className="truncate">{t('settings')}</span>}
		  </Link>
		  
		  <button 
			onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }} 
			title={isCollapsed ? t('logout') : ''}
			className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 group`}
		  >
			<LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:-translate-y-0.5" /> 
			{!isCollapsed && <span className="truncate">{t('logout')}</span>}
		  </button>
		</div>
	  </aside>

	  {/* MAIN CONTENT AREA */}
	  <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0f0f11] rounded-[2rem] border border-slate-200 dark:border-slate-800/60 shadow-sm relative transition-colors duration-300">
		<Outlet /> 
	  </main>
	</div>
  );
}