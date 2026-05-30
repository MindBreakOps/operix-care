import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../config/supabaseClient';
import logo from '../../assets/logo.jpg'; 
import { 
  LayoutDashboard, Users, HeartPulse, Stethoscope, 
  FlaskConical, Activity, Droplet, History, Briefcase, DollarSign, 
  Microscope, Settings, LogOut, Globe
} from 'lucide-react';

export default function AppLayout() {
  const { user, role } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  
  const [profile, setProfile] = useState(null);

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
  
  const navLinks = [
	...(userRole === 'admin' ? [{ name: t("Admin Console"), path: "/", icon: LayoutDashboard }] : []),
	...(['admin', 'receptionist'].includes(userRole) ? [{ name: t("Front Desk"), path: "/reception", icon: Users }] : []),
	...(['admin', 'nurse'].includes(userRole) ? [{ name: t("Nurse Station"), path: "/nurse", icon: HeartPulse }] : []),
	...(['admin', 'doctor'].includes(userRole) ? [{ name: t("Doctor Workspace"), path: "/doctor", icon: Stethoscope }] : []),
	...(['admin', 'chemist'].includes(userRole) ? [{ name: t("Pharmacy Unit"), path: "/chemist", icon: FlaskConical }] : []),
	...(['admin', 'doctor', 'nurse'].includes(userRole) ? [{ name: t("Operations OR"), path: "/operations", icon: Activity }] : []),
	...(['admin', 'doctor', 'nurse', 'receptionist'].includes(userRole) ? [{ name: t("Blood Bank"), path: "/bloodbank", icon: Droplet }] : []),
	...(['admin', 'doctor', 'receptionist', 'nurse'].includes(userRole) ? [{ name: t("Patient History"), path: "/history", icon: History }] : []),
	...(userRole === 'admin' ? [{ name: t("Human Resources"), path: "/hr", icon: Briefcase }] : []),
	...(userRole === 'admin' ? [{ name: t("Financial Controller"), path: "/finance", icon: DollarSign }] : []),
	...(['admin', 'pathologist', 'doctor'].includes(userRole) ? [{ name: t("Medical Labs"), path: "/pathology", icon: Microscope }] : []),
	...(['admin', 'radiologist', 'doctor'].includes(userRole) ? [{ name: t("Radiography"), path: "/radiology", icon: Activity }] : []),
  ];

  const handleLogout = async () => {
	await supabase.auth.signOut();
	window.location.href = '/login';
  };

  return (
	<div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
	  <aside className="w-64 bg-slate-900 dark:bg-black text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-2xl">
		
		<div className="h-20 flex items-center gap-3 px-6 bg-slate-950 border-b border-slate-800/50">
		  <img src={logo} alt="OPERIX Care" className="w-10 h-10 object-contain rounded-lg" />
		  <h2 className="font-black text-lg text-white tracking-tighter">OPERIX</h2>
		</div>

		<div className="px-6 py-6">
		  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
			<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t('Staff Record')}</div>
			<div className="text-sm font-bold text-white truncate">{profile?.full_name || t('Loading...')}</div>
			<div className="flex items-center gap-2 mt-2">
			  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-blue-900/20">
				{t(role) || '---'}
			  </span>
			  <span className="text-[10px] font-mono text-slate-400 border-l border-slate-600 pl-2">
				ID: {profile?.pro_id || '---'}
			  </span>
			</div>
		  </div>
		</div>

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

		<div className="p-4 border-t border-slate-800/50 space-y-2">
		  <button 
			onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
			className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg active:scale-95"
		  >
			<Globe className="w-5 h-5" /> 
			{language === 'en' ? 'عربي (Switch to Arabic)' : 'English (Switch to English)'}
		  </button>
		  <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${location.pathname === '/settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
			<Settings className="w-5 h-5" /> {t('settings')}
		  </Link>
		  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all duration-200">
			<LogOut className="w-5 h-5" /> {t('logout')}
		  </button>
		</div>
	  </aside>

	  <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
		<Outlet /> 
	  </main>
	</div>
  );
}