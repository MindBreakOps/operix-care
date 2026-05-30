import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Link } from 'react-router-dom';
import { Users, Activity, Syringe, Pill, ShieldAlert, Check, X, Edit, Trash2, Save, Shield, ArrowRight, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ activeVisits: 0, pendingRx: 0, activeOps: 0, totalPatients: 0 });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role: '' });

  const fetchAnalytics = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  const [visitsRes, rxRes, opsRes, usersRes, pendingRes, activeRes] = await Promise.all([
		supabase.from('visits').select('id', { count: 'exact' }).neq('status', 'discharged'),
		supabase.from('prescriptions').select('id', { count: 'exact' }).eq('status', 'pending'),
		supabase.from('operations').select('id', { count: 'exact' }).in('status', ['scheduled', 'in_progress']),
		supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'patient'),
		supabase.from('profiles').select('*').eq('status', 'pending'),
		supabase.from('profiles').select('*').eq('status', 'approved').order('created_at', { ascending: false })
	  ]);

	  setStats({
		activeVisits: visitsRes.count || 0,
		pendingRx: rxRes.count || 0,
		activeOps: opsRes.count || 0,
		totalPatients: usersRes.count || 0
	  });
	  setPendingUsers(pendingRes.data || []);
	  setActiveUsers(activeRes.data || []);
	} catch (error) {
	  console.error("Error fetching stats:", error);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const handleUserApproval = async (userId, newStatus) => {
	await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
	fetchAnalytics(true);
  };

  const startEdit = (user) => {
	setEditMode(user.id);
	setEditForm({ full_name: user.full_name || '', role: user.role || '' });
  };

  const saveEdit = async (userId) => {
	await supabase.from('profiles').update({
	  full_name: editForm.full_name,
	  role: editForm.role
	}).eq('id', userId);
	
	setEditMode(null);
	fetchAnalytics(true);
  };

  const deleteUser = async (userId) => {
	if (!window.confirm(t("Are you sure you want to permanently delete this user's profile and revoke access?"))) return;
	await supabase.from('profiles').delete().eq('id', userId);
	fetchAnalytics(true);
  };

  return (
	<div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('System Online')}</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('Command Center')}</h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">{t('Enterprise Analytics & Access Control')}</p>
		</div>
		<button onClick={() => fetchAnalytics(true)} disabled={loading || isRefreshing} className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50">
		  <RefreshCcw className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
		  {t('Refresh Data')}
		</button>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
		  <p className="text-sm font-medium text-slate-500 animate-pulse">{t('Syncing Enterprise Data...')}</p>
		</div>
	  ) : (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
		  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
			  <div className="flex items-center gap-4 relative z-10">
				<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl ring-1 ring-blue-100 dark:ring-blue-800/50"><Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
				<div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('Active Visits')}</div><div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.activeVisits}</div></div>
			  </div>
			</div>
			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
			  <div className="flex items-center gap-4 relative z-10">
				<div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl ring-1 ring-amber-100 dark:ring-amber-800/50"><Pill className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
				<div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('Pending Rx')}</div><div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.pendingRx}</div></div>
			  </div>
			</div>
			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
			  <div className="flex items-center gap-4 relative z-10">
				<div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl ring-1 ring-red-100 dark:ring-red-800/50"><Syringe className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
				<div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('Surgeries')}</div><div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.activeOps}</div></div>
			  </div>
			</div>
			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
			  <div className="flex items-center gap-4 relative z-10">
				<div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-xl ring-1 ring-indigo-100 dark:ring-indigo-800/50"><Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
				<div><div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('Total Patients')}</div><div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.totalPatients}</div></div>
			  </div>
			</div>
		  </div>

		  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
			<div className="xl:col-span-1 space-y-8">
			  <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md overflow-hidden flex flex-col h-[400px]">
				<div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
				  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500"/> {t('Account Approvals')}</h2>
				  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">{pendingUsers.length} {t('Pending')}</span>
				</div>
				<div className="overflow-y-auto flex-1 p-2">
				  {pendingUsers.length === 0 ? (
					<div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2"><Check className="w-8 h-8 text-slate-300 dark:text-slate-700" /><span className="text-sm font-medium">{t('All caught up.')}</span></div>
				  ) : (
					pendingUsers.map(u => (
					  <div key={u.id} className="p-4 mb-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
						<div className="flex justify-between items-start">
						  <div><h3 className="font-bold text-slate-900 dark:text-white text-sm">{u.full_name || t('No Name Provided')}</h3><div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">{u.id}</div></div>
						  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md">{u.role}</span>
						</div>
						<div className="flex gap-2 w-full mt-1">
						  <button onClick={() => handleUserApproval(u.id, 'approved')} className="flex-1 flex justify-center items-center gap-1.5 bg-slate-900 dark:bg-emerald-500/10 text-white dark:text-emerald-400 hover:bg-slate-800 dark:hover:bg-emerald-500/20 py-2 rounded-lg text-xs font-bold transition"><Check className="w-3.5 h-3.5"/> {t('Approve')}</button>
						  <button onClick={() => handleUserApproval(u.id, 'rejected')} className="flex-1 flex justify-center items-center gap-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 py-2 rounded-lg text-xs font-bold transition"><X className="w-3.5 h-3.5"/> {t('Reject')}</button>
						</div>
					  </div>
					))
				  )}
				</div>
			  </div>

			  <div className="bg-slate-900 dark:bg-black rounded-2xl shadow-xl overflow-hidden border border-slate-800 p-1">
				<div className="p-4 pb-2"><h2 className="text-sm font-bold text-white tracking-wide">{t('Quick Portals')}</h2></div>
				<div className="grid grid-cols-2 gap-1 p-1">
				  <Link to="/reception" className="group bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl transition-colors relative overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div className="font-bold text-white text-sm">{t('Front Desk')}</div><div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{t('Triage & Check-In')}</div><ArrowRight className="w-4 h-4 text-slate-500 absolute bottom-4 right-4 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
				  </Link>
				  <Link to="/nurse" className="group bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl transition-colors relative overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div className="font-bold text-white text-sm">{t('Nursing')}</div><div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{t('Log Vitals')}</div><ArrowRight className="w-4 h-4 text-slate-500 absolute bottom-4 right-4 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
				  </Link>
				  <Link to="/doctor" className="group bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl transition-colors relative overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div className="font-bold text-white text-sm">{t('Doctor')}</div><div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{t('Consultations')}</div><ArrowRight className="w-4 h-4 text-slate-500 absolute bottom-4 right-4 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
				  </Link>
				  <Link to="/chemist" className="group bg-slate-800/50 hover:bg-slate-800 p-4 rounded-xl transition-colors relative overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
					<div className="font-bold text-white text-sm">{t('Pharmacy')}</div><div className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">{t('Dispensary')}</div><ArrowRight className="w-4 h-4 text-slate-500 absolute bottom-4 right-4 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
				  </Link>
				</div>
			  </div>
			</div>

			<div className="xl:col-span-2 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-md overflow-hidden flex flex-col h-[650px]">
			  <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
				<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield className="w-5 h-5 text-indigo-500"/> {t('Access & Security Registry')}</h2>
				<span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeUsers.length} {t('Active Profiles')}</span>
			  </div>
			  <div className="overflow-x-auto flex-1">
				<table className="w-full text-left text-sm border-collapse">
				  <thead className="bg-white/50 dark:bg-slate-900/50 sticky top-0 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-10">
					<tr>
					  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Personnel Identity')}</th>
					  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('System Role')}</th>
					  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">{t('Clearance Actions')}</th>
					</tr>
				  </thead>
				  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
					{activeUsers.length === 0 ? (
					  <tr><td colSpan="3" className="p-12 text-center text-slate-500">{t('Registry is empty.')}</td></tr>
					) : (
					  activeUsers.map(user => (
						<tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
						  <td className="px-6 py-4">
							{editMode === user.id ? (
							  <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full max-w-xs text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('Full Name')} />
							) : (
							  <div><div className="font-bold text-slate-900 dark:text-white">{user.full_name || t('Unnamed Record')}</div><div className="text-[10px] font-mono text-slate-400 mt-0.5">{user.id}</div></div>
							)}
						  </td>
						  <td className="px-6 py-4">
							{editMode === user.id ? (
							  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="w-40 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 p-2 rounded-lg outline-none">
								<option value="admin">{t('Admin')}</option><option value="doctor">{t('Doctor')}</option><option value="nurse">{t('Nurse')}</option><option value="receptionist">{t('Receptionist')}</option><option value="chemist">{t('Chemist')}</option><option value="patient">{t('Patient')}</option>
							  </select>
							) : (
							  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{user.role}</span>
							)}
						  </td>
						  <td className="px-6 py-4 text-right">
							{editMode === user.id ? (
							  <div className="flex justify-end gap-2">
								<button onClick={() => setEditMode(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title={t('Cancel')}><X className="w-4 h-4" /></button>
								<button onClick={() => saveEdit(user.id)} className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg" title={t('Save Modifications')}><Save className="w-4 h-4" /></button>
							  </div>
							) : (
							  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button onClick={() => startEdit(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title={t('Edit Profile')}><Edit className="w-4 h-4" /></button>
								<button onClick={() => deleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title={t('Revoke Access')}><Trash2 className="w-4 h-4" /></button>
							  </div>
							)}
						  </td>
						</tr>
					  ))
					)}
				  </tbody>
				</table>
			  </div>
			</div>
		  </div>
		</div>
	  )}
	</div>
  );
}