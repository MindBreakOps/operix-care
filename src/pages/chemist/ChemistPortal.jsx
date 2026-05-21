import { useState } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Activity, Search, ShieldAlert, CheckCircle, Receipt, FlaskConical } from 'lucide-react';

export default function ChemistPortal() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [activeTicket, setActiveTicket] = useState(null);
  const [pharmacyNotes, setPharmacyNotes] = useState('');

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
	setMessage({ type: '', text: '' });

	try {
	  const { data: ticket, error: ticketError } = await supabase
		.from('tickets')
		.select('*')
		.eq('id', searchMrn.trim())
		.single();

	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");
	  if (ticket.status !== 'awaiting_pharmacy') {
		throw new Error(`Ticket is currently at status: ${ticket.status.replace(/_/g, ' ')}. It is not in the Chemist/Pharmacy queue.`);
	  }

	  setActiveTicket(ticket);
	  
	} catch (err) {
	  showMessage('error', err.message);
	} finally {
	  setLoading(false);
	}
  };

  // 2. DISPENSE & COMPLETE TICKET
// ... inside ChemistPortal.jsx, replace your handleCompleteTicket ...
  
	const handleCompleteTicket = async (e) => {
	  e.preventDefault();
	  setLoading(true);
	  
	  try {
		// 1. Update Ticket Status
		await supabase.from('tickets').update({
		  pharmacy_notes: pharmacyNotes,
		  status: 'completed',
		  payment_status: 'paid'
		}).eq('id', activeTicket.id);
  
		// 2. Export Receipt as Image
		const dataUrl = await toPng(financialReceiptRef.current, { backgroundColor: '#ffffff' });
  
		// 3. Save Receipt to Patient File Record
		await supabase.from('patient_files').insert([{
		  patient_id: activeTicket.patient_id, // Link to master ID
		  file_name: `Receipt_${activeTicket.id}.png`,
		  file_url: dataUrl, // Saving the base64 or you can push this to Storage
		  file_type: 'image/png',
		  medical_history: `Payment Received: $${activeTicket.total_bill}. Notes: ${pharmacyNotes}`
		}]);
  
		showMessage('success', `Receipt generated and saved to Patient File.`);
		setActiveTicket(null);
	  } catch (err) {
		showMessage('error', "Error: " + err.message);
	  } finally {
		setLoading(false);
	  }
	};

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  {/* AMBIENT GLOWS */}
	  <div className="absolute top-[-10%] left-[50%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/2"></div>
	  
	  {/* HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pharmacy & Chemistry Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Dispensary & Checkout
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
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50">
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
			<FlaskConical className="w-16 h-16 opacity-20 mb-4" />
			<p className="font-bold uppercase tracking-widest text-sm">Enter a Ticket MRN to dispense medications</p>
		  </div>
		) : loading && !activeTicket ? (
		  <div className="h-[500px] flex items-center justify-center text-amber-500 font-bold uppercase tracking-widest animate-pulse">
			Retrieving Prescriptions...
		  </div>
		) : activeTicket ? (
		  <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
			<div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 md:p-12 backdrop-blur-xl">
			  
			  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
				<div>
				  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Patient: {activeTicket.patient_name}</h2>
				  <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 uppercase tracking-widest">MRN: {activeTicket.id}</p>
				</div>
				<Receipt className="w-10 h-10 text-amber-500 opacity-20"/>
			  </div>

			  {/* PRESCRIPTION BLOCK */}
			  <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 md:p-8 mb-8 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>
				<div className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
				  <FlaskConical className="w-4 h-4"/> Physician Prescription (Rx)
				</div>
				<div className="font-mono text-lg text-slate-900 dark:text-amber-50 whitespace-pre-wrap leading-relaxed relative z-10">
				  {activeTicket.prescribed_meds || 'No medications prescribed by physician.'}
				</div>
			  </div>

			  {/* BILLING BLOCK */}
			  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 mb-8 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
				<div>
				  <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Final Bill (Services + Intake)</div>
				  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">{activeTicket.services_requested}</div>
				</div>
				<div className="text-4xl font-black font-mono text-slate-900 dark:text-white">${activeTicket.total_bill}</div>
			  </div>
			  
			  {/* PHARMACY ACTION FORM */}
			  <form onSubmit={handleCompleteTicket} className="space-y-6 border-t border-slate-200 dark:border-slate-800 pt-8">
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Chemist Notes / Dispensary Record</label>
				  <textarea required value={pharmacyNotes} onChange={e => setPharmacyNotes(e.target.value)} rows="3" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/50 text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="Medications dispensed exactly as prescribed. Payment collected..."></textarea>
				</div>
				<button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-xl shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-lg">
				  {loading ? 'Closing Record...' : <><CheckCircle className="w-6 h-6"/> Dispense Meds, Collect Payment & Close Ticket</>}
				</button>
			  </form>

			</div>
		  </div>
		) : null}
	  </div>
	</div>
  );
}