// src/pages/settings/Settings.jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Settings() {
  const { user, role } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  return (
	<div className="max-w-6xl mx-auto space-y-6">
	  <div className="border-b-2 border-slate-200 pb-4">
		<h1 className="text-2xl font-black text-slate-800 dark:text-white">{t('settings')}</h1>
		<p className="text-sm text-slate-500 font-medium mt-1">Manage your account, localization, and system preferences.</p>
	  </div>

	  <div className="flex flex-col md:flex-row gap-8">
		{/* Navigation Sidebar */}
		<div className="w-full md:w-64 shrink-0 space-y-2">
		  <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{t('profile')}</button>
		  <button onClick={() => setActiveTab('preferences')} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition ${activeTab === 'preferences' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{t('prefs')}</button>
		  <button onClick={() => setActiveTab('security')} className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm transition ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{t('security')}</button>
		</div>

		{/* Content Area */}
		<div className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
		  
		  {activeTab === 'profile' && (
			<div className="space-y-6 animate-in fade-in duration-300">
			  <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">{t('profile')}</h2>
			  <div className="flex items-center gap-6">
				<div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-black uppercase shadow-md">
				  {user?.email?.charAt(0)}
				</div>
				<div>
				  <h3 className="font-bold text-xl text-slate-800 dark:text-white">{user?.email}</h3>
				  <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider rounded-full">Role: {role}</span>
				</div>
			  </div>
			</div>
		  )}

		  {activeTab === 'preferences' && (
			<div className="space-y-6 animate-in fade-in duration-300">
			  <h2 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">{t('prefs')}</h2>
			  
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Language Toggle */}
				<div>
				  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('lang')}</label>
				  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg p-3 text-sm outline-none">
					<option value="en">English (US)</option>
					<option value="ar">العربية (Arabic)</option>
					<option value="fr">Français (French)</option>
					<option value="es">Español (Spanish)</option>
				  </select>
				</div>
				{/* Theme Toggle */}
				<div>
				  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t('theme')}</label>
				  <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-lg p-3 text-sm outline-none">
					<option value="light">Light Mode</option>
					<option value="dark">Dark Mode</option>
				  </select>
				</div>
			  </div>
			</div>
		  )}

		  {activeTab === 'security' && (
			<div className="space-y-6 animate-in fade-in duration-300">
			  <h2 className="text-lg font-bold text-red-600 border-b border-slate-100 dark:border-slate-800 pb-2">{t('security')}</h2>
			  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-900/50 flex justify-between items-center">
				<div>
				  <h3 className="font-bold text-red-800 dark:text-red-400 text-sm">{t('logout')}</h3>
				  <p className="text-xs text-red-600 dark:text-red-500 mt-1">Log out of OPERIX Care securely.</p>
				</div>
				<button onClick={async () => { await supabase.auth.signOut(); localStorage.clear(); window.location.href = '/'; }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow-sm">
				  {t('logout')}
				</button>
			  </div>
			</div>
		  )}
		</div>
	  </div>
	</div>
  );
}