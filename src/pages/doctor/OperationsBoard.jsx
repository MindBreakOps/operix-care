import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Activity, Scissors, CheckCircle, PlusCircle, AlertCircle, 
  RefreshCw, User, Droplet, FileText, ShieldAlert, HeartPulse, ChevronRight // Add this here!
} from 'lucide-react';

export default function OperationsBoard() {
  const [operations, setOperations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [surgeons, setSurgeons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
	patient_id: '',
	surgeon_id: '',
	operation_name: '',
	blood_units_required: 0,
	notes: ''
  });

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchData = async () => {
	setLoading(true);
	
	// Fetch patients from the Master Patient Files
	const { data: pFiles } = await supabase.from('patient_files').select('id, full_name');
	if (pFiles) setPatients(pFiles);

	// Fetch surgeons from system profiles
	const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
	if (profiles) setSurgeons(profiles.filter(p => p.role === 'doctor' || p.role === 'admin'));

	// Fetch active operations
	const { data: ops } = await supabase.from('operations').select('*').order('created_at', { ascending: true });
	if (ops) setOperations(ops);
	
	setLoading(false);
  };

  useEffect(() => {
	fetchData();
  }, []);

  const handleScheduleSurgery = async (e) => {
	e.preventDefault();
	setLoading(true);

	const { error } = await supabase.from('operations').insert([{
	  patient_id: formData.patient_id,
	  surgeon_id: formData.surgeon_id,
	  operation_name: formData.operation_name,
	  blood_units_required: parseInt(formData.blood_units_required),
	  notes: formData.notes,
	  status: 'scheduled'
	}]);
	
	if (error) {
	  showMessage('error', "Error scheduling: " + error.message);
	} else {
	  showMessage('success', "Surgery successfully scheduled.");
	  setFormData({ patient_id: '', surgeon_id: '', operation_name: '', blood_units_required: 0, notes: '' });
	  fetchData();
	}
	setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
	await supabase.from('operations').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  const getName = (id) => {
	const person = [...patients, ...surgeons].find(p => p.id === id);
	return person ? person.full_name : 'Unknown Record';
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  
	  {/* AMBIENT GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
	  <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Operating Room Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Surgical Board
		  </h1>
		</div>
		
		<button onClick={fetchData} disabled={loading} className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
		  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/> Refresh Board
		</button>
	  </div>

	  {/* ALERTS */}
	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
		  {message.text}
		</div>
	  )}

	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		
		{/* SCHEDULING FORM */}
		<div className="lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 lg:p-8 h-fit">
		  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
			<PlusCircle className="w-5 h-5 text-red-600"/> Book Procedure
		  </h2>
		  
		  <form onSubmit={handleScheduleSurgery} className="space-y-5">
			<div>
			  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Patient</label>
			  <select required value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white">
				<option value="">Choose Patient...</option>
				{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
			  </select>
			</div>
			
			<div>
			  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Select Surgeon</label>
			  <select required value={formData.surgeon_id} onChange={e => setFormData({...formData, surgeon_id: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white">
				<option value="">Choose Surgeon...</option>
				{surgeons.map(s => <option key={s.id} value={s.id}>Dr. {s.full_name}</option>)}
			  </select>
			</div>

			<div>
			  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Operation Name</label>
			  <input required type="text" value={formData.operation_name} onChange={e => setFormData({...formData, operation_name: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white" placeholder="e.g., Appendectomy"/>
			</div>

			<div>
			  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Droplet className="w-3 h-3 text-red-500"/> Blood Units Required</label>
			  <input required type="number" min="0" value={formData.blood_units_required} onChange={e => setFormData({...formData, blood_units_required: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white"/>
			</div>

			<div>
			  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Clinical Notes</label>
			  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows="2" className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Optional details..."></textarea>
			</div>

			<button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
			  <Scissors className="w-4 h-4"/> Schedule Operation
			</button>
		  </form>
		</div>

		{/* LIVE TRACKING BOARD */}
		<div className="lg:col-span-2">
		  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 lg:p-8 min-h-[600px] flex flex-col">
			
			{loading && operations.length === 0 ? (
			  <div className="flex-1 flex items-center justify-center text-red-500 font-bold uppercase tracking-widest animate-pulse">Loading OR Schedule...</div>
			) : operations.filter(op => op.status !== 'completed').length === 0 ? (
			  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 bg-white/40 dark:bg-slate-900/40">
				<HeartPulse className="w-16 h-16 opacity-20 mb-4" />
				<p className="font-bold uppercase tracking-widest text-sm">No active operations. The OR is clear.</p>
			  </div>
			) : (
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
				
				{/* SCHEDULED COLUMN */}
				<div className="space-y-4">
				  <div className="bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 rounded-xl text-center font-black text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700/50">
					Pre-Op / Scheduled
				  </div>
				  
				  {operations.filter(op => op.status === 'scheduled').map(op => (
					<div key={op.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500 transition-all hover:shadow-md">
					  <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2"><User className="w-4 h-4 text-slate-400"/> {getName(op.patient_id)}</h3>
					  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2 mb-1">{op.operation_name}</div>
					  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Surgeon: Dr. {getName(op.surgeon_id)}</div>
					  
					  {op.blood_units_required > 0 && (
						<div className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mb-4 border border-red-100 dark:border-red-900/50">
						  <Droplet className="w-3 h-3"/> REQUIRES {op.blood_units_required} BLOOD UNITS
						</div>
					  )}
					  
					  <button onClick={() => updateStatus(op.id, 'in_progress')} className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
						Commence Surgery <ChevronRight className="w-3 h-3"/>
					  </button>
					</div>
				  ))}
				</div>

				{/* IN PROGRESS COLUMN */}
				<div className="space-y-4">
				  <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm p-3 rounded-xl text-center font-black text-red-600 dark:text-red-400 text-[10px] uppercase tracking-widest border border-red-200 dark:border-red-900/50 flex justify-center items-center gap-2">
					<span className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full animate-pulse"></span> In Surgery (OR Active)
				  </div>
				  
				  {operations.filter(op => op.status === 'in_progress').map(op => (
					<div key={op.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm border-l-4 border-l-red-600 relative overflow-hidden group">
					  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl pointer-events-none"></div>
					  
					  <h3 className="font-black text-slate-900 dark:text-white text-lg relative z-10 flex items-center gap-2"><User className="w-4 h-4 text-red-400"/> {getName(op.patient_id)}</h3>
					  <div className="text-sm font-bold text-red-600 dark:text-red-400 mt-2 mb-1 relative z-10">{op.operation_name}</div>
					  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10">Surgeon: Dr. {getName(op.surgeon_id)}</div>
					  
					  <button onClick={() => updateStatus(op.id, 'completed')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex justify-center items-center gap-2 relative z-10 active:scale-95 shadow-md shadow-emerald-500/20">
						<CheckCircle className="w-4 h-4"/> Sign Off / Completed
					  </button>
					</div>
				  ))}
				</div>
				
			  </div>
			)}
		  </div>
		</div>
	  </div>
	</div>
  );
}