import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Activity, Heart, Thermometer, Hash, ChevronRight, Search, User, ClipboardList, ShieldAlert, CheckCircle } from 'lucide-react';

export default function NurseDashboard() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [activeTicket, setActiveTicket] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  
  const [vitals, setVitals] = useState({ 
	blood_pressure: '', heart_rate: '', temperature: '', weight_kg: '', nurse_notes: '' 
  });

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // 1. LOOKUP BY MRN
  const handleSearchMRN = async (e) => {
	e.preventDefault();
	if (!searchMrn.trim()) return;
	
	setLoading(true);
	setActiveTicket(null);
	setPatientProfile(null);
	setMessage({ type: '', text: '' });

	try {
	  // Fetch Ticket
	  const { data: ticket, error: ticketError } = await supabase
		.from('tickets')
		.select('*')
		.eq('id', searchMrn.trim())
		.single();

	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");
	  
	  // FIXED: Look for 'triage_pending' instead of 'awaiting_triage'
	  if (ticket.status !== 'triage_pending') {
		throw new Error(`Ticket is currently at status: ${ticket.status.replace(/_/g, ' ')}. It is not in the Triage queue.`);
	  }

	  // Fetch Patient Master Record
	  const { data: patient, error: patientError } = await supabase
		.from('patient_files')
		.select('*')
		.eq('id', ticket.patient_id)
		.single();

	  if (patientError) throw new Error("Could not retrieve patient master file.");

	  setActiveTicket(ticket);
	  setPatientProfile(patient);
	  
	} catch (err) {
	  showMessage('error', err.message);
	} finally {
	  setLoading(false);
	}
  };

  // 2. SUBMIT VITALS
  const handlePushToDoctor = async (e) => {
	e.preventDefault();
	setLoading(true);
	try {
	  const { error } = await supabase.from('tickets').update({
		blood_pressure: vitals.blood_pressure,
		heart_rate: vitals.heart_rate,
		temperature: vitals.temperature,
		weight_kg: vitals.weight_kg,
		nurse_notes: vitals.nurse_notes,
		status: 'awaiting_doctor' // Routes it to the Doctor!
	  }).eq('id', activeTicket.id);

	  if (error) throw error;

	  showMessage('success', `Vitals recorded. Ticket #${activeTicket.id} routed to Doctor queue.`);
	  setActiveTicket(null);
	  setPatientProfile(null);
	  setSearchMrn('');
	  setVitals({ blood_pressure: '', heart_rate: '', temperature: '', weight_kg: '', nurse_notes: '' });
	} catch (err) {
	  showMessage('error', "Error saving vitals: " + err.message);
	} finally {
	  setLoading(false);
	}
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  {/* AMBIENT GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
	  
	  {/* HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nursing Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Triage & Vitals
		  </h1>
		</div>
		
		{/* MRN SEARCH BAR */}
		<form onSubmit={handleSearchMRN} className="flex bg-white dark:bg-slate-900 backdrop-blur-md p-2 rounded-2xl w-full md:w-[400px] border border-slate-300 dark:border-slate-700 shadow-lg">
		  <input 
			required
			type="text" 
			value={searchMrn} 
			onChange={e => setSearchMrn(e.target.value)}
			className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0" 
			placeholder="Scan or Enter MRN Ticket..."
		  />
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
			<Search className="w-4 h-4"/> Lookup
		  </button>
		</form>
	  </div>

	  {/* ALERTS */}
	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
		  {message.text}
		</div>
	  )}

	  {/* MAIN CONTENT AREA */}
	  <div className="relative z-10">
		{!activeTicket && !loading ? (
		  <div className="h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
			<Activity className="w-16 h-16 opacity-20 mb-4" />
			<p className="font-bold uppercase tracking-widest text-sm">Enter a Ticket MRN to begin Triage</p>
		  </div>
		) : loading && !activeTicket ? (
		  <div className="h-[500px] flex items-center justify-center text-blue-500 font-bold uppercase tracking-widest animate-pulse">
			Accessing Secure Records...
		  </div>
		) : activeTicket && patientProfile ? (
		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			{/* LEFT: PATIENT CONTEXT */}
			<div className="lg:col-span-1 space-y-6">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 backdrop-blur-xl">
				<div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
				  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center"><User className="w-6 h-6"/></div>
				  <div>
					<h3 className="font-black text-lg text-slate-900 dark:text-white">{patientProfile.full_name}</h3>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">DOB: {patientProfile.date_of_birth || 'N/A'}</div>
				  </div>
				</div>
				
				<div className="space-y-4 text-sm">
				  <div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Sex & Blood Type</div>
					<div className="font-bold text-slate-800 dark:text-slate-200">{patientProfile.sex || 'U'} | {patientProfile.blood_group || 'Unknown'}</div>
				  </div>
				  <div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Medical History / Allergies</div>
					<div className="font-medium text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 italic">
					  {patientProfile.medical_history || 'No prior medical history on file.'}
					</div>
				  </div>
				  <div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Front Desk Request</div>
					<div className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
					  {activeTicket.services_requested}
					</div>
				  </div>
				</div>
			  </div>
			</div>

			{/* RIGHT: VITALS ENTRY */}
			<div className="lg:col-span-2">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 backdrop-blur-xl h-full">
				<h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
				  <ClipboardList className="w-5 h-5 text-blue-500"/> Clinical Vitals Intake
				</h2>
				
				<form onSubmit={handlePushToDoctor} className="space-y-6">
				  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Heart className="w-3 h-3 text-red-500"/> Blood Pressure</label>
					  <input required type="text" value={vitals.blood_pressure} onChange={e => setVitals({...vitals, blood_pressure: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white" placeholder="120/80 mmHg" />
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3 text-blue-500"/> Heart Rate</label>
					  <input required type="number" value={vitals.heart_rate} onChange={e => setVitals({...vitals, heart_rate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white" placeholder="BPM" />
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Thermometer className="w-3 h-3 text-amber-500"/> Core Temp</label>
					  <input required type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white" placeholder="°C" />
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Hash className="w-3 h-3 text-emerald-500"/> Body Weight</label>
					  <input required type="number" step="0.1" value={vitals.weight_kg} onChange={e => setVitals({...vitals, weight_kg: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white" placeholder="KG" />
					</div>
				  </div>

				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Triage Observation Notes</label>
					<textarea value={vitals.nurse_notes} onChange={e => setVitals({...vitals, nurse_notes: e.target.value})} rows="4" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Patient appears stable. Complains of mild headaches..."></textarea>
				  </div>

				  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-2">
					{loading ? 'Processing...' : <>Clear for Doctor Examination <ChevronRight className="w-5 h-5"/></>}
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