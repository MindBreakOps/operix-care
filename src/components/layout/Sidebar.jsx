import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext'; 
import { 
  LayoutDashboard, Users, Activity, Stethoscope, 
  Scissors, FlaskConical, CreditCard, FileText, 
  LogOut, Menu, X, ShieldPlus, Globe, ChevronLeft, ChevronRight, User
} from 'lucide-react';

export default function Sidebar() {
  const { user, role, signOut } = useAuth();
  const { t, language, setLanguage } = useLanguage(); 
  const location = useLocation();
  
  const [isOpen, setIsOpen] = useState(false); 
  const [isCollapsed, setIsCollapsed] = useState(false); 

  const NAV_LINKS = [
	{ name: t('Front Desk'), path: '/reception', icon: Users, roles: ['admin', 'receptionist'], color: 'text-emerald-500' },
	{ name: t('Triage & Vitals'), path: '/nurse', icon: Activity, roles: ['admin', 'nurse'], color: 'text-blue-500' },
	{ name: t('Consultation'), path: '/doctor', icon: Stethoscope, roles: ['admin', 'doctor'], color: 'text-indigo-500' },
	{ name: t('Surgical Board'), path: '/operations', icon: Scissors, roles: ['admin', 'doctor', 'nurse'], color: 'text-red-500' },
	{ name: t('Dispensary'), path: '/chemist', icon: FlaskConical, roles: ['admin', 'chemist'], color: 'text-amber-500' },
	{ name: t('Unified Timeline'), path: '/history', icon: FileText, roles: ['admin', 'doctor', 'nurse', 'receptionist'], color: 'text-slate-400' },
	{ name: t('Corporate Treasury'), path: '/finance', icon: CreditCard, roles: ['admin', 'finance'], color: 'text-purple-500' }
  ];

  const filteredLinks = NAV_LINKS.filter(link => link.roles.includes(role));

  const handleLogout = async () => {
	try { await signOut(); } catch (error) { console.error("Error logging out:", error.message); }
  };

  return (
	<>
	  <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden fixed top-5 left-4 z-[60] p-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-lg">
		{isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
	  </button>

	  {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[40] lg:hidden"></div>}

	  <aside className={`fixed inset-y-0 left-0 z-[50] flex flex-col bg-white/80 dark:bg-slate-900/90 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isCollapsed ? 'w-20' : 'w-72'}`}>
		
		<button 
			onClick={() => setIsCollapsed(!isCollapsed)} 
			className="hidden lg:flex absolute -right-3 top-8 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1.5 shadow-lg z-[60] transition-colors"
		>
			{isCollapsed ? <ChevronRight className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
		</button>

		<div className={`p-6 flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3'} transition-all overflow-hidden`}>
		  <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
			<ShieldPlus className="w-6 h-6 text-white" />
		  </div>
		  {!isCollapsed && (
			<div className="whitespace-nowrap">
				<h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">OPERIX</h1>
				<p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Care OS v2.0</p>
			</div>
		  )}
		</div>

		<div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-2 custom-scrollbar">
		  {!isCollapsed && <div className="px-4 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{t('Modules')}</div>}
		  
		  {filteredLinks.map((link) => {
			const isActive = location.pathname.includes(link.path);
			const Icon = link.icon;
			return (
			  <Link 
				key={link.name} 
				to={link.path} 
				onClick={() => setIsOpen(false)} 
				title={isCollapsed ? link.name : ''}
				className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive ? 'bg-slate-900 dark:bg-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
			  >
				{isActive && <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl opacity-50 ${link.color.replace('text', 'bg')}`}></div>}
				<Icon className={`w-5 h-5 shrink-0 relative z-10 transition-colors ${isActive ? 'text-white dark:text-slate-900' : `${link.color} opacity-90 group-hover:opacity-100`}`} />
				{!isCollapsed && <span className={`text-sm font-bold truncate relative z-10 ${isActive ? 'text-white dark:text-slate-900' : 'group-hover:text-slate-900 dark:group-hover:text-white'}`}>{link.name}</span>}
			  </Link>
			);
		  })}
		</div>

		<div className={`p-3 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-950/30 transition-all`}>
		  <div className={`flex ${isCollapsed ? 'justify-center' : 'items-center gap-3 px-2'} mb-4 overflow-hidden`}>
			<div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700" title={user?.email?.split('@')[0]}>
				<User className="w-5 h-5 text-slate-500" />
			</div>
			{!isCollapsed && (
				<div className="overflow-hidden">
				<div className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.email?.split('@')[0] || t('System User')}</div>
				<div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 truncate">{t('Role:')} {t(role) || t('Unassigned')}</div>
				</div>
			)}
		  </div>
		  
		  <button 
			onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
			title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
			className={`w-full mb-3 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-center gap-3 px-4'} py-3 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg active:scale-95`}
		  >
			<Globe className="w-5 h-5 shrink-0" /> 
			{!isCollapsed && <span className="truncate">{language === 'en' ? 'عربي' : 'English'}</span>}
		  </button>

		  <button 
			onClick={handleLogout} 
			title={isCollapsed ? t('Terminate Session') : ''}
			className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-center gap-2 px-4'} py-2.5 bg-red-50 hover:bg-red-600 dark:bg-red-500/10 dark:hover:bg-red-600 text-red-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all group`}
		  >
			<LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-1" /> 
			{!isCollapsed && <span className="truncate">{t('Terminate Session')}</span>}
		  </button>
		</div>
	  </aside>
	</>
  );
}