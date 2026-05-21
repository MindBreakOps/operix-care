import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Stethoscope, Activity, Syringe, Pill, Clock, 
  CheckCircle, ChevronRight, TestTube, FileText, 
  Calendar, ShieldAlert, ArrowRight, Users
} from 'lucide-react';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('consultations'); // 'consultations' or 'operations'
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clinical State
  const [queue, setQueue] = useState([]);
  const [activeVisit, setActiveVisit] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  
  // Surgical State
  const [operations, setOperations] = useState([]);

  // Forms
  const [rxForm, setRxForm] = useState({ medication: '', dosage: '', instructions: '' });
  const [labForm, setLabForm] = useState({ test_type: '', notes: '' });
  const [opForm, setOpForm] = useState({ operation_type: '', scheduled_date: '', priority: 'Routine' });

  const fetchClinicalData = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  // 1. Fetch Active Patient Queue (Waiting or In Progress)
	  const { data: visitsData } = await supabase
		.from('visits')
		.select(`
		  id, status, triage_priority, vitals, clinical_notes,
		  patient:patient_id(id, full_name)
		`)
		.in('status', ['waiting', 'in_progress'])
		.order('created_at', { ascending: true });

	  // 2. Fetch Operations Board
	  const { data: opsData } = await supabase
		.from('operations')
		.select(`
		  id, operation_type, status, scheduled_date, priority,
		  patient:patient_id(id, full_name),
		  surgeon:surgeon_id(id, full_name)
		`)
		.order('scheduled_date', { ascending: true });

	  setQueue(visitsData || []);
	  setOperations(opsData || []);
	} catch (error) {
	  console.error("Error fetching clinical data:", error);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchClinicalData(); }, []);

  // --- CLINICAL ACTIONS ---
  const startConsultation = async (visit) => {
	setActiveVisit(visit);
	setClinicalNotes(visit.clinical_notes || '');
	if (visit.status === 'waiting') {
	  await supabase.from('visits').update({ status: 'in_progress' }).eq('id', visit.id);
	  fetchClinicalData();
	}
  };

  const saveClinicalNotes = async () => {
	if (!activeVisit) return;
	await supabase.from('visits').update({ clinical_notes: clinicalNotes }).eq('id', activeVisit.id);
	alert("Clinical notes saved securely.");
  };

  const prescribeMedication = async (e) => {
	e.preventDefault();
	if (!activeVisit) return;
	const { error } = await supabase.from('prescriptions').insert([{
	  visit_id: activeVisit.id,
	  patient_id: activeVisit.patient.id,
	  medication_name: rxForm.medication,
	  dosage: rxForm.dosage,
	  instructions: rxForm.instructions,
	  status: 'pending'
	}]);
	if (!error) {
	  alert("Prescription dispatched to Pharmacy.");
	  setRxForm({ medication: '', dosage: '', instructions: '' });
	}
  };

  const orderLabTest = async (e) => {
	e.preventDefault();
	if (!activeVisit) return;
	const { error } = await supabase.from('lab_tests').insert([{
	  visit_id: activeVisit.id,
	  patient_id: activeVisit.patient.id,
	  test_name: labForm.test_type,
	  notes: labForm.notes,
	  status: 'pending'
	}]);
	if (!error) {
	  alert("Lab order dispatched.");
	  setLabForm({ test_type: '', notes: '' });
	}
  };

  const scheduleSurgery = async (e) => {
	e.preventDefault();
	if (!activeVisit) return;
	
	// Get the current logged-in doctor's ID
	const { data: { user } } = await supabase.auth.getUser();
	
	const { error } = await supabase.from('operations').insert([{
	  visit_id: activeVisit.id,
	  patient_id: activeVisit.patient.id,
	  surgeon_id: user.id, // Current doctor becomes the surgeon
	  operation_type: opForm.operation_type,
	  scheduled_date: opForm.scheduled_date,
	  priority: opForm.priority,
	  status: 'scheduled'
	}]);
	
	if (!error) {
	  alert("Surgery added to Operations Theater board.");
	  setOpForm({ operation_type: '', scheduled_date: '', priority: 'Routine' });
	  fetchClinicalData();
	}
  };

  const dischargePatient = async () => {
	if (!activeVisit) return;
	await saveClinicalNotes();
	await supabase.from('visits').update({ status: 'discharged' }).eq('id', activeVisit.id);
	setActiveVisit(null);
	fetchClinicalData();
  };

  // UI Helpers
  const getPriorityColor = (priority) => {
	const p = priority?.toLowerCase();
	if (p === 'emergency' || p === 'high') return 'bg-red-500 text-white shadow-red-500/30';
	if (p === 'urgent') return 'bg-amber-500 text-white shadow-amber-500/30';
	return 'bg-emerald-500 text-white shadow-emerald-500/30';
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* AMBIENT BACKGROUND GLOWS (Dynamic based on Tab) */}
	  <div className={`absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 ${activeTab === 'consultations' ? 'bg-teal-500/10 dark:bg-teal-600/10' : 'bg-rose-500/10 dark:bg-rose-600/10'}`}></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className={`w-2 h-2 rounded-full animate-pulse ${activeTab === 'consultations' ? 'bg-teal-500' : 'bg-rose-500'}`}></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Provider Portal</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			{activeTab === 'consultations' ? 'Clinical Workspace' : 'Surgical Theater'}
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Patient diagnostics, prescribing, and operative scheduling.</p>
		</div>
		
		{/* PREMIUM SEGMENTED CONTROLLER */}
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button 
			onClick={() => setActiveTab('consultations')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'consultations' ? 'bg-white dark:bg-slate-800 shadow-sm text-teal-600 dark:text-teal-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Stethoscope className="w-4 h-4"/> Consultations
		  </button>
		  <button 
			onClick={() => setActiveTab('operations')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'operations' ? 'bg-white dark:bg-slate-800 shadow-sm text-rose-600 dark:text-rose-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Syringe className="w-4 h-4"/> Operations Board
		  </button>
		</div>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <Activity className={`w-10 h-10 animate-bounce ${activeTab === 'consultations' ? 'text-teal-500/50' : 'text-rose-500/50'}`} />
		  <p className="text-sm font-medium text-slate-500 animate-pulse">Loading clinical records...</p>
		</div>
	  ) : (
		<>
		  {/* ============================================== */}
		  {/* TAB 1: CLINICAL CONSULTATIONS                  */}
		  {/* ============================================== */}
		  {activeTab === 'consultations' && (
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  
			  {/* LEFT: PATIENT QUEUE */}
			  <div className={`lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col ${activeVisit ? 'hidden lg:flex h-[800px]' : 'h-[650px]'}`}>
				<div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
				  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
					<Users className="w-4 h-4"/> Triage Queue
				  </h3>
				  <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black px-2 py-0.5 rounded-md">{queue.length}</span>
				</div>
				
				<div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
				  {queue.length === 0 ? (
					<div className="text-center p-8 text-slate-400 text-sm">No patients waiting.</div>
				  ) : queue.map(visit => (
					<div 
					  key={visit.id} 
					  onClick={() => startConsultation(visit)} 
					  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border group ${activeVisit?.id === visit.id ? 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-slate-200 dark:border-slate-800/50'}`}
					>
					  <div className="flex justify-between items-start mb-2">
						<div className={`font-bold text-sm truncate ${activeVisit?.id === visit.id ? 'text-teal-900 dark:text-teal-300' : 'text-slate-900 dark:text-white'}`}>
						  {visit.patient?.full_name || 'Unknown Patient'}
						</div>
						<div className={`text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-sm ${getPriorityColor(visit.triage_priority)}`}>
						  {visit.triage_priority || 'Routine'}
						</div>
					  </div>
					  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
						<Clock className="w-3 h-3"/> {visit.status === 'in_progress' ? 'In Consult' : 'Waiting'}
					  </div>
					</div>
				  ))}
				</div>
			  </div>

			  {/* RIGHT: ACTIVE CONSULTATION WORKSPACE */}
			  <div className={`lg:col-span-2 ${!activeVisit ? 'hidden lg:block' : ''}`}>
				{activeVisit ? (
				  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[800px]">
					
					{/* Workspace Header */}
					<div className="relative p-6 md:p-8 overflow-hidden border-b border-slate-100 dark:border-slate-800">
					  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
					  
					  <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
						<div>
						  <button onClick={() => setActiveVisit(null)} className="lg:hidden text-teal-600 dark:text-teal-400 font-bold text-xs mb-4 flex items-center gap-1"><ChevronRight className="w-4 h-4 rotate-180"/> Back to Queue</button>
						  
						  <div className="flex flex-wrap items-center gap-3 mb-1">
							<h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{activeVisit.patient?.full_name}</h2>
							<span className="bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ring-1 ring-teal-200 dark:ring-teal-500/30">
							  Active Consult
							</span>
						  </div>
						  <p className="text-sm font-mono text-slate-500 mt-2">Visit ID: {activeVisit.id.split('-')[0]}</p>
						</div>

						<button onClick={dischargePatient} className="w-full md:w-auto px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200 rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2">
						  <CheckCircle className="w-4 h-4"/> Discharge Patient
						</button>
					  </div>
					</div>

					<div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
					  
					  {/* Vitals & Notes Grid */}
					  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						
						{/* Clinical Notes (Auto-saving) */}
						<div className="space-y-3">
						  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
							<FileText className="w-4 h-4"/> Physician Notes
						  </h4>
						  <textarea 
							value={clinicalNotes}
							onChange={(e) => setClinicalNotes(e.target.value)}
							onBlur={saveClinicalNotes}
							placeholder="Enter diagnosis, symptoms, and clinical observations here. Notes autosave on blur."
							className="w-full h-48 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-slate-900 dark:text-white resize-none"
						  />
						</div>

						{/* Nurse Vitals (Read-Only) */}
						<div className="space-y-3">
						  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
							<Activity className="w-4 h-4"/> Triage Vitals
						  </h4>
						  <div className="h-48 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 overflow-y-auto text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
							{activeVisit.vitals || "No vitals recorded by triage nurse yet."}
						  </div>
						</div>

					  </div>

					  {/* Orders Bento Grid */}
					  <div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
						
						{/* Rx Prescription Form */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
						  <h4 className="text-[11px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest flex items-center gap-2 mb-4">
							<Pill className="w-4 h-4"/> E-Prescribe
						  </h4>
						  <form onSubmit={prescribeMedication} className="space-y-3">
							<input required placeholder="Medication Name" value={rxForm.medication} onChange={e=>setRxForm({...rxForm, medication: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-900 dark:text-white"/>
							<input required placeholder="Dosage (e.g., 500mg)" value={rxForm.dosage} onChange={e=>setRxForm({...rxForm, dosage: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-900 dark:text-white"/>
							<input required placeholder="Sig / Instructions" value={rxForm.instructions} onChange={e=>setRxForm({...rxForm, instructions: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500/50 text-slate-900 dark:text-white"/>
							<button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 text-xs uppercase tracking-widest mt-2 shadow-md shadow-teal-500/20">Send to Pharmacy</button>
						  </form>
						</div>

						{/* Lab Orders Form */}
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
						  <h4 className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
							<TestTube className="w-4 h-4"/> Order Labs
						  </h4>
						  <form onSubmit={orderLabTest} className="space-y-3">
							<select required value={labForm.test_type} onChange={e=>setLabForm({...labForm, test_type: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white">
							  <option value="">Select Test Panel...</option>
							  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
							  <option value="Comprehensive Metabolic Panel">Comprehensive Metabolic Panel</option>
							  <option value="Lipid Panel">Lipid Panel</option>
							  <option value="Urinalysis">Urinalysis</option>
							  <option value="Hemoglobin A1C">Hemoglobin A1C</option>
							</select>
							<textarea placeholder="Clinical notes for pathology..." value={labForm.notes} onChange={e=>setLabForm({...labForm, notes: e.target.value})} className="w-full h-[94px] text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white resize-none"/>
							<button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 text-xs uppercase tracking-widest mt-2 shadow-md shadow-indigo-500/20">Dispatch Order</button>
						  </form>
						</div>

					  </div>
					</div>
				  </div>
				) : (
				  <div className="hidden lg:flex h-[650px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl items-center justify-center p-12 text-center text-slate-400 backdrop-blur-sm">
					<div className="space-y-4">
					  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
						<Stethoscope className="w-8 h-8 opacity-40" />
					  </div>
					  <p className="font-medium">Select a patient from the queue<br/>to begin consultation.</p>
					</div>
				  </div>
				)}
			  </div>
			</div>
		  )}

		  {/* ============================================== */}
		  {/* TAB 2: SURGICAL OPERATIONS BOARD               */}
		  {/* ============================================== */}
		  {activeTab === 'operations' && (
			<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  
			  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				{/* LEFT: SCHEDULE SURGERY FORM */}
				<div className="lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden p-6">
				  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
					<ShieldAlert className="w-5 h-5 text-rose-500"/> 
					<h2 className="font-bold text-slate-800 dark:text-white">Schedule Procedure</h2>
				  </div>

				  <form onSubmit={scheduleSurgery} className="space-y-4">
					<div className="p-4 bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-xl mb-4">
					  <p className="text-xs text-rose-800 dark:text-rose-300 font-medium leading-relaxed">
						To schedule an operation, you must have a patient actively selected in the <strong>Consultation Workspace</strong>.
					  </p>
					  <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
						Target: {activeVisit ? <span className="text-rose-600 dark:text-rose-400">{activeVisit.patient?.full_name}</span> : 'NONE SELECTED'}
					  </div>
					</div>

					<div className="space-y-1.5">
					  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Procedure Type</label>
					  <input required type="text" value={opForm.operation_type} onChange={e=>setOpForm({...opForm, operation_type: e.target.value})} placeholder="e.g. Appendectomy" disabled={!activeVisit} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 dark:text-white disabled:opacity-50"/>
					</div>
					
					<div className="grid grid-cols-2 gap-3">
					  <div className="space-y-1.5">
						<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Date & Time</label>
						<input required type="datetime-local" value={opForm.scheduled_date} onChange={e=>setOpForm({...opForm, scheduled_date: e.target.value})} disabled={!activeVisit} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 dark:text-white disabled:opacity-50"/>
					  </div>
					  <div className="space-y-1.5">
						<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Priority</label>
						<select value={opForm.priority} onChange={e=>setOpForm({...opForm, priority: e.target.value})} disabled={!activeVisit} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-rose-500/50 text-slate-900 dark:text-white disabled:opacity-50">
						  <option>Routine</option>
						  <option>Urgent</option>
						  <option>Emergency</option>
						</select>
					  </div>
					</div>
					
					<button type="submit" disabled={!activeVisit} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest mt-4 shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2">
					  Book Operating Theater <ArrowRight className="w-4 h-4"/>
					</button>
				  </form>
				</div>

				{/* RIGHT: SURGICAL THEATER BOARD */}
				<div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-[600px]">
				  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
					<h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
					  <Calendar className="w-4 h-4"/> Master Operating Schedule
					</h3>
				  </div>
				  
				  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar">
					{operations.length === 0 ? (
					  <div className="text-center p-12 text-slate-400 text-sm">No surgeries scheduled.</div>
					) : operations.map(op => (
					  <div key={op.id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
						
						{/* Status Indicator Bar */}
						<div className={`absolute left-0 top-0 bottom-0 w-1.5 ${op.status === 'in_progress' ? 'bg-rose-500 animate-pulse' : op.status === 'completed' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
						
						<div className="pl-3">
						  <div className="flex items-center gap-2 mb-1">
							<span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm ${getPriorityColor(op.priority)}`}>
							  {op.priority}
							</span>
							<span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
							  {op.status.replace('_', ' ')}
							</span>
						  </div>
						  <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{op.operation_type}</h4>
						  <p className="text-xs font-medium text-slate-500 mt-1">
							Patient: <strong className="text-slate-700 dark:text-slate-300">{op.patient?.full_name}</strong>
						  </p>
						</div>
						
						<div className="text-left md:text-right w-full md:w-auto bg-slate-50 dark:bg-slate-950 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border md:border-transparent border-slate-100 dark:border-slate-800">
						  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Scheduled For</div>
						  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
							{new Date(op.scheduled_date).toLocaleString()}
						  </div>
						</div>
					  </div>
					))}
				  </div>
				</div>

			  </div>
			</div>
		  )}
		</>
	  )}
	</div>
  );
}