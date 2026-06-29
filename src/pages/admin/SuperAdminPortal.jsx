import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Building2, Globe, CreditCard, Search, Edit, Activity, Lock, Mail, User, 
  CheckCircle, XOctagon, Loader2, Plus, Calendar, ToggleLeft, ToggleRight, ShieldAlert
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
	name: '', 
	domain: '', 
	subscription_type: 'core', 
	subscription_end_date: '',
	has_hr_board: false,
	has_finance_board: false,
	admin_name: '', 
	admin_email: '', 
	admin_password: ''
  });

  const [editingWorkspace, setEditingWorkspace] = useState(null);

  useEffect(() => {
	fetchWorkspaces();
  }, []);

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

  const handleProvisionWorkspace = async (e) => {
	  e.preventDefault();
	  setIsProvisioning(true);
	  try {
		// 1. Create the secure Workspace container
		const { data: workspace, error: wsError } = await supabase
		  .from('workspaces')
		  .insert([{
			name: formData.name,
			domain: formData.domain.toLowerCase().trim(),
			subscription_type: formData.subscription_type,
			subscription_end_date: formData.subscription_end_date || null,
			has_hr_board: formData.subscription_type === 'enterprise' ? formData.has_hr_board : false,
			has_finance_board: formData.subscription_type === 'enterprise' ? formData.has_finance_board : false,
			status: 'active'
		  }])
		  .select()
		  .single();
  
		if (wsError) throw wsError;
  
		// 2. Sign up the primary Workspace Administrator
		const { data: authData, error: authError } = await supabase.auth.signUp({
		  email: formData.admin_email,
		  password: formData.admin_password,
		  options: {
			data: {
			  full_name: formData.admin_name,
			  role: 'admin',
			  workspace_id: workspace.id
			}
		  }
		});
  
		if (authError) throw authError;
  
		// 3. NEW: Auto-fill the profiles table so they show up in your system immediately!
		const { error: profileError } = await supabase
		  .from('profiles')
		  .insert([{
			id: authData.user.id, // Links exactly to their secure Auth ID
			full_name: formData.admin_name,
			email: formData.admin_email,
			role: 'admin',
			workspace_id: workspace.id
		  }]);
  
		if (profileError) throw profileError;
  
		alert(`Success! Workspace "${workspace.name}" provisioned and Root Admin profile created.`);
		setShowProvisionModal(false);
		
		// Reset State
		setFormData({
		  name: '', domain: '', subscription_type: 'core', subscription_end_date: '',
		  has_hr_board: false, has_finance_board: false, admin_name: '', admin_email: '', admin_password: ''
		});
		fetchWorkspaces();
	  } catch (err) {
		console.error("Provisioning failure:", err);
		alert(`Provisioning Failed: ${err.message}`);
	  } finally {
		setIsProvisioning(false);
	  }
	};

  const handleUpdateWorkspace = async (e) => {
	e.preventDefault();
	try {
	  const isPro = editingWorkspace.subscription_type === 'enterprise';
	  
	  const { error } = await supabase
		.from('workspaces')
		.update({
		  name: editingWorkspace.name,
		  status: editingWorkspace.status,
		  subscription_type: editingWorkspace.subscription_type,
		  subscription_end_date: editingWorkspace.subscription_end_date || null,
		  // If downgrading to core, auto-revoke access to premium modules
		  has_hr_board: isPro ? editingWorkspace.has_hr_board : false,
		  has_finance_board: isPro ? editingWorkspace.has_finance_board : false
		})
		.eq('id', editingWorkspace.id);

	  if (error) throw error;
	  
	  alert("Workspace policies and runtime configurations updated successfully.");
	  setEditingWorkspace(null);
	  fetchWorkspaces();
	} catch (err) {
	  console.error("Update failure:", err);
	  alert(`Update Failed: ${err.message}`);
	}
  };

  const filteredWorkspaces = workspaces.filter(ws => 
	ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
	ws.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
	<div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
	  
	  {/* Header Summary */}
	  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
		<div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			<Building2 className="w-8 h-8 text-blue-600" />
			OPERIX Core Ecosystem Management
		  </h1>
		  <p className="text-sm font-medium text-slate-500 mt-1">
			Global governance portal for tenant tracking, auth delegation, and module feature flag assignment.
		  </p>
		</div>
		<button 
		  onClick={() => setShowProvisionModal(true)}
		  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20"
		>
		  <Plus className="w-4 h-4" /> Provision New Tenant
		</button>
	  </div>

	  {/* Control Actions bar */}
	  <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl items-center gap-3">
		<Search className="w-5 h-5 text-slate-400 shrink-0" />
		<input 
		  type="text" 
		  placeholder="Query workspaces by client name or root domain routing rules..."
		  value={searchTerm}
		  onChange={e => setSearchTerm(e.target.value)}
		  className="w-full bg-transparent border-none text-sm font-bold outline-none text-slate-800 dark:text-white placeholder-slate-400"
		/>
	  </div>

	  {/* Primary Infrastructure Grid */}
	  {loading ? (
		<div className="flex flex-col items-center justify-center py-24 space-y-3">
		  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
		  <p className="text-sm font-bold text-slate-500">Querying global multi-tenant schema...</p>
		</div>
	  ) : (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
		  {filteredWorkspaces.map(ws => {
			const isExpired = ws.subscription_end_date && new Date(ws.subscription_end_date) < new Date();
			return (
			  <div key={ws.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
				<div className="flex justify-between items-start">
				  <div>
					<h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
					  {ws.name}
					  <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${
						ws.subscription_type === 'enterprise' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
					  }`}>
						{ws.subscription_type}
					  </span>
					</h3>
					<p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-1">
					  <Globe className="w-3 h-3" /> System Domain: {ws.domain}.operix-solutions.com
					</p>
				  </div>
				  
				  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
					ws.status === 'active' && !isExpired ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
				  }`}>
					{ws.status === 'active' && !isExpired ? (
					  <><CheckCircle className="w-3.5 h-3.5" /> Functional</>
					) : (
					  <><XOctagon className="w-3.5 h-3.5" /> Suspended / Expired</>
					)}
				  </span>
				</div>

				<div className="grid grid-cols-2 gap-4 border-t border-b border-slate-100 dark:border-slate-800/60 py-3 text-xs font-bold">
				  <div className="space-y-1">
					<span className="text-slate-400 block uppercase tracking-wide text-[10px]">Access End Date</span>
					<span className={`flex items-center gap-1 dark:text-white ${isExpired ? 'text-rose-600 font-black' : ''}`}>
					  <Calendar className="w-3.5 h-3.5 text-slate-400" />
					  {ws.subscription_end_date ? new Date(ws.subscription_end_date).toLocaleDateString() : 'Infinite/Perpetual'}
					</span>
				  </div>
				  <div className="space-y-1">
					<span className="text-slate-400 block uppercase tracking-wide text-[10px]">Active Entitlements</span>
					<div className="flex gap-2 flex-wrap mt-0.5">
					  <span className={`px-1.5 py-0.5 rounded text-[10px] ${ws.has_hr_board ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 line-through'}`}>Live HR</span>
					  <span className={`px-1.5 py-0.5 rounded text-[10px] ${ws.has_finance_board ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 line-through'}`}>Financial Board</span>
					</div>
				  </div>
				</div>

				<div className="flex justify-between items-center pt-1">
				  <span className="text-[11px] font-medium text-slate-400">ID: {ws.id}</span>
				  <button 
					onClick={() => setEditingWorkspace(ws)}
					className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
				  >
					<Edit className="w-3.5 h-3.5" /> Adjust Parameters
				  </button>
				</div>
			  </div>
			);
		  })}
		</div>
	  )}

	  {/* PROVISIONING MODAL */}
	  {showProvisionModal && (
		<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
		  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
			<div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
			  <div>
				<h2 className="text-xl font-black text-slate-900 dark:text-white">Provision Enterprise Instance</h2>
				<p className="text-xs font-medium text-slate-400 mt-0.5">Automates DB allocation, parameters verification, and identity seeding.</p>
			  </div>
			  <button onClick={() => setShowProvisionModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">✕</button>
			</div>

			<form onSubmit={handleProvisionWorkspace} className="p-6 space-y-6">
			  
			  {/* SECTION: TENANT CONFIG */}
			  <div className="space-y-4">
				<h4 className="text-xs font-black uppercase tracking-widest text-blue-600">1. Cluster & Routing Strategy</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				  <div>
					<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Hospital/Facility Name</label>
					<input required type="text" placeholder="e.g. King Faisal Clinical Center" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
				  </div>
				  <div>
					<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Dedicated Subdomain Mapping</label>
					<div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 focus-within:border-blue-500">
					  <input required type="text" placeholder="kingfaisal" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})} className="w-full py-3 bg-transparent border-none text-sm font-bold dark:text-white outline-none" />
					  <span className="text-xs font-bold text-slate-400">.operix.com</span>
					</div>
				  </div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				  <div>
					<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subscription Tier Matrix</label>
					<select value={formData.subscription_type} onChange={e => setFormData({...formData, subscription_type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500">
					  <option value="core">Core Tier (Base Modules)</option>
					  <option value="enterprise">Enterprise Pro Edition (All Modules)</option>
					</select>
				  </div>
				  <div>
					<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subscription Expiration Date</label>
					<input type="date" value={formData.subscription_end_date} onChange={e => setFormData({...formData, subscription_end_date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
				  </div>
				</div>

				{/* Granular Feature Modules Flag */}
				{formData.subscription_type === 'enterprise' ? (
				  <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40 p-4 rounded-xl space-y-3">
					<span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 block">Enterprise Module Entitlements</span>
					<div className="flex gap-6">
					  <label className="flex items-center gap-2 text-xs font-bold dark:text-white cursor-pointer">
						<input type="checkbox" checked={formData.has_hr_board} onChange={e => setFormData({...formData, has_hr_board: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500" />
						Enable Live HR System
					  </label>
					  <label className="flex items-center gap-2 text-xs font-bold dark:text-white cursor-pointer">
						<input type="checkbox" checked={formData.has_finance_board} onChange={e => setFormData({...formData, has_finance_board: e.target.checked})} className="rounded text-purple-600 focus:ring-purple-500" />
						Enable Financial Board
					  </label>
					</div>
				  </div>
				) : (
				  <div className="bg-slate-100 dark:bg-slate-800/40 p-3 rounded-xl flex items-center gap-2 text-xs font-medium text-slate-400">
					<ShieldAlert className="w-4 h-4 shrink-0 text-slate-400" />
					<span>Core Edition restricts <b>Live HR</b> & <b>Financial Management Boards</b> automatically. Upgrade tier to assign modules.</span>
				  </div>
				)}
			  </div>

			  {/* SECTION: ADMIN IDENTITY */}
			  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-5">
				<h4 className="text-xs font-black uppercase tracking-widest text-emerald-600">2. Root Administrator Credentials (Auto-fills Profile)</h4>
				<div>
				  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Root Admin Full Name</label>
				  <input required type="text" placeholder="Dr. Abdullah Mansour" value={formData.admin_name} onChange={e => setFormData({...formData, admin_name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				  <div>
					<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Corporate Admin Email</label>
					<input required type="email" placeholder="admin@domain.com" value={formData.admin_email} onChange={e => setFormData({...formData, admin_email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
				  </div>
				  <div>
					<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Initial Master Password</label>
					<input required type="password" placeholder="••••••••••••" value={formData.admin_password} onChange={e => setFormData({...formData, admin_password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
				  </div>
				</div>
			  </div>

			  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
				<button type="button" onClick={() => setShowProvisionModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-sm rounded-xl transition-all">Cancel</button>
				<button type="submit" disabled={isProvisioning} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-2">
				  {isProvisioning ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning Cluster...</> : 'Confirm Deployment'}
				</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}

	  {/* PARAMETERS ADJUSTMENT MODAL */}
	  {editingWorkspace && (
		<div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
		  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl">
			<div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
			  <div>
				<h2 className="text-xl font-black text-slate-900 dark:text-white">Adjust Tenant Parameters</h2>
				<p className="text-xs font-medium text-slate-400 mt-0.5">Modify workspace capabilities, runtime policies, or billing states.</p>
			  </div>
			  <button onClick={() => setEditingWorkspace(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">✕</button>
			</div>

			<form onSubmit={handleUpdateWorkspace} className="p-6 space-y-4">
			  <div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Workspace Identifier</label>
				<input type="text" value={editingWorkspace.name} onChange={e => setEditingWorkspace({...editingWorkspace, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
			  </div>
			  
			  <div className="grid grid-cols-2 gap-4">
				<div>
				  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Operational State</label>
				  <select value={editingWorkspace.status} onChange={e => setEditingWorkspace({...editingWorkspace, status: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500">
					<option value="active">Active (Permit All Logins)</option>
					<option value="suspended">Suspended (Bypass/Block Logins)</option>
				  </select>
				</div>
				<div>
				  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subscription Tier Matrix</label>
				  <select value={editingWorkspace.subscription_type} onChange={e => setEditingWorkspace({...editingWorkspace, subscription_type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500">
					<option value="core">Core Tier</option>
					<option value="enterprise">Enterprise Pro Edition</option>
					</select>
				</div>
			  </div>

			  <div>
				<label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Subscription Ending Date</label>
				<input type="date" value={editingWorkspace.subscription_end_date || ''} onChange={e => setEditingWorkspace({...editingWorkspace, subscription_end_date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold dark:text-white outline-none focus:border-blue-500" />
			  </div>

			  {/* Dynamic Feature Module Switches based on Tier */}
			  {editingWorkspace.subscription_type === 'enterprise' ? (
				<div className="bg-purple-50/60 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/40 p-4 rounded-xl space-y-4">
				  <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 block">Adjust Runtime Component Flags</span>
				  
				  <div className="flex justify-between items-center">
					<span className="text-xs font-bold dark:text-white">Live HR Management System</span>
					<button type="button" onClick={() => setEditingWorkspace({...editingWorkspace, has_hr_board: !editingWorkspace.has_hr_board})} className="text-purple-600 focus:outline-none">
					  {editingWorkspace.has_hr_board ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
					</button>
				  </div>

				  <div className="flex justify-between items-center">
					<span className="text-xs font-bold dark:text-white">Financial & Treasury Board</span>
					<button type="button" onClick={() => setEditingWorkspace({...editingWorkspace, has_finance_board: !editingWorkspace.has_finance_board})} className="text-purple-600 focus:outline-none">
					  {editingWorkspace.has_finance_board ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9 text-slate-400" />}
					</button>
				  </div>
				</div>
			  ) : (
				<div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-400 flex items-center gap-2">
				  <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
				  <span>Modules automatically revoked. Client must subscribe to <b>Enterprise Pro Edition</b> to enable HR or Finance.</span>
				</div>
			  )}

			  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
				<button type="button" onClick={() => setEditingWorkspace(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-sm rounded-xl">Discard</button>
				<button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/10">Commit Settings</button>
			  </div>
			</form>
		  </div>
		</div>
	  )}
	</div>
  );
}