import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Activity, Scissors, Clock, CheckCircle, PlusCircle, AlertCircle } from 'lucide-react';

export default function OperationsBoard() {
  const [operations, setOperations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [surgeons, setSurgeons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Matches your exact DB Schema
  const [formData, setFormData] = useState({
	patient_id: '',
	surgeon_id: '',
	operation_name: '',
	blood_units_required: 0,
	notes: ''
  });

  const fetchData = async () => {
	setLoading(true);
	
	// Fetch all profiles so we can match UUIDs to real names
	const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
	if (profiles) {
	  setPatients(profiles.filter(p => p.role === 'patient'));
	  setSurgeons(profiles.filter(p => p.role === 'doctor' || p.role === 'admin'));
	}

	// Fetch operations
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

	// Insert using your specific columns
	const { error } = await supabase.from('operations').insert([{
	  patient_id: formData.patient_id,
	  surgeon_id: formData.surgeon_id,
	  operation_name: formData.operation_name,
	  blood_units_required: parseInt(formData.blood_units_required),
	  notes: formData.notes,
	  status: 'scheduled'
	}]);
	
	if (error) alert("Error scheduling: " + error.message);

	setFormData({ patient_id: '', surgeon_id: '', operation_name: '', blood_units_required: 0, notes: '' });
	fetchData();
  };

  const updateStatus = async (id, newStatus) => {
	await supabase.from('operations').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  // Helper function to turn a UUID into a real name
  const getName = (id) => {
	const person = [...patients, ...surgeons].find(p => p.id === id);
	return person ? person.full_name : 'Unknown Profile';
  };

  return (
	<div className="max-w-7xl mx-auto space-y-6 p-4">
	  <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-end">
		<div>
		  <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
			<Activity className="w-7 h-7 text-red-600" /> Surgical Operations Board
		  </h1>
		</div>
		<button onClick={fetchData} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-lg text-sm transition">Refresh Board</button>
	  </div>

	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		{/* SCHEDULING FORM */}
		<div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit space-y-4">
		  <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
			<PlusCircle className="w-5 h-5 text-red-600"/> Book Procedure
		  </h2>
		  
		  <form onSubmit={handleScheduleSurgery} className="space-y-4">
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Patient</label>
			  <select required value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
				<option value="">Choose Patient...</option>
				{patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
			  </select>
			</div>
			
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Surgeon</label>
			  <select required value={formData.surgeon_id} onChange={e => setFormData({...formData, surgeon_id: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
				<option value="">Choose Surgeon...</option>
				{surgeons.map(s => <option key={s.id} value={s.id}>Dr. {s.full_name}</option>)}
			  </select>
			</div>

			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operation Name</label>
			  <input required type="text" value={formData.operation_name} onChange={e => setFormData({...formData, operation_name: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="e.g., Appendectomy"/>
			</div>

			<div className="grid grid-cols-2 gap-2">
			  <div>
				<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Units</label>
				<input required type="number" min="0" value={formData.blood_units_required} onChange={e => setFormData({...formData, blood_units_required: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
			  </div>
			</div>

			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Clinical Notes</label>
			  <input type="text" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="Optional details..."/>
			</div>

			<button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition uppercase tracking-wider text-sm flex justify-center items-center gap-2">
			  <Scissors className="w-4 h-4"/> Schedule Operation
			</button>
		  </form>
		</div>

		{/* LIVE TRACKING BOARD */}
		<div className="lg:col-span-2">
		  {loading ? (
			<div className="p-10 flex justify-center"><div className="loader border-t-red-600"></div></div>
		  ) : operations.filter(op => op.status !== 'completed').length === 0 ? (
			<div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
			  No active operations. The OR is clear.
			</div>
		  ) : (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			  
			  {/* SCHEDULED */}
			  <div className="space-y-4">
				<div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-center font-bold text-slate-600 dark:text-slate-300 text-sm uppercase tracking-wider border border-slate-200 dark:border-slate-700">Scheduled</div>
				{operations.filter(op => op.status === 'scheduled').map(op => (
				  <div key={op.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-amber-500">
					<h3 className="font-black text-slate-900 dark:text-white text-lg">{getName(op.patient_id)}</h3>
					<div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">{op.operation_name}</div>
					<div className="text-xs text-slate-500 mb-2">Surgeon: Dr. {getName(op.surgeon_id)}</div>
					{op.blood_units_required > 0 && (
					  <div className="text-[10px] font-bold text-red-700 bg-red-100 inline-block px-2 py-1 rounded mb-3">
						REQUIRES {op.blood_units_required} BLOOD UNITS
					  </div>
					)}
					<button onClick={() => updateStatus(op.id, 'in_progress')} className="w-full bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 py-2 rounded-lg text-xs font-bold uppercase transition flex items-center justify-center gap-1">
					  Start Surgery
					</button>
				  </div>
				))}
			  </div>

			  {/* IN PROGRESS */}
			  <div className="space-y-4">
				<div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg text-center font-bold text-red-600 text-sm uppercase tracking-wider border border-red-200 flex justify-center gap-2">
				  <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse mt-1"></span> In Surgery
				</div>
				{operations.filter(op => op.status === 'in_progress').map(op => (
				  <div key={op.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 shadow-sm border-l-4 border-l-red-600">
					<h3 className="font-black text-slate-900 dark:text-white text-lg">{getName(op.patient_id)}</h3>
					<div className="text-sm font-bold text-red-600 mb-1">{op.operation_name}</div>
					<div className="text-xs text-slate-500 mb-3">Surgeon: Dr. {getName(op.surgeon_id)}</div>
					<button onClick={() => updateStatus(op.id, 'completed')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold uppercase transition flex justify-center gap-1">
					  <CheckCircle className="w-4 h-4"/> Complete
					</button>
				  </div>
				))}
			  </div>
			</div>
		  )}
		</div>
	  </div>
	</div>
  );
}