import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  FileText, ChevronRight, Search, User, 
  ClipboardList, ShieldAlert, CheckCircle, 
  Activity, Mic, MicOff, BookOpen, Clock, RefreshCcw
} from 'lucide-react';

export default function DoctorDashboard() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // LIVE QUEUE STATE
  const [pendingQueue, setPendingQueue] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  
  const [consult, setConsult] = useState({ diagnosis: '', symptoms: '', prescribed_meds: '' });
  const [vitals, setVitals] = useState({ blood_pressure: '', heart_rate: '', temperature: '', weight_kg: '', height_cm: '' });
  const [isListening, setIsListening] = useState(false);

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // FETCH ALL PATIENTS WAITING FOR A DOCTOR OR TRIAGE
  const fetchDoctorQueue = async () => {
	try {
	  const { data, error } = await supabase
		.from('tickets')
		.select('id, patient_name, services_requested, status, created_at')
		.in('status', ['triage_pending', 'awaiting_doctor'])
		.order('created_at', { ascending: true });
	  
	  if (error) throw error;
	  if (data) setPendingQueue(data);
	} catch (err) {
	  console.error("Error fetching doctor queue:", err.message);
	}
  };

  useEffect(() => {
	fetchDoctorQueue();
  }, []);

  // LOAD THE TICKET CLIKED FROM THE QUEUE
  const loadTicketData = async (ticketId) => {
	setLoading(true); setActiveTicket(null); setPatientProfile(null); setMessage({ type: '', text: '' });

	try {
	  const { data: ticket, error: ticketError } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");

	  const { data: patient, error: patientError } = await supabase.from('patient_files').select('*').eq('id', ticket.patient_id).single();
	  if (patientError) throw new Error("Could not retrieve patient master file.");

	  setActiveTicket(ticket);
	  setPatientProfile(patient);
	  setSearchMrn('');
	  
	  setVitals({
		blood_pressure: ticket.blood_pressure || '',
		heart_rate: ticket.heart_rate || '',
		temperature: ticket.temperature || '',
		weight_kg: ticket.weight_kg || '',
		height_cm: ticket.height_cm || ''
	  });
	  
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  const handleSearchMRN = (e) => {
	e.preventDefault();
	if (searchMrn.trim()) loadTicketData(searchMrn.trim());
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
	  setConsult(prev => ({ ...prev, [field]: prev[field] ? `${prev[field]} ${transcript}` : transcript }));
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
	  fetchDoctorQueue();
	} catch (err) { showMessage('error', "Error saving consultation: " + err.message); } finally { setLoading(false); }
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  
	  {/* ==================================================== */}
	  {/* EXTENSIVE MEDICAL DICTIONARY DATALISTS               */}
	  {/* ==================================================== */}
	  <datalist id="symptoms-dict">
		{/* Cardiorespiratory Symptoms */}
		<option value="Acute Chest Pain (Retrosternal, crushing)" />
		<option value="Dyspnea on exertion (Shortness of breath)" />
		<option value="Paroxysmal Nocturnal Dyspnea (PND)" />
		<option value="Orthopnea (Difficulty breathing laying down)" />
		<option value="Productive Cough with purulent sputum" />
		<option value="Hemoptysis (Coughing up blood)" />
		<option value="Palpitations (Irregular heartbeats)" />
		<option value="Stridor and Wheezing" />
		{/* Gastrointestinal Symptoms */}
		<option value="Epigastric Pain (Burning, postprandial)" />
		<option value="Acute Abdominal Pain (Right Lower Quadrant tenderness)" />
		<option value="Dysphagia (Difficulty swallowing)" />
		<option value="Nausea, emesis, and dehydration" />
		<option value="Hematemesis (Vomiting blood)" />
		<option value="Melena (Dark tarry stools)" />
		{/* Neurological & Systemic Symptoms */}
		<option value="Syncope (Transient loss of consciousness)" />
		<option value="Severe Unilateral Throbbing Headache" />
		<option value="Vertigo and Tinnitus" />
		<option value="Paresthesia (Numbness/tingling in extremities)" />
		<option value="Generalized Myalgia and Arthralgia" />
		<option value="Polyuria, Polydipsia, and Polyphagia" />
		<option value="Diaphoresis (Profuse sweating)" />
	  </datalist>

	  <datalist id="diagnosis-dict">
		{/* Cardiovascular & Metabolic */}
		<option value="I10 - Essential (Primary) Hypertension" />
		<option value="E11.9 - Type 2 Diabetes Mellitus without complications" />
		<option value="E78.5 - Hyperlipidemia, Unspecified" />
		<option value="I25.10 - Atherosclerotic heart disease of native coronary artery" />
		<option value="I48.91 - Unspecified Atrial Fibrillation" />
		{/* Respiratory & Infectious */}
		<option value="J06.9 - Acute Upper Respiratory Infection, Unspecified" />
		<option value="J20.9 - Acute Bronchitis, Unspecified" />
		<option value="J45.909 - Unspecified Asthma, uncomplicated" />
		<option value="N39.0 - Urinary Tract Infection, site not specified" />
		<option value="A09 - Infectious Gastroenteritis and Colitis" />
		{/* Gastrointestinal & Musculoskeletal */}
		<option value="K21.9 - Gastroesophageal Reflux Disease (GERD) without esophagitis" />
		<option value="M19.90 - Unspecified Osteoarthritis, unspecified site" />
		<option value="M54.50 - Low Back Pain, Unspecified" />
		<option value="G43.909 - Migraine, Unspecified, not intractable" />
		<option value="R07.9 - Chest Pain, Unspecified" />
	  </datalist>

	  <datalist id="rx-dict">
		{/* Cardiovascular / Antihypertensive */}
		<option value="Lisinopril 10mg - 1 tablet PO QD" />
		<option value="Amlodipine Besylate 5mg - 1 tablet PO QD" />
		<option value="Atorvastatin Calcium 20mg - 1 tablet PO HS" />
		<option value="Metoprolol Succinate 50mg - 1 tablet PO QD" />
		{/* Antidiabetic / Metabolic */}
		<option value="Metformin HCl 500mg - 1 tablet PO BID with meals" />
		<option value="Sitagliptin Phosphate 100mg - 1 tablet PO QD" />
		{/* Antibiotics & Gastrointestinal */}
		<option value="Amoxicillin 500mg - 1 capsule PO TID x 7 days" />
		<option value="Azithromycin 250mg - 2 tabs PO day 1, then 1 tab PO QD x 4 days" />
		<option value="Ciprofloxacin 500mg - 1 tablet PO BID x 5 days" />
		<option value="Omeprazole 20mg - 1 capsule PO AC daily" />
		{/* Analgesics & Respiratory */}
		<option value="Ibuprofen 400mg - 1 tablet PO Q6H PRN for pain" />
		<option value="Acetaminophen 500mg - 1-2 tablets PO Q6H PRN pain/fever" />
		<option value="Albuterol HFA Inhaler - 2 puffs MDI Q4H PRN shortness of breath" />
		<option value="Montelukast Sodium 10mg - 1 tablet PO HS" />
	  </datalist>

	  <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
	  
	  {/* TOP HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Physician Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">Clinical Consultation</h1>
		</div>
		
		{/* OVERRIDE SCAN BAR */}
		<form onSubmit={handleSearchMRN} className="flex bg-white dark:bg-slate-900 backdrop-blur-md p-2 rounded-2xl w-full md:w-[400px] border border-slate-300 dark:border-slate-700 shadow-lg">
		  <input type="text" value={searchMrn} onChange={e => setSearchMrn(e.target.value)} className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0" placeholder="Scan override / Input MRN..." />
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"><Search className="w-4 h-4"/> Fetch</button>
		</form>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  {/* DASHBOARD SWITCHBOARD */}
	  <div className="relative z-10">
		{!activeTicket && !loading ? (
		  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
			<div className="flex items-center justify-between">
			  <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-500"/> Active Consultation Waitlist</h3>
			  <button onClick={fetchDoctorQueue} className="text-xs font-bold text-indigo-600 flex items-center gap-1.5 hover:underline"><RefreshCcw className="w-3.5 h-3.5"/> Re-sync Live Triage</button>
			</div>
			
			{pendingQueue.length === 0 ? (
			  <div className="h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40">
				<CheckCircle className="w-12 h-12 opacity-20 mb-3 text-emerald-500" />
				<p className="font-bold uppercase tracking-widest text-sm">All Clinical Queues Clear</p>
			  </div>
			) : (
			  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{pendingQueue.map(ticket => (
				  <div key={ticket.id} onClick={() => loadTicketData(ticket.id)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
					<div className="flex justify-between items-start mb-4">
					  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><User className="w-5 h-5"/></div>
					  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${ticket.status === 'triage_pending' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
						{ticket.status === 'triage_pending' ? 'Bypass Nurse' : 'Ready'}
					  </span>
					</div>
					<h4 className="font-black text-lg text-slate-900 dark:text-white mb-1">{ticket.patient_name || 'Unknown Patient'}</h4>
					<p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-4 line-clamp-1">{ticket.services_requested}</p>
					<div className="text-[10px] font-mono text-slate-400">MRN ID: {String(ticket.id)}</div>
				  </div>
				))}
			  </div>
			)}
		  </div>
		) : loading && !activeTicket ? (
		  <div className="h-[500px] flex items-center justify-center text-indigo-500 font-bold uppercase tracking-widest animate-pulse">Retrieving Encrypted File...</div>
		) : activeTicket && patientProfile ? (
		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			{/* VITALS PANEL */}
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
				<button onClick={() => { setActiveTicket(null); fetchDoctorQueue(); }} className="mt-6 w-full text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest text-center">← Release File & Return to Waitlist</button>
			  </div>
			</div>

			{/* CONSULTATION CLINICAL WORKSPACE */}
			<div className="lg:col-span-2">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 backdrop-blur-xl h-full">
				<h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4"><ClipboardList className="w-5 h-5 text-indigo-500"/> Examination & Diagnosis</h2>
				
				<form onSubmit={handlePushToPharmacy} className="space-y-6">
				  
				  {activeTicket.status === 'triage_pending' && (
					<div className="p-5 border-2 border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl bg-indigo-50/30 dark:bg-indigo-900/10 mb-6 animate-in zoom-in-95">
					  <div className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Direct Entry: Missing Vitals</div>
					  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">BP</label><input type="text" value={vitals.blood_pressure} onChange={e => setVitals({...vitals, blood_pressure: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" placeholder="120/80" /></div>
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">HR</label><input type="number" value={vitals.heart_rate} onChange={e => setVitals({...vitals, heart_rate: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" placeholder="BPM" /></div>
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Temp</label><input type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" placeholder="°C" /></div>
						<div><label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Weight</label><input type="number" step="0.1" value={vitals.weight_kg} onChange={e => setVitals({...vitals, weight_kg: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500" placeholder="KG" /></div>
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
					<input required autoComplete="off" list="symptoms-dict" type="text" value={consult.symptoms} onChange={e => setConsult({...consult, symptoms: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white" placeholder="Type symptoms or use dropdown suggestions..." />
				  </div>
				  
				  <div>
					<div className="flex justify-between items-end mb-2">
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><BookOpen className="w-3 h-3"/> Physician Diagnosis</label>
					  <button type="button" onClick={() => toggleVoiceDictation('diagnosis')} className={`text-xs font-bold flex items-center gap-1 ${isListening === 'diagnosis' ? 'text-red-500 animate-pulse' : 'text-indigo-500 hover:text-indigo-600'}`}>
						{isListening === 'diagnosis' ? <><MicOff className="w-3 h-3"/> Recording...</> : <><Mic className="w-3 h-3"/> Dictate</>}
					  </button>
					</div>
					<input required autoComplete="off" list="diagnosis-dict" type="text" value={consult.diagnosis} onChange={e => setConsult({...consult, diagnosis: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white" placeholder="Search standard ICD codes..." />
				  </div>
				  
				  <div>
					<div className="flex justify-between items-end mb-2">
					  <label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Prescribed Medications (Rx)</label>
					  <button type="button" onClick={() => toggleVoiceDictation('prescribed_meds')} className={`text-xs font-bold flex items-center gap-1 ${isListening === 'prescribed_meds' ? 'text-red-500 animate-pulse' : 'text-indigo-500 hover:text-indigo-600'}`}>
						{isListening === 'prescribed_meds' ? <><MicOff className="w-3 h-3"/> Recording...</> : <><Mic className="w-3 h-3"/> Dictate</>}
					  </button>
					</div>
					<input required autoComplete="off" list="rx-dict" type="text" value={consult.prescribed_meds} onChange={e => setConsult({...consult, prescribed_meds: e.target.value})} className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/50 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-400" placeholder="Search operational formulary..." />
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