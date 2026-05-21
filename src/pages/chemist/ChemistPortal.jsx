import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Search, Pill, FlaskConical, CheckCircle } from 'lucide-react';

export default function ChemistPortal() {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [chemistNotes, setChemistNotes] = useState('');
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
	  if (data.status !== 'waiting_for_pharmacy') {
		alert(`This ticket is not ready for the pharmacy. Current Status: ${data.status.toUpperCase()}`);
		return;
	  }
	  setTicket(data);
	  setChemistNotes('');
	} else {
	  alert("Ticket ID not found.");
	}
  };

  const handleDispense = async (e) => {
	e.preventDefault();
	setLoading(true);

	await supabase
	  .from('tickets')
	  .update({
		pharmacy_notes: chemistNotes,
		status: 'discharged' // Ends the hospital chain!
	  })
	  .eq('id', ticket.id);

	setSuccess(true);
	setTicket(null);
	setTicketId('');
	setLoading(false);
  };

  return (
	<div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
	  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
		<h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
		  <FlaskConical className="w-7 h-7 text-amber-600" /> Pharmacy & Dispensing Unit
		</h1>
	  </div>

	  {/* ID Lookup */}
	  <form onSubmit={lookupTicket} className="flex gap-2">
		<input required type="number" value={ticketId} onChange={e => setTicketId(e.target.value)} className="flex-1 border dark:border-slate-800 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500" placeholder="Scan or enter Patient Ticket ID..."/>
		<button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition">
		  <Search className="w-4 h-4"/> Fetch Prescription
		</button>
	  </form>

	  {success && <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-xl text-center shadow-sm">Medication dispensed successfully. Patient has been discharged.</div>}

	  {ticket && (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
		  
		  {/* LEFT: Doctor's Prescription View */}
		  <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900/50 space-y-4 shadow-sm">
			<div className="border-b border-amber-200 dark:border-amber-900/50 pb-2">
			  <span className="text-xs font-bold uppercase text-amber-700 dark:text-amber-500 tracking-wider">Clinical Orders</span>
			  <h3 className="font-black text-slate-900 dark:text-white text-lg mt-0.5">{ticket.patient_name}</h3>
			  <div className="text-xs text-slate-500 font-medium mt-1">Ticket: #{ticket.id} | Prescribing Dr. {ticket.doctor_name}</div>
			</div>

			<div>
			  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Diagnosis Context</div>
			  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800">{ticket.diagnosis || 'No diagnosis provided.'}</p>
			</div>

			<div>
			  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 flex items-center gap-1"><Pill className="w-3 h-3 text-amber-600"/> Prescribed Medications</div>
			  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border-2 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white font-mono text-sm leading-relaxed whitespace-pre-wrap">
				{ticket.prescribed_meds || 'No medications prescribed by physician.'}
			  </div>
			</div>
		  </div>

		  {/* RIGHT: Chemist Dispensing Action */}
		  <form onSubmit={handleDispense} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
			<h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600"/> Dispensing Confirmation</h2>
			
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Pharmacist Notes / Warnings Provided</label>
			  <textarea required value={chemistNotes} onChange={e=>setChemistNotes(e.target.value)} rows="4" className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="Dispensed exactly as prescribed. Instructed patient to take after meals..."></textarea>
			</div>

			<button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-lg shadow-md transition uppercase tracking-widest text-sm">
			  {loading ? 'Processing...' : 'Mark as Dispensed & Discharge Patient'}
			</button>
		  </form>

		</div>
	  )}
	</div>
  );
}