import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Search, HeartPulse, Activity } from 'lucide-react';

export default function NursePortal() {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [vitals, setVitals] = useState({ bp: '', temp: '', hr: '', weight: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const lookupTicket = async (e) => {
	e.preventDefault();
	setTicket(null);
	setSuccess(false);
	
	const { data } = await supabase
	  .from('tickets')
	  .select('*')
	  .eq('id', ticketId)
	  .single();

	if (data) {
	  setTicket(data);
	  setVitals({ bp: data.blood_pressure || '', temp: data.temperature || '', hr: data.heart_rate || '', weight: data.weight_kg || '', notes: data.nurse_notes || '' });
	} else {
	  alert("Ticket ID not found in system registers.");
	}
  };

  const handleSaveVitals = async (e) => {
	e.preventDefault();
	setLoading(true);

	await supabase
	  .from('tickets')
	  .update({
		blood_pressure: vitals.bp,
		temperature: parseFloat(vitals.temp),
		heart_rate: parseInt(vitals.hr),
		weight_kg: parseFloat(vitals.weight),
		nurse_notes: vitals.notes,
		status: 'waiting_for_doctor'
	  })
	  .eq('id', ticket.id);

	setSuccess(true);
	setTicket(null);
	setTicketId('');
	setLoading(false);
  };

  return (
	<div className="max-w-2xl mx-auto space-y-6 p-4 md:p-6">
	  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
		<h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
		  <HeartPulse className="w-7 h-7 text-pink-500" /> Nursing Triage Station
		</h1>
	  </div>

	  <form onSubmit={lookupTicket} className="flex gap-2">
		<input required type="number" value={ticketId} onChange={e => setTicketId(e.target.value)} className="flex-1 border dark:border-slate-800 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-pink-500" placeholder="Scan or enter Ticket ID (e.g. 1)"/>
		<button type="submit" className="bg-slate-900 dark:bg-slate-800 hover:bg-black text-white px-5 rounded-xl font-bold text-sm flex items-center gap-2 transition">
		  <Search className="w-4 h-4"/> Fetch Chart
		</button>
	  </form>

	  {success && <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-xl text-center">Biometrics recorded. Routed directly to Physician.</div>}

	  {ticket && (
		<form onSubmit={handleSaveVitals} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
		  <div className="p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg">
			<div className="text-xs text-slate-500 font-bold uppercase">Patient Data Snapshot • Ticket #{ticket.id}</div>
			<div className="text-lg font-black text-slate-900 dark:text-white mt-1">{ticket.patient_name}</div>
			<div className="text-xs font-bold text-blue-500 mt-0.5">Assigned: Dr. {ticket.doctor_name}</div>
		  </div>

		  <div className="grid grid-cols-2 gap-4">
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">BP (mmHg)</label>
			  <input required type="text" value={vitals.bp} onChange={e=>setVitals({...vitals, bp: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono" placeholder="120/80"/>
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Temp (°C)</label>
			  <input required type="number" step="0.1" value={vitals.temp} onChange={e=>setVitals({...vitals, temp: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono" placeholder="36.5"/>
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Heart Rate (BPM)</label>
			  <input required type="number" value={vitals.hr} onChange={e=>setVitals({...vitals, hr: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono" placeholder="72"/>
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Weight (KG)</label>
			  <input type="number" step="0.1" value={vitals.weight} onChange={e=>setVitals({...vitals, weight: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono" placeholder="68.4"/>
			</div>
		  </div>

		  <div>
			<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vitals Observation Notes</label>
			<textarea value={vitals.notes} onChange={e=>setVitals({...vitals, notes: e.target.value})} rows="3" className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="Patient reporting sudden onset migraine..."></textarea>
		  </div>

		  <button type="submit" disabled={loading} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg shadow-md transition flex items-center justify-center gap-2">
			<Activity className="w-5 h-5"/> {loading ? 'Logging...' : 'Commit Parameters & Dispatch'}
		  </button>
		</form>
	  )}
	</div>
  );
}