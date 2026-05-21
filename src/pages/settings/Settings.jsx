import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  User, Settings as SettingsIcon, ShieldAlert, LogOut, 
  Globe, Moon, Sun, ChevronRight 
} from 'lucide-react';

export default function Settings() {
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans overflow-hidden min-h-screen">
	  
	  {/* AMBIENT BACKGROUND GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
	  <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Configuration</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			{t('settings')}
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Manage your account, localization, and system preferences.</p>
		</div>
	  </div>

	  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
		
		{/* LEFT: NAVIGATION SIDEBAR */}
		<div className="md:col-span-1 space-y-2">
		  <button 
			onClick={() => setActiveTab('profile')} 
			className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
		  >
			<span className="flex items-center gap-3"><User className="w-4 h-4"/> {t('profile')}</span>
			<ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'profile' ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2'}`} />
		  </button>
		  
		  <button 
			onClick={() => setActiveTab('preferences')} 
			className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeTab === 'preferences' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
		  >
			<span className="flex items-center gap-3"><SettingsIcon className="w-4 h-4"/> {t('prefs')}</span>
			<ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'preferences' ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2'}`} />
		  </button>
		  
		  <button 
			onClick={() => setActiveTab('security')} 
			className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeTab === 'security' ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' : 'bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'}`}
		  >
			<span className="flex items-center gap-3"><ShieldAlert className="w-4 h-4"/> {t('security')}</span>
			<ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'security' ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2'}`} />
		  </button>
		</div>

		{/* RIGHT: CONTENT AREA */}
		<div className="md:col-span-3 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl min-h-[500px] overflow-hidden flex flex-col">
		  
		  {/* TAB: PROFILE */}
		  {activeTab === 'profile' && (
			<div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-3">
				<User className="w-5 h-5 text-blue-500"/> {t('profile')}
			  </h2>
			  
			  <div className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-slate-50/50 dark:bg-slate-950/30 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
				<div className="w-32 h-32 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-5xl font-black uppercase shadow-inner border-4 border-white dark:border-slate-800 shrink-0">
				  {user?.email?.charAt(0) || '?'}
				</div>
				<div className="text-center md:text-left space-y-3">
				  <div>
					<div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Registered Account</div>
					<h3 className="font-black text-2xl text-slate-900 dark:text-white truncate max-w-xs md:max-w-md">{user?.email}</h3>
				  </div>
				  <span className="inline-block mt-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-xs font-black uppercase tracking-widest rounded-lg border border-blue-200 dark:border-blue-500/30">
					System Role: {role}
				  </span>
				</div>
			  </div>
			</div>
		  )}

		  {/* TAB: PREFERENCES */}
		  {activeTab === 'preferences' && (
			<div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-3">
				<SettingsIcon className="w-5 h-5 text-blue-500"/> {t('prefs')}
			  </h2>
			  
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Language Configuration */}
				<div className="space-y-3">
				  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
					<Globe className="w-3 h-3 text-blue-500"/> {t('lang')}
				  </label>
				  <select 
					value={language} 
					onChange={(e) => setLanguage(e.target.value)} 
					className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 dark:text-white rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
				  >
					<option value="en">English (US)</option>
					<option value="ar">العربية (Arabic)</option>
					<option value="fr">Français (French)</option>
					<option value="es">Español (Spanish)</option>
				  </select>
				</div>

				{/* Theme Configuration */}
				<div className="space-y-3">
				  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
					{theme === 'dark' ? <Moon className="w-3 h-3 text-indigo-400"/> : <Sun className="w-3 h-3 text-amber-500"/>} 
					{t('theme')}
				  </label>
				  <select 
					value={theme} 
					onChange={(e) => setTheme(e.target.value)} 
					className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 dark:text-white rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-white dark:hover:bg-slate-900 cursor-pointer"
				  >
					<option value="light">Light Mode</option>
					<option value="dark">Dark Mode</option>
				  </select>
				</div>
			  </div>
			</div>
		  )}

		  {/* TAB: SECURITY */}
		  {activeTab === 'security' && (
			<div className="p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  <h2 className="text-xl font-black text-red-600 dark:text-red-500 border-b border-red-100 dark:border-red-900/30 pb-4 flex items-center gap-3">
				<ShieldAlert className="w-5 h-5"/> {t('security')}
			  </h2>
			  
			  <div className="bg-red-50/50 dark:bg-red-950/20 p-6 md:p-8 rounded-3xl border border-red-200 dark:border-red-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<div>
				  <h3 className="font-black text-red-800 dark:text-red-400 text-lg">{t('logout')}</h3>
				  <p className="text-xs font-bold text-red-600/70 dark:text-red-500/70 mt-1 uppercase tracking-widest">Terminate active session securely.</p>
				</div>
				<button 
				  onClick={async () => { 
					await supabase.auth.signOut(); 
					localStorage.clear(); 
					window.location.href = '/'; 
				  }} 
				  className="w-full md:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
				>
				  <LogOut className="w-4 h-4"/> {t('logout')}
				</button>
			  </div>
			</div>
		  )}

		</div>
	  </div>
	</div>
  );
}