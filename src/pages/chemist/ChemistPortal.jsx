import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Pill, RefreshCcw, PackageCheck, User, 
  Clock, CheckCircle, Package, AlertCircle 
} from 'lucide-react';

export default function ChemistDashboard() {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);

  const fetchPrescriptions = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  const { data } = await supabase
		.from('prescriptions')
		.select(`
		  id, medication_name, dosage, instructions, status, created_at,
		  patient:patient_id(full_name)
		`)
		.in('status', ['pending', 'dispensed'])
		.order('created_at', { ascending: false });

	  setPrescriptions(data || []);
	} catch (error) {
	  console.error("Error fetching prescriptions:", error);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchPrescriptions(); }, []);

  const updateStatus = async (id, newStatus) => {
	setLoading(true);
	await supabase.from('prescriptions').update({ status: newStatus }).eq('id', id);
	fetchPrescriptions();
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* AMBIENT BACKGROUND GLOW */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pharmacy Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Chemist Dispensary
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Real-time prescription processing and medication fulfillment.</p>
		</div>
		<button 
		  onClick={() => fetchPrescriptions(true)} 
		  disabled={loading || isRefreshing}
		  className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50"
		>
		  <RefreshCcw className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
		  Sync Queue
		</button>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <Pill className="w-10 h-10 text-amber-500/50 animate-bounce" />
		  <p className="text-sm font-medium text-slate-500 animate-pulse">Retrieving medication orders...</p>
		</div>
	  ) : (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  {prescriptions.length === 0 ? (
			<div className="col-span-full text-center p-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
			  <PackageCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
			  <p className="text-lg font-bold text-slate-500">Inventory clear.</p>
			  <p className="text-sm text-slate-400">No pending prescriptions at this time.</p>
			</div>
		  ) : (
			prescriptions.map((p) => (
			  <div key={p.id} className={`relative p-6 rounded-3xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-lg ${p.status === 'pending' ? 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/50' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
				
				{/* Visual Indicator */}
				<div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 ${p.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

				<div>
				  <div className="flex justify-between items-start mb-4">
					<span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md shadow-sm ${p.status === 'pending' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
					  {p.status}
					</span>
					<span className="text-[10px] font-mono text-slate-400">
					  {new Date(p.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
					</span>
				  </div>

				  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
					<Pill className="w-5 h-5 text-amber-500"/> {p.medication_name}
				  </h3>
				  <div className="text-lg font-bold text-amber-700 dark:text-amber-400 mt-1">{p.dosage}</div>
				  
				  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
					<p className="text-xs font-medium text-slate-600 dark:text-slate-400">{p.instructions}</p>
				  </div>

				  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-200">
					<div className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"><User className="w-3 h-3 text-slate-500"/></div>
					{p.patient?.full_name}
				  </div>
				</div>

				<div className="mt-8">
				  {p.status === 'pending' ? (
					<button 
					  onClick={() => updateStatus(p.id, 'dispensed')}
					  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20"
					>
					  Verify & Dispense
					</button>
				  ) : (
					<div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest">
					  <CheckCircle className="w-4 h-4"/> Dispensed Successfully
					</div>
				  )}
				</div>
			  </div>
			))
		  )}
		</div>
	  )}
	</div>
  );
}