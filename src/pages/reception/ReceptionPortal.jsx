import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { 
  Calendar, Clock, User, CheckCircle, ShieldAlert, 
  Activity, Receipt, FilePlus, ChevronRight, Download, QrCode, 
  CreditCard, Banknote, Mail, Phone, Upload, Settings, UserCheck, XCircle
} from 'lucide-react';

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmd1QUqvJ9FNIGDXAgIFFXUoKip3yeEkQqzbugfJtUsK7YHj8Ma0eMxDl6lLDtzL8f/exec';

export default function ReceptionDashboard() {
  const { user, role } = useAuth();
  
  const [activeTab, setActiveTab] = useState('registration');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const routingTicketRef = useRef(null);
  const financialReceiptRef = useRef(null);

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  // --- REGISTRATION STATE ---
  const [regStep, setRegStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null); 
  const [regForm, setRegForm] = useState({
	full_name: '', email: '', phone: '', date_of_birth: '', 
	sex: '', address: '', blood_group: '', health_notes: ''
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [registering, setRegistering] = useState(false);

  // --- DYNAMIC PRICING & TICKETING STATE ---
  const [visitType, setVisitType] = useState('check');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [currency, setCurrency] = useState('SDG');
  const [customNotes, setCustomNotes] = useState('');
  
  const [services, setServices] = useState([
	{ id: 'consultation', name: 'Physician Consultation', selected: true, price: 50 },
	{ id: 'blood_test', name: 'Blood Test (CBC, Panel)', selected: false, price: 30 },
	{ id: 'urine_test', name: 'Urine Analysis', selected: false, price: 20 },
	{ id: 'xray', name: 'Radiology / X-Ray', selected: false, price: 100 }
  ]);
  
  const [generatedTicket, setGeneratedTicket] = useState(null);

  const calculateTotal = () => {
	return services.filter(s => s.selected).reduce((total, s) => total + Number(s.price), 0);
  };

  const handleServiceChange = (id, field, value) => {
	setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addCustomService = () => {
	const id = `custom_${Date.now()}`;
	setServices([...services, { id, name: 'Custom Service', selected: true, price: 0 }]);
  };

  // --- APPOINTMENTS STATE ---
  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newAppt, setNewAppt] = useState({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });

  const fetchAppointmentsData = async () => {
	setLoading(true);
	if (['admin', 'receptionist'].includes(role)) {
	  const { data: pFiles } = await supabase.from('patient_files').select('id, full_name, email').not('full_name', 'is', null);
	  if (pFiles) setPatientsList(pFiles);

	  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
	  if (profiles) setDoctors(profiles.filter(p => p.role === 'doctor'));
	}

	let query = supabase.from('appointments').select(`
	  id, appointment_date, time_slot, status, reason, patient_id, doctor_id,
	  patient:patient_files!appointments_patient_id_fkey(full_name),
	  doctor:profiles!appointments_doctor_id_fkey(full_name)
	`).order('appointment_date', { ascending: true });

	const { data } = await query;
	if (data) setAppointments(data);
	setLoading(false);
  };

  useEffect(() => { if (activeTab === 'appointments') fetchAppointmentsData(); }, [activeTab]);

  // --- HANDLERS ---
  const handleRegisterPatient = async (e) => {
	e.preventDefault();
	setRegistering(true);
	try {
	  const { data: newPatient, error } = await supabase.from('patient_files').insert([{
		full_name: regForm.full_name, email: regForm.email, phone: regForm.phone, date_of_birth: regForm.date_of_birth,
		sex: regForm.sex, address: regForm.address, blood_group: regForm.blood_group, medical_history: regForm.health_notes, uploaded_by: user?.id
	  }]).select().single();
	  if (error) throw error;
	  setSelectedPatient(newPatient);
	  setRegStep(2);
	  showMessage('success', `Patient Profile created. Proceed to Services.`);
	} catch (err) { showMessage('error', err.message); } finally { setRegistering(false); }
  };

  const handleGenerateTicket = async (e) => {
	e.preventDefault();
	setRegistering(true);
	try {
	  const selectedServicesList = services.filter(s => s.selected);
	  const requestedServicesNames = selectedServicesList.map(s => s.name).join(', ');
	  const totalBill = calculateTotal();
	  const isUpfront = ['check', 'emergency'].includes(visitType);

	  const { data: ticket, error } = await supabase.from('tickets').insert([{
		patient_id: selectedPatient.id,
		patient_name: selectedPatient.full_name,
		visit_type: visitType,
		services_requested: requestedServicesNames,
		total_bill: totalBill,
		currency: currency,
		payment_status: isUpfront ? 'paid_upfront' : 'pending',
		payment_method: isUpfront ? paymentMethod : null,
		status: 'triage_pending',
		notes: customNotes
	  }]).select().single();

	  if (error) throw error;
	  setGeneratedTicket({ ...ticket, itemized_services: selectedServicesList }); 
	  setRegStep(3);
	  showMessage('success', `Ticket & Receipt Generated Successfully!`);
	} catch (err) { showMessage('error', err.message); } finally { setRegistering(false); }
  };

  const handleBookAppointment = async (e) => {
	e.preventDefault();
	setBooking(true);
	try {
	  const { error } = await supabase.from('appointments').insert({ 
		patient_id: newAppt.patient_id, doctor_id: newAppt.doctor_id, 
		appointment_date: newAppt.date, time_slot: newAppt.time, 
		reason: newAppt.reason, status: 'scheduled' 
	  });
	  if (error) throw error;
	  setNewAppt({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });
	  fetchAppointmentsData();
	  showMessage('success', 'Appointment scheduled!');
	} catch (error) { showMessage('error', error.message); } finally { setBooking(false); }
  };

  // NEW: APPOINTMENT ACTION HANDLERS
  const handleUpdateApptStatus = async (id, newStatus) => {
	try {
	  await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
	  fetchAppointmentsData();
	  showMessage('success', `Appointment marked as ${newStatus}.`);
	} catch (err) {
	  showMessage('error', err.message);
	}
  };

  const handleCheckIn = async (appt) => {
	try {
	  setLoading(true);
	  // Fetch full patient profile for ticketing
	  const { data: pData, error } = await supabase.from('patient_files').select('*').eq('id', appt.patient_id).single();
	  if (error) throw error;
	  
	  // Auto-update appointment to completed
	  await supabase.from('appointments').update({ status: 'completed' }).eq('id', appt.id);
	  
	  // Switch context to Ticket Generation
	  setSelectedPatient(pData);
	  setVisitType('appointment');
	  setActiveTab('registration');
	  setRegStep(2);
	  showMessage('success', `Patient Checked In. Please generate routing ticket.`);
	} catch (err) {
	  showMessage('error', "Check-in failed: " + err.message);
	} finally {
	  setLoading(false);
	}
  };

  const exportImage = async (ref, fileNamePrefix) => {
	if (!ref.current) return;
	const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff', pixelRatio: 3, style: { transform: 'scale(1)' } });
	const link = document.createElement('a'); link.href = dataUrl; link.download = `${fileNamePrefix}_${generatedTicket.id}.png`; link.click();
  };

  const resetFlow = () => {
	setRegStep(1); setSelectedPatient(null); setGeneratedTicket(null); setUploadFiles([]);
	setServices([
	  { id: 'consultation', name: 'Physician Consultation', selected: true, price: 50 },
	  { id: 'blood_test', name: 'Blood Test', selected: false, price: 30 },
	  { id: 'urine_test', name: 'Urine Analysis', selected: false, price: 20 },
	  { id: 'xray', name: 'Radiology / X-Ray', selected: false, price: 100 }
	]);
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans overflow-hidden min-h-screen">
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Front Desk Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Reception Dashboard</h1>
		</div>
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50">
		  <button onClick={() => setActiveTab('registration')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'registration' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Intake & Tickets</button>
		  <button onClick={() => setActiveTab('appointments')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'appointments' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>Appointments List</button>
		</div>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  {/* TAB 1: INTAKE */}
	  {activeTab === 'registration' && (
		<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-8 animate-in fade-in min-h-[600px]">
		  
		  {/* STEP 1: PATIENT REGISTRATION */}
		  {regStep === 1 && (
			<form onSubmit={handleRegisterPatient} className="max-w-4xl mx-auto space-y-6">
			  <h2 className="text-2xl font-black text-center mb-8">New Patient Enrollment</h2>
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950/30 p-6 rounded-3xl border border-slate-200">
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
				  <input required type="text" value={regForm.full_name} onChange={e => setRegForm({...regForm, full_name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm"/>
				</div>
				<div className="grid grid-cols-2 gap-4">
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">DOB</label>
					<input required type="date" value={regForm.date_of_birth} onChange={e => setRegForm({...regForm, date_of_birth: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm"/>
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sex</label>
					<select required value={regForm.sex} onChange={e => setRegForm({...regForm, sex: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm">
					  <option value="">Select...</option><option value="M">Male</option><option value="F">Female</option>
					</select>
				  </div>
				</div>
				
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Blood Group</label>
				  <select value={regForm.blood_group} onChange={e => setRegForm({...regForm, blood_group: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm">
					<option value="">Unknown</option>
					<option value="A+">A+</option><option value="A-">A-</option>
					<option value="B+">B+</option><option value="B-">B-</option>
					<option value="AB+">AB+</option><option value="AB-">AB-</option>
					<option value="O+">O+</option><option value="O-">O-</option>
				  </select>
				</div>
				
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone</label>
				  <input required type="tel" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm"/>
				</div>
				
				<div className="col-span-1 md:col-span-2">
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1"><Mail className="w-3 h-3 inline"/> Email Address</label>
				  <input type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} placeholder="patient@example.com" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm" />
				</div>

			  </div>
			  <button type="submit" disabled={registering} className="w-full bg-slate-900 text-white font-bold rounded-xl p-4 transition-all active:scale-95">Proceed to Services</button>
			</form>
		  )}

		  {/* STEP 2: TICKETING & DYNAMIC PRICING */}
		  {regStep === 2 && !generatedTicket && (
			<div className="max-w-3xl mx-auto animate-in slide-in-from-right-4">
			  <h3 className="text-xl font-black mb-6">Patient: {selectedPatient?.full_name}</h3>

			  <form onSubmit={handleGenerateTicket} className="space-y-6">
				<div className="grid grid-cols-3 gap-4 mb-6">
				  {['check', 'appointment', 'emergency'].map(type => (
					<label key={type} className={`p-4 rounded-xl border-2 cursor-pointer text-center ${visitType === type ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500'}`}>
					  <input type="radio" className="hidden" checked={visitType === type} onChange={() => setVisitType(type)} />
					  <span className="font-bold uppercase tracking-widest text-xs">{type}</span>
					</label>
				  ))}
				</div>

				<div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
				  <div className="flex justify-between items-center mb-4 border-b pb-2">
					<h4 className="font-black text-slate-800">Dynamic Pricing Services</h4>
					<select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-white border rounded-lg p-1.5 text-xs font-bold text-slate-700 outline-none">
					  <option value="SDG">SDG (Pound)</option><option value="USD">USD ($)</option><option value="SAR">SAR (﷼)</option>
					</select>
				  </div>
				  
				  {services.map(service => (
					<div key={service.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200">
					  <input type="checkbox" checked={service.selected} onChange={e => handleServiceChange(service.id, 'selected', e.target.checked)} className="w-5 h-5 accent-emerald-600"/>
					  <input type="text" value={service.name} onChange={e => handleServiceChange(service.id, 'name', e.target.value)} className="flex-1 font-bold text-sm outline-none bg-transparent" placeholder="Service Name"/>
					  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border">
						<span className="text-xs font-bold text-slate-400">{currency}</span>
						<input type="number" value={service.price} onChange={e => handleServiceChange(service.id, 'price', e.target.value)} className="w-20 font-mono text-sm font-bold text-right outline-none bg-transparent" placeholder="0.00"/>
					  </div>
					</div>
				  ))}
				  <button type="button" onClick={addCustomService} className="text-xs font-bold text-emerald-600 hover:underline">+ Add Custom Service Row</button>
				</div>

				{['check', 'emergency'].includes(visitType) && (
				  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
					<div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Upfront Payment Required</div>
					<div className="text-3xl font-black font-mono mt-1">{currency} {calculateTotal().toLocaleString()}</div>
					<div className="flex gap-4 mt-4">
					  <label className="flex items-center gap-2 cursor-pointer font-bold"><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-emerald-600"/><CreditCard className="w-4 h-4"/> Card</label>
					  <label className="flex items-center gap-2 cursor-pointer font-bold"><input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="accent-emerald-600"/><Banknote className="w-4 h-4"/> Cash</label>
					</div>
				  </div>
				)}

				<button type="submit" disabled={registering} className="w-full bg-emerald-600 text-white font-bold rounded-xl py-4 active:scale-95">Generate Dual Documents</button>
			  </form>
			</div>
		  )}

		  {/* STEP 3: DUAL EXPORT (TICKET & RECEIPT) */}
		  {regStep === 3 && generatedTicket && (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-500">
			  <div className="space-y-4">
				<div ref={routingTicketRef} className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-200 shadow-md">
				  <div className="flex justify-between items-start border-b-2 pb-4 mb-4">
					<div><h1 className="text-2xl font-black tracking-tighter">OPERIX Care</h1><p className="text-[10px] font-black uppercase text-slate-400">Clinical Routing Ticket</p></div>
					<QrCode className="w-10 h-10 text-slate-300"/>
				  </div>
				  <div className="bg-slate-50 p-4 rounded-xl text-center border mb-6">
					<div className="text-[10px] font-black uppercase text-emerald-600 mb-1">MRN</div>
					<div className="text-3xl font-black font-mono tracking-widest">{generatedTicket.id}</div>
				  </div>
				  <div className="space-y-3 mb-6">
					<div><div className="text-[9px] font-black uppercase text-slate-400">Patient Name</div><div className="font-bold text-lg">{generatedTicket.patient_name}</div></div>
					<div className="grid grid-cols-2">
					  <div><div className="text-[9px] font-black uppercase text-slate-400">Sex</div><div className="font-bold">{selectedPatient.sex}</div></div>
					  <div><div className="text-[9px] font-black uppercase text-slate-400">Blood Type</div><div className="font-bold">{selectedPatient.blood_group || 'Unknown'}</div></div>
					</div>
				  </div>
				  <div className="border-t-2 pt-4 mb-6">
					<div className="text-[9px] font-black uppercase text-slate-400 mb-2">Requested Routing</div>
					<div className="font-bold bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">{generatedTicket.services_requested}</div>
				  </div>
				</div>
				<button onClick={() => exportImage(routingTicketRef, 'Routing_Ticket')} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2">
				  <Download className="w-4 h-4"/> Export Clinical Ticket
				</button>
			  </div>

			  <div className="space-y-4">
				<div ref={financialReceiptRef} className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-200 shadow-md">
				  <div className="text-center border-b-2 border-slate-100 pb-4 mb-4">
					<h1 className="text-xl font-black tracking-tighter">OPERIX Care</h1><p className="text-[10px] font-black uppercase text-slate-400">Official Financial Receipt</p>
				  </div>
				  <div className="flex justify-between items-center mb-6 text-xs font-bold text-slate-500">
					<span>MRN: {generatedTicket.id}</span><span>{new Date().toLocaleDateString()}</span>
				  </div>
				  <div className="mb-6"><div className="text-[9px] font-black uppercase text-slate-400 mb-1">Billed To</div><div className="font-bold">{generatedTicket.patient_name}</div></div>
				  
				  <div className="space-y-3 border-t-2 border-b-2 border-dashed border-slate-200 py-4 mb-6">
					{generatedTicket.itemized_services?.map(s => (
						<div key={s.id} className="flex justify-between text-sm">
							<span className="font-bold text-slate-700">{s.name}</span>
							<span className="font-mono font-bold text-slate-500">{generatedTicket.currency} {Number(s.price).toLocaleString()}</span>
						</div>
					))}
				  </div>

				  <div className="flex justify-between items-end mb-6">
					<div className="text-[10px] font-black uppercase text-slate-400">Total Amount</div>
					<div className="text-2xl font-black font-mono text-emerald-600">{generatedTicket.currency} {generatedTicket.total_bill.toLocaleString()}</div>
				  </div>
				  <div className="bg-slate-100 p-3 rounded-lg text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
					Status: {generatedTicket.payment_status.replace('_', ' ')}
				  </div>
				</div>
				<button onClick={() => exportImage(financialReceiptRef, 'Financial_Receipt')} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2">
				  <Download className="w-4 h-4"/> Export Itemized Receipt
				</button>
			  </div>
			</div>
		  )}
		</div>
	  )}

	  {/* TAB 2: APPOINTMENTS FULLY UPGRADED */}
	  {activeTab === 'appointments' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
		  
		  {/* Booking Panel */}
		  {['admin', 'receptionist'].includes(role) && (
			<div className="col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 h-fit backdrop-blur-xl shadow-sm">
			  <h2 className="font-bold mb-6 flex items-center gap-2"><Calendar className="w-5 h-5 text-emerald-600"/> Book Slot</h2>
			  <form onSubmit={handleBookAppointment} className="space-y-4">
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Patient</label>
				  <select required value={newAppt.patient_id} onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm">
					<option value="">Select Patient...</option>{patientsList.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
				  </select>
				</div>
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Doctor</label>
				  <select required value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm">
					<option value="">Select Doctor...</option>{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
				  </select>
				</div>
				<div className="grid grid-cols-2 gap-4">
				  <input required type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm" />
				  <input required type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm" />
				</div>
				<button type="submit" disabled={booking} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl p-3.5 text-sm transition-all active:scale-95 shadow-md">Confirm Booking</button>
			  </form>
			</div>
		  )}
		  
		  {/* Dynamic Appointments List */}
		  <div className={`col-span-1 ${['admin', 'receptionist'].includes(role) ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 backdrop-blur-xl h-[650px] overflow-y-auto shadow-sm`}>
			<div className="flex justify-between items-center mb-6 border-b pb-4">
			  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2"><Clock className="w-4 h-4"/> Upcoming Schedule</h3>
			  <button onClick={fetchAppointmentsData} className="text-emerald-600 text-xs font-bold hover:underline">Refresh</button>
			</div>

			{appointments.length === 0 && !loading && (
			  <div className="flex items-center justify-center h-64 text-slate-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed rounded-3xl">No Appointments Found.</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			  {appointments.map(appt => (
				<div key={appt.id} className="p-5 bg-white rounded-2xl border border-slate-200 hover:shadow-md transition-all group flex flex-col justify-between">
				  <div>
					<div className="flex justify-between items-start mb-2">
					  <div className="font-black text-lg text-slate-900">{appt.patient?.full_name || 'Unknown Patient'}</div>
					  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : appt.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
						{appt.status || 'Scheduled'}
					  </span>
					</div>
					<div className="text-xs font-bold text-slate-500 flex flex-col gap-1 mb-4">
					  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-emerald-500"/> Dr. {appt.doctor?.full_name}</span>
					  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-500"/> {new Date(appt.appointment_date).toLocaleDateString()} @ {appt.time_slot}</span>
					</div>
				  </div>

				  {/* ACTION CONTROLS */}
				  {appt.status !== 'completed' && appt.status !== 'cancelled' && (
					<div className="flex gap-2 mt-auto border-t pt-4">
					  <button onClick={() => handleCheckIn(appt)} className="flex-1 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center justify-center gap-1">
						<UserCheck className="w-3 h-3"/> Check In
					  </button>
					  <button onClick={() => handleUpdateApptStatus(appt.id, 'cancelled')} className="px-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center justify-center">
						<XCircle className="w-4 h-4"/>
					  </button>
					</div>
				  )}
				</div>
			  ))}
			</div>
		  </div>
		</div>
	  )}
	</div>
  );
}