import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { toPng } from 'html-to-image';
import { 
  Search, ShieldAlert, CheckCircle, Receipt, FlaskConical, 
  CreditCard, Banknote, Globe, Download, Database, Plus, Trash2, Edit3, ShoppingCart, PlusCircle, MinusCircle 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ChemistPortal() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dispensary'); 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const [medicines, setMedicines] = useState([]);
  const [medForm, setMedForm] = useState({
	id: null, generic_name: '', trading_name: '', type: 'Tablet', formula: '', 
	manufacturer: '', country: '', production_date: '', expiry_date: '', 
	price_sdg: 0, price_sar: 0, price_usd: 0
  });

  const fetchMedicines = async () => {
	const { data } = await supabase.from('medicines').select('*').order('generic_name', { ascending: true });
	if (data) setMedicines(data);
  };

  useEffect(() => { fetchMedicines(); }, []);

  const handleSaveMedicine = async (e) => {
	e.preventDefault();
	setLoading(true);
	try {
	  if (medForm.id) {
		await supabase.from('medicines').update(medForm).eq('id', medForm.id);
		showMessage('success', t('Medicine updated successfully.'));
	  } else {
		const { id, ...newMed } = medForm;
		await supabase.from('medicines').insert([newMed]);
		showMessage('success', t('New medicine added to inventory.'));
	  }
	  setMedForm({ id: null, generic_name: '', trading_name: '', type: 'Tablet', formula: '', manufacturer: '', country: '', production_date: '', expiry_date: '', price_sdg: 0, price_sar: 0, price_usd: 0 });
	  fetchMedicines();
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  const handleDeleteMedicine = async (id) => {
	if(!window.confirm(t('Delete this medication from inventory?'))) return;
	await supabase.from('medicines').delete().eq('id', id);
	fetchMedicines();
	showMessage('success', t('Medicine removed.'));
  };

  const [searchMrn, setSearchMrn] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [cart, setCart] = useState([]); 
  const [currency, setCurrency] = useState('SDG');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [pharmacistNotes, setPharmacistNotes] = useState('');
  const financialReceiptRef = useRef(null);

  const handleSearchMRN = async (e) => {
	e.preventDefault();
	if (!searchMrn.trim()) return;
	setLoading(true); setActiveTicket(null); setCart([]);
	try {
	  const { data: ticket, error } = await supabase.from('tickets').select('*').eq('id', searchMrn.trim()).single();
	  if (error || !ticket) throw new Error(t("Invalid MRN or Ticket not found."));
	  if (ticket.status !== 'awaiting_pharmacy') throw new Error(`${t('Ticket is at status:')} ${ticket.status}. ${t('Not in Pharmacy queue.')}`);
	  setActiveTicket(ticket);
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  const addToCart = (med) => {
	const existing = cart.find(item => item.id === med.id);
	if (existing) {
	  setCart(cart.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item));
	} else {
	  setCart([...cart, { ...med, qty: 1 }]);
	}
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const getPrice = (item) => currency === 'USD' ? item.price_usd : currency === 'SAR' ? item.price_sar : item.price_sdg;
  const calculateTotal = () => cart.reduce((total, item) => total + (getPrice(item) * item.qty), 0);

  const handleCompleteTicket = async (e) => {
	e.preventDefault();
	if (cart.length === 0) return showMessage('error', t('Cart is empty. Add medications to dispense.'));
	setLoading(true);
	try {
	  const finalPrice = calculateTotal();
	  const dispensedList = cart.map(item => `${item.qty}x ${item.trading_name} (${item.formula})`).join(', ');
	  const combinedNotes = `Dispensed: ${dispensedList}. Notes: ${pharmacistNotes}`;

	  await supabase.from('tickets').update({
		pharmacy_notes: combinedNotes, total_bill: activeTicket.total_bill + finalPrice, currency: currency, payment_method: paymentMethod, payment_status: 'paid_post_care', status: 'completed'
	  }).eq('id', activeTicket.id);

	  const dataUrl = await toPng(financialReceiptRef.current, { backgroundColor: '#ffffff', pixelRatio: 3 });

	  await supabase.from('patient_files').insert([{
		patient_id: activeTicket.patient_id, file_name: `Pharmacy_Receipt_${activeTicket.id}.png`, file_url: dataUrl, file_type: 'image/png', medical_history: combinedNotes
	  }]);

	  showMessage('success', t('Ticket closed. Receipt saved to Patient Timeline.'));
	  const link = document.createElement('a'); link.href = dataUrl; link.download = `Pharmacy_${activeTicket.id}.png`; link.click();
	  setActiveTicket(null); setSearchMrn(''); setCart([]); setPharmacistNotes('');
	} catch (err) { showMessage('error', err.message); } finally { setLoading(false); }
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  <div className="absolute top-[-10%] left-[50%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] transform -translate-x-1/2 pointer-events-none"></div>
	  
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Pharmacy Operations')}</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('Chemist Portal')}</h1>
		</div>
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button onClick={() => setActiveTab('dispensary')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'dispensary' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}><ShoppingCart className="w-4 h-4"/> {t('Dispensary & Billing')}</button>
		  <button onClick={() => setActiveTab('inventory')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-800 shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}><Database className="w-4 h-4"/> {t('Inventory')}</button>
		</div>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  {activeTab === 'dispensary' && (
		<div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  <form onSubmit={handleSearchMRN} className="flex bg-white dark:bg-slate-900 backdrop-blur-md p-2 rounded-2xl w-full md:w-[400px] border shadow-lg mb-8">
			<input required type="text" value={searchMrn} onChange={e => setSearchMrn(e.target.value)} className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold placeholder:text-slate-400 dark:text-white" placeholder={t('Scan or Enter MRN Ticket...')} />
			<button type="submit" disabled={loading} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold active:scale-95 flex items-center gap-2"><Search className="w-4 h-4"/> {t('Lookup')}</button>
		  </form>

		  {!activeTicket ? (
			<div className="h-[400px] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
			  <FlaskConical className="w-16 h-16 opacity-20 mb-4" /><p className="font-bold uppercase tracking-widest text-sm">{t('Enter MRN to begin dispensing')}</p>
			</div>
		  ) : (
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
			  <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border shadow-xl p-6 h-fit">
				<div className="flex justify-between items-center mb-6">
				  <h2 className="text-xl font-black dark:text-white">{t('Patient:')} {activeTicket.patient_name}</h2>
				  <div className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border">{t('MRN:')} {activeTicket.id}</div>
				</div>
				<div className="bg-slate-50 dark:bg-slate-950 border rounded-2xl p-5 mb-8">
				  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><FlaskConical className="w-4 h-4 text-amber-500"/> {t('Physician Prescription (Rx)')}</div>
				  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{activeTicket.prescribed_meds || t('No medications explicitly prescribed by doctor.')}</div>
				</div>
				<div className="border-t pt-6">
				  <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500 mb-4">{t('Inventory Lookup')}</h3>
				  <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
					{medicines.map(med => (
					  <div key={med.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 border rounded-xl hover:border-amber-400 group">
						<div><div className="font-bold text-sm dark:text-white">{med.trading_name || med.generic_name} <span className="text-xs text-slate-400">({med.formula})</span></div><div className="text-[9px] font-black uppercase text-slate-400">{med.type} | {med.manufacturer}</div></div>
						<button onClick={() => addToCart(med)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white"><PlusCircle className="w-5 h-5"/></button>
					  </div>
					))}
				  </div>
				</div>
			  </div>

			  <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border shadow-xl p-6 flex flex-col h-full">
				<div className="flex justify-between items-center mb-6">
				  <h3 className="font-bold text-sm uppercase tracking-widest text-slate-500"><ShoppingCart className="w-4 h-4 inline mr-2"/> {t('Patient Cart')}</h3>
				  <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-100 border-none rounded-lg p-2 text-xs font-bold outline-none">
					<option value="SDG">{t('SDG (Pound)')}</option><option value="USD">{t('USD ($)')}</option><option value="SAR">{t('SAR (﷼)')}</option>
				  </select>
				</div>
				<div className="flex-1 overflow-y-auto space-y-3 min-h-[200px]">
				  {cart.length === 0 ? <p className="text-center text-slate-400 text-xs font-bold uppercase py-12">{t('Cart is empty')}</p> : cart.map(item => (
					<div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
					  <div><div className="font-bold text-sm">{item.trading_name}</div><div className="text-[10px] text-slate-500">{item.qty}x @ {getPrice(item)} {currency}</div></div>
					  <div className="flex items-center gap-4"><div className="font-mono font-black text-amber-600">{item.qty * getPrice(item)}</div><button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><MinusCircle className="w-4 h-4"/></button></div>
					</div>
				  ))}
				</div>
				<form onSubmit={handleCompleteTicket} className="border-t pt-6 mt-4 space-y-6">
				  <div className="flex justify-between items-end bg-amber-50 p-4 rounded-xl border">
					<div className="text-[10px] font-black uppercase text-amber-600">{t('Final Bill')}</div><div className="text-3xl font-black font-mono">{currency} {calculateTotal().toLocaleString()}</div>
				  </div>
				  <div className="flex gap-4">
					<label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 font-bold text-sm ${paymentMethod === 'card' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`}><input type="radio" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> <CreditCard className="w-4 h-4"/> {t('Card')}</label>
					<label className={`flex-1 p-3 rounded-xl border-2 cursor-pointer flex items-center justify-center gap-2 font-bold text-sm ${paymentMethod === 'cash' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-500'}`}><input type="radio" className="hidden" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> <Banknote className="w-4 h-4"/> {t('Cash')}</label>
				  </div>
				  <textarea value={pharmacistNotes} onChange={e => setPharmacistNotes(e.target.value)} placeholder={t('Pharmacist Instructions / Notes...')} rows="2" className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none focus:border-amber-500"></textarea>
				  <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-4 rounded-xl active:scale-95 flex justify-center gap-2"><CheckCircle className="w-5 h-5"/> {t('Checkout & Issue Receipt')}</button>
				</form>
			  </div>
			</div>
		  )}
		</div>
	  )}

	  {activeTab === 'inventory' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  <div className="lg:col-span-1 bg-white/90 dark:bg-slate-900/90 rounded-3xl border shadow-xl p-6 h-fit">
			<h2 className="font-bold flex items-center gap-2 mb-6 border-b pb-4 dark:text-white">{medForm.id ? <><Edit3 className="w-5 h-5 text-blue-500"/> {t('Edit Medication')}</> : <><Plus className="w-5 h-5 text-emerald-500"/> {t('Add New Medication')}</>}</h2>
			<form onSubmit={handleSaveMedicine} className="space-y-4">
			  <input required type="text" value={medForm.generic_name} onChange={e => setMedForm({...medForm, generic_name: e.target.value})} placeholder={t('Generic Name *')} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none"/>
			  <input type="text" value={medForm.trading_name} onChange={e => setMedForm({...medForm, trading_name: e.target.value})} placeholder={t('Trading Name (Brand)')} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none"/>
			  <div className="grid grid-cols-2 gap-3">
				<select value={medForm.type} onChange={e => setMedForm({...medForm, type: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none">
				  <option>{t('Tablet')}</option><option>{t('Capsule')}</option><option>{t('Syrup')}</option><option>{t('Injection')}</option><option>{t('Cream')}</option><option>{t('Drops')}</option>
				</select>
				<input type="text" value={medForm.formula} onChange={e => setMedForm({...medForm, formula: e.target.value})} placeholder={t('Dosage (e.g. 500mg)')} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none"/>
			  </div>
			  <div className="grid grid-cols-2 gap-3">
				<input type="text" value={medForm.manufacturer} onChange={e => setMedForm({...medForm, manufacturer: e.target.value})} placeholder={t('Manufacturer')} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none"/>
				<input type="text" value={medForm.country} onChange={e => setMedForm({...medForm, country: e.target.value})} placeholder={t('Country')} className="w-full bg-slate-50 border rounded-xl p-3 text-sm outline-none"/>
			  </div>
			  <div className="grid grid-cols-2 gap-3">
				<div><label className="text-[9px] font-black uppercase text-slate-400 px-1">{t('Prod Date')}</label><input type="date" value={medForm.production_date} onChange={e => setMedForm({...medForm, production_date: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-2.5 text-sm outline-none"/></div>
				<div><label className="text-[9px] font-black uppercase text-slate-400 px-1">{t('Exp Date')}</label><input type="date" value={medForm.expiry_date} onChange={e => setMedForm({...medForm, expiry_date: e.target.value})} className="w-full bg-slate-50 border rounded-xl p-2.5 text-sm outline-none"/></div>
			  </div>
			  <div className="p-4 bg-amber-50 border rounded-xl space-y-3">
				<div className="text-[10px] font-black uppercase tracking-widest text-amber-600">{t('Pricing Matrix')}</div>
				<div className="grid grid-cols-3 gap-2">
				  <div className="text-center"><div className="text-[9px] font-bold text-slate-500 mb-1">SDG</div><input required type="number" step="0.01" value={medForm.price_sdg} onChange={e => setMedForm({...medForm, price_sdg: e.target.value})} className="w-full p-2 rounded-lg border text-sm text-center"/></div>
				  <div className="text-center"><div className="text-[9px] font-bold text-slate-500 mb-1">USD</div><input required type="number" step="0.01" value={medForm.price_usd} onChange={e => setMedForm({...medForm, price_usd: e.target.value})} className="w-full p-2 rounded-lg border text-sm text-center"/></div>
				  <div className="text-center"><div className="text-[9px] font-bold text-slate-500 mb-1">SAR</div><input required type="number" step="0.01" value={medForm.price_sar} onChange={e => setMedForm({...medForm, price_sar: e.target.value})} className="w-full p-2 rounded-lg border text-sm text-center"/></div>
				</div>
			  </div>
			  <div className="flex gap-2 pt-2">
				<button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl active:scale-95 text-sm">{medForm.id ? t('Update Item') : t('Save Item')}</button>
				{medForm.id && <button type="button" onClick={() => setMedForm({ id: null, generic_name: '', trading_name: '', type: 'Tablet', formula: '', manufacturer: '', country: '', production_date: '', expiry_date: '', price_sdg: 0, price_sar: 0, price_usd: 0 })} className="px-4 bg-slate-200 rounded-xl font-bold text-sm hover:bg-slate-300">{t('Cancel')}</button>}
			  </div>
			</form>
		  </div>

		  <div className="lg:col-span-2 bg-white/90 dark:bg-slate-900/90 rounded-3xl border shadow-xl p-6 h-[700px] flex flex-col">
			<h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-4"><Database className="w-4 h-4 inline mr-1"/> {t('Master Inventory')}</h3>
			<div className="flex-1 overflow-x-auto custom-scrollbar border rounded-2xl">
			  <table className="w-full text-left text-sm whitespace-nowrap">
				<thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0">
				  <tr><th className="p-4">{t('Medication')}</th><th className="p-4">{t('Formula/Type')}</th><th className="p-4">SDG</th><th className="p-4">USD</th><th className="p-4">SAR</th><th className="p-4 text-right">{t('Actions')}</th></tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
				  {medicines.map(med => (
					<tr key={med.id} className="hover:bg-slate-50 transition-colors">
					  <td className="p-4"><div className="font-bold">{med.trading_name || med.generic_name}</div><div className="text-[10px] text-slate-400">{med.generic_name}</div></td>
					  <td className="p-4 text-slate-600">{med.formula} <span className="px-2 py-0.5 bg-slate-100 rounded ml-1 text-[9px]">{med.type}</span></td>
					  <td className="p-4 font-mono font-bold text-amber-600">{med.price_sdg}</td>
					  <td className="p-4 font-mono font-bold text-amber-600">{med.price_usd}</td>
					  <td className="p-4 font-mono font-bold text-amber-600">{med.price_sar}</td>
					  <td className="p-4 text-right">
						<button onClick={() => setMedForm(med)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg mr-1"><Edit3 className="w-4 h-4"/></button>
						<button onClick={() => handleDeleteMedicine(med.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
					  </td>
					</tr>
				  ))}
				</tbody>
			  </table>
			  {medicines.length === 0 && <div className="text-center py-12 text-slate-400 font-bold uppercase text-xs">{t('No items in inventory.')}</div>}
			</div>
		  </div>
		</div>
	  )}

	  <div className="hidden">
		<div ref={financialReceiptRef} className="bg-white text-slate-900 p-8 w-[400px]">
		  <div className="text-center border-b-2 border-slate-200 pb-4 mb-4"><h1 className="text-xl font-black">OPERIX Care</h1><p className="text-[10px] font-black uppercase text-slate-400">Pharmacy Receipt</p></div>
		  <div className="mb-6 border-b border-slate-100 pb-4"><div className="text-xs font-bold text-slate-500 mb-1">MRN: {activeTicket?.id}</div><div className="font-bold">Patient: {activeTicket?.patient_name}</div></div>
		  <div className="space-y-3 border-b-2 border-dashed border-slate-200 pb-4 mb-6">
			{cart.map(item => (<div key={item.id} className="flex justify-between text-sm"><span className="font-bold">{item.qty}x {item.trading_name}</span><span className="font-mono font-bold">{currency} {item.qty * getPrice(item)}</span></div>))}
		  </div>
		  <div className="flex justify-between items-end mb-6"><div className="text-[10px] font-black uppercase text-slate-400">Total Billed</div><div className="text-2xl font-black font-mono">{currency} {calculateTotal()}</div></div>
		  <div className="bg-slate-100 p-3 text-center text-xs font-bold uppercase tracking-widest">PAID VIA {paymentMethod}</div>
		</div>
	  </div>
	</div>
  );
}