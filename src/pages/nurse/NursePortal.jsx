import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  HeartPulse, Activity, Thermometer, ClipboardPlus, Pill, 
  CheckCircle, ChevronRight, Users, ShieldAlert, Clock, 
  RefreshCcw, Syringe, Scale, Wind
} from 'lucide-react';

export default function NurseDashboard() {
  const [activeTab, setActiveTab] = useState('triage'); // 'triage' or 'medications'
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data State
  const [queue, setQueue] = useState([]);
  const [medications, setMedications] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  // Vitals Form State
  const [vitalsForm, setVitalsForm] = useState({
	bp: '', hr: '', temp: '', spo2: '', weight: '', respRate: ''
  });

  const fetchNurseData = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  // 1. Fetch Patients Waiting for Triage/Doctor
	  const { data: visitsData } = await supabase
		.from('visits')
		.select(`
		  id, status, triage_priority, vitals, created_at,
		  patient:patient_id(id, full_name, gender, date_of_birth, blood_group)
		`)
		.eq('status', 'waiting')
		.order('created_at', { ascending: true });

	  // 2. Fetch Pending Medications (Prescribed by doctor, waiting for Nurse to administer)
	  // Assuming 'dispensed' or 'pending' status from pharmacy
	  const { data: medsData } = await supabase
		.from('prescriptions')
		.select(`
		  id, medication_name, dosage, instructions, status, created_at,
		  patient:patient_id(full_name),
		  visit:visit_id(id)
		`)
		.in('status', ['dispensed', 'pending']) 
		.order('created_at', { ascending: true });

	  setQueue(visitsData || []);
	  setMedications(medsData || []);
	} catch (error) {
	  console.error("Error fetching nurse data:", error);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchNurseData(); }, []);

  // --- ACTIONS ---
  const handleSaveVitals = async (e) => {
	e.preventDefault();
	if (!selectedVisit) return;
	setLoading(true);

	// Format vitals into a clean readable string for the Doctor
	const formattedVitals = `BP: ${vitalsForm.bp || '--'} mmHg | HR: ${vitalsForm.hr || '--'} bpm | Temp: ${vitalsForm.temp || '--'} °C\nSpO2: ${vitalsForm.spo2 || '--'}% | Resp: ${vitalsForm.respRate || '--'} breaths/min | Wt: ${vitalsForm.weight || '--'} kg`;

	const { error } = await supabase.from('visits')
	  .update({ vitals: formattedVitals })
	  .eq('id', selectedVisit.id);

	if (error) {
	  alert("Error saving vitals: " + error.message);
	} else {
	  setVitalsForm({ bp: '', hr: '', temp: '', spo2: '', weight: '', respRate: '' });
	  setSelectedVisit(null);
	  fetchNurseData();
	}
	setLoading(false);
  };

  const handleAdministerMed = async (medId) => {
	setLoading(true);
	const { error } = await supabase.from('prescriptions')
	  .update({ status: 'administered' })
	  .eq('id', medId);

	if (error) alert("Error updating record: " + error.message);
	else fetchNurseData();
  };

  // UI Helpers
  const getPriorityStyle = (priority) => {
	const p = priority?.toLowerCase();
	if (p === 'emergency' || p === 'high') return 'bg-red-500 text-white shadow-red-500/30';
	if (p === 'urgent') return 'bg-amber-500 text-white shadow-amber-500/30';
	return 'bg-emerald-500 text-white shadow-emerald-500/30';
  };

  const calculateAge = (dob) => {
	if (!dob) return 'N/A';
	const diff = Date.now() - new Date(dob).getTime();
	return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* AMBIENT BACKGROUND GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-fuchsia-500/10 dark:bg-fuchsia-600/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-1000"></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Care</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Nursing Station
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Patient vitals logging and medication administration.</p>
		</div>
		
		{/* PREMIUM SEGMENTED CONTROLLER */}
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button 
			onClick={() => setActiveTab('triage')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'triage' ? 'bg-white dark:bg-slate-800 shadow-sm text-fuchsia-600 dark:text-fuchsia-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Activity className="w-4 h-4"/> Vitals & Triage
		  </button>
		  <button 
			onClick={() => setActiveTab('medications')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'medications' ? 'bg-white dark:bg-slate-800 shadow-sm text-fuchsia-600 dark:text-fuchsia-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Syringe className="w-4 h-4"/> Administer Meds
			{medications.length > 0 && (
			  <span className="ml-1 bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300 py-0.5 px-2 rounded-full text-[10px]">
				{medications.length}
			  </span>
			)}
		  </button>
		</div>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <HeartPulse className="w-10 h-10 text-fuchsia-500/50 animate-bounce" />
		  <p className="text-sm font-medium text-slate-500 animate-pulse">Syncing patient records...</p>
		</div>
	  ) : (
		<>
		  {/* ============================================== */}
		  {/* TAB 1: VITALS & TRIAGE                         */}
		  {/* ============================================== */}
		  {activeTab === 'triage' && (
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  
			  {/* LEFT: WAITING QUEUE */}
			  <div className={`lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col ${selectedVisit ? 'hidden lg:flex h-[800px]' : 'h-[700px]'}`}>
				<div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
				  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
					<Users className="w-4 h-4"/> Pending Vitals
				  </h3>
				  <button onClick={() => fetchNurseData(true)} className="text-slate-400 hover:text-fuchsia-500 transition-colors">
					<RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}/>
				  </button>
				</div>
				
				<div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
				  {queue.length === 0 ? (
					<div className="text-center p-8 text-slate-400 text-sm">All waiting patients have vitals logged.</div>
				  ) : queue.map(visit => {
					const hasVitals = visit.vitals && visit.vitals.length > 5;
					return (
					  <div 
						key={visit.id} 
						onClick={() => setSelectedVisit(visit)} 
						className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border group ${selectedVisit?.id === visit.id ? 'bg-fuchsia-50 dark:bg-fuchsia-500/10 border-fuchsia-200 dark:border-fuchsia-500/30 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800/50'}`}
					  >
						<div className="flex justify-between items-start mb-2">
						  <div className="truncate pr-2">
							<div className={`font-bold text-sm truncate ${selectedVisit?.id === visit.id ? 'text-fuchsia-900 dark:text-fuchsia-300' : 'text-slate-900 dark:text-white'}`}>
							  {visit.patient?.full_name || 'Unknown Patient'}
							</div>
							<div className="text-[10px] font-mono text-slate-400 mt-1 flex gap-2">
							  <span>Age: {calculateAge(visit.patient?.date_of_birth)}</span>
							  <span>Sex: {visit.patient?.gender?.charAt(0) || '-'}</span>
							</div>
						  </div>
						  <div className={`text-[9px] shrink-0 font-black uppercase px-2 py-1 rounded-md shadow-sm ${getPriorityStyle(visit.triage_priority)}`}>
							{visit.triage_priority}
						  </div>
						</div>
						<div className="flex items-center justify-between mt-3 border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
						  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
							<Clock className="w-3 h-3"/> Waiting
						  </div>
						  {hasVitals ? (
							<span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3 h-3"/> Logged</span>
						  ) : (
							<span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400"><ShieldAlert className="w-3 h-3"/> Needs Vitals</span>
						  )}
						</div>
					  </div>
					)
				  })}
				</div>
			  </div>

			  {/* RIGHT: VITALS LOGGING WORKSPACE */}
			  <div className={`lg:col-span-2 ${!selectedVisit ? 'hidden lg:block' : ''}`}>
				{selectedVisit ? (
				  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[800px] animate-in fade-in slide-in-from-right-4 duration-300">
					
					<div className="relative p-6 md:p-8 overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
					  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
					  
					  <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
						<div>
						  <button onClick={() => setSelectedVisit(null)} className="lg:hidden text-fuchsia-600 dark:text-fuchsia-400 font-bold text-xs mb-4 flex items-center gap-1 hover:underline"><ChevronRight className="w-4 h-4 rotate-180"/> Back to Queue</button>
						  
						  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recording Telemetry For</div>
						  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
							{selectedVisit.patient?.full_name}
							{selectedVisit.patient?.blood_group && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ring-1 ring-red-200 dark:ring-red-500/30">{selectedVisit.patient.blood_group}</span>}
						  </h2>
						  <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-500">
							<span>Age: {calculateAge(selectedVisit.patient?.date_of_birth)}</span>
							<span>Sex: {selectedVisit.patient?.gender || 'Unspecified'}</span>
							<span className="font-mono text-fuchsia-600 dark:text-fuchsia-400">ID: {selectedVisit.id.split('-')[0]}</span>
						  </div>
						</div>
					  </div>
					</div>

					<div className="p-6 md:p-8 flex-1 flex flex-col">
					  <form onSubmit={handleSaveVitals} className="w-full space-y-6">
						
						<div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
						  
						  {/* Blood Pressure */}
						  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group focus-within:border-fuchsia-400 dark:focus-within:border-fuchsia-500 transition-colors">
							<label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
							  Blood Pressure <Activity className="w-4 h-4 text-fuchsia-500/50"/>
							</label>
							<div className="flex items-end gap-2">
							  <input placeholder="120/80" value={vitalsForm.bp} onChange={e=>setVitalsForm({...vitalsForm, bp: e.target.value})} className="w-full text-2xl font-black tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"/>
							  <span className="text-xs font-bold text-slate-400 pb-1">mmHg</span>
							</div>
						  </div>

						  {/* Heart Rate */}
						  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group focus-within:border-rose-400 dark:focus-within:border-rose-500 transition-colors">
							<label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
							  Heart Rate <HeartPulse className="w-4 h-4 text-rose-500/50"/>
							</label>
							<div className="flex items-end gap-2">
							  <input type="number" placeholder="80" value={vitalsForm.hr} onChange={e=>setVitalsForm({...vitalsForm, hr: e.target.value})} className="w-full text-2xl font-black tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"/>
							  <span className="text-xs font-bold text-slate-400 pb-1">bpm</span>
							</div>
						  </div>

						  {/* Temperature */}
						  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group focus-within:border-amber-400 dark:focus-within:border-amber-500 transition-colors">
							<label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
							  Temperature <Thermometer className="w-4 h-4 text-amber-500/50"/>
							</label>
							<div className="flex items-end gap-2">
							  <input type="number" step="0.1" placeholder="36.5" value={vitalsForm.temp} onChange={e=>setVitalsForm({...vitalsForm, temp: e.target.value})} className="w-full text-2xl font-black tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"/>
							  <span className="text-xs font-bold text-slate-400 pb-1">°C</span>
							</div>
						  </div>

						  {/* SpO2 */}
						  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group focus-within:border-cyan-400 dark:focus-within:border-cyan-500 transition-colors">
							<label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
							  Oxygen (SpO2) <Wind className="w-4 h-4 text-cyan-500/50"/>
							</label>
							<div className="flex items-end gap-2">
							  <input type="number" placeholder="98" value={vitalsForm.spo2} onChange={e=>setVitalsForm({...vitalsForm, spo2: e.target.value})} className="w-full text-2xl font-black tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"/>
							  <span className="text-xs font-bold text-slate-400 pb-1">%</span>
							</div>
						  </div>

						  {/* Respiration */}
						  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group focus-within:border-emerald-400 dark:focus-within:border-emerald-500 transition-colors">
							<label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
							  Respiration <Activity className="w-4 h-4 text-emerald-500/50"/>
							</label>
							<div className="flex items-end gap-2">
							  <input type="number" placeholder="16" value={vitalsForm.respRate} onChange={e=>setVitalsForm({...vitalsForm, respRate: e.target.value})} className="w-full text-2xl font-black tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"/>
							  <span className="text-xs font-bold text-slate-400 pb-1">b/m</span>
							</div>
						  </div>

						  {/* Weight */}
						  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group focus-within:border-indigo-400 dark:focus-within:border-indigo-500 transition-colors">
							<label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
							  Weight <Scale className="w-4 h-4 text-indigo-500/50"/>
							</label>
							<div className="flex items-end gap-2">
							  <input type="number" step="0.1" placeholder="70.5" value={vitalsForm.weight} onChange={e=>setVitalsForm({...vitalsForm, weight: e.target.value})} className="w-full text-2xl font-black tracking-tighter bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"/>
							  <span className="text-xs font-bold text-slate-400 pb-1">kg</span>
							</div>
						  </div>
						</div>

						{selectedVisit.vitals && (
						  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
							<h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Previously Logged Vitals</h4>
							<p className="text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{selectedVisit.vitals}</p>
						  </div>
						)}

						<button type="submit" disabled={loading} className="w-full mt-auto bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest shadow-lg shadow-fuchsia-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
						  <ClipboardPlus className="w-5 h-5"/> Secure to Patient File
						</button>
					  </form>
					</div>
				  </div>
				) : (
				  <div className="hidden lg:flex h-[700px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl items-center justify-center p-12 text-center text-slate-400 backdrop-blur-sm">
					<div className="space-y-4">
					  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
						<Activity className="w-8 h-8 opacity-40" />
					  </div>
					  <p className="font-medium">Select a patient from the queue<br/>to begin logging telemetry.</p>
					</div>
				  </div>
				)}
			  </div>
			</div>
		  )}

		  {/* ============================================== */}
		  {/* TAB 2: MEDICATION ADMINISTRATION               */}
		  {/* ============================================== */}
		  {activeTab === 'medications' && (
			<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
			  
			  <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
				<h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
				  <Syringe className="w-5 h-5 text-fuchsia-500"/> Treatment Administration
				</h2>
				<button onClick={() => fetchNurseData(true)} className="text-xs font-bold text-slate-500 hover:text-fuchsia-500 transition-colors flex items-center gap-1">
				  <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}/> Sync Orders
				</button>
			  </div>

			  {medications.length === 0 ? (
				<div className="text-center p-16 text-slate-400 flex flex-col items-center">
				  <CheckCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
				  <p className="text-lg font-bold text-slate-500">No pending treatments.</p>
				  <p className="text-sm mt-1">All prescribed medications have been administered.</p>
				</div>
			  ) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				  {medications.map((med) => (
					<div key={med.id} className="relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between group overflow-hidden">
					  
					  <div>
						<div className="flex justify-between items-start mb-4">
						  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30">
							Needs Admin
						  </span>
						  <span className="text-[10px] font-mono text-slate-400">
							{new Date(med.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
						  </span>
						</div>
						
						<h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
						  <Pill className="w-5 h-5 text-fuchsia-500"/> {med.medication_name}
						</h3>
						<div className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-400 mt-1">{med.dosage}</div>
						
						<div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
						  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Physician Instructions</div>
						  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{med.instructions || 'No specific instructions.'}</p>
						</div>
						
						<div className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
						  <Users className="w-4 h-4"/> Patient: <span className="text-slate-900 dark:text-white">{med.patient?.full_name}</span>
						</div>
					  </div>

					  <button 
						onClick={() => handleAdministerMed(med.id)}
						disabled={loading}
						className="w-full mt-6 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
					  >
						<CheckCircle className="w-4 h-4"/> Mark Administered
					  </button>
					</div>
				  ))}
				</div>
			  )}
			</div>
		  )}
		</>
	  )}
	</div>
  );
}