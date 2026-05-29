import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Activity, Heart, Thermometer, Hash, ChevronRight, 
  Search, User, ClipboardList, ShieldAlert, CheckCircle, Ruler, Clock
} from 'lucide-react';

export default function NurseDashboard() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [pendingQueue, setPendingQueue] = useState([]);

  const [activeTicket, setActiveTicket] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  
  const [vitals, setVitals] = useState({ blood_pressure: '', heart_rate: '', temperature: '', weight_kg: '', height_cm: '', nurse_notes: '' });

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const calculateAge = (dobString) => {
	if (!dobString) return 'Unknown Age';
	const dob = new Date(dobString);
	const diffMs = Date.now() - dob.getTime();
	const ageDt = new Date(diffMs); 
	return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const fetchPendingQueue = async () => {
	try {
	  const { data, error } = await supabase
		.from('tickets')
		.select('id, patient_name, services_requested, created_at')
		.eq('status', 'triage_pending')
		.order('created_at', { ascending: true });
	  if (error) throw error;
	  if (data) setPendingQueue(data);
	} catch (err) {
	  console.error("Error fetching queue:", err.message);
	}
  };

  useEffect(() => { fetchPendingQueue(); }, []);

  const loadTicketData = async (ticketId) => {
	setLoading(true); setActiveTicket(null); setPatientProfile(null); setMessage({ type: '', text: '' });

	try {
	  const { data: ticket, error: ticketError } = await supabase.from('tickets').select('*').eq('id', ticketId).single();
	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");
	  
	  if (ticket.status !== 'triage_pending') {
		throw new Error(`Ticket is currently at status: ${ticket.status}. It is not in the Triage queue.`);
	  }

	  const { data: patient, error: patientError } = await supabase.from('patient_files').select('*').eq('id', ticket.patient_id).single();
	  if (patientError) throw new Error("Could not retrieve patient master file.");

	  setActiveTicket(ticket);
	  setPatientProfile(patient);
	  setSearchMrn('');
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  const handleSearchMRN = (e) => {
	e.preventDefault();
	if (searchMrn.trim()) loadTicketData(searchMrn.trim());
  };

  const handlePushToDoctor = async (e) => {
	e.preventDefault();
	setLoading(true);
	try {
	  const { error } = await supabase.from('tickets').update({
		blood_pressure: vitals.blood_pressure,
		heart_rate: vitals.heart_rate,
		temperature: vitals.temperature,
		weight_kg: vitals.weight_kg,
		height_cm: vitals.height_cm,
		nurse_notes: vitals.nurse_notes,
		status: 'awaiting_doctor' 
	  }).eq('id', activeTicket.id);

	  if (error) throw error;

	  showMessage('success', `Vitals recorded. Ticket #${activeTicket.id} routed to Doctor queue.`);
	  setActiveTicket(null); setPatientProfile(null);
	  setVitals({ blood_pressure: '', heart_rate: '', temperature: '', weight_kg: '', height_cm: '', nurse_notes: '' });
	  fetchPendingQueue(); 
	} catch (err) { showMessage('error', "Error saving vitals: " + err.message); } finally { setLoading(false); }
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
	  
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nursing Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Triage & Vitals</h1>
		</div>
		
		<form onSubmit={handleSearchMRN} className="flex bg-white dark:bg-slate-900 backdrop-blur-md p-2 rounded-2xl w-full md:w-[400px] border border-slate-300 dark:border-slate-700 shadow-lg">
		  <input required type="text" value={searchMrn} onChange={e => setSearchMrn(e.target.value)} className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold placeholder:text-slate-400 focus:ring-0" placeholder="Fast lookup MRN..." />
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold active:scale-95 flex items-center gap-2"><Search className="w-4 h-4"/> Search</button>
		</form>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  <div className="relative z-10">
		{!activeTicket && !loading ? (
		  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="flex items-center justify-between mb-6">
			  <h3 className="font-black text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500"/> Pending Triage Queue</h3>
			  <button onClick={fetchPendingQueue} className="text-xs font-bold text-blue-600 hover:underline">Refresh Queue</button>
			</div>
			
			{pendingQueue.length === 0 ? (
			   <div className="h-[300px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40">
				<CheckCircle className="w-12 h-12 opacity-20 mb-3" />
				<p className="font-bold uppercase tracking-widest text-sm">Queue is empty</p>
			  </div>
			) : (
			  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{pendingQueue.map(ticket => (
				  <div key={ticket.id} onClick={() => loadTicketData(ticket.id)} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
					<div className="flex justify-between items-start mb-4">
					  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><User className="w-5 h-5"/></div>
					  {/* CRITICAL FIX: Cast ticket.id to String to prevent .substring() crash */}
					  <div className="text-[9px] font-mono font-black text-slate-400">MRN: {String(ticket.id).substring(0,8)}</div>
					</div>
					<h4 className="font-black text-lg text-slate-900 dark:text-white mb-1">{ticket.patient_name || 'Unknown Patient'}</h4>
					<p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-4 line-clamp-1">{ticket.services_requested}</p>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
					  Waited: {ticket.created_at ? Math.round((new Date() - new Date(ticket.created_at)) / 60000) : 0} mins
					</div>
				  </div>
				))}
			  </div>
			)}
		  </div>
		) : activeTicket && patientProfile ? (
		  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
			
			<div className="lg:col-span-1 space-y-6">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 backdrop-blur-xl">
				<div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
				  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><User className="w-6 h-6"/></div>
				  <div>
					<h3 className="font-black text-lg">{patientProfile.full_name}</h3>
					<div className="text-[10px] font-black uppercase text-white bg-blue-600 px-2 py-0.5 rounded inline-block mt-1 tracking-widest">Age: {calculateAge(patientProfile.date_of_birth)}</div>
				  </div>
				</div>
				
				<div className="space-y-4 text-sm">
				  <div><div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Sex & Blood Type</div><div className="font-bold">{patientProfile.sex || 'U'} | {patientProfile.blood_group || 'Unknown'}</div></div>
				  <div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Medical History / Allergies</div>
					<div className="font-medium text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border italic">{patientProfile.medical_history || 'No prior medical history on file.'}</div>
				  </div>
				  <div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Front Desk Request</div>
					<div className="font-bold text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100">{activeTicket.services_requested}</div>
				  </div>
				</div>
				<button onClick={() => { setActiveTicket(null); fetchPendingQueue(); }} className="mt-6 w-full text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest text-center">← Cancel & Back to Queue</button>
			  </div>
			</div>

			<div className="lg:col-span-2">
			  <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 backdrop-blur-xl h-full">
				<h2 className="text-xl font-black mb-6 flex items-center gap-2 border-b pb-4"><ClipboardList className="w-5 h-5 text-blue-500"/> Clinical Vitals Intake</h2>
				
				<form onSubmit={handlePushToDoctor} className="space-y-6">
				  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Heart className="w-3 h-3 inline text-red-500"/> Blood Pressure</label><input required type="text" value={vitals.blood_pressure} onChange={e => setVitals({...vitals, blood_pressure: e.target.value})} className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-4 text-sm font-bold" placeholder="120/80 mmHg" /></div>
					<div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Activity className="w-3 h-3 inline text-blue-500"/> Heart Rate</label><input required type="number" value={vitals.heart_rate} onChange={e => setVitals({...vitals, heart_rate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-4 text-sm font-bold" placeholder="BPM" /></div>
					<div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Thermometer className="w-3 h-3 inline text-amber-500"/> Core Temp</label><input required type="number" step="0.1" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-4 text-sm font-bold" placeholder="°C" /></div>
					
					<div className="grid grid-cols-2 gap-3">
						<div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Ruler className="w-3 h-3 inline text-purple-500"/> Height</label><input required type="number" step="1" value={vitals.height_cm} onChange={e => setVitals({...vitals, height_cm: e.target.value})} className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-4 text-sm font-bold" placeholder="CM" /></div>
						<div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Hash className="w-3 h-3 inline text-emerald-500"/> Weight</label><input required type="number" step="0.1" value={vitals.weight_kg} onChange={e => setVitals({...vitals, weight_kg: e.target.value})} className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-4 text-sm font-bold" placeholder="KG" /></div>
					</div>
				  </div>

				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Triage Observation Notes</label>
					<textarea value={vitals.nurse_notes} onChange={e => setVitals({...vitals, nurse_notes: e.target.value})} rows="4" className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl p-4 text-sm" placeholder="Patient appears stable..."></textarea>
				  </div>

				  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl active:scale-95 flex justify-center items-center gap-2">
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