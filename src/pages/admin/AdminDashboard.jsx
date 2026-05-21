// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Link } from 'react-router-dom';
import { Users, Activity, Syringe, Pill, ShieldAlert, Check, X, Edit, Trash2, Save, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ activeVisits: 0, pendingRx: 0, activeOps: 0, totalPatients: 0 });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', role: '' });

  const fetchAnalytics = async () => {
	setLoading(true);
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
	}
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // --- APPROVAL FUNCTIONS ---
  const handleUserApproval = async (userId, newStatus) => {
	await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
	fetchAnalytics();
  };

  // --- MANAGEMENT FUNCTIONS ---
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
	fetchAnalytics();
  };

  const deleteUser = async (userId) => {
	if (!window.confirm("Are you sure you want to permanently delete this user's profile and revoke access?")) return;
	
	await supabase.from('profiles').delete().eq('id', userId);
	fetchAnalytics();
  };

  return (
	<div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
	  <div className="flex justify-between items-end border-b-2 border-slate-800 dark:border-slate-700 pb-4">
		<div>
		  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">OPERIX Command Center</h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Live Hospital Analytics & Access Control.</p>
		</div>
		<button onClick={fetchAnalytics} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-lg text-sm transition hover:bg-slate-300 dark:hover:bg-slate-700">Refresh Data</button>
	  </div>

	  {loading ? <div className="flex justify-center p-20"><Activity className="w-8 h-8 text-blue-600 animate-spin" /></div> : (
		<>
		  {/* Live Analytics Banner */}
		  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 border-l-4 border-l-blue-500">
			  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"><Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" /></div>
			  <div><div className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeVisits}</div><div className="text-xs font-bold text-slate-500 uppercase">Active Visits</div></div>
			</div>
			<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 border-l-4 border-l-amber-500">
			  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg"><Pill className="w-6 h-6 text-amber-600 dark:text-amber-400" /></div>
			  <div><div className="text-2xl font-black text-slate-800 dark:text-white">{stats.pendingRx}</div><div className="text-xs font-bold text-slate-500 uppercase">Pending Rx</div></div>
			</div>
			<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500">
			  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"><Syringe className="w-6 h-6 text-red-600 dark:text-red-400" /></div>
			  <div><div className="text-2xl font-black text-slate-800 dark:text-white">{stats.activeOps}</div><div className="text-xs font-bold text-slate-500 uppercase">Surgeries Queued</div></div>
			</div>
			<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 border-l-4 border-l-indigo-500">
			  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg"><Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /></div>
			  <div><div className="text-2xl font-black text-slate-800 dark:text-white">{stats.totalPatients}</div><div className="text-xs font-bold text-slate-500 uppercase">Total Patients</div></div>
			</div>
		  </div>

		  {/* INBOX: Pending Approvals */}
		  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
			<div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
			  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-amber-500"/> Account Approvals</h2>
			  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{pendingUsers.length} Pending</span>
			</div>
			
			<div className="divide-y divide-slate-100 dark:divide-slate-800">
			  {pendingUsers.length === 0 ? (
				<div className="p-8 text-center text-slate-500">No new account requests.</div>
			  ) : (
				pendingUsers.map(u => (
				  <div key={u.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
					<div>
					  <h3 className="font-bold text-slate-800 dark:text-white">{u.full_name || 'No Name Provided'}</h3>
					  <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {u.id}</div>
					</div>
					<div className="flex items-center gap-4">
					  <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded">Req. Role: {u.role}</span>
					  <div className="flex gap-2">
						<button onClick={() => handleUserApproval(u.id, 'approved')} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition border border-emerald-200 hover:border-emerald-600">
						  <Check className="w-4 h-4"/> Approve
						</button>
						<button onClick={() => handleUserApproval(u.id, 'rejected')} className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold transition border border-red-200 hover:border-red-600">
						  <X className="w-4 h-4"/> Reject
						</button>
					  </div>
					</div>
				  </div>
				))
			  )}
			</div>
		  </div>

		  {/* ACTIVE PERSONNEL MANAGEMENT (CRUD) */}
		  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
			<div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
			  <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Shield className="w-5 h-5 text-blue-500"/> Active Personnel Management</h2>
			</div>
			
			<div className="overflow-x-auto">
			  <table className="w-full text-left text-sm">
				<thead className="bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-xs font-bold">
				  <tr>
					<th className="px-6 py-3">Staff Name</th>
					<th className="px-6 py-3">Assigned Role</th>
					<th className="px-6 py-3 text-right">Actions</th>
				  </tr>
				</thead>
				<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
				  {activeUsers.length === 0 ? (
					<tr><td colSpan="3" className="p-8 text-center text-slate-500">No active staff found.</td></tr>
				  ) : (
					activeUsers.map(user => (
					  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-slate-800 dark:text-slate-200">
						
						{/* NAME COLUMN */}
						<td className="px-6 py-4">
						  {editMode === user.id ? (
							<input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="border dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded w-full max-w-xs" />
						  ) : (
							<div className="font-bold">{user.full_name || 'Unnamed'}</div>
						  )}
						</td>

						{/* ROLE COLUMN */}
						<td className="px-6 py-4">
						  {editMode === user.id ? (
							<select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="border dark:border-slate-700 bg-white dark:bg-slate-950 p-2 rounded">
							  <option value="admin">Admin</option>
							  <option value="doctor">Doctor</option>
							  <option value="nurse">Nurse</option>
							  <option value="receptionist">Receptionist</option>
							  <option value="chemist">Chemist</option>
							  <option value="patient">Patient</option>
							</select>
						  ) : (
							<span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold uppercase">
							  {user.role}
							</span>
						  )}
						</td>

						{/* ACTIONS COLUMN */}
						<td className="px-6 py-4 text-right">
						  {editMode === user.id ? (
							<div className="flex justify-end gap-2">
							  <button onClick={() => saveEdit(user.id)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white p-2 rounded transition" title="Save Changes">
								<Save className="w-4 h-4" />
							  </button>
							  <button onClick={() => setEditMode(null)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 p-2 rounded transition" title="Cancel">
								<X className="w-4 h-4" />
							  </button>
							</div>
						  ) : (
							<div className="flex justify-end gap-2">
							  <button onClick={() => startEdit(user)} className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded transition" title="Edit Staff Member">
								<Edit className="w-4 h-4" />
							  </button>
							  <button onClick={() => deleteUser(user.id)} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white p-2 rounded transition" title="Delete Profile">
								<Trash2 className="w-4 h-4" />
							  </button>
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

		  {/* Quick Portal Navigation */}
		  <div className="bg-slate-900 p-6 rounded-xl shadow-md text-white">
			<h2 className="text-lg font-bold mb-4">Jump to Department</h2>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			  <Link to="/reception" className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition text-center border border-slate-700 hover:border-blue-500">
				<div className="font-bold text-blue-400">Front Desk</div><div className="text-xs text-slate-400 mt-1">Triage & Check-In</div>
			  </Link>
			  <Link to="/nurse" className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition text-center border border-slate-700 hover:border-pink-500">
				<div className="font-bold text-pink-400">Nursing Station</div><div className="text-xs text-slate-400 mt-1">Log Vitals</div>
			  </Link>
			  <Link to="/doctor" className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition text-center border border-slate-700 hover:border-emerald-500">
				<div className="font-bold text-emerald-400">Doctor Workspace</div><div className="text-xs text-slate-400 mt-1">Consult & Prescribe</div>
			  </Link>
			  <Link to="/chemist" className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg transition text-center border border-slate-700 hover:border-amber-500">
				<div className="font-bold text-amber-400">Pharmacy</div><div className="text-xs text-slate-400 mt-1">Dispense Meds</div>
				
			  </Link>
			</div>
		  </div>
		</>
	  )}
	</div>
  );
}