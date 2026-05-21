import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Users, ClipboardList, Search, UserPlus, Clock, 
  ShieldAlert, ArrowRight, Activity, Calendar, CheckCircle, RefreshCcw, User, Phone, Droplet 
} from 'lucide-react';

export default function ReceptionDashboard() {
  const [activeTab, setActiveTab] = useState('checkin');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data State
  const [patients, setPatients] = useState([]);
  const [waitingRoom, setWaitingRoom] = useState([]);
  
  // Interaction State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatientForm, setIsNewPatientForm] = useState(false);
  
  // Forms
  const [visitForm, setVisitForm] = useState({ priority: 'Routine', notes: '' });
  const [newPatientForm, setNewPatientForm] = useState({
	full_name: '', email: '', date_of_birth: '', gender: 'Male', blood_group: 'O+', phone_number: '', allergies: ''
  });

  const fetchFrontDeskData = async (isManual = false) => {
	if (isManual) setIsRefreshing(true);
	else setLoading(true);

	try {
	  const { data: patientsData } = await supabase
		.from('profiles')
		.select('*')
		.eq('role', 'patient')
		.order('full_name', { ascending: true });

	  const { data: queueData } = await supabase
		.from('visits')
		.select(`id, status, triage_priority, created_at, patient:patient_id(id, full_name)`)
		.eq('status', 'waiting')
		.order('created_at', { ascending: true });

	  setPatients(patientsData || []);
	  setWaitingRoom(queueData || []);
	} catch (error) {
	  console.error("Error fetching front desk data:", error);
	} finally {
	  setLoading(false);
	  setIsRefreshing(false);
	}
  };

  useEffect(() => { fetchFrontDeskData(); }, []);

  // --- ACTIONS ---
  const handleRegisterNewPatient = async (e) => {
	e.preventDefault();
	setLoading(true);
	
	// We insert directly into profiles (as a generic hospital record, no auth login yet)
	const { data, error } = await supabase.from('profiles').insert([{
	  full_name: newPatientForm.full_name,
	  email: newPatientForm.email,
	  date_of_birth: newPatientForm.date_of_birth,
	  gender: newPatientForm.gender,
	  blood_group: newPatientForm.blood_group,
	  phone_number: newPatientForm.phone_number,
	  allergies: newPatientForm.allergies,
	  role: 'patient',
	  status: 'approved'
	}]).select().single();

	if (error) {
	  alert("Registration failed: " + error.message);
	} else {
	  // Auto-select them for immediate check-in
	  setSelectedPatient(data);
	  setIsNewPatientForm(false);
	  setNewPatientForm({ full_name: '', email: '', date_of_birth: '', gender: 'Male', blood_group: 'O+', phone_number: '', allergies: '' });
	  fetchFrontDeskData();
	}
	setLoading(false);
  };

  const handleCheckIn = async (e) => {
	e.preventDefault();
	if (!selectedPatient) return;

	setLoading(true);
	const { error } = await supabase.from('visits').insert([{
	  patient_id: selectedPatient.id,
	  status: 'waiting',
	  triage_priority: visitForm.priority,
	  clinical_notes: visitForm.notes ? `Chief Complaint at Triage: ${visitForm.notes}` : ''
	}]);

	if (error) {
	  alert("Error checking in patient: " + error.message);
	} else {
	  setTimeout(() => window.print(), 100); // Trigger ticket print
	  setVisitForm({ priority: 'Routine', notes: '' });
	  setSelectedPatient(null);
	  setActiveTab('waiting_room');
	  fetchFrontDeskData();
	}
	setLoading(false);
  };

  const filteredPatients = patients.filter(p => 
	p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
	p.id.includes(searchQuery) ||
	p.phone_number?.includes(searchQuery)
  );

  const getPriorityStyle = (priority) => {
	const p = priority?.toLowerCase();
	if (p === 'emergency' || p === 'high') return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400', glow: 'shadow-red-500/30', lightBg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30' };
	if (p === 'urgent') return { bg: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', glow: 'shadow-amber-500/30', lightBg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' };
	return { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-emerald-500/30', lightBg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30' };
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* AMBIENT BACKGROUND GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-cyan-500/10 dark:bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-1000"></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Front of House</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Reception & Triage
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Patient registration, queue management, and priority triage.</p>
		</div>
		
		{/* PREMIUM SEGMENTED CONTROLLER */}
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button 
			onClick={() => setActiveTab('checkin')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'checkin' ? 'bg-white dark:bg-slate-800 shadow-sm text-cyan-600 dark:text-cyan-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<ClipboardList className="w-4 h-4"/> Check-In Desk
		  </button>
		  <button 
			onClick={() => setActiveTab('waiting_room')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'waiting_room' ? 'bg-white dark:bg-slate-800 shadow-sm text-cyan-600 dark:text-cyan-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Users className="w-4 h-4"/> Live Waiting Room
			{waitingRoom.length > 0 && (
			  <span className="ml-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 py-0.5 px-2 rounded-full text-[10px]">
				{waitingRoom.length}
			  </span>
			)}
		  </button>
		</div>
	  </div>

	  {loading ? (
		<div className="flex flex-col items-center justify-center h-64 gap-4">
		  <Activity className="w-10 h-10 text-cyan-500/50 animate-bounce" />
		  <p className="text-sm font-medium text-slate-500 animate-pulse">Syncing operations database...</p>
		</div>
	  ) : (
		<>
		  {activeTab === 'checkin' && (
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
			  
			  {/* LEFT: PATIENT SEARCH & DIRECTORY */}
			  <div className={`lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col ${selectedPatient || isNewPatientForm ? 'hidden lg:flex h-[800px]' : 'h-[800px]'}`}>
				<div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-4">
				  <div className="flex justify-between items-center">
					<h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
					  <Search className="w-4 h-4"/> Patient Lookup
					</h3>
					<button onClick={() => { setIsNewPatientForm(true); setSelectedPatient(null); }} className="text-[10px] font-black uppercase bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 px-3 py-1.5 rounded-lg hover:bg-cyan-200 transition-colors flex items-center gap-1">
					  <UserPlus className="w-3 h-3"/> New Patient
					</button>
				  </div>
				  <div className="relative group">
					<Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
					<input 
					  type="text" 
					  placeholder="Search by name, ID, or phone..." 
					  value={searchQuery}
					  onChange={(e) => setSearchQuery(e.target.value)}
					  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-900 dark:text-white"
					/>
				  </div>
				</div>
				
				<div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
				  {filteredPatients.length === 0 ? (
					<div className="text-center p-8 text-slate-400 text-sm">No patients found. Click "New Patient".</div>
				  ) : filteredPatients.map(patient => (
					<div 
					  key={patient.id} 
					  onClick={() => { setSelectedPatient(patient); setIsNewPatientForm(false); }} 
					  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border group ${selectedPatient?.id === patient.id ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/30 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
					>
					  <div className="flex justify-between items-center">
						<div className="truncate pr-3">
						  <div className={`font-bold text-sm truncate transition-colors ${selectedPatient?.id === patient.id ? 'text-cyan-900 dark:text-cyan-300' : 'text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}`}>
							{patient.full_name || 'Unnamed Patient'}
						  </div>
						  <div className="text-[10px] font-mono text-slate-400 mt-1 truncate flex items-center gap-2">
							<span>ID: {patient.id.split('-')[0]}</span>
							{patient.phone_number && <span>• {patient.phone_number}</span>}
						  </div>
						</div>
						<ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${selectedPatient?.id === patient.id ? 'text-cyan-500 translate-x-1' : 'text-slate-300 dark:text-slate-700 group-hover:text-cyan-400'}`} />
					  </div>
					</div>
				  ))}
				</div>
			  </div>

			  {/* RIGHT: FORMS (NEW PATIENT OR CHECK-IN) */}
			  <div className={`lg:col-span-2 ${!selectedPatient && !isNewPatientForm ? 'hidden lg:block' : ''}`}>
				
				{/* STATE A: NEW PATIENT REGISTRATION FORM */}
				{isNewPatientForm && (
				  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[800px] animate-in fade-in slide-in-from-right-4 duration-300">
					<div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
					  <button onClick={() => setIsNewPatientForm(false)} className="lg:hidden text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-4 flex items-center gap-1 hover:underline"><ArrowRight className="w-4 h-4 rotate-180"/> Cancel</button>
					  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2"><UserPlus className="w-5 h-5 text-cyan-500"/> Register New Patient</h2>
					  <p className="text-sm text-slate-500 mt-1">Create a comprehensive medical record. Email is used for portal access.</p>
					</div>

					<div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
					  <form onSubmit={handleRegisterNewPatient} className="space-y-6">
						
						<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						  <div className="space-y-1.5">
							<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Legal Full Name</label>
							<input required type="text" placeholder="John Doe" value={newPatientForm.full_name} onChange={e=>setNewPatientForm({...newPatientForm, full_name: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"/>
						  </div>
						  <div className="space-y-1.5">
							<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Date of Birth</label>
							<input required type="date" value={newPatientForm.date_of_birth} onChange={e=>setNewPatientForm({...newPatientForm, date_of_birth: e.target.value})} className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"/>
						  </div>
						</div>

						<div className="grid grid-cols-2 md:grid-cols-4 gap-5">
						  <div className="space-y-1.5 md:col-span-2">
							<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Sex Assigned</label>
							<select value={newPatientForm.gender} onChange={e=>setNewPatientForm({...newPatientForm, gender: e.target.value})} className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white">
							  <option>Male</option><option>Female</option><option>Other</option>
							</select>
						  </div>
						  <div className="space-y-1.5 md:col-span-2">
							<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex items-center gap-1"><Droplet className="w-3 h-3 text-red-500"/> Blood Group</label>
							<select value={newPatientForm.blood_group} onChange={e=>setNewPatientForm({...newPatientForm, blood_group: e.target.value})} className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white">
							  <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
							</select>
						  </div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 dark:border-slate-800 pt-6">
						  <div className="space-y-1.5">
							<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email Address</label>
							<input required type="email" placeholder="patient@example.com" value={newPatientForm.email} onChange={e=>setNewPatientForm({...newPatientForm, email: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"/>
						  </div>
						  <div className="space-y-1.5">
							<label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Phone Number</label>
							<input type="tel" placeholder="+966 5X XXX XXXX" value={newPatientForm.phone_number} onChange={e=>setNewPatientForm({...newPatientForm, phone_number: e.target.value})} className="w-full text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white"/>
						  </div>
						</div>

						<div className="space-y-1.5">
						  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 text-red-500">Known Allergies (Optional)</label>
						  <textarea placeholder="e.g. Penicillin, Peanuts. Leave blank if none." value={newPatientForm.allergies} onChange={e=>setNewPatientForm({...newPatientForm, allergies: e.target.value})} className="w-full h-24 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white resize-none"/>
						</div>

						<button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest shadow-lg shadow-slate-900/20 dark:shadow-white/10 disabled:opacity-50">
						  Create Medical Record
						</button>
					  </form>
					</div>
				  </div>
				)}

				{/* STATE B: CHECK-IN DESK (CREATE VISIT) */}
				{selectedPatient && (
				  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[800px] animate-in fade-in slide-in-from-right-4 duration-300">
					
					<div className="relative p-6 md:p-8 overflow-hidden border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
					  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
					  
					  <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
						<div>
						  <button onClick={() => setSelectedPatient(null)} className="lg:hidden text-cyan-600 dark:text-cyan-400 font-bold text-xs mb-4 flex items-center gap-1 hover:underline"><ArrowRight className="w-4 h-4 rotate-180"/> Back to Search</button>
						  
						  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Initiating Visit For</div>
						  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
							{selectedPatient.full_name}
							{selectedPatient.blood_group && <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ring-1 ring-red-200 dark:ring-red-500/30">{selectedPatient.blood_group}</span>}
						  </h2>
						  <div className="flex gap-4 mt-3 text-xs font-semibold text-slate-500">
							{selectedPatient.date_of_birth && <span>DOB: {selectedPatient.date_of_birth}</span>}
							{selectedPatient.gender && <span>Sex: {selectedPatient.gender}</span>}
						  </div>
						</div>
					  </div>
					</div>

					<div className="p-6 md:p-8 flex-1 flex flex-col">
					  <form onSubmit={handleCheckIn} className="w-full space-y-6">
						
						<div className="space-y-2">
						  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">
							<ShieldAlert className="w-4 h-4"/> Triage Priority Level
						  </label>
						  <div className="grid grid-cols-3 gap-3">
							{['Routine', 'Urgent', 'Emergency'].map(level => {
							  const style = getPriorityStyle(level);
							  const isSelected = visitForm.priority === level;
							  return (
								<button key={level} type="button" onClick={() => setVisitForm({...visitForm, priority: level})} className={`py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isSelected ? `${style.bg} text-white ${style.glow}` : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}>
								  {level}
								</button>
							  );
							})}
						  </div>
						</div>

						<div className="space-y-2">
						  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">
							<ClipboardList className="w-4 h-4"/> Chief Complaint / Notes
						  </label>
						  <textarea 
							required
							placeholder="Why is the patient visiting today? (e.g. Severe chest pain, routine checkup)"
							value={visitForm.notes}
							onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
							className="w-full h-40 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-900 dark:text-white resize-none"
						  />
						</div>

						{selectedPatient.allergies && (
						  <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
							<h4 className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest mb-1">Warning: Known Allergies</h4>
							<p className="text-sm font-semibold text-red-800 dark:text-red-300">{selectedPatient.allergies}</p>
						  </div>
						)}

						<button type="submit" disabled={loading} className="w-full mt-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex justify-center items-center gap-2">
						  <CheckCircle className="w-5 h-5"/> Issue Ticket & Send to Waiting Room
						</button>
					  </form>
					</div>
				  </div>
				)}

				{/* STATE C: EMPTY STATE */}
				{!selectedPatient && !isNewPatientForm && (
				  <div className="hidden lg:flex h-[800px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl items-center justify-center p-12 text-center text-slate-400 backdrop-blur-sm">
					<div className="space-y-4">
					  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
						<UserPlus className="w-8 h-8 opacity-40" />
					  </div>
					  <p className="font-medium">Search and select a patient record<br/>to begin the check-in process.</p>
					</div>
				  </div>
				)}
			  </div>
			</div>
		  )}

		  {activeTab === 'waiting_room' && (
			 // (Waiting Room block exactly the same as previously generated)
			 <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px]">
			 
			 <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
			   <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
				 <Clock className="w-5 h-5 text-cyan-500"/> Live Triage Queue
			   </h2>
			   <button onClick={() => fetchFrontDeskData(true)} className="text-xs font-bold text-slate-500 hover:text-cyan-500 transition-colors flex items-center gap-1">
				 <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}/> Sync Queue
			   </button>
			 </div>

			 {waitingRoom.length === 0 ? (
			   <div className="text-center p-16 text-slate-400 flex flex-col items-center">
				 <CheckCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mb-4" />
				 <p className="text-lg font-bold text-slate-500">The waiting room is empty.</p>
				 <p className="text-sm mt-1">All patients have been called by the clinical staff.</p>
			   </div>
			 ) : (
			   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				 {waitingRoom.map((visit) => {
				   const priorityStyle = getPriorityStyle(visit.triage_priority);
				   const waitTimeMins = Math.floor((new Date() - new Date(visit.created_at)) / 60000);
				   
				   return (
					 <div key={visit.id} className={`relative p-6 rounded-3xl border shadow-sm flex flex-col justify-between group overflow-hidden ${priorityStyle.lightBg} ${priorityStyle.border}`}>
					   
					   <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none ${priorityStyle.bg}`}></div>

					   <div>
						 <div className="flex justify-between items-start mb-4">
						   <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md text-white shadow-sm ${priorityStyle.bg} ${priorityStyle.glow}`}>
							 {visit.triage_priority}
						   </span>
						   <span className="text-[10px] font-mono text-slate-500 bg-white/50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
							 {visit.id.split('-')[0]}
						   </span>
						 </div>
						 
						 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
						   {visit.patient?.full_name}
						 </h3>
					   </div>

					   <div className="mt-6 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
						 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
						   <Clock className="w-3.5 h-3.5"/> 
						   {waitTimeMins < 1 ? 'Just arrived' : `${waitTimeMins} min wait`}
						 </div>
						 <span className="text-[10px] uppercase tracking-widest font-black text-cyan-600 dark:text-cyan-400">
						   Awaiting Nurse
						 </span>
					   </div>
					 </div>
				   )
				 })}
			   </div>
			 )}
		   </div>
		  )}
		</>
	  )}

	  {/* --- HIDDEN PHYSICAL PRINT TICKET --- */}
	  {selectedPatient && (
		<div id="printable-ticket" className="hidden print:block text-black bg-white p-8 max-w-md mx-auto border-2 border-slate-200 font-sans">
		  <div className="text-center border-b-2 border-slate-200 pb-4 mb-6">
			<h1 className="text-3xl font-black text-slate-900 tracking-widest">OPERIX</h1>
			<p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Enterprise Health System</p>
		  </div>
		  
		  <div className="text-center font-bold text-lg mb-6 uppercase bg-slate-100 py-2 border border-slate-200">
			Visit Routing Ticket
		  </div>

		  <div className="space-y-4 text-sm">
			<div className="flex justify-between border-b border-slate-100 pb-2">
			  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Date / Time</span>
			  <span className="font-bold font-mono">{new Date().toLocaleString()}</span>
			</div>
			<div className="flex justify-between border-b border-slate-100 pb-2">
			  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Patient</span>
			  <span className="font-black text-lg uppercase">{selectedPatient.full_name}</span>
			</div>
			<div className="flex justify-between border-b border-slate-100 pb-2">
			  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Triage Priority</span>
			  <span className="font-black uppercase tracking-widest bg-slate-100 px-3 py-1 rounded">{visitForm.priority}</span>
			</div>
			<div className="flex justify-between border-b border-slate-100 pb-2">
			  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Department</span>
			  <span className="font-bold uppercase">General Practice</span>
			</div>
		  </div>

		  <div className="text-center mt-12 font-mono text-xl font-bold tracking-[0.3em] border border-dashed border-slate-300 py-4">
			*PT-{selectedPatient.id.split('-')[0].toUpperCase()}*
		  </div>
		  
		  <div className="text-center mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
			Please present this ticket to the clinical nurse when called.
		  </div>
		</div>
	  )}

	</div>
  );
}