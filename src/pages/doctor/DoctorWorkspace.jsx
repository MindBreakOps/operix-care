import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Search, Stethoscope, Clipboard, FileText } from 'lucide-react';

export default function DoctorWorkspace() {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [clinicalData, setClinicalData] = useState({ symptoms: '', diagnosis: '', plan: '' });
  const [loading, setLoading] = useState(false);
  const [completeMessage, setCompleteMessage] = useState(false);

  const lookupTicket = async (e) => {
	e.preventDefault();
	setTicket(null);
	setCompleteMessage(false);

	const { data } = await supabase
	  .from('tickets')
	  .select('*')
	  .eq('id', ticketId)
	  .single();

	if (data) {
	  setTicket(data);
	  setClinicalData({ symptoms: data.symptoms || '', diagnosis: data.diagnosis || '', plan: data.treatment_plan || '' });
	} else {
	  alert("No active clinical record corresponding to this ID.");
	}
  };

const handleFinalizeConsultation = async (e) => {
	  e.preventDefault();
	  setLoading(true);
  
	  // If they typed a treatment plan/prescription, send to Pharmacy. Otherwise, Discharge.
	  const nextStatus = clinicalData.plan.length > 5 ? 'waiting_for_pharmacy' : 'discharged';
  
	  await supabase
		.from('tickets')
		.update({
		  symptoms: clinicalData.symptoms,
		  diagnosis: clinicalData.diagnosis,
		  prescribed_meds: clinicalData.plan, // Send the plan to the pharmacy column!
		  status: nextStatus
		})
		.eq('id', ticket.id);
  
	  setCompleteMessage(`Encounter signed off. Patient routed to ${nextStatus === 'waiting_for_pharmacy' ? 'Pharmacy' : 'Discharge'}.`);
	  setTicket(null);
	  setTicketId('');
	  setLoading(false);
	};

  return (
	<div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
	  <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
		<h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
		  <Stethoscope className="w-7 h-7 text-emerald-600" /> Clinical Provider Workspace
		</h1>
	  </div>

	  <form onSubmit={lookupTicket} className="flex gap-2">
		<input required type="number" value={ticketId} onChange={e => setTicketId(e.target.value)} className="flex-1 border dark:border-slate-800 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Load electronic health record by Ticket ID..."/>
		<button type="submit" className="bg-slate-900 dark:bg-slate-800 hover:bg-black text-white px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition">
		  <Search className="w-4 h-4"/> Load Chart
		</button>
	  </form>

	  {completeMessage && <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-bold rounded-xl text-center shadow-sm">Consultation closed successfully. Case documentation archived.</div>}

	  {ticket && (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
		  
		  {/* Triage Panel */}
		  <div className="bg-slate-900 dark:bg-black text-slate-100 p-5 rounded-xl border border-slate-800 space-y-4 shadow-md md:col-span-1">
			<div className="border-b border-slate-800 pb-2">
			  <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Triage Metrics</span>
			  <h3 className="font-bold text-white truncate text-base mt-0.5">{ticket.patient_name}</h3>
			  <div className="text-xs text-emerald-400 font-medium">Record Ticket: #{ticket.id}</div>
			</div>

			<div className="space-y-2.5 font-mono text-xs">
			  <div className="flex justify-between border-b border-slate-800/60 pb-1.5"><span>BP:</span> <span className="font-bold text-white">{ticket.blood_pressure || 'N/A'} mmHg</span></div>
			  <div className="flex justify-between border-b border-slate-800/60 pb-1.5"><span>TEMP:</span> <span className="font-bold text-white">{ticket.temperature || 'N/A'} °C</span></div>
			  <div className="flex justify-between border-b border-slate-800/60 pb-1.5"><span>HR:</span> <span className="font-bold text-white">{ticket.heart_rate || 'N/A'} BPM</span></div>
			  <div className="flex justify-between pb-1"><span>WEIGHT:</span> <span className="font-bold text-white">{ticket.weight_kg || 'N/A'} KG</span></div>
			</div>

			<div className="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
			  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1 flex items-center gap-1"><Clipboard className="w-3 h-3"/> Intake Notes</div>
			  <p className="text-xs text-slate-300 italic leading-relaxed">{ticket.nurse_notes || 'No triage observations entered.'}</p>
			</div>
		  </div>

		  {/* Assessment Form */}
		  <form onSubmit={handleFinalizeConsultation} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
			<h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600"/> Diagnostic Charting</h2>
			
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chief Complaint / Symptoms</label>
			  <textarea required value={clinicalData.symptoms} onChange={e=>setClinicalData({...clinicalData, symptoms: e.target.value})} rows="2" className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="Clinical physical overview..."></textarea>
			</div>

			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Primary Clinical Diagnosis</label>
			  <input required type="text" value={clinicalData.diagnosis} onChange={e=>setClinicalData({...clinicalData, diagnosis: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="E.g., Gastroesophageal reflux disease"/>
			</div>

			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Treatment Plan & Directives</label>
			  <textarea required value={clinicalData.plan} onChange={e=>setClinicalData({...clinicalData, plan: e.target.value})} rows="3" className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white" placeholder="Medication schedules, behavioral precautions..."></textarea>
			</div>

			<button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md transition">
			  {loading ? 'Archiving Case...' : 'Sign Off & Conclude Encounter'}
			</button>
		  </form>

		</div>
	  )}
	</div>
  );
}