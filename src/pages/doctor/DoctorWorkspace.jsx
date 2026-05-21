import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { FileText, ChevronRight, Search, User, ClipboardList, ShieldAlert, CheckCircle, Activity } from 'lucide-react';

export default function DoctorDashboard() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [activeTicket, setActiveTicket] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  
  const [consult, setConsult] = useState({ diagnosis: '', symptoms: '', prescribed_meds: '' });

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
	  const { data: ticket, error: ticketError } = await supabase
		.from('tickets')
		.select('*')
		.eq('id', searchMrn.trim())
		.single();

	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");
	  if (ticket.status !== 'awaiting_doctor') {
		throw new Error(`Ticket is currently at status: ${ticket.status.replace(/_/g, ' ')}. It is not in the Physician queue.`);
	  }

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

  // 2. SUBMIT CONSULTATION
  const handlePushToPharmacy = async (e) => {
	e.preventDefault();
	setLoading(true);
	try {
	  const { error } = await supabase.from('tickets').update({
		diagnosis: consult.diagnosis,
		symptoms: consult.symptoms,
		prescribed_meds: consult.prescribed_meds,
		status: 'awaiting_pharmacy'
	  }).eq('id', activeTicket.id);

	  if (error) throw error;

	  showMessage('success', `Consultation logged. Ticket #${activeTicket.id} routed to Pharmacy.`);
	  setActiveTicket(null);
	  setPatientProfile(null);
	  setSearchMrn('');
	  setConsult({ diagnosis: '', symptoms: '', prescribed_meds: '' });
	} catch (err) {
	  showMessage('error', "Error saving consultation: " + err.message);
	} finally {
	  setLoading(false);
	}
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  {/* AMBIENT GLOWS */}
	  <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
	  
	  {/* HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Physician Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Clinical Consultation
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
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
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
			<FileText className="w-16 h-16 opacity-20 mb-4" />
			<p className="font-bold uppercase tracking-widest text-sm">Enter a Ticket MRN to begin Consultation</p>
		  </div>
		) : loading && !activeTicket ? (
		  <div className="h-[500px] flex items-center justify-center text-indigo-500 font-bold uppercase tracking-widest animate-pulse">
			Retrieving Encrypted File...
		  </div>
		) : activeTicket && patientProfile ? (
		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			{/* LEFT: MASTER RECORD & VITALS */}
			<div className="lg:col-span-1 space-y-6">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 backdrop-blur-xl">
				
				<h3 className="font-black text-xl text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">{patientProfile.full_name}</h3>
				
				<div className="space-y-4 text-sm mb-6">
				  <div className="grid grid-cols-2 gap-4">
					<div>
					  <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">DOB</div>
					  <div className="font-bold">{patientProfile.date_of_birth}</div>
					</div>
					<div>
					  <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Sex / Blood</div>
					  <div className="font-bold">{patientProfile.sex} | {patientProfile.blood_group}</div>
					</div>
				  </div>
				  <div>
					<div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Medical History</div>
					<div className="text-slate-600 dark:text-slate-400 italic text-xs">{patientProfile.medical_history || 'None'}</div>
				  </div>
				</div>

				<div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-800/50">
				  <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Triage Vitals</h4>
				  <div className="grid grid-cols-2 gap-3 font-mono text-sm">
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">BP</span> <span className="font-bold">{activeTicket.blood_pressure}</span></div>
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">HR</span> <span className="font-bold">{activeTicket.heart_rate}</span></div>
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">Temp</span> <span className="font-bold">{activeTicket.temperature}°C</span></div>
					<div><span className="text-[9px] text-slate-500 block uppercase sans-serif">Weight</span> <span className="font-bold">{activeTicket.weight_kg}kg</span></div>
				  </div>
				  <div className="mt-3 text-xs text-indigo-800 dark:text-indigo-200 border-t border-indigo-200/50 dark:border-indigo-800 pt-2">
					<strong>Nurse Notes:</strong> {activeTicket.nurse_notes || 'No notes.'}
				  </div>
				</div>

			  </div>
			</div>

			{/* RIGHT: CONSULTATION ENTRY */}
			<div className="lg:col-span-2">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 backdrop-blur-xl h-full">
				<h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
				  <ClipboardList className="w-5 h-5 text-indigo-500"/> Examination & Diagnosis
				</h2>
				
				<form onSubmit={handlePushToPharmacy} className="space-y-6">
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Reported Symptoms</label>
					<textarea required value={consult.symptoms} onChange={e => setConsult({...consult, symptoms: e.target.value})} rows="3" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Patient complains of..."></textarea>
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Physician Diagnosis</label>
					<input required type="text" value={consult.diagnosis} onChange={e => setConsult({...consult, diagnosis: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white" placeholder="Primary diagnosis..." />
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">Prescribed Medications (Rx)</label>
					<textarea required value={consult.prescribed_meds} onChange={e => setConsult({...consult, prescribed_meds: e.target.value})} rows="5" className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/50 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300" placeholder="1. Medication Name - Dosage - Frequency..."></textarea>
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