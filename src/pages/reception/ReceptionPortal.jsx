import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { 
  Calendar, Clock, User, FileText, CheckCircle, XCircle, 
  Settings, ShieldAlert, Phone, Mail, Activity, 
  Bell, Lock, Upload, Receipt, FilePlus, ChevronRight, Hash, Download, QrCode
} from 'lucide-react';

// ==========================================
// CONFIGURATION
// ==========================================
const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmd1QUqvJ9FNIGDXAgIFFXUoKip3yeEkQqzbugfJtUsK7YHj8Ma0eMxDl6lLDtzL8f/exec';

export default function ReceptionDashboard() {
  const { user, role } = useAuth();
  
  const [activeTab, setActiveTab] = useState('registration');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Refs for Image Export
  const routingTicketRef = useRef(null);
  const financialReceiptRef = useRef(null);

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 6000);
  };

  // ==========================================
  // STATE: REGISTRATION & TICKETING FLOW
  // ==========================================
  const [regStep, setRegStep] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null); 
  
  const [regForm, setRegForm] = useState({
	full_name: '', email: '', phone: '', date_of_birth: '', 
	sex: '', address: '', blood_group: '', health_notes: ''
  });
  const [uploadFiles, setUploadFiles] = useState([]);
  const [registering, setRegistering] = useState(false);

  const [ticketForm, setTicketForm] = useState({
	consultation: true, blood_test: false, urine_test: false, xray: false, custom_notes: ''
  });
  const [generatedTicket, setGeneratedTicket] = useState(null);

  const PRICING = { consultation: 50, blood_test: 30, urine_test: 20, xray: 100 };
  const calculateTotal = () => {
	let total = 0;
	if (ticketForm.consultation) total += PRICING.consultation;
	if (ticketForm.blood_test) total += PRICING.blood_test;
	if (ticketForm.urine_test) total += PRICING.urine_test;
	if (ticketForm.xray) total += PRICING.xray;
	return total;
  };

  // ==========================================
  // STATE: APPOINTMENTS & SETTINGS
  // ==========================================
  const [appointments, setAppointments] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newAppt, setNewAppt] = useState({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });
  const [booking, setBooking] = useState(false);

  const [settingsForm, setSettingsForm] = useState({ notifications: true, dark_mode: true, two_factor: false });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAppointmentsData = async () => {
	setLoading(true);
	if (['admin', 'receptionist'].includes(role)) {
	  const { data: pFiles } = await supabase.from('patient_files').select('id, full_name, email').not('full_name', 'is', null);
	  if (pFiles) setPatientsList(pFiles);

	  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role');
	  if (profiles) setDoctors(profiles.filter(p => p.role === 'doctor'));
	}

	// Change "patient:profiles" to "patient:patient_files"
	let query = supabase.from('appointments').select(`
	  id, appointment_date, time_slot, status, reason,
	  patient:patient_files!appointments_patient_id_fkey(full_name),
	  doctor:profiles!appointments_doctor_id_fkey(full_name)
	`).order('appointment_date', { ascending: true }).order('time_slot', { ascending: true });

	if (role === 'doctor') query = query.eq('doctor_id', user?.id);
	const { data } = await query;
	if (data) setAppointments(data);
	setLoading(false);
  };

  useEffect(() => {
	if (activeTab === 'appointments') fetchAppointmentsData();
  }, [activeTab, role, user?.id]);

  // ==========================================
  // IMAGE EXPORT FUNCTION
  // ==========================================
  const exportImage = async (ref, fileNamePrefix) => {
	if (!ref.current) return;
	try {
	  showMessage('success', 'Generating high-resolution image...');
	  const dataUrl = await toPng(ref.current, { 
		backgroundColor: '#ffffff', 
		pixelRatio: 3, // High quality for printing
		style: { transform: 'scale(1)', borderRadius: '0px' } // Flattens UI elements for clean export
	  });
	  const link = document.createElement('a');
	  link.href = dataUrl;
	  link.download = `${fileNamePrefix}_${generatedTicket.id}.png`;
	  link.click();
	} catch (error) {
	  showMessage('error', 'Failed to export image. Please try again.');
	}
  };

  // ==========================================
  // HANDLERS: REGISTRATION & TICKETING
  // ==========================================
  const fileToBase64 = (file) => {
	return new Promise((resolve, reject) => {
	  const reader = new FileReader();
	  reader.readAsDataURL(file);
	  reader.onload = () => resolve(reader.result.split(',')[1]);
	  reader.onerror = error => reject(error);
	});
  };

  const handleRegisterPatient = async (e) => {
	e.preventDefault();
	setRegistering(true);
	setMessage({ type: '', text: '' });

	try {
	  const { data: newPatient, error: dbError } = await supabase.from('patient_files').insert([{
		full_name: regForm.full_name,
		email: regForm.email,
		phone: regForm.phone,
		date_of_birth: regForm.date_of_birth,
		sex: regForm.sex,
		address: regForm.address,
		blood_group: regForm.blood_group,
		medical_history: regForm.health_notes,
		uploaded_by: user.id
	  }]).select().single();

	  if (dbError) throw dbError;

	  if (uploadFiles.length > 0) {
		for (const file of uploadFiles) {
		  const base64Data = await fileToBase64(file);
		  const gasResponse = await fetch(GAS_WEBHOOK_URL, {
			method: 'POST',
			body: JSON.stringify({ fileName: `${newPatient.id}_${file.name}`, mimeType: file.type, fileData: base64Data })
		  });
		  const gasData = await gasResponse.json();
		  if (gasData.fileUrl) {
			await supabase.from('patient_files').insert([{
			  patient_id: newPatient.id, uploaded_by: user.id, file_name: file.name, file_type: file.type, file_url: gasData.fileUrl
			}]);
		  }
		}
	  }
	  
	  setSelectedPatient(newPatient);
	  setRegStep(2);
	  showMessage('success', `Patient Profile created. Proceed to Services & Billing.`);
	} catch (err) {
	  showMessage('error', "Registration Error: " + err.message);
	} finally {
	  setRegistering(false);
	}
  };

  const handleGenerateTicket = async (e) => {
	e.preventDefault();
	setRegistering(true);

	try {
	  let requestedServices = [];
	  if (ticketForm.consultation) requestedServices.push('Consultation');
	  if (ticketForm.blood_test) requestedServices.push('Blood Test');
	  if (ticketForm.urine_test) requestedServices.push('Urine Test');
	  if (ticketForm.xray) requestedServices.push('X-Ray');

	  const totalBill = calculateTotal();

	  // INSERT TICKET: Notice doctor_name is left blank. Status goes straight to triage.
	  const { data: ticket, error: ticketError } = await supabase.from('tickets').insert([{
		patient_id: selectedPatient.id,
		patient_name: selectedPatient.full_name,
		services_requested: requestedServices.join(', '),
		total_bill: totalBill,
		payment_status: 'pending',
		status: 'awaiting_triage', // NURSE QUEUE
		notes: ticketForm.custom_notes
	  }]).select().single();

	  if (ticketError) throw ticketError;

	  setGeneratedTicket(ticket);
	  setRegStep(3); // Move to Export Screen
	  showMessage('success', `Ticket & Receipt Generated Successfully!`);
	} catch (err) {
	  showMessage('error', "Ticketing Error: " + err.message);
	} finally {
	  setRegistering(false);
	}
  };

  const handleBookAppointment = async (e) => {
	e.preventDefault();
	setBooking(true);
	try {
	  const { error } = await supabase.from('appointments').insert({
		patient_id: newAppt.patient_id, doctor_id: newAppt.doctor_id, appointment_date: newAppt.date, time_slot: newAppt.time, reason: newAppt.reason
	  });
	  if (error) throw error;
	  setNewAppt({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });
	  fetchAppointmentsData();
	  showMessage('success', 'Appointment scheduled!');
	} catch (error) {
	  showMessage('error', error.message);
	} finally {
	  setBooking(false);
	}
  };

  const resetFlow = () => {
	setRegStep(1);
	setSelectedPatient(null);
	setGeneratedTicket(null);
	setUploadFiles([]);
	setRegForm({ full_name: '', email: '', phone: '', date_of_birth: '', sex: '', address: '', blood_group: '', health_notes: '' });
	setTicketForm({ consultation: true, blood_test: false, urine_test: false, xray: false, custom_notes: '' });
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans overflow-hidden min-h-screen">
	  
	  {/* AMBIENT BACKGROUND GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
	  <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-teal-500/10 dark:bg-teal-600/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Front Desk Operations</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Reception Dashboard
		  </h1>
		</div>
		
		{/* SEGMENTED CONTROLLER */}
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button onClick={() => setActiveTab('registration')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'registration' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}>
			<User className="w-4 h-4"/> Intake & Tickets
		  </button>
		  <button onClick={() => setActiveTab('appointments')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'appointments' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}>
			<Calendar className="w-4 h-4"/> Appointments
		  </button>
		  <button onClick={() => setActiveTab('settings')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}>
			<Settings className="w-4 h-4"/> Settings
		  </button>
		</div>
	  </div>

	  {/* ALERTS */}
	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
		  {message.text}
		</div>
	  )}

	  {/* ========================================== */}
	  {/* TAB 1: INTAKE & TICKETING */}
	  {/* ========================================== */}
	  {activeTab === 'registration' && (
		<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
		  
		  {/* STEP 1: PATIENT REGISTRATION */}
		  {regStep === 1 && (
			<div className="max-w-4xl mx-auto space-y-8">
			  <div className="text-center mb-8">
				<div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl mb-4">
				  <FilePlus className="w-8 h-8" />
				</div>
				<h2 className="text-2xl font-black text-slate-900 dark:text-white">New Patient Enrollment</h2>
				<p className="text-sm text-slate-500 mt-1">Capture demographics and upload external health files (GAS Auth).</p>
			  </div>

			  <form onSubmit={handleRegisterPatient} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950/30 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Legal Full Name</label>
					<input required type="text" value={regForm.full_name} onChange={e => setRegForm({...regForm, full_name: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"/>
				  </div>
				  <div className="grid grid-cols-2 gap-4">
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">DOB</label>
					  <input required type="date" value={regForm.date_of_birth} onChange={e => setRegForm({...regForm, date_of_birth: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"/>
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Sex</label>
					  <select required value={regForm.sex} onChange={e => setRegForm({...regForm, sex: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white">
						<option value="">Select...</option><option value="M">Male</option><option value="F">Female</option>
					  </select>
					</div>
					<div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Activity className="w-3 h-3 text-red-500"/> Blood Group</label>
					  <select value={regForm.blood_group} onChange={e => setRegForm({...regForm, blood_group: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white">
						<option value="">Select...</option>
						<option value="A+">A+</option><option value="A-">A-</option>
						<option value="B+">B+</option><option value="B-">B-</option>
						<option value="AB+">AB+</option><option value="AB-">AB-</option>
						<option value="O+">O+</option><option value="O-">O-</option>
					  </select>
					</div>
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Mail className="w-3 h-3"/> Email</label>
					<input type="email" value={regForm.email} onChange={e => setRegForm({...regForm, email: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white" />
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Phone className="w-3 h-3"/> Phone Number</label>
					<input required type="tel" value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white"/>
				  </div>
				  <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-6 mt-2">
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Known Medical History / Allergies</label>
					<textarea value={regForm.health_notes} onChange={e => setRegForm({...regForm, health_notes: e.target.value})} rows="2" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-900 dark:text-white placeholder:text-slate-400"></textarea>
				  </div>
				  <div className="md:col-span-2">
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5"><Upload className="w-3 h-3 text-emerald-500"/> External Files & Records (Via GAS API)</label>
					<input type="file" multiple onChange={e => setUploadFiles(Array.from(e.target.files))} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-medium outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"/>
					{uploadFiles.length > 0 && <p className="text-[10px] font-bold text-emerald-600 mt-2">{uploadFiles.length} file(s) queued for GAS upload.</p>}
				  </div>
				</div>
				<button type="submit" disabled={registering} className="w-full bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold rounded-xl p-4 text-sm transition shadow-lg shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
				  {registering ? 'Processing Profile & Uploading Files...' : <>Register & Proceed to Services <ChevronRight className="w-4 h-4"/></>}
				</button>
			  </form>
			</div>
		  )}

		  {/* STEP 2: SELECT SERVICES & BILLING */}
		  {regStep === 2 && !generatedTicket && (
			<div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500">
			  <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 flex justify-between items-center">
				<div>
				  <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1">Active Patient Context</div>
				  <h3 className="text-xl font-black text-slate-900 dark:text-white">{selectedPatient?.full_name}</h3>
				</div>
				<User className="w-8 h-8 text-emerald-300" />
			  </div>

			  <form onSubmit={handleGenerateTicket} className="space-y-6 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-950/30">
				<h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4"><Receipt className="w-5 h-5 text-emerald-500"/> Required Services</h4>
				
				<div className="space-y-3">
				  <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors">
					<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Physician Consultation</span>
					<div className="flex items-center gap-4">
					  <span className="font-mono text-sm text-slate-500">${PRICING.consultation}</span>
					  <input type="checkbox" checked={ticketForm.consultation} onChange={e => setTicketForm({...ticketForm, consultation: e.target.checked})} className="w-5 h-5 accent-emerald-600"/>
					</div>
				  </label>
				  <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors">
					<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Blood Test (CBC, Chem Panel)</span>
					<div className="flex items-center gap-4">
					  <span className="font-mono text-sm text-slate-500">${PRICING.blood_test}</span>
					  <input type="checkbox" checked={ticketForm.blood_test} onChange={e => setTicketForm({...ticketForm, blood_test: e.target.checked})} className="w-5 h-5 accent-emerald-600"/>
					</div>
				  </label>
				  <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors">
					<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Urine Analysis</span>
					<div className="flex items-center gap-4">
					  <span className="font-mono text-sm text-slate-500">${PRICING.urine_test}</span>
					  <input type="checkbox" checked={ticketForm.urine_test} onChange={e => setTicketForm({...ticketForm, urine_test: e.target.checked})} className="w-5 h-5 accent-emerald-600"/>
					</div>
				  </label>
				  <label className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-400 transition-colors">
					<span className="font-bold text-sm text-slate-800 dark:text-slate-200">Radiology / X-Ray</span>
					<div className="flex items-center gap-4">
					  <span className="font-mono text-sm text-slate-500">${PRICING.xray}</span>
					  <input type="checkbox" checked={ticketForm.xray} onChange={e => setTicketForm({...ticketForm, xray: e.target.checked})} className="w-5 h-5 accent-emerald-600"/>
					</div>
				  </label>
				</div>

				<div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex items-center justify-between">
				  <div>
					<div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Payable Amount</div>
					<div className="text-3xl font-black font-mono text-slate-900 dark:text-white">${calculateTotal()}</div>
				  </div>
				  <button type="submit" disabled={registering} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-8 py-4 text-sm transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
					{registering ? 'Generating...' : 'Generate Ticket & Receipt'}
				  </button>
				</div>
			  </form>
			</div>
		  )}

		  {/* STEP 3: EXPORTABLE TICKETS & RECEIPTS */}
		  {generatedTicket && (
			<div className="animate-in zoom-in duration-500 space-y-8">
			  <div className="text-center mb-8">
				<h2 className="text-2xl font-black text-slate-900 dark:text-white">Documents Generated Successfully</h2>
				<p className="text-sm text-slate-500 mt-1">Export the Clinical Routing Ticket (for the Nurse/Doctor) and the Financial Receipt (for Patient/Chemist).</p>
			  </div>

			  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				
				{/* 1. THE CLINICAL ROUTING TICKET */}
				<div className="space-y-4">
				  {/* Export Target Container */}
				  <div ref={routingTicketRef} className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-200 shadow-md">
					
					{/* Header */}
					<div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-4">
					  <div>
						<h1 className="text-2xl font-black tracking-tighter">OPERIX Care</h1>
						<p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Routing Ticket</p>
					  </div>
					  <QrCode className="w-10 h-10 text-slate-300"/>
					</div>

					{/* MRN Block */}
					<div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-200 mb-6">
					  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Master Record Number (MRN)</div>
					  <div className="text-3xl font-black font-mono tracking-widest">{generatedTicket.id}</div>
					</div>

					{/* Patient Data */}
					<div className="space-y-3 mb-6">
					  <div>
						<div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Patient Name</div>
						<div className="font-bold text-lg">{generatedTicket.patient_name}</div>
					  </div>
					  <div className="grid grid-cols-2 gap-4">
						<div>
						  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sex</div>
						  <div className="font-bold">{selectedPatient.sex || 'N/A'}</div>
						</div>
						<div>
						  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">DOB</div>
						  <div className="font-bold">{selectedPatient.date_of_birth || 'N/A'}</div>
						</div>
					  </div>
					</div>

					{/* Services */}
					<div className="border-t-2 border-slate-100 pt-4 mb-6">
					  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Requested Services / Next Stop</div>
					  <div className="font-bold bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200">
						{generatedTicket.services_requested}
					  </div>
					</div>

					<div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
					  Generated: {new Date().toLocaleString()}
					</div>
				  </div>

				  <button onClick={() => exportImage(routingTicketRef, 'Routing_Ticket')} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3.5 rounded-xl text-sm flex justify-center items-center gap-2 transition active:scale-95 shadow-lg">
					<Download className="w-4 h-4"/> Download Routing Ticket
				  </button>
				</div>

				{/* 2. THE FINANCIAL RECEIPT */}
				<div className="space-y-4">
				  {/* Export Target Container */}
				  <div ref={financialReceiptRef} className="bg-white text-slate-900 p-8 rounded-2xl border-2 border-slate-200 shadow-md">
					
					{/* Header */}
					<div className="text-center border-b-2 border-slate-100 pb-4 mb-4">
					  <h1 className="text-xl font-black tracking-tighter">OPERIX Care</h1>
					  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Financial Receipt</p>
					</div>

					<div className="flex justify-between items-center mb-6 text-xs font-bold">
					  <span className="text-slate-500">MRN: {generatedTicket.id}</span>
					  <span className="text-slate-500">{new Date().toLocaleDateString()}</span>
					</div>

					<div className="mb-6">
					  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Billed To</div>
					  <div className="font-bold">{generatedTicket.patient_name}</div>
					</div>

					{/* Itemized Bill */}
					<div className="space-y-3 border-t-2 border-b-2 border-dashed border-slate-200 py-4 mb-6">
					  {ticketForm.consultation && <div className="flex justify-between text-sm"><span className="font-bold text-slate-700">Physician Consult</span><span className="font-mono font-bold">${PRICING.consultation}</span></div>}
					  {ticketForm.blood_test && <div className="flex justify-between text-sm"><span className="font-bold text-slate-700">Blood Analysis</span><span className="font-mono font-bold">${PRICING.blood_test}</span></div>}
					  {ticketForm.urine_test && <div className="flex justify-between text-sm"><span className="font-bold text-slate-700">Urine Analysis</span><span className="font-mono font-bold">${PRICING.urine_test}</span></div>}
					  {ticketForm.xray && <div className="flex justify-between text-sm"><span className="font-bold text-slate-700">Radiology (X-Ray)</span><span className="font-mono font-bold">${PRICING.xray}</span></div>}
					</div>

					<div className="flex justify-between items-end mb-6">
					  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Amount</div>
					  <div className="text-2xl font-black font-mono">${generatedTicket.total_bill}</div>
					</div>

					<div className="bg-slate-100 p-3 rounded-lg text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
					  Status: {generatedTicket.payment_status}
					</div>
				  </div>

				  <button onClick={() => exportImage(financialReceiptRef, 'Financial_Receipt')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm flex justify-center items-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-500/20">
					<Download className="w-4 h-4"/> Download Official Receipt
				  </button>
				</div>

			  </div>

			  <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
				<button onClick={resetFlow} className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:underline">
				  Clear terminal and register next patient
				</button>
			  </div>
			</div>
		  )}
		</div>
	  )}

	  {/* ========================================== */}
	  {/* TAB 2: APPOINTMENTS */}
	  {/* ========================================== */}
	  {activeTab === 'appointments' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  {['admin', 'receptionist'].includes(role) && (
			<div className="col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 h-fit">
			  <h2 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
				<Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Book New Slot
			  </h2>
			  <form onSubmit={handleBookAppointment} className="space-y-4">
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Patient</label>
				  <select required value={newAppt.patient_id} onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none text-slate-900 dark:text-white">
					<option value="">Select Patient...</option>
					{patientsList.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
				  </select>
				</div>
				<div>
				  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Provider</label>
				  <select required value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none text-slate-900 dark:text-white">
					<option value="">Select Doctor...</option>
					{doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
				  </select>
				</div>
				<div className="grid grid-cols-2 gap-4">
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Date</label>
					<input required type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none text-slate-900 dark:text-white" />
				  </div>
				  <div>
					<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Time</label>
					<input required type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-medium outline-none text-slate-900 dark:text-white" />
				  </div>
				</div>
				<button type="submit" disabled={booking} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl p-3.5 text-sm transition mt-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
				  {booking ? 'Scheduling...' : 'Confirm Booking'}
				</button>
			  </form>
			</div>
		  )}

		  <div className={`col-span-1 ${['admin', 'receptionist'].includes(role) ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl h-[650px] flex flex-col`}>
			 <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
				<h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
				  <Clock className="w-4 h-4"/> Upcoming Schedule
				</h3>
			 </div>
			 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
				{appointments.length === 0 && !loading && (
				  <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-widest text-xs">No Appointments Found.</div>
				)}
				{appointments.map(appt => (
				  <div key={appt.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-emerald-500/50 transition-all">
					<div className="flex items-start gap-5">
					  <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-3 px-4 rounded-xl text-center min-w-[90px] border border-emerald-100 dark:border-emerald-500/20">
						<div className="text-[10px] font-black uppercase tracking-widest">{new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
						<div className="text-sm font-black mt-1 font-mono">{appt.time_slot}</div>
					  </div>
					  <div>
						<h4 className="font-black text-slate-900 dark:text-white text-lg">{appt.patient?.full_name || 'Unknown Patient'}</h4>
						<div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
						  <span className="font-bold flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400"/> Dr. {appt.doctor?.full_name}</span>
						</div>
					  </div>
					</div>
				  </div>
				))}
			 </div>
		  </div>
		</div>
	  )}

	  {/* ========================================== */}
	  {/* TAB 3: SETTINGS */}
	  {/* ========================================== */}
	  {activeTab === 'settings' && (
		<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-8 lg:p-12 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
		  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-800 pb-4 flex items-center gap-3">
			<Settings className="w-6 h-6 text-emerald-600"/> Desk Preferences
		  </h2>

		  <form onSubmit={(e) => { e.preventDefault(); setSavingSettings(true); setTimeout(() => { setSavingSettings(false); showMessage('success', 'Preferences saved.'); }, 800); }} className="space-y-8">
			<div className="flex items-center gap-5 p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
			  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
				<User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
			  </div>
			  <div>
				<h3 className="text-lg font-bold text-slate-900 dark:text-white">{user?.email || 'Active User'}</h3>
				<div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">System Role: {role}</div>
			  </div>
			</div>
			{/* Toggles */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			  <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex justify-between items-center">
				<div>
				  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"><Bell className="w-4 h-4 text-emerald-500"/> Push Notifications</h4>
				  <p className="text-xs text-slate-500 mt-1">Alerts for new patient registrations.</p>
				</div>
				<button type="button" onClick={() => setSettingsForm({...settingsForm, notifications: !settingsForm.notifications})} className={`w-12 h-6 rounded-full transition-colors relative ${settingsForm.notifications ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
				  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settingsForm.notifications ? 'translate-x-7' : 'translate-x-1'}`}></div>
				</button>
			  </div>
			</div>
		  </form>
		</div>
	  )}

	</div>
  );
}