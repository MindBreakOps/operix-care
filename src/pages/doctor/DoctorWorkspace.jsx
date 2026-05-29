import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  FileText, ChevronRight, Search, User, 
  ClipboardList, ShieldAlert, CheckCircle, 
  Activity, Mic, MicOff, BookOpen
} from 'lucide-react';

export default function DoctorDashboard() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [activeTicket, setActiveTicket] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  
  const [consult, setConsult] = useState({ diagnosis: '', symptoms: '', prescribed_meds: '' });
  const [vitals, setVitals] = useState({ blood_pressure: '', heart_rate: '', temperature: '', weight_kg: '', height_cm: '' });
  const [isListening, setIsListening] = useState(false);

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSearchMRN = async (e) => {
	e.preventDefault();
	if (!searchMrn.trim()) return;
	
	setLoading(true); setActiveTicket(null); setPatientProfile(null); setMessage({ type: '', text: '' });

	try {
	  const { data: ticket, error: ticketError } = await supabase.from('tickets').select('*').eq('id', searchMrn.trim()).single();
	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");
	  
	  if (ticket.status !== 'awaiting_doctor' && ticket.status !== 'triage_pending') {
		throw new Error(`Ticket is at status: ${ticket.status.replace(/_/g, ' ')}. It is not available for consultation.`);
	  }

	  const { data: patient, error: patientError } = await supabase.from('patient_files').select('*').eq('id', ticket.patient_id).single();
	  if (patientError) throw new Error("Could not retrieve patient master file.");

	  setActiveTicket(ticket);
	  setPatientProfile(patient);
	  
	  setVitals({
		blood_pressure: ticket.blood_pressure || '',
		heart_rate: ticket.heart_rate || '',
		temperature: ticket.temperature || '',
		weight_kg: ticket.weight_kg || '',
		height_cm: ticket.height_cm || ''
	  });
	  
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  const toggleVoiceDictation = (field) => {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) {
	  showMessage('error', 'Voice recognition is not supported in your browser. Please use Chrome or Edge.');
	  return;
	}

	if (isListening === field) {
	  setIsListening(false);
	  return;
	}

	const recognition = new SpeechRecognition();
	recognition.lang = 'en-US';
	recognition.interimResults = false;
	
	recognition.onstart = () => setIsListening(field);
	recognition.onresult = (event) => {
	  const transcript = event.results[0][0].transcript;
	  setConsult(prev => ({ 
		...prev, 
		[field]: prev[field] ? `${prev[field]} ${transcript}` : transcript 
	  }));
	};
	recognition.onerror = (event) => {
	  showMessage('error', `Voice dictation error: ${event.error}`);
	  setIsListening(false);
	};
	recognition.onend = () => setIsListening(false);

	recognition.start();
  };

  const handlePushToPharmacy = async (e) => {
	e.preventDefault();
	setLoading(true);
	try {
	  const updatePayload = {
		diagnosis: consult.diagnosis,
		symptoms: consult.symptoms,
		prescribed_meds: consult.prescribed_meds,
		status: 'awaiting_pharmacy'
	  };

	  if (activeTicket.status === 'triage_pending') {
		updatePayload.blood_pressure = vitals.blood_pressure;
		updatePayload.heart_rate = vitals.heart_rate;
		updatePayload.temperature = vitals.temperature;
		updatePayload.weight_kg = vitals.weight_kg;
		updatePayload.height_cm = vitals.height_cm;
	  }

	  const { error } = await supabase.from('tickets').update(updatePayload).eq('id', activeTicket.id);
	  if (error) throw error;

	  showMessage('success', `Consultation logged. Ticket #${activeTicket.id} routed to Pharmacy.`);
	  setActiveTicket(null); setPatientProfile(null); setSearchMrn('');
	  setConsult({ diagnosis: '', symptoms: '', prescribed_meds: '' });
	} catch (err) { showMessage('error', "Error saving consultation: " + err.message); } finally { setLoading(false); }
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  
	  {/* 3 ISOLATED MEDICAL DICTIONARY DATALISTS */}
	  <datalist id="symptoms-dict">
		<option value="Headache and Dizziness" />
		<option value="Shortness of Breath (Dyspnea)" />
		<option value="Chest Pain" />
		<option value="Nausea and Vomiting" />
		<option value="Fever and Chills" />
		<option value="Abdominal Pain" />
	  </datalist>

	  <datalist id="diagnosis-dict">
		<option value="Essential (Primary) Hypertension" />
		<option value="Type 2 Diabetes Mellitus" />
		<option value="Acute Upper Respiratory Infection" />
		<option value="Urinary Tract Infection, Unspecified" />
		<option value="Gastroesophageal Reflux Disease (GERD)" />
		<option value="Migraine without Aura" />
	  </datalist>

	  <datalist id="rx-dict">
		<option value="Amoxicillin 500mg - 1 capsule PO TID x 7 days" />
		<option value="Ibuprofen 400mg - 1 tablet PO PRN for pain" />
		<option value="Lisinopril 10mg - 1 tablet PO QD" />
		<option value="Omeprazole 20mg - 1 capsule PO QD" />
		<option value="Metformin 500mg - 1 tablet PO BID with meals" />
	  </datalist>

	  <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
	  
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Physician Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">Clinical Consultation</h1>
		</div>
		
		<form onSubmit={handleSearchMRN} className="flex bg-white dark:bg-slate-900 backdrop-blur-md p-2 rounded-2xl w-full md:w-[400px] border border-slate-300 dark:border-slate-700 shadow-lg">
		  <input required type="text" value={searchMrn} onChange={e => setSearchMrn(e.target.value)} className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0" placeholder="Scan or Enter MRN Ticket..." />
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"><Search className="w-4 h-4"/> Lookup</button>
		</form>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  <div className="relative z-10">
		{!activeTicket && !loading ? (
		  <div className="h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
			<FileText className="w-16 h-16 opacity-20 mb-4" />
			<p className="font-bold uppercase tracking-widest text-sm">Enter a Ticket MRN to begin Consultation</p>
		  </div>
		) : loading && !activeTicket ? (
		  <div className="h-[500px] flex items-center justify-center text-indigo-500 font-bold uppercase tracking-widest animate-pulse">Retrieving Encrypted File...</div>
		) : activeTicket && patientProfile ? (
		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			<div className="lg:col-span-1 space-y-6">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 backdrop-blur-xl">
				<h3 className="font-black text-xl text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">{patientProfile.full_name}</h3>
				<div className="space-y-4 text-sm mb-6">
				  <div className="grid grid-cols-2 gap-4">
					<div><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">DOB</div><div className="font-bold">{patientProfile.date_of_birth}</div></div>
					<div><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sex / Blood</div><div className="font-bold">{patientProfile.sex} | {patientProfile.blood_group}</div></div>
				  </div>
				  <div><div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Medical History</div><div className="text-slate-600 dark:text-slate-400 italic text-xs">{patientProfile.medical_history || 'None'}</div></div>
				</div>

				<div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/50">
				  <div className="flex justify-between items-center mb-3">
					<h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3"/> Triage Vitals</h4>
					{activeTicket.status === 'triage_pending' && <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase">Nurse Bypassed</span>}
				  </div>
				  <div className="grid grid-cols-2 gap-3 font-mono text-sm">
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">BP</span> <span className="font-bold">{vitals.blood_pressure || '--'}</span></div>
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">HR</span> <span className="font-bold">{vitals.heart_rate || '--'}</span></div>
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">Temp</span> <span className="font-bold">{vitals.temperature ? `${vitals.temperature}°C` : '--'}</span></div>
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">Weight</span> <span className="font-bold">{vitals.weight_kg ? `${vitals.weight_kg}kg` : '--'}</span></div>
				  </div>
				  <div className="mt-3 text-xs text-indigo-800 dark:text-indigo-200 border-t border-indigo-200/50 dark:border-indigo-800 pt-2"><strong>Nurse Notes:</strong> {activeTicket.nurse_notes || 'No notes provided.'}</div>
				</div>
			  </div>
			</div>

			<div className="lg:col-span-2">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 backdrop-blur-xl h-full">
				<h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4"><ClipboardList className="w-5 h-5 text-indigo-500"/> Examination & Diagnosis</h2>
				
				<form onSubmit={handlePushToPharmacy} className="space-y-6">
				  
				  {activeTicket.status === 'triage_pending' && (
					<div className="p-5 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 mb-6">
					  <div className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Direct Entry: Missing Vitals</div>
					  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">BP</label><input type="text" value={vitals.blood_pressure} onChange={e => setVitals({...vitals, blood_pressure: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none" placeholder="120/80" /></div>
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">HR</label><input type="number" value={vitals.heart_rate} onChange={e => setVitals({...vitals, heart_rate: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none" placeholder="BPM" /></div>
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Temp</label><input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none" placeholder="°C" /></div>
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Weight</label><input type="number" step="0.1" value={vitals.weight_kg} onChange={e => setVitals({...vitals, weight_kg: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none" placeholder="KG" /></div>
					  </div>
					</div>
				  )}

				  <div>
					<div className="flex justify-between items-end mb-2">
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Reported Symptoms</label>
					  <button type="button" onClick={() => toggleVoiceDictation('symptoms')} className={`text-xs font-bold flex items-center gap-1 ${isListening === 'symptoms' ? 'text-red-500 animate-pulse' : 'text-indigo-500 hover:text-indigo-600'}`}>
						{isListening === 'symptoms' ? <><MicOff className="w-3 h-3"/> Recording...</> : <><Mic className="w-3 h-3"/> Dictate</>}
					  </button>
					</div>
					{/* CRITICAL FIX: Changed to input and attached specific list */}
					<input required autoComplete="off" list="symptoms-dict" type="text" value={consult.symptoms} onChange={e => setConsult({...consult, symptoms: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Patient complains of..." />
				  </div>
				  
				  <div>
					<div className="flex justify-between items-end mb-2">
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><BookOpen className="w-3 h-3"/> Physician Diagnosis</label>
					  <button type="button" onClick={() => toggleVoiceDictation('diagnosis')} className={`text-xs font-bold flex items-center gap-1 ${isListening === 'diagnosis' ? 'text-red-500 animate-pulse' : 'text-indigo-500 hover:text-indigo-600'}`}>
						{isListening === 'diagnosis' ? <><MicOff className="w-3 h-3"/> Recording...</> : <><Mic className="w-3 h-3"/> Dictate</>}
					  </button>
					</div>
					<input required autoComplete="off" list="diagnosis-dict" type="text" value={consult.diagnosis} onChange={e => setConsult({...consult, diagnosis: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Search dictionary or type diagnosis..." />
				  </div>
				  
				  <div>
					<div className="flex justify-between items-end mb-2">
					  <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Prescribed Medications (Rx)</label>
					  <button type="button" onClick={() => toggleVoiceDictation('prescribed_meds')} className={`text-xs font-bold flex items-center gap-1 ${isListening === 'prescribed_meds' ? 'text-red-500 animate-pulse' : 'text-indigo-500 hover:text-indigo-600'}`}>
						{isListening === 'prescribed_meds' ? <><MicOff className="w-3 h-3"/> Recording...</> : <><Mic className="w-3 h-3"/> Dictate</>}
					  </button>
					</div>
					{/* CRITICAL FIX: Changed to input and attached specific list */}
					<input required autoComplete="off" list="rx-dict" type="text" value={consult.prescribed_meds} onChange={e => setConsult({...consult, prescribed_meds: e.target.value})} className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/50 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-400" placeholder="Search Medication (e.g. Amoxicillin...)" />
				  </div>

				  <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
					{loading ? 'Processing...' : <>Sign off & Route to Pharmacy <ChevronRight className="w-5 h-5"/></>}
				  </button>
				</form>
			  </div>
			</div>
		  </div>
		) : null}
	  </div>
	</div>
  );
}