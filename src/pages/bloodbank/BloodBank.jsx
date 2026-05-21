import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Droplet, AlertCircle, Plus, Minus, RefreshCcw, Activity, ShieldCheck } from 'lucide-react';

export default function BloodBank() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInventory = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	const { data, error } = await supabase
	  .from('blood_inventory')
	  .select('*')
	  .order('blood_type');
	
	if (!error && data) setInventory(data);
	
	setLoading(false);
	setIsRefreshing(false);
  };

  useEffect(() => {
	fetchInventory();
  }, []);

  const updateUnits = async (type, currentUnits, change) => {
	const newUnits = Math.max(0, currentUnits + change); 
	
	// Optimistic UI update for instant snappiness
	setInventory(inventory.map(item => 
	  item.blood_type === type ? { ...item, units: newUnits } : item
	));

	// Background Database Sync
	await supabase
	  .from('blood_inventory')
	  .update({ units: newUnits, last_updated: new Date().toISOString() })
	  .eq('blood_type', type);
  };

  const getStatusProfile = (units) => {
	if (units === 0) return { color: 'red', text: 'Depleted', bg: 'bg-red-500', border: 'border-red-500/50', glow: 'from-red-500/20' };
	if (units < 5) return { color: 'rose', text: 'Critical', bg: 'bg-rose-500', border: 'border-rose-500/50', glow: 'from-rose-500/20' };
	if (units < 15) return { color: 'amber', text: 'Low Stock', bg: 'bg-amber-500', border: 'border-amber-500/50', glow: 'from-amber-500/20' };
	return { color: 'emerald', text: 'Healthy', bg: 'bg-emerald-500', border: 'border-emerald-500/50', glow: 'from-emerald-500/20' };
  };

  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const criticalShortages = inventory.filter(item => item.units < 5).length;

  return (
	<div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* HEADER SECTION */}
	  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Inventory</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Blood Bank Operations
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Enterprise hemotherapy dispensing and tracking.</p>
		</div>
		<button 
		  onClick={() => fetchInventory(true)} 
		  disabled={loading || isRefreshing}
		  className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-all hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-50"
		>
		  <RefreshCcw className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ${isRefreshing ? 'animate-spin text-red-500' : ''}`} />
		  Sync Ledger
		</button>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <Droplet className="w-10 h-10 text-red-500/50 animate-bounce" />
		  <p className="text-sm font-medium text-slate-500 animate-pulse">Accessing cold storage records...</p>
		</div>
	  ) : (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
		  
		  {/* TOP METRICS BENTO */}
		  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
			
			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
			  <div className="flex items-center gap-5 relative z-10">
				<div className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/40 dark:to-rose-900/20 p-4 rounded-2xl ring-1 ring-red-200 dark:ring-red-800/50 shadow-inner">
				  <Droplet className="w-7 h-7 text-red-600 dark:text-red-400 fill-red-500/20" />
				</div>
				<div>
				  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Vault Capacity</div>
				  <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{totalUnits} <span className="text-lg font-bold text-slate-400 tracking-normal">Units</span></div>
				</div>
			  </div>
			</div>

			<div className={`relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-3xl border shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300 ${criticalShortages > 0 ? 'border-amber-200 dark:border-amber-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
			  <div className={`absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br to-transparent rounded-full blur-2xl transition-all ${criticalShortages > 0 ? 'from-amber-500/10 group-hover:from-amber-500/20' : 'from-emerald-500/5 group-hover:from-emerald-500/10'}`}></div>
			  <div className="flex items-center gap-5 relative z-10">
				<div className={`p-4 rounded-2xl ring-1 shadow-inner ${criticalShortages > 0 ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20 ring-amber-200 dark:ring-amber-800/50' : 'bg-slate-50 dark:bg-slate-800/50 ring-slate-200 dark:ring-slate-700'}`}>
				  <AlertCircle className={`w-7 h-7 ${criticalShortages > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
				</div>
				<div>
				  <div className={`text-[11px] font-black uppercase tracking-widest mb-1 ${criticalShortages > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-400'}`}>Critical Shortages</div>
				  <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{criticalShortages} <span className="text-lg font-bold text-slate-400 tracking-normal">Groups</span></div>
				</div>
			  </div>
			</div>

			<div className="relative overflow-hidden bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl group hover:shadow-lg transition-all duration-300">
			  <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
			  <div className="flex items-center gap-5 relative z-10">
				<div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/40 dark:to-teal-900/20 p-4 rounded-2xl ring-1 ring-emerald-200 dark:ring-emerald-800/50 shadow-inner">
				  <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
				</div>
				<div>
				  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">System Health</div>
				  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
					{criticalShortages > 2 ? 'Action Required' : criticalShortages > 0 ? 'Monitor Levels' : 'Optimal'}
				  </div>
				</div>
			  </div>
			</div>

		  </div>

		  {/* INVENTORY GRID */}
		  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
			{inventory.map((group) => {
			  const status = getStatusProfile(group.units);
			  // Calculate a visual fill percentage (capping at 30 units for the visual bar)
			  const fillPercentage = Math.min((group.units / 30) * 100, 100);

			  return (
				<div key={group.blood_type} className={`relative bg-white dark:bg-slate-900/80 rounded-3xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl group flex flex-col ${group.units < 5 ? `border-${status.color}-300 dark:${status.border}` : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}>
				  
				  {/* Ambient Glow */}
				  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${status.glow} to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-80 transition-opacity pointer-events-none`}></div>

				  <div className="p-6 pb-4 flex-1 flex flex-col relative z-10">
					<div className="flex justify-between items-start mb-6">
					  <div>
						<h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">{group.blood_type}</h2>
						<div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500">
						  <Activity className="w-3 h-3" /> {status.text}
						</div>
					  </div>
					  <Droplet className={`w-8 h-8 ${group.units < 5 ? `text-${status.color}-500 fill-${status.color}-500/30 animate-pulse` : 'text-slate-200 dark:text-slate-700'}`} />
					</div>

					<div className="mt-auto">
					  <div className="flex justify-between items-end mb-2">
						<span className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none">{group.units}</span>
						<span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Units</span>
					  </div>
					  
					  {/* Visual Capacity Bar */}
					  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
						<div 
						  className={`h-full rounded-full transition-all duration-1000 ease-out ${status.bg}`}
						  style={{ width: `${fillPercentage}%` }}
						></div>
					  </div>
					</div>
				  </div>
				  
				  {/* Action Bar */}
				  <div className="p-2 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 relative z-10">
					<button 
					  onClick={() => updateUnits(group.blood_type, group.units, -1)}
					  disabled={group.units === 0}
					  className="flex justify-center items-center gap-2 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 transition-all text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest active:scale-[0.97]"
					>
					  <Minus className="w-4 h-4" /> Dispense
					</button>
					<button 
					  onClick={() => updateUnits(group.blood_type, group.units, 1)}
					  className="flex justify-center items-center gap-2 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest active:scale-[0.97]"
					>
					  <Plus className="w-4 h-4" /> Add
					</button>
				  </div>

				</div>
			  );
			})}
		  </div>

		</div>
	  )}
	</div>
  );
}