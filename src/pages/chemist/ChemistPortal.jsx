import { useState, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { toPng } from 'html-to-image';
import { Activity, Search, ShieldAlert, CheckCircle, Receipt, FlaskConical, CreditCard, Banknote, Globe, Download } from 'lucide-react';

export default function ChemistPortal() {
  const [searchMrn, setSearchMrn] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const financialReceiptRef = useRef(null);
  
  const [activeTicket, setActiveTicket] = useState(null);
  const [pharmacyNotes, setPharmacyNotes] = useState('');
  
  // POST-CARE BILLING LOGIC
  const [finalPrice, setFinalPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSearchMRN = async (e) => {
	e.preventDefault();
	if (!searchMrn.trim()) return;
	setLoading(true); setActiveTicket(null); setMessage({ type: '', text: '' });

	try {
	  const { data: ticket, error: ticketError } = await supabase.from('tickets').select('*').eq('id', searchMrn.trim()).single();
	  if (ticketError || !ticket) throw new Error("Invalid MRN or Ticket not found.");
	  if (ticket.status !== 'awaiting_pharmacy') throw new Error(`Ticket is currently at status: ${ticket.status}. It is not in the Pharmacy queue.`);

	  setActiveTicket(ticket);
	  setFinalPrice(ticket.total_bill || 0); // Pre-fill with existing bill
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  const handleCompleteTicket = async (e) => {
	e.preventDefault();
	setLoading(true);
	try {
	  // 1. Update Ticket
	  const { error } = await supabase.from('tickets').update({
		pharmacy_notes: pharmacyNotes,
		total_bill: parseFloat(finalPrice),
		currency: currency,
		payment_method: paymentMethod,
		payment_status: 'paid_post_care',
		status: 'completed'
	  }).eq('id', activeTicket.id);
	  if (error) throw error;

	  // 2. Generate Image Receipt
	  const dataUrl = await toPng(financialReceiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 3, style: { transform: 'scale(1)', borderRadius: '0px' } });

	  // 3. Save Receipt directly into Patient's Master Timeline
	  await supabase.from('patient_files').insert([{
		patient_id: activeTicket.patient_id,
		file_name: `PostCare_Receipt_${activeTicket.id}.png`,
		file_url: dataUrl,
		file_type: 'image/png',
		medical_history: `Post-Care Payment Processed: ${currency} ${finalPrice}. Pharmacy Notes: ${pharmacyNotes}`
	  }]);

	  showMessage('success', `Ticket closed. Receipt saved to Patient Timeline.`);
	  
	  // Prompt Download
	  const link = document.createElement('a'); link.href = dataUrl; link.download = `Receipt_${activeTicket.id}.png`; link.click();

	  setActiveTicket(null); setSearchMrn(''); setPharmacyNotes('');
	} catch (err) { showMessage('error', "Error closing ticket: " + err.message); } finally { setLoading(false); }
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  <div className="absolute top-[-10%] left-[50%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] transform -translate-x-1/2"></div>
	  
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pharmacy Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dispensary & Checkout</h1>
		</div>
		
		<form onSubmit={handleSearchMRN} className="flex bg-white dark:bg-slate-900 backdrop-blur-md p-2 rounded-2xl w-full md:w-[400px] border shadow-lg">
		  <input required type="text" value={searchMrn} onChange={e => setSearchMrn(e.target.value)} className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold placeholder:text-slate-400 focus:ring-0" placeholder="Scan or Enter MRN Ticket..." />
		  <button type="submit" disabled={loading} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold active:scale-95 flex items-center gap-2">
			<Search className="w-4 h-4"/> Lookup
		  </button>
		</form>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  <div className="relative z-10">
		{!activeTicket ? (
		  <div className="h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40">
			<FlaskConical className="w-16 h-16 opacity-20 mb-4" />
			<p className="font-bold uppercase tracking-widest text-sm">Enter a Ticket MRN to dispense medications</p>
		  </div>
		) : (
		  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
			
			{/* LEFT: PHARMACY WORKFLOW */}
			<div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl border shadow-xl p-8 backdrop-blur-xl">
			  <h2 className="text-2xl font-black mb-6">Patient: {activeTicket.patient_name}</h2>
			  
			  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 mb-8">
				<div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2"><FlaskConical className="w-4 h-4"/> Physician Prescription (Rx)</div>
				<div className="font-mono text-lg whitespace-pre-wrap">{activeTicket.prescribed_meds || 'No medications prescribed.'}</div>
			  </div>

			  <form onSubmit={handleCompleteTicket} className="space-y-6 border-t border-slate-200 dark:border-slate-800 pt-8">
				<h3 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-4">Post-Care Billing</h3>
				
				{/* Custom Billing Inputs */}
				<div className="grid grid-cols-2 gap-4">
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Final Price</label>
					<input required type="number" step="0.01" value={finalPrice} onChange={e => setFinalPrice(e.target.value)} className="w-full bg-slate-50 border p-4 text-xl font-mono font-black rounded-xl outline-none" />
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3"/> Currency</label>
					<select required value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-slate-50 border p-4 text-sm font-bold rounded-xl outline-none">
					  <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="SAR">SAR (﷼)</option>
					</select>
				  </div>
				</div>

				<div className="flex gap-4 mb-4">
				  <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 font-bold ${paymentMethod === 'card' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-amber-300'}`}>
					<input type="radio" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> <CreditCard className="w-4 h-4"/> Card
				  </label>
				  <label className={`flex-1 p-4 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 font-bold ${paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500 hover:border-amber-300'}`}>
					<input type="radio" className="hidden" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> <Banknote className="w-4 h-4"/> Cash
				  </label>
				</div>

				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pharmacist Notes</label>
				  <textarea required value={pharmacyNotes} onChange={e => setPharmacyNotes(e.target.value)} rows="2" className="w-full bg-slate-50 border p-4 text-sm rounded-xl outline-none"></textarea>
				</div>

				<button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl active:scale-95 flex justify-center gap-3">
				  {loading ? 'Processing...' : <><CheckCircle className="w-5 h-5"/> Collect Payment & Issue Receipt</>}
				</button>
			  </form>
			</div>

			{/* RIGHT: LIVE RECEIPT PREVIEW (HIDDEN FROM UI, USED FOR EXPORT) */}
			<div className="bg-slate-100 p-8 rounded-3xl flex items-center justify-center">
				<div ref={financialReceiptRef} className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-sm">
					<div className="text-center border-b-2 border-slate-100 pb-4 mb-4">
						<h1 className="text-2xl font-black">OPERIX Care</h1>
						<p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Official Clinical Receipt</p>
					</div>
					<div className="flex justify-between items-center mb-6 text-xs font-bold text-slate-500">
						<span>MRN: {activeTicket.id}</span>
						<span>{new Date().toLocaleDateString()}</span>
					</div>
					<div className="mb-6 border-b-2 border-dashed border-slate-200 pb-6">
						<div className="text-[9px] font-black uppercase text-slate-400 mb-1">Patient</div>
						<div className="font-bold text-lg">{activeTicket.patient_name}</div>
						<div className="text-[9px] font-black uppercase text-slate-400 mt-4 mb-1">Services Billed</div>
						<div className="font-bold text-sm">{activeTicket.services_requested}</div>
					</div>
					<div className="flex justify-between items-end mb-6">
						<div className="text-[10px] font-black uppercase text-slate-400">Total Paid</div>
						<div className="text-3xl font-black font-mono">{currency} {finalPrice}</div>
					</div>
					<div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
						<CheckCircle className="w-4 h-4"/> PAID VIA {paymentMethod}
					</div>
				</div>
			</div>

		  </div>
		)}
	  </div>
	</div>
  );
}