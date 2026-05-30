import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient'; 
import { useAuth } from '../../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { 
  Calendar, Clock, User, CheckCircle, ShieldAlert, 
  Activity, Receipt, FilePlus, ChevronRight, Download, QrCode, 
  CreditCard, Banknote, Mail, Phone, Upload, Settings, UserCheck, XCircle, Microscope,
  Droplet, MapPin
} from 'lucide-react';

// 1. IMPORT THE LANGUAGE HOOK
import { useLanguage } from '../../contexts/LanguageContext';

export default function ReceptionDashboard() {
  // 2. INITIALIZE TRANSLATION FUNCTION
  const { t } = useLanguage();
  
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

  const [regStep, setRegStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null); 
  const [regForm, setRegForm] = useState({
	full_name: '', email: '', phone: '', date_of_birth: '', 
	sex: '', address: '', blood_group: '', health_notes: ''
  });
  const [registering, setRegistering] = useState(false);

  const [visitType, setVisitType] = useState('check');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [currency, setCurrency] = useState('SDG');
  const [customNotes, setCustomNotes] = useState('');
  
  // DIAGNOSTIC ROUTING STATE
  const [pathologyOrder, setPathologyOrder] = useState('');
  const [radiologyOrder, setRadiologyOrder] = useState('');

  // Initializing dynamic service names with t()
  const [services, setServices] = useState([
	{ id: 'consultation', name: t('Physician Consultation'), selected: true, price: 50 },
	{ id: 'blood_test', name: t('Blood Test (CBC, Panel)'), selected: false, price: 30 },
	{ id: 'xray', name: t('Radiology / X-Ray'), selected: false, price: 100 }
  ]);
  
  const [generatedTicket, setGeneratedTicket] = useState(null);

  const calculateTotal = () => services.filter(s => s.selected).reduce((total, s) => total + Number(s.price), 0);

  const handleServiceChange = (id, field, value) => {
	setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addCustomService = () => {
	const id = `custom_${Date.now()}`;
	setServices([...services, { id, name: t('Custom Service'), selected: true, price: 0 }]);
  };

  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newAppt, setNewAppt] = useState({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });
  const [booking, setBooking] = useState(false); 

  const fetchAppointmentsData = async () => {
	setLoading(true);
	if (['admin', 'receptionist'].includes(role)) {
	  const { data: pFiles } = await supabase.from('patient_files').select('id, full_name, email').not('full_name', 'is', null);
	  if (pFiles) setPatientsList(pFiles);

	  const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
	  if (profiles) setDoctors(profiles.filter(p => p.role === 'doctor'));
	}

	const { data, error } = await supabase.from('appointments').select(`
	  id, appointment_date, time_slot, status, reason, patient_id, doctor_id,
	  patient:patient_files!appointments_patient_id_fkey(full_name),
	  doctor:profiles!appointments_doctor_id_fkey(full_name)
	`).order('appointment_date', { ascending: true });
	
	if (error) console.error("Error fetching appointments:", error);
	if (data) setAppointments(data);
	setLoading(false);
  };

  useEffect(() => { 
	fetchAppointmentsData(); 
  }, []); 

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
	  showMessage('success', t('Patient Profile created. Proceed to Services.'));
	} catch (err) { showMessage('error', err.message); } finally { setRegistering(false); }
  };

  const handleGenerateTicket = async (e) => {
	e.preventDefault();
	setRegistering(true);
	try {
	  const selectedServicesList = services.filter(s => s.selected);
	  const isUpfront = ['check', 'emergency'].includes(visitType);

	  const { data: ticket, error } = await supabase.from('tickets').insert([{
		patient_id: selectedPatient.id,
		patient_name: selectedPatient.full_name,
		visit_type: visitType,
		services_requested: selectedServicesList.map(s => s.name).join(', '),
		total_bill: calculateTotal(),
		currency: currency,
		payment_status: isUpfront ? 'paid_upfront' : 'pending',
		payment_method: isUpfront ? paymentMethod : null,
		status: 'triage_pending',
		notes: customNotes
	  }]).select().single();

	  if (error) throw error;

	  const labInserts = [];
	  if (pathologyOrder && pathologyOrder.trim() !== '') {
		labInserts.push({ 
		  ticket_id: ticket.id, patient_id: selectedPatient.id, patient_name: selectedPatient.full_name, 
		  lab_type: 'Pathology', test_name: pathologyOrder, status: 'pending' 
		});
	  }
	  if (radiologyOrder && radiologyOrder.trim() !== '') {
		labInserts.push({ 
		  ticket_id: ticket.id, patient_id: selectedPatient.id, patient_name: selectedPatient.full_name, 
		  lab_type: 'Radiology', test_name: radiologyOrder, status: 'pending'
		});
	  }
	  
	  if (labInserts.length > 0) {
		const { error: labError } = await supabase.from('lab_requests').insert(labInserts);
		if (labError) {
		  console.error("Lab Insert Error:", labError);
		  showMessage('error', t("Ticket created, but Lab Order failed: ") + labError.message);
		}
	  }

	  setGeneratedTicket({ ...ticket, itemized_services: selectedServicesList }); 
	  setRegStep(3);
	  showMessage('success', t('Ticket & Orders Generated Successfully!'));
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
	  showMessage('success', t('Appointment scheduled!'));
	} catch (error) { showMessage('error', error.message); } finally { setBooking(false); }
  };

  const handleCheckIn = async (appt) => {
	try {
	  setLoading(true);
	  const { data: pData, error } = await supabase.from('patient_files').select('*').eq('id', appt.patient_id).single();
	  if (error) throw error;
	  await supabase.from('appointments').update({ status: 'completed' }).eq('id', appt.id);
	  setSelectedPatient(pData);
	  setVisitType('appointment');
	  setActiveTab('registration');
	  setRegStep(2);
	  showMessage('success', t('Patient Checked In. Please generate routing ticket.'));
	} catch (err) { showMessage('error', t("Check-in failed: ") + err.message); } finally { setLoading(false); }
  };

  const exportImage = async (ref, fileNamePrefix) => {
	if (!ref.current) return;
	const dataUrl = await toPng(ref.current, { backgroundColor: '#ffffff', pixelRatio: 3, style: { transform: 'scale(1)' } });
	const link = document.createElement('a'); link.href = dataUrl; link.download = `${fileNamePrefix}_${generatedTicket.id}.png`; link.click();
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans overflow-hidden min-h-screen">
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Front Desk Operations')}</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('Reception Dashboard')}</h1>
		</div>
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50">
		  <button onClick={() => setActiveTab('registration')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'registration' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('Intake & Tickets')}</button>
		  <button onClick={() => setActiveTab('appointments')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'appointments' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('Appointments List')}</button>
		</div>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  {activeTab === 'registration' && (
		<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 md:p-8 animate-in fade-in min-h-[600px]">
		  
		  {regStep === 1 && (
			<form onSubmit={handleRegisterPatient} className="max-w-4xl mx-auto space-y-8">
			  <div className="text-center">
				<h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">{t('New Patient Enrollment')}</h2>
				<p className="text-slate-500 text-sm">{t('Enter the required patient details to begin triage.')}</p>
			  </div>
			  
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Personal Details Section */}
				<div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
				  <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
					<User className="w-4 h-4 text-emerald-500" /> {t('Personal Details')}
				  </h3>
				  <div className="space-y-4">
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Full Name')}</label>
					  <input required type="text" placeholder={t("John Doe")} value={regForm.full_name} onChange={e => setRegForm({...regForm, full_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"/>
					</div>
					<div className="grid grid-cols-2 gap-4">
					  <div>
						<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('DOB')}</label>
						<input required type="date" value={regForm.date_of_birth} onChange={e => setRegForm({...regForm, date_of_birth: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"/>
					  </div>
					  <div>
						<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Sex')}</label>
						<select required value={regForm.sex} onChange={e => setRegForm({...regForm, sex: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white">
						  <option value="">{t('Select...')}</option><option value="M">{t('Male')}</option><option value="F">{t('Female')}</option>
						</select>
					  </div>
					</div>
				  </div>
				</div>

				{/* Contact & Medical Section */}
				<div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
				  <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-6 pb-2 border-b border-slate-100 dark:border-slate-800">
					<Activity className="w-4 h-4 text-emerald-500" /> {t('Contact & Medical')}
				  </h3>
				  <div className="space-y-4">
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Phone Number')}</label>
					  <div className="relative">
						<Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input required type="tel" placeholder="+1 234 567 8900" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"/>
					  </div>
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Email Address')}</label>
					  <div className="relative">
						<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
						<input type="email" placeholder="patient@example.com" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"/>
					  </div>
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Blood Group')}</label>
					  <div className="relative">
						<Droplet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
						<select value={regForm.blood_group} onChange={e => setRegForm({...regForm, blood_group: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pl-10 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white">
						  <option value="">{t('Unknown')}</option>
						  <option value="A+">A+</option><option value="A-">A-</option>
						  <option value="B+">B+</option><option value="B-">B-</option>
						  <option value="AB+">AB+</option><option value="AB-">AB-</option>
						  <option value="O+">O+</option><option value="O-">O-</option>
						</select>
					  </div>
					</div>
				  </div>
				</div>
			  </div>
			  
			  <button type="submit" disabled={registering} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl p-4 transition-all active:scale-[0.98] shadow-lg flex justify-center items-center gap-2">
				{t('Proceed to Triage & Services')} <ChevronRight className="w-5 h-5" />
			  </button>
			</form>
		  )}

		  {regStep === 2 && !generatedTicket && (
			<div className="max-w-3xl mx-auto animate-in slide-in-from-right-4">
			  <h3 className="text-xl font-black mb-6 dark:text-white">{t('Patient:')} {selectedPatient?.full_name}</h3>
			  <form onSubmit={handleGenerateTicket} className="space-y-6">
				
				<div className="grid grid-cols-3 gap-4 mb-6">
				  {['check', 'appointment', 'emergency'].map(type => (
					<label key={type} className={`p-4 rounded-xl border-2 cursor-pointer text-center transition-all ${visitType === type ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
					  <input type="radio" className="hidden" checked={visitType === type} onChange={() => setVisitType(type)} />
					  <span className="font-bold uppercase tracking-widest text-xs">{t(type)}</span>
					</label>
				  ))}
				</div>

				<div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
				  <h4 className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b dark:border-slate-800 pb-2"><Microscope className="w-4 h-4 text-purple-500"/> {t('Diagnostic Routing')}</h4>
				  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('Pathology (Medical Lab)')}</label>
					  <input type="text" value={pathologyOrder} onChange={e => setPathologyOrder(e.target.value)} placeholder={t("e.g. CBC Panel, Urine Analysis")} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-purple-500"/>
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t('Radiography (X-Ray/Scan)')}</label>
					  <input type="text" value={radiologyOrder} onChange={e => setRadiologyOrder(e.target.value)} placeholder={t("e.g. Chest X-Ray, CT Scan")} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-purple-500"/>
					</div>
				  </div>
				  <p className="text-[10px] text-slate-400 italic">{t("If filled, an order will be sent directly to the technician's queue.")}</p>
				</div>

				<div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
				  <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-2">
					<h4 className="font-black text-slate-800 dark:text-slate-200">{t('Dynamic Pricing Services')}</h4>
					<select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-1.5 text-xs font-bold outline-none dark:text-white">
					  <option value="SDG">{t('SDG (Pound)')}</option><option value="USD">{t('USD ($)')}</option><option value="SAR">{t('SAR (﷼)')}</option>
					</select>
				  </div>
				  
				  {services.map(service => (
					<div key={service.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
					  <input type="checkbox" checked={service.selected} onChange={e => handleServiceChange(service.id, 'selected', e.target.checked)} className="w-5 h-5 accent-emerald-600"/>
					  <input type="text" value={service.name} onChange={e => handleServiceChange(service.id, 'name', e.target.value)} className="flex-1 font-bold text-sm outline-none bg-transparent dark:text-white" placeholder={t("Service Name")}/>
					  <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-lg border dark:border-slate-700 shadow-sm">
						<span className="text-xs font-bold text-slate-400">{currency}</span>
						<input type="number" value={service.price} onChange={e => handleServiceChange(service.id, 'price', e.target.value)} className="w-20 font-mono text-sm font-bold text-right outline-none bg-transparent dark:text-white" placeholder="0.00"/>
					  </div>
					</div>
				  ))}
				  <button type="button" onClick={addCustomService} className="text-xs font-bold text-emerald-600 hover:underline">{t('+ Add Custom Service Row')}</button>
				</div>

				{['check', 'emergency'].includes(visitType) && (
				  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-6">
					<div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">{t('Upfront Payment Required')}</div>
					<div className="text-3xl font-black font-mono mt-1 dark:text-emerald-400">{currency} {calculateTotal().toLocaleString()}</div>
					<div className="flex gap-4 mt-4">
					  <label className="flex items-center gap-2 cursor-pointer font-bold dark:text-slate-300"><input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-emerald-600"/><CreditCard className="w-4 h-4"/> {t('Card')}</label>
					  <label className="flex items-center gap-2 cursor-pointer font-bold dark:text-slate-300"><input type="radio" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="accent-emerald-600"/><Banknote className="w-4 h-4"/> {t('Cash')}</label>
					</div>
				  </div>
				)}

				<button type="submit" disabled={registering} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-4 active:scale-95 shadow-lg shadow-emerald-500/20 transition-all">{t('Generate Ticket & Dispatch Orders')}</button>
			  </form>
			</div>
		  )}

		  {regStep === 3 && generatedTicket && (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in duration-500">
			  <div className="space-y-4">
				<div ref={routingTicketRef} className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-200 shadow-md">
				  <div className="flex justify-between items-start border-b-2 pb-4 mb-4">
					<div><h1 className="text-2xl font-black tracking-tighter">OPERIX Care</h1><p className="text-[10px] font-black uppercase text-slate-400">{t('Clinical Routing Ticket')}</p></div>
					<QrCode className="w-10 h-10 text-slate-300"/>
				  </div>
				  <div className="bg-slate-50 p-4 rounded-xl text-center border mb-6">
					<div className="text-[10px] font-black uppercase text-emerald-600 mb-1">{t('MRN')}</div>
					<div className="text-3xl font-black font-mono tracking-widest">{generatedTicket.id}</div>
				  </div>
				  <div className="space-y-3 mb-6">
					<div><div className="text-[9px] font-black uppercase text-slate-400">{t('Patient Name')}</div><div className="font-bold text-lg">{generatedTicket.patient_name}</div></div>
				  </div>
				  <div className="border-t-2 pt-4 mb-6">
					<div className="text-[9px] font-black uppercase text-slate-400 mb-2">{t('Requested Routing')}</div>
					<div className="font-bold bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">{generatedTicket.services_requested}</div>
					
					{(pathologyOrder || radiologyOrder) && (
					  <div className="mt-3 text-[10px] font-bold text-purple-700 bg-purple-50 p-2 rounded border border-purple-200">
						{t('Lab Orders Dispatched Systematically.')}
					  </div>
					)}
				  </div>
				</div>
				<button onClick={() => exportImage(routingTicketRef, 'Routing_Ticket')} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"><Download className="w-4 h-4"/> {t('Export Clinical Ticket')}</button>
			  </div>

			  <div className="space-y-4">
				<div ref={financialReceiptRef} className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-200 shadow-md">
				  <div className="text-center border-b-2 border-slate-100 pb-4 mb-4">
					<h1 className="text-xl font-black tracking-tighter">OPERIX Care</h1><p className="text-[10px] font-black uppercase text-slate-400">{t('Official Financial Receipt')}</p>
				  </div>
				  <div className="flex justify-between items-center mb-6 text-xs font-bold text-slate-500">
					<span>{t('MRN:')} {generatedTicket.id}</span><span>{new Date().toLocaleDateString()}</span>
				  </div>
				  <div className="mb-6"><div className="text-[9px] font-black uppercase text-slate-400 mb-1">{t('Billed To')}</div><div className="font-bold">{generatedTicket.patient_name}</div></div>
				  
				  <div className="space-y-3 border-t-2 border-b-2 border-dashed border-slate-200 py-4 mb-6">
					{generatedTicket.itemized_services?.map(s => (
						<div key={s.id} className="flex justify-between text-sm">
							<span className="font-bold text-slate-700">{s.name}</span>
							<span className="font-mono font-bold text-slate-500">{generatedTicket.currency} {Number(s.price).toLocaleString()}</span>
						</div>
					))}
				  </div>

				  <div className="flex justify-between items-end mb-6">
					<div className="text-[10px] font-black uppercase text-slate-400">{t('Total Amount')}</div>
					<div className="text-2xl font-black font-mono text-emerald-600">{generatedTicket.currency} {generatedTicket.total_bill.toLocaleString()}</div>
				  </div>
				  <div className="bg-slate-100 p-3 rounded-lg text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
					{t('Status:')} {t(generatedTicket.payment_status.replace('_', ' '))}
				  </div>
				</div>
				<button onClick={() => exportImage(financialReceiptRef, 'Financial_Receipt')} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"><Download className="w-4 h-4"/> {t('Export Itemized Receipt')}</button>
			  </div>
			</div>
		  )}
		</div>
	  )}

	  {activeTab === 'appointments' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
		  
		  {/* Create Appointment Column */}
		  <div className="lg:col-span-1 bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl h-max">
			<h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">{t('Schedule New Visit')}</h3>
			<form onSubmit={handleBookAppointment} className="space-y-5">
			  <div>
				<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Select Patient')}</label>
				<select required value={newAppt.patient_id} onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
				  <option value="">{t('-- Choose Patient --')}</option>
				  {patientsList.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
				</select>
			  </div>
			  
			  <div>
				<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Assign Doctor')}</label>
				<select required value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white">
				  <option value="">{t('-- Choose Doctor --')}</option>
				  {doctors.map(d => <option key={d.id} value={d.id}>{t('Dr.')} {d.full_name}</option>)}
				</select>
			  </div>

			  <div className="grid grid-cols-2 gap-4">
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Date')}</label>
				  <input required type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"/>
				</div>
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Time Slot')}</label>
				  <input required type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"/>
				</div>
			  </div>

			  <div>
				<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{t('Visit Reason')}</label>
				<textarea required rows="2" placeholder={t("Brief description...")} value={newAppt.reason} onChange={e => setNewAppt({...newAppt, reason: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"></textarea>
			  </div>

			  <button type="submit" disabled={booking} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl py-3.5 transition-all shadow-md mt-4">
				{booking ? t('Scheduling...') : t('Confirm Appointment')}
			  </button>
			</form>
		  </div>

		  {/* Appointments List Column */}
		  <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl">
			<h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
			  {t('Upcoming Schedule')}
			  <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">{appointments.length} {t('Total')}</span>
			</h3>

			{loading ? (
			  <div className="text-center py-10">
				<div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
				<p className="text-sm font-bold text-slate-500">{t('Loading schedule...')}</p>
			  </div>
			) : appointments.length === 0 ? (
			  <div className="text-center py-16 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
				<Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
				<p className="font-bold text-slate-500">{t('No appointments scheduled.')}</p>
			  </div>
			) : (
			  <div className="space-y-4">
				{appointments.map(appt => (
				  <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm transition-all hover:border-emerald-200 group">
					<div className="flex gap-4 items-center mb-4 sm:mb-0">
					  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl text-emerald-600 dark:text-emerald-400">
						<Clock className="w-6 h-6" />
					  </div>
					  <div>
						<h4 className="font-bold text-slate-900 dark:text-white text-base">
						  {appt.patient?.full_name || t('Unknown Patient')}
						</h4>
						<div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1">
						  <span>{appt.appointment_date} @ {appt.time_slot}</span>
						  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
						  <span>{t('Dr.')} {appt.doctor?.full_name || t('Unassigned')}</span>
						</div>
						<p className="text-xs text-slate-400 mt-1 italic line-clamp-1">{appt.reason}</p>
					  </div>
					</div>

					<div className="flex flex-col sm:items-end gap-2">
					  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${appt.status === 'completed' ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
						{t(appt.status)}
					  </span>
					  {appt.status !== 'completed' && (
						<button onClick={() => handleCheckIn(appt)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm shadow-emerald-500/20">
						  {t('Check-in Patient')}
						</button>
					  )}
					</div>
				  </div>
				))}
			  </div>
			)}
		  </div>

		</div>
	  )}
	</div>
  );
}