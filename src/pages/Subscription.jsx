import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, Users, Settings, Activity, CreditCard,
  Check, Plus, Minus, Download, FileText, FlaskConical, Briefcase
} from 'lucide-react';

const OPS_API   = 'https://script.google.com/macros/s/AKfycby7xDEoYBzGM7sAAAkX0LDTKNHo63LjbgmaC-0VLXESPFj7BSl10GE-sIqM-Ss3wE8/exec';
const DOCS_API  = 'https://script.google.com/macros/s/AKfycbxX5si41SuQj-yhGsrexa8snsaT0VgoPw0EHo7GGE9AAbEN6uKTA4qpmA9jdQFJpEC_/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';
const VAT_RATE  = 0.15;

export default function Subscription() {
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', employees: '1-50' });
  const [activeView, setActiveView] = useState('modules'); // 'modules' | 'ledger'

  // Refactored to match OPERIX Care actual modules and brand colors
  const [modules, setModules] = useState({
	hris: { active: false, price: 1500, title: 'OPERIX HR & Finance', desc: 'Core human capital management, payroll & financial ledger.', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: <Briefcase size={24} /> },
	operations: { active: false, price: 1200, title: 'OPERIX Labs & Pharmacy', desc: 'Inventory tracking, diagnostic queues & automated billing.', color: 'text-amber-400', bg: 'bg-amber-500', icon: <FlaskConical size={24} /> },
	care: { active: true, price: 4500, title: 'OPERIX Care (Core HIS)', desc: 'Complete Hospital Information System, Triage & Doctor portlas.', color: 'text-blue-500', bg: 'bg-blue-600', icon: <Activity size={24} /> },
  });

  const getPrice = (base) => billingCycle === 'yearly' ? base * 0.8 : base;

  const calculateFinancials = () => {
	const subtotal = Object.values(modules).reduce((acc, m) => m.active ? acc + getPrice(m.price) : acc, 0);
	const vat = subtotal * VAT_RATE;
	return { subtotal, vat, grandTotal: subtotal + vat };
  };

  const toggleModule = (key) =>
	setModules(prev => ({ ...prev, [key]: { ...prev[key], active: !prev[key].active } }));

  // ─── CHECKOUT ENGINE ───
  const handleCheckoutSubmit = async (e) => {
	e.preventDefault();
	setIsSubmitting(true);
	const fin = calculateFinancials();
	const cycleText = billingCycle === 'yearly' ? 'Annual Billing (20% Discount)' : 'Monthly Billing';
	const selectedModules = Object.values(modules).filter(m => m.active).map(m => m.title).join(', ');

	const adminBody = `NEW ENTERPRISE SUBSCRIPTION REQUEST\n\nContact: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company}\nSize: ${formData.employees}\n\nModules: ${selectedModules}\nCycle: ${cycleText}\nSubtotal: SAR ${fin.subtotal.toLocaleString()}\nVAT: SAR ${fin.vat.toLocaleString()}\nTotal: SAR ${fin.grandTotal.toLocaleString()} / mo`;

	const htmlInvoice = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #1e293b;padding:40px;border-radius:12px;background:#0f172a;color:#f8fafc"><h1 style="color:#ffffff;margin-top:0">OPERIX Solutions</h1><p style="color:#94a3b8;font-size:14px">Enterprise Subscription Quotation (inc. 15% VAT)</p><hr style="border:none;border-top:1px solid #334155;margin:24px 0"/><h3 style="color:#ffffff">Client Details</h3><p style="font-size:14px;line-height:1.6;color:#cbd5e1"><strong>Company:</strong> ${formData.company}<br/><strong>Contact:</strong> ${formData.name}<br/><strong>Email:</strong> ${formData.email}</p><h3 style="color:#ffffff;margin-top:32px">Subscription Plan</h3><table style="width:100%;border-collapse:collapse;font-size:14px;color:#f8fafc">${Object.values(modules).filter(m=>m.active).map(m=>`<tr style="border-bottom:1px solid #334155"><td style="padding:12px;font-weight:bold">${m.title}</td><td style="padding:12px;text-align:right">SAR ${getPrice(m.price).toLocaleString()}</td></tr>`).join('')}</table><div style="margin-top:24px;padding:20px;background:#1e293b;border-radius:8px"><div style="display:flex;justify-content:space-between;font-size:14px;color:#cbd5e1"><span>VAT (15%)</span><span>SAR ${fin.vat.toLocaleString()}</span></div><hr style="border:none;border-top:1px solid #475569;margin:8px 0"/><div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:#ffffff"><span>Grand Total</span><span style="color:#3b82f6">SAR ${fin.grandTotal.toLocaleString()} /mo</span></div></div></div>`;

	try {
	  await fetch(OPS_API,  { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'sendEmail', to: TARGET_EMAIL, subject: `Subscription: ${formData.company}`, body: adminBody }) });
	  await fetch(DOCS_API, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ action: 'sendContract', email: formData.email, subject: 'Your OPERIX Subscription Quotation', htmlBody: htmlInvoice }) });
	  alert(`Success! Quotation sent to ${formData.email}. Our team will contact you shortly.`);
	  setShowModal(false);
	  navigate('/');
	} catch {
	  alert('Error processing request. Please try again.');
	} finally {
	  setIsSubmitting(false);
	}
  };

  const fin = calculateFinancials();
  const activeCount = Object.values(modules).filter(m => m.active).length;

  const features = {
	hris:       ['Employee Self-Service & Directory', 'Automated Payroll & Allowances', 'Financial Master Ledger'],
	operations: ['Real-time Blood Bank Vault', 'Dynamic Pharmacy Cart Billing', 'Diagnostic Queue Routing'],
	care:       ['Voice-to-Text Clinical Dictation', 'Smart Admissions & Triage', 'Encrypted PDF Patient Records'],
  };

  return (
	<div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-200 font-sans overflow-x-hidden animate-in fade-in pb-32 transition-colors duration-300">

	  {/* ── NAVBAR ── */}
	  <nav className="sticky top-0 z-50 px-8 py-4 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
		<button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
		  <ArrowLeft size={16} /> Back to Platform
		</button>
		<div className="flex items-center gap-2.5">
		  <span className="text-blue-500"><Zap size={20} /></span>
		  <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">OPERIX Ecosystem</span>
		</div>
	  </nav>

	  {/* ── HEADER ── */}
	  <div className="max-w-7xl mx-auto px-6 pt-12 pb-6 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
		<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

		<h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white relative z-10">
		  Manage your integrated <br className="hidden md:block"/> enterprise architecture.
		</h1>

		{/* Billing Toggle */}
		<div className="inline-flex p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md relative z-10 shadow-sm">
		  {['monthly', 'yearly'].map(cycle => (
			<button
			  key={cycle}
			  onClick={() => setBillingCycle(cycle)}
			  className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${billingCycle === cycle ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
			>
			  {cycle === 'monthly' ? 'Monthly' : (
				<span className="flex items-center gap-2">
				  Annual
				  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">-20%</span>
				</span>
			  )}
			</button>
		  ))}
		</div>

		{/* Sub-view Toggle */}
		<div className="flex justify-center gap-3 border-b border-slate-200 dark:border-slate-800/60 pb-6 relative z-10 mt-8">
		  <button onClick={() => setActiveView('modules')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 border ${activeView === 'modules' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md border-transparent' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}>
			<Zap size={16} /> Module Configurator
		  </button>
		  <button onClick={() => setActiveView('ledger')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 border ${activeView === 'ledger' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md border-transparent' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}>
			<FileText size={16} /> Financial Ledger
		  </button>
		</div>
	  </div>

	  <div className="max-w-7xl mx-auto px-6 space-y-8 relative z-10">

		{/* ── MODULE CONFIGURATOR VIEW ── */}
		{activeView === 'modules' && (
		  <div className="animate-in fade-in slide-in-from-bottom-4">
			<div className="mb-6">
			  <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
				<Zap size={24} className="text-blue-500" /> Ecosystem Modules
			  </h2>
			  <p className="mt-1 text-sm font-bold text-slate-500">
				Select the modules to include in your enterprise workspace license.
			  </p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
			  {Object.entries(modules).map(([key, mod]) => (
				<div
				  key={key}
				  className={`p-8 rounded-3xl border shadow-sm transition-all flex flex-col bg-white dark:bg-slate-900/60 backdrop-blur-xl
					${mod.active ? `border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50` : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1'}`
				  }
				>
				  <div className="flex items-start justify-between mb-6">
					<div className={`w-14 h-14 rounded-2xl ${mod.bg} text-white flex items-center justify-center shadow-lg transition-transform duration-300 ${mod.active ? 'scale-110' : ''}`}>
					  {mod.icon}
					</div>
					{mod.active && (
					  <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
						Installed
					  </span>
					)}
				  </div>

				  <h3 className="text-xl font-black text-slate-900 dark:text-white">{mod.title}</h3>
				  <p className="text-xs font-bold mt-2 mb-6 text-slate-500">{mod.desc}</p>

				  <ul className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-6 mb-8 flex-1">
					{features[key].map((f, i) => (
					  <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
						<Check size={16} className={`${mod.color} mt-0.5 shrink-0`} />
						{f}
					  </li>
					))}
				  </ul>

				  <div className="text-4xl font-black font-mono mb-6 text-slate-900 dark:text-white tracking-tighter">
					<span className="text-lg font-bold text-slate-400 tracking-normal mr-1">SAR</span>
					{getPrice(mod.price).toLocaleString()}
					<span className="text-sm font-bold ml-1 text-slate-400 tracking-normal">/mo</span>
					{billingCycle === 'yearly' && (
					  <div className="text-xs font-bold mt-2 text-slate-400 line-through tracking-normal">
						SAR {mod.price.toLocaleString()} /mo
					  </div>
					)}
				  </div>

				  <button
					onClick={() => toggleModule(key)}
					className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 border
					  ${mod.active
						? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10'
						: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-lg hover:opacity-90'
					  }`}
				  >
					{mod.active ? (<><Minus size={16} /> Remove Module</>) : (<><Plus size={16} /> Add to Workspace</>)}
				  </button>
				</div>
			  ))}
			</div>
		  </div>
		)}

		{/* ── LEDGER VIEW ── */}
		{activeView === 'ledger' && (
		  <div className="animate-in fade-in slide-in-from-bottom-4">
			<div className="mb-6">
			  <h2 className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-white">
				<FileText size={24} className="text-emerald-500" /> Financial Ledger
			  </h2>
			  <p className="mt-1 text-sm font-bold text-slate-500">
				View and download your official OPERIX tax invoices.
			  </p>
			</div>

			<div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-xl">
			  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-950/50">
				<div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl"><CreditCard size={20} className="text-emerald-600 dark:text-emerald-400" /></div>
				<div>
				  <div className="font-black text-slate-900 dark:text-white">Invoice History</div>
				  <div className="text-xs font-bold text-slate-500">ZATCA-compliant tax invoices for your workspace.</div>
				</div>
			  </div>
			  <div className="overflow-x-auto">
				<table className="w-full text-left">
				  <thead>
					<tr className="bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
					  {['Invoice Ref', 'Issue Date', 'Ecosystem Licenses', 'Amount (inc VAT)', 'Status', 'Action'].map((h, i) => (
						<th key={i} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
					  ))}
					</tr>
				  </thead>
				  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
					<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
					  <td className="px-8 py-5 font-mono font-bold text-sm text-slate-900 dark:text-white">INV-2026-041</td>
					  <td className="px-8 py-5 text-sm font-bold text-slate-500">01 Jun 2026</td>
					  <td className="px-8 py-5 font-bold text-sm text-slate-900 dark:text-white">OPERIX Core Workspace</td>
					  <td className="px-8 py-5 font-mono font-black text-sm text-slate-900 dark:text-white">SAR 16,560</td>
					  <td className="px-8 py-5">
						<span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">PAID</span>
					  </td>
					  <td className="px-8 py-5">
						<button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-sm">
						  <Download size={14} /> PDF
						</button>
					  </td>
					</tr>
				  </tbody>
				</table>
			  </div>
			</div>
		  </div>
		)}

	  </div>

	  {/* ── STICKY CHECKOUT FLOAT ── */}
		<div className="fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none animate-in slide-in-from-bottom-8">
		  <div className="pointer-events-auto w-full max-w-5xl rounded-3xl px-8 py-6 flex flex-col md:flex-row items-center justify-between shadow-2xl border border-slate-800 bg-slate-900/95 dark:bg-[#111] backdrop-blur-2xl text-white">
			<div className="text-center md:text-left mb-4 md:mb-0">
			  <div className="font-mono text-3xl md:text-4xl font-black tracking-tighter">
				SAR {fin.grandTotal.toLocaleString()}
				<span className="text-sm font-bold ml-2 text-slate-400 tracking-normal">/mo</span>
			  </div>
			  <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mt-2 flex flex-wrap justify-center md:justify-start gap-2">
				<span>{activeCount} Module{activeCount !== 1 ? 's' : ''} · Inc. 15% VAT</span>
				{billingCycle === 'yearly' && (
				  <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">· 20% Annual Discount</span>
				)}
			  </div>
			</div>
			<button
			  onClick={() => setShowModal(true)}
			  disabled={activeCount === 0}
			  className="w-full md:w-auto bg-blue-600 text-white font-black px-10 py-4 rounded-2xl text-sm hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed whitespace-nowrap active:scale-95"
			>
			  Proceed to Checkout
			</button>
		  </div>
		</div>

	  {/* ── CHECKOUT MODAL ── */}
	  {showModal && (
		<div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 md:p-6 animate-in fade-in">
		  <div className="w-full max-w-lg rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#0f0f11] overflow-hidden relative">
			<div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500"></div>
			
			<div className="flex items-start justify-between mb-8 mt-2">
			  <div>
				<div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Checkout Details</div>
				<div className="text-sm font-bold mt-1 text-slate-500">Complete your workspace configuration.</div>
			  </div>
			  <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl font-black transition-colors bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">×</button>
			</div>

			<form onSubmit={handleCheckoutSubmit} className="space-y-5">
			  {[
				{ label: 'Full Name',   field: 'name',    type: 'text',  placeholder: 'John Smith' },
				{ label: 'Work Email',  field: 'email',   type: 'email', placeholder: 'john@company.com' },
			  ].map(({ label, field, type, placeholder }) => (
				<div key={field}>
				  <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">{label}</label>
				  <input
					type={type} placeholder={placeholder} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} required
					className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white"
				  />
				</div>
			  ))}

			  <div className="grid grid-cols-2 gap-4">
				{[
				  { label: 'Company',      field: 'company',   type: 'text',   placeholder: 'Your Company' },
				  { label: 'Company Size', field: 'employees', type: 'select', options: ['1-50','51-200','201-500','500+'] },
				].map(({ label, field, type, placeholder, options }) => (
				  <div key={field}>
					<label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-slate-500">{label}</label>
					{type === 'select' ? (
					  <select
						value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })}
						className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white"
					  >
						{options.map(o => <option key={o} value={o}>{o} Beds</option>)}
					  </select>
					) : (
					  <input
						type={type} placeholder={placeholder} value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} required
						className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:text-white"
					  />
					)}
				  </div>
				))}
			  </div>

			  {/* Order Summary */}
			  <div className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 mt-6">
				<div className="text-[10px] font-black uppercase tracking-widest mb-4 text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2">Order Summary</div>
				{Object.values(modules).filter(m => m.active).map(m => (
				  <div key={m.title} className="flex justify-between text-sm font-bold mb-2.5 text-slate-900 dark:text-white">
					<span>{m.title}</span>
					<span className="text-slate-500 font-mono">SAR {getPrice(m.price).toLocaleString()}</span>
				  </div>
				))}
				<div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-3 space-y-2">
				  <div className="flex justify-between text-xs font-bold text-slate-500">
					<span>Subtotal</span>
					<span className="font-mono">SAR {fin.subtotal.toLocaleString()}</span>
				  </div>
				  <div className="flex justify-between text-xs font-bold text-slate-500">
					<span>VAT (15%)</span>
					<span className="font-mono">SAR {fin.vat.toLocaleString()}</span>
				  </div>
				  <div className="flex justify-between items-end pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
					<span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Grand Total</span>
					<span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 leading-none">
					  SAR {fin.grandTotal.toLocaleString()}
					</span>
				  </div>
				</div>
			  </div>

			  <button
				type="submit"
				disabled={isSubmitting}
				className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-4 active:scale-95"
			  >
				{isSubmitting ? 'Processing Order…' : 'Confirm Subscription'}
			  </button>
			</form>
		  </div>
		</div>
	  )}

	</div>
  );
}