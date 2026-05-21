// src/pages/bloodbank/BloodBank.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Droplet, AlertCircle, Plus, Minus, RefreshCw } from 'lucide-react';

export default function BloodBank() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
	setLoading(true);
	const { data, error } = await supabase
	  .from('blood_inventory')
	  .select('*')
	  .order('blood_type');
	
	if (!error && data) setInventory(data);
	setLoading(false);
  };

  useEffect(() => {
	fetchInventory();
  }, []);

  const updateUnits = async (type, currentUnits, change) => {
	const newUnits = Math.max(0, currentUnits + change); // Prevent negative numbers
	
	// Optimistic UI update for speed
	setInventory(inventory.map(item => 
	  item.blood_type === type ? { ...item, units: newUnits } : item
	));

	// Update Database
	await supabase
	  .from('blood_inventory')
	  .update({ units: newUnits, last_updated: new Date().toISOString() })
	  .eq('blood_type', type);
  };

  if (loading) return <div className="p-10 flex justify-center"><div className="loader"></div></div>;

  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const criticalShortages = inventory.filter(item => item.units < 5).length;

  return (
	<div className="max-w-6xl mx-auto space-y-6">
	  {/* Header */}
	  <div className="flex justify-between items-end border-b-2 border-slate-800 dark:border-slate-700 pb-4">
		<div>
		  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
			<Droplet className="w-8 h-8 text-red-500 fill-red-500/20" /> Blood Bank Operations
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Live Blood Group Inventory & Dispensing.</p>
		</div>
		<button onClick={fetchInventory} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-lg text-sm transition hover:bg-slate-300 dark:hover:bg-slate-700">
		  <RefreshCw className="w-4 h-4" /> Refresh
		</button>
	  </div>

	  {/* Metrics Banner */}
	  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
		  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
			<Droplet className="w-8 h-8 text-red-500" />
		  </div>
		  <div>
			<div className="text-3xl font-black text-slate-800 dark:text-white">{totalUnits}</div>
			<div className="text-sm font-bold text-slate-500 uppercase">Total Units Available</div>
		  </div>
		</div>
		
		<div className={`p-5 rounded-xl border shadow-sm flex items-center gap-4 ${criticalShortages > 0 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
		  <div className={`p-4 rounded-full ${criticalShortages > 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
			<AlertCircle className="w-8 h-8" />
		  </div>
		  <div>
			<div className={`text-3xl font-black ${criticalShortages > 0 ? 'text-amber-700 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-500'}`}>{criticalShortages}</div>
			<div className={`text-sm font-bold uppercase ${criticalShortages > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Groups in Critical Shortage (&lt;5 units)</div>
		  </div>
		</div>
	  </div>

	  {/* Inventory Grid */}
	  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
		{inventory.map((group) => (
		  <div key={group.blood_type} className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${group.units < 5 ? 'border-red-300 dark:border-red-900/50 shadow-red-900/10' : 'border-slate-200 dark:border-slate-800'}`}>
			<div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50">
			  <span className="text-2xl font-black text-slate-800 dark:text-white">{group.blood_type}</span>
			  <span className={`text-xs font-bold px-2 py-1 rounded-full ${group.units >= 10 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : group.units > 4 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'}`}>
				{group.units} Units
			  </span>
			</div>
			
			<div className="p-3 bg-slate-50 dark:bg-slate-950 flex justify-between gap-2">
			  <button 
				onClick={() => updateUnits(group.blood_type, group.units, -1)}
				disabled={group.units === 0}
				className="flex-1 flex justify-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition text-slate-700 dark:text-slate-300"
			  >
				<Minus className="w-5 h-5" />
			  </button>
			  <button 
				onClick={() => updateUnits(group.blood_type, group.units, 1)}
				className="flex-1 flex justify-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition text-red-600 dark:text-red-500"
			  >
				<Plus className="w-5 h-5" />
			  </button>
			</div>
		  </div>
		))}
	  </div>
	</div>
  );
}