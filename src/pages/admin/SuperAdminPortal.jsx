import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Building2, Globe, CreditCard, Search, Edit, Activity, Lock, Mail, User, CheckCircle, XOctagon, Loader2, Plus 
} from 'lucide-react';

export default function SuperAdminPortal() {
  const { t } = useLanguage();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Provisioning State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [formData, setFormData] = useState({
	name: '', domain: '', subscription_type: 'core', admin_name: '', admin_email: '', admin_password: ''
  });

  const [editingWorkspace, setEditingWorkspace] = useState(null);

  const fetchWorkspaces = async () => {
	try {
	  setLoading(true);
	  const { data, error } = await supabase
		.from('workspaces')
		.select('*')
		.order('created_at', { ascending: false });
	  
	  if (error) throw error;
	  setWorkspaces(data || []);
	} catch (err) {
	  console.error("Fetch workspaces error:", err);
	  alert(`Database Error: ${err.message}`);
	} finally {
	  setLoading(false);
	}
  };

  useEffect(() => { fetchWorkspaces(); }, []);

  const filteredWorkspaces = workspaces.filter(w => 
	w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
	w.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProvisionTenant = async (e) => {
	e.preventDefault();
	setIsProvisioning(true);

	try {
	  // 1. Create Workspace
	  const { data: newWorkspace, error: wsError } = await supabase
		.from('workspaces')
		.insert([{ 
		  name: formData.name, 
		  domain: formData.domain.toLowerCase().replace(/[^a-z0-9-]/g, ''), 
		  subscription_type: formData.subscription_type,
		  status: 'active'
		}])
		.select().single();

	  if (wsError) throw new Error("Workspace Creation Failed: " + wsError.message);

	  // 2. Create the Admin Auth User
	  const { data: authData, error: authError } = await supabase.auth.signUp({
		email: formData.admin_email,
		password: formData.admin_password,
		options: {
		  data: {
			full_name: formData.admin_name,
			role: 'admin',
			status: 'active',
			workspace_id: newWorkspace.id
		  }
		}
	  });

	  if (authError) throw new Error(`Workspace created, but admin failed: ${authError.message}`);

	  // 3. Inform the Super Admin about the Session switch
	  alert(`✅ Success! Workspace '${newWorkspace.domain}' provisioned.\n\nSECURITY NOTICE: Creating a new user account has ended your current Super Admin session. You will be redirected to the login page.`);
	  
	  // Because signUp logged them out of Super Admin, we force a hard reload to clean the session
	  window.location.href = '/saas-login';

	} catch (error) {
	  alert(`⛔ Provisioning Error:\n${error.message}`);
	  setIsProvisioning(false);
	}
  };

  const handleUpdateWorkspace = async (e) => {
	e.preventDefault();
	try {
	  const { error } = await supabase
		.from('workspaces')
		.update({ status: editingWorkspace.status, subscription_type: editingWorkspace.subscription_type })
		.eq('id', editingWorkspace.id);
	  
	  if (error) throw error;
	  setEditingWorkspace(null);
	  fetchWorkspaces();
	  alert("✅ Workspace updated successfully.");
	} catch (error) {
	  alert(`⛔ Update Error: ${error.message}`);
	}
  };

  const activeCount = workspaces.filter(w => w.status === 'active').length;
  const mrr = workspaces.reduce((sum, w) => sum + (w.subscription_type === 'enterprise' ? 4500 : 1500), 0);

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans overflow-hidden min-h-screen">
	  
	  <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
	  <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('SaaS Control Plane')}</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('Network Workspaces')}</h1>
		</div>
		<button 
		  onClick={() => setShowProvisionModal(true)} 
		  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95"
		>
		  <Plus className="w-5 h-5"/> {t('Provision New Tenant')}
		</button>
	  </div>

	  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
		<div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
		  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-800"><Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400"/></div>
		  <div>
			<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t('Total Workspaces')}</div>
			<div className="text-3xl font-black text-slate-900 dark:text-white">{workspaces.length}</div>
		  </div>
		</div>
		<div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
		  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800"><Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400"/></div>
		  <div>
			<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t('Active Tenants')}</div>
			<div className="text-3xl font-black text-slate-900 dark:text-white">{activeCount}</div>
		  </div>
		</div>
		<div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-5">
		  <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800"><CreditCard className="w-6 h-6 text-amber-600 dark:text-amber-400"/></div>
		  <div>
			<div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{t('Estimated MRR')}</div>
			<div className="text-3xl font-black text-slate-900 dark:text-white font-mono">SAR {mrr.toLocaleString()}</div>
		  </div>
		</div>
	  </div>

	  <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 overflow-hidden min-h-[500px]">
		<div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
		  <div className="relative w-full max-w-sm">
			<Search className="w-4 h-4 absolute left-4 top-3 text-slate-400"/>
			<input 
			  type="text" 
			  placeholder={t('Search domain or facility...')}
			  value={searchTerm}
			  onChange={(e) => setSearchTerm(e.target.value)}
			  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white"
			/>
		  </div>
		</div>

		<div className="overflow-x-auto">
		  <table className="w-full text-left">
			<thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
			  <tr>
				<th className="px-6 py-4">{t('Facility Info')}</th>
				<th className="px-6 py-4">{t('Domain Routing')}</th>
				<th className="px-6 py-4">{t('Subscription')}</th>
				<th className="px-6 py-4">{t('Status')}</th>
				<th className="px-6 py-4 text-right">{t('Actions')}</th>
			  </tr>
			</thead>
			<tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
			  {loading ? (
				<tr><td colSpan="5" className="text-center py-10 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
			  ) : filteredWorkspaces.length === 0 ? (
				 <tr><td colSpan="5" className="text-center py-10 text-slate-500 font-bold">No workspaces found.</td></tr>
			  ) : filteredWorkspaces.map(ws => (
				<tr key={ws.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
				  <td className="px-6 py-4">
					<div className="font-bold text-slate-900 dark:text-white text-sm">{ws.name}</div>
					<div className="text-[10px] font-mono text-slate-400 mt-1">ID: {ws.id.substring(0,8)}...</div>
				  </td>
				  <td className="px-6 py-4">
					<span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-blue-100 dark:border-blue-800/50 flex items-center gap-2 w-max">
					  <Globe className="w-3 h-3"/> {ws.domain}
					</span>
				  </td>
				  <td className="px-6 py-4">
					<span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${ws.subscription_type === 'enterprise' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
					  {ws.subscription_type}
					</span>
				  </td>
				  <td className="px-6 py-4">
					<span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5 w-max border ${ws.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
					  {ws.status === 'active' ? <CheckCircle className="w-3 h-3"/> : <XOctagon className="w-3 h-3"/>} {ws.status}
					</span>
				  </td>
				  <td className="px-6 py-4 text-right">
					<button onClick={() => setEditingWorkspace(ws)} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-blue-500 hover:border-blue-300 transition-colors shadow-sm">
					  <Edit className="w-4 h-4"/>
					</button>
				  </td>
				</tr>
			  ))}
			</tbody>
		  </table>
		</div>
	  </div>

	  {showProvisionModal && (
		<div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
		  <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
			<div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
			  <div>
				<h2 className="text-xl font-black text-slate-900 dark:text-white">{t('Provision New Tenant')}</h2>
				<p className="text-xs font-bold text-slate-500 mt-1">{t('Create a workspace and initial admin account.')}</p>
			  </div>
			  <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
			</div>
			
			<form onSubmit={handleProvisionTenant} className="p-8 space-y-6">
			  <div className="grid grid-cols-2 gap-6">
				<div>
				  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t('Facility Name')}</label>
				  <div className="relative group">
					<Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"/>
					<input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white" placeholder="City Hospital"/>
				  </div>
				</div>
				<div>
				  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t('Subdomain Routing')}</label>
				  <div className="relative group">
					<Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"/>
					<input required type="text" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value.toLowerCase()})} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white" placeholder="city-hospital"/>
				  </div>
				</div>
			  </div>

			  <div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t('Subscription Tier')}</label>
				<select value={formData.subscription_type} onChange={e => setFormData({...formData, subscription_type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-blue-500 dark:text-white">
				  <option value="core">OPERIX Core (SAR 1,500/mo)</option>
				  <option value="enterprise">OPERIX Enterprise (SAR 4,500/mo)</option>
				</select>
			  </div>

			  <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
				<h3 className="text-sm font-black text-slate-900 dark:text-white mb-4">{t('Initial Admin Account')}</h3>
				<div className="space-y-4">
				  <div>
					<div className="relative group">
					  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"/>
					  <input required type="text" value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white" placeholder="Admin Name"/>
					</div>
				  </div>
				  <div className="grid grid-cols-2 gap-4">
					<div className="relative group">
					  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"/>
					  <input required type="email" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white" placeholder="admin@domain.com"/>
					</div>
					<div className="relative group">
					  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400"/>
					  <input required type="password" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500 dark:text-white" placeholder="Secure Password"/>
					</div>
				  </div>
				</div>
			  </div>

			  <button type="submit" disabled={isProvisioning} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all mt-4 flex justify-center items-center">
				{isProvisioning ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : t('Deploy Workspace & Account')}
			  </button>
			</form>
		  </div>
		</div>
	  )}

	  {editingWorkspace && (
		<div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
		  <div className="bg-white dark:bg-[#0a0a0a] w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8">
			<h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">Manage {editingWorkspace.domain}</h2>
			<form onSubmit={handleUpdateWorkspace} className="space-y-4">
			  <div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
				<select value={editingWorkspace.status} onChange={e => setEditingWorkspace({...editingWorkspace, status: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500">
				  <option value="active">Active</option>
				  <option value="suspended">Suspended (Blocks Login)</option>
				</select>
			  </div>
			  <div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subscription</label>
				<select value={editingWorkspace.subscription_type} onChange={e => setEditingWorkspace({...editingWorkspace, subscription_type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500">
				  <option value="core">Core</option>
				  <option value="enterprise">Enterprise</option>
				</select>
			  </div>
			  <div className="flex gap-3 pt-4">
				<button type="button" onClick={() => setEditingWorkspace(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Cancel</button>
				<button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl">Save</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}

	</div>
  );
}