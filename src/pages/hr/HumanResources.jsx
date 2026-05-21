import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Users, FileText, Download, Eye, Upload, Calendar, ShieldAlert, 
  Edit2, Save, X, Hash, ChevronLeft, ChevronRight, Fingerprint, Briefcase, Activity, User
} from 'lucide-react';

export default function HumanResources() {
  const [activeTab, setActiveTab] = useState('directory');
  const [staff, setStaff] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeRecord, setEmployeeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false); // NEW: State for Face ID photo
  const [documents, setDocuments] = useState([]);

  // --- ATTENDANCE & ROSTER STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [roster, setRoster] = useState({}); 

  const fetchStaff = async () => {
	setLoading(true);
	const { data } = await supabase.from('profiles').select('*').neq('role', 'patient').order('created_at', { ascending: false });
	if (data) setStaff(data);
	setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const openEmployeeFile = async (person) => {
	setSelectedEmployee(person);
	setEmployeeRecord(null);
	setIsEditing(false);
	setDocuments([]);

	let { data: record } = await supabase.from('employee_records').select('*').eq('staff_id', person.id).single();
	if (!record) {
	  const { data: newRecord } = await supabase.from('employee_records').insert([{ staff_id: person.id }]).select().single();
	  record = newRecord;
	}
	setEmployeeRecord(record);
	setEditForm(record); 

	const { data: files } = await supabase.storage.from('hr_documents').list(person.id);
	if (files) setDocuments(files);
  };

  const handleSaveChanges = async () => {
	setLoading(true);
	const { error } = await supabase.from('employee_records').update(editForm).eq('staff_id', selectedEmployee.id);
	if (error) alert("Error saving: " + error.message);
	else { setEmployeeRecord(editForm); setIsEditing(false); }
	setLoading(false);
  };

  // NEW: Face ID Photo Upload Handler
  const handlePhotoUpload = async (e) => {
	if (!e.target.files || e.target.files.length === 0 || !selectedEmployee) return;
	setUploadingPhoto(true);
	const file = e.target.files[0];
	const filePath = `${selectedEmployee.id}/face_id.jpeg`; // Consistent path for Face ID

	const { error } = await supabase.storage.from('employee_photos').upload(filePath, file, { upsert: true });
	
	if (!error) {
	  const { data } = supabase.storage.from('employee_photos').getPublicUrl(filePath);
	  // Update database with the public URL
	  await supabase.from('employee_records').update({ profile_url: data.publicUrl }).eq('staff_id', selectedEmployee.id);
	  openEmployeeFile(selectedEmployee); // Refresh data
	} else {
	  alert("Error syncing Face ID photo: " + error.message);
	}
	setUploadingPhoto(false);
  };

  const handleFileUpload = async (e) => {
	if (!e.target.files || e.target.files.length === 0 || !selectedEmployee) return;
	setUploading(true);
	const file = e.target.files[0];
	const filePath = `${selectedEmployee.id}/${Math.random()}_${file.name}`;
	const { error } = await supabase.storage.from('hr_documents').upload(filePath, file);
	if (!error) openEmployeeFile(selectedEmployee);
	setUploading(false);
  };

  const handleFileAction = async (fileName, action) => {
	const { data, error } = await supabase.storage.from('hr_documents').createSignedUrl(`${selectedEmployee.id}/${fileName}`, 60);
	if (error) return alert("Error accessing file.");
	if (action === 'preview') window.open(data.signedUrl, '_blank');
	if (action === 'download') {
	  const link = document.createElement('a');
	  link.href = data.signedUrl;
	  link.download = fileName;
	  link.click();
	}
  };

  const getExpiryStatus = (dateString) => {
	if (!dateString) return { bg: 'bg-slate-200 dark:bg-slate-800', bar: 'bg-slate-400', text: 'Not Set', pct: 0, textColor: 'text-slate-500' };
	const daysLeft = Math.floor((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
	if (daysLeft < 0) return { bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500', text: 'Expired', pct: 100, textColor: 'text-red-500' };
	if (daysLeft < 30) return { bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500', text: `${daysLeft} Days Left`, pct: 80, textColor: 'text-amber-500' };
	return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500', text: 'Valid & Active', pct: 100, textColor: 'text-emerald-500' };
  };

  // --- ATTENDANCE ROSTER LOGIC ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const groupedStaff = {
	'Medical Doctors': staff.filter(s => s.role === 'doctor'),
	'Nursing Staff': staff.filter(s => s.role === 'nurse'),
	'Pharmacy & Chemists': staff.filter(s => s.role === 'chemist'),
	'Front Desk Reception': staff.filter(s => s.role === 'receptionist'),
	'Management & Technical': staff.filter(s => ['admin', 'hr', 'it', 'accountant', 'manager'].includes(s.role?.toLowerCase())),
  };

  const handleShiftClick = (empId, day) => {
	const key = `${empId}_${day}`;
	const currentShift = roster[key];
	const shiftCycle = { undefined: 'M', 'M': 'N', 'N': 'O', 'O': 'L', 'L': 'S', 'S': undefined };
	setRoster({ ...roster, [key]: shiftCycle[currentShift] });
  };

  const handlePublishRoster = async () => {
	setLoading(true);
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth() + 1; 

	const recordsToInsert = Object.entries(roster).map(([key, shiftVal]) => {
	  const [staffId, dayStr] = key.split('_');
	  const day = parseInt(dayStr);
	  const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
	  return { staff_id: staffId, shift_date: formattedDate, shift_type: shiftVal };
	}).filter(record => record.shift_type !== undefined); 

	if (recordsToInsert.length === 0) {
	  alert("No shifts assigned! Click the grid to assign shifts first.");
	  setLoading(false);
	  return;
	}

	const { error } = await supabase.from('attendance').upsert(recordsToInsert, { onConflict: 'staff_id, shift_date' });
	if (error) alert("Error publishing roster: " + error.message);
	else alert(`Successfully published ${recordsToInsert.length} shift assignments!`);
	
	setLoading(false);
  };

  const shiftColors = {
	'M': 'bg-blue-500 text-white shadow-blue-500/30', 
	'N': 'bg-indigo-600 text-white shadow-indigo-600/30', 
	'O': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300', 
	'L': 'bg-amber-500 text-white shadow-amber-500/30', 
	'S': 'bg-red-500 text-white shadow-red-500/30' 
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  
	  {/* AMBIENT BACKGROUND GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
	  <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Department of People</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			HR & Compliance Ops
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Enterprise credentials, automated shifts, and secure records.</p>
		</div>
		
		{/* PREMIUM SEGMENTED CONTROLLER */}
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button 
			onClick={() => setActiveTab('directory')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'directory' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Users className="w-4 h-4"/> Staff Directory
		  </button>
		  <button 
			onClick={() => setActiveTab('attendance')} 
			className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 scale-95'}`}
		  >
			<Calendar className="w-4 h-4"/> Master Timesheet
		  </button>
		</div>
	  </div>

	  {activeTab === 'directory' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  
		  {/* LEFT: MASTER LIST */}
		  <div className={`lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col ${selectedEmployee ? 'hidden lg:flex h-[750px]' : 'h-[650px]'}`}>
			<div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
			  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
				<Briefcase className="w-4 h-4"/> Active Personnel ({staff.length})
			  </h3>
			</div>
			<div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
			  {staff.map(person => (
				<div 
				  key={person.id} 
				  onClick={() => openEmployeeFile(person)} 
				  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex justify-between items-center group ${selectedEmployee?.id === person.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700/50'} border`}
				>
				  <div className="truncate pr-3">
					<div className={`font-bold text-sm truncate transition-colors ${selectedEmployee?.id === person.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{person.full_name}</div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{person.role}</div>
				  </div>
				  <div className={`text-[9px] font-mono font-black px-2 py-1 rounded-md shrink-0 transition-colors ${selectedEmployee?.id === person.id ? 'bg-indigo-200/50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500'}`}>
					{person.pro_id || 'PENDING'}
				  </div>
				</div>
			  ))}
			</div>
		  </div>

		  {/* RIGHT: DETAILED EMPLOYEE FILE */}
		  <div className={`lg:col-span-2 ${!selectedEmployee ? 'hidden lg:block' : ''}`}>
			{selectedEmployee && employeeRecord ? (
			  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[750px]">
				
				{/* File Header */}
				<div className="relative p-6 md:p-8 overflow-hidden border-b border-slate-100 dark:border-slate-800">
				  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
				  
				  <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
					<div className="flex items-center gap-5">
					  {/* NEW: Face ID Profile Photo Display & Upload */}
					  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 shrink-0 shadow-inner group">
						{employeeRecord?.profile_url ? (
						  <img src={employeeRecord.profile_url} alt="Face ID Profile" className="w-full h-full object-cover" />
						) : (
						  <User className="w-10 h-10 m-5 text-slate-400" />
						)}
						{isEditing && (
						  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
							<Upload className="w-5 h-5 text-white mb-1" />
							<span className="text-[9px] font-black uppercase text-white tracking-widest text-center px-1">Sync Photo</span>
							<input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
						  </label>
						)}
					  </div>
					  
					  <div>
						<button onClick={() => setSelectedEmployee(null)} className="lg:hidden text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-4 flex items-center gap-1 hover:underline"><ChevronLeft className="w-4 h-4"/> Back to Directory</button>
						
						<div className="flex flex-wrap items-center gap-3 mb-1">
						  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedEmployee.full_name}</h2>
						  <span className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ring-1 ring-indigo-200 dark:ring-indigo-500/30">
							{selectedEmployee.role}
						  </span>
						</div>
						<p className="text-sm font-black text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-1.5">
						  <Fingerprint className="w-4 h-4 text-indigo-400"/> {selectedEmployee.pro_id || 'ID GENERATING...'}
						  {uploadingPhoto && <span className="text-indigo-600 dark:text-indigo-400 ml-2 animate-pulse">Syncing AI...</span>}
						</p>
					  </div>
					</div>

					{isEditing ? (
					  <div className="flex gap-2 w-full md:w-auto">
						<button onClick={() => setIsEditing(false)} className="flex-1 md:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"><X className="w-4 h-4"/> Cancel</button>
						<button onClick={handleSaveChanges} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-95 flex items-center justify-center gap-2"><Save className="w-4 h-4"/> Save Profile</button>
					  </div>
					) : (
					  <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-200 rounded-xl text-xs font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2"><Edit2 className="w-4 h-4"/> Modify Record</button>
					)}
				  </div>
				</div>

				<div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
				  
				  {/* General Info Grid */}
				  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Education Level</div>
					  {isEditing ? <input value={editForm.education_level || ''} onChange={e => setEditForm({...editForm, education_level: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition text-slate-900 dark:text-white"/> : <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{employeeRecord.education_level || 'Not specified'}</div>}
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Routing / Bank Acc</div>
					  {isEditing ? <input value={editForm.bank_account || ''} onChange={e => setEditForm({...editForm, bank_account: e.target.value})} className="w-full text-sm font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition text-slate-900 dark:text-white"/> : <div className="font-bold text-sm font-mono text-slate-800 dark:text-slate-200 truncate">{employeeRecord.bank_account || 'Pending Info'}</div>}
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Contract Status</div>
					  {isEditing ? (
						<select value={editForm.contract_status || 'Active'} onChange={e => setEditForm({...editForm, contract_status: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 transition text-slate-900 dark:text-white">
						  <option>Active</option><option>Probation</option><option>Terminated</option>
						</select>
					  ) : <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{employeeRecord.contract_status || 'Active'}</div>}
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Leave Allowance</div>
					  {isEditing ? (
						<div className="flex gap-2 items-center">
						  <input type="number" value={editForm.total_leave_days || 0} onChange={e => setEditForm({...editForm, total_leave_days: parseInt(e.target.value)})} className="w-14 text-sm font-semibold text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"/>
						  <span className="text-slate-400">-</span>
						  <input type="number" value={editForm.used_leave_days || 0} onChange={e => setEditForm({...editForm, used_leave_days: parseInt(e.target.value)})} className="w-14 text-sm font-semibold text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white" title="Used Days"/>
						</div>
					  ) : <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{employeeRecord.total_leave_days - employeeRecord.used_leave_days} Days Rem.</div>}
					</div>
				  </div>

				  {/* Expiry Meters (Compliance) */}
				  <div className="space-y-5 border-t border-slate-200/60 dark:border-slate-800/60 pt-8">
					<h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
					  <ShieldAlert className="w-4 h-4"/> Biometric & Credential Compliance
					</h4>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					  
					  {/* National ID Meter */}
					  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
						<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">National ID / Passport</div>
						{isEditing ? (
						  <div className="space-y-3">
							<input placeholder="ID Number" value={editForm.id_number || ''} onChange={e => setEditForm({...editForm, id_number: e.target.value})} className="w-full text-sm font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"/>
							<input type="date" value={editForm.id_expiry || ''} onChange={e => setEditForm({...editForm, id_expiry: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"/>
						  </div>
						) : (
						  <>
							<div className="flex justify-between items-end mb-2">
							  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{employeeRecord.id_number || 'No Record'}</span>
							  <span className={`text-[10px] font-black uppercase tracking-wider ${getExpiryStatus(employeeRecord.id_expiry).textColor}`}>{getExpiryStatus(employeeRecord.id_expiry).text}</span>
							</div>
							<div className={`w-full rounded-full h-1.5 overflow-hidden ${getExpiryStatus(employeeRecord.id_expiry).bg}`}>
							  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getExpiryStatus(employeeRecord.id_expiry).bar}`} style={{ width: `${getExpiryStatus(employeeRecord.id_expiry).pct}%` }}></div>
							</div>
						  </>
						)}
					  </div>

					  {/* Clinical License Meter */}
					  {['doctor', 'nurse', 'chemist'].includes(selectedEmployee.role) && (
						<div className="p-5 bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-sm relative overflow-hidden">
						  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl"></div>
						  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 relative z-10">Medical Practice License</div>
						  {isEditing ? (
							<div className="space-y-3 relative z-10">
							  <input placeholder="License Number" value={editForm.medical_license_no || ''} onChange={e => setEditForm({...editForm, medical_license_no: e.target.value})} className="w-full text-sm font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"/>
							  <input type="date" value={editForm.license_expiry || ''} onChange={e => setEditForm({...editForm, license_expiry: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white"/>
							</div>
						  ) : (
							<div className="relative z-10">
							  <div className="flex justify-between items-end mb-2">
								<span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{employeeRecord.medical_license_no || 'Unlicensed'}</span>
								<span className={`text-[10px] font-black uppercase tracking-wider ${getExpiryStatus(employeeRecord.license_expiry).textColor}`}>{getExpiryStatus(employeeRecord.license_expiry).text}</span>
							  </div>
							  <div className={`w-full rounded-full h-1.5 overflow-hidden ${getExpiryStatus(employeeRecord.license_expiry).bg}`}>
								<div className={`h-full rounded-full transition-all duration-1000 ease-out ${getExpiryStatus(employeeRecord.license_expiry).bar}`} style={{ width: `${getExpiryStatus(employeeRecord.license_expiry).pct}%` }}></div>
							  </div>
							</div>
						  )}
						</div>
					  )}
					</div>
				  </div>

				  {/* Document Management Area */}
				  {!isEditing && (
					<div className="border-t border-slate-200/60 dark:border-slate-800/60 pt-8">
					  <div className="flex justify-between items-center mb-5">
						<h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
						  <FileText className="w-4 h-4"/> Encrypted File Vault
						</h4>
						<label className="bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-2">
						  {uploading ? 'Encrypting...' : <><Upload className="w-3.5 h-3.5"/> Upload Document</>}
						  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
						</label>
					  </div>

					  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{documents.length === 0 ? (
						  <div className="col-span-1 md:col-span-2 text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm font-medium">
							No credentials uploaded. Vault is empty.
						  </div>
						) : documents.map(file => (
						  <div key={file.name} className="flex justify-between items-center p-4 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 group hover:shadow-md transition-all">
							<span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate pr-4">{file.name.split('_').pop()}</span>
							<div className="flex gap-1">
							  <button onClick={() => handleFileAction(file.name, 'preview')} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
							  <button onClick={() => handleFileAction(file.name, 'download')} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"><Download className="w-4 h-4"/></button>
							</div>
						  </div>
						))}
					  </div>
					</div>
				  )}

				</div>
			  </div>
			) : (
			  <div className="hidden lg:flex h-[750px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl items-center justify-center p-12 text-center text-slate-400 backdrop-blur-sm">
				<div className="space-y-3">
				  <Fingerprint className="w-12 h-12 mx-auto opacity-20" />
				  <p className="font-medium">Select a personnel record to decrypt <br/>and view secure information.</p>
				</div>
			  </div>
			)}
		  </div>
		</div>
	  )}
	  
	  {/* --- MASTER TIMESHEET TAB --- */}
	  {activeTab === 'attendance' && (
		<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-[800px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
		  
		  {/* Controls & Legend */}
		  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col lg:flex-row justify-between items-center gap-6">
			
			<div className="flex items-center justify-between w-full lg:w-auto gap-6 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
			  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
			  <h2 className="text-lg font-black text-slate-900 dark:text-white text-center min-w-[140px] tracking-tight">{monthName}</h2>
			  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
			</div>
			
			<div className="flex flex-wrap justify-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
			  <span className="flex items-center gap-1.5"><div className="w-5 h-5 bg-blue-500 shadow-md shadow-blue-500/20 text-white flex justify-center items-center rounded text-[10px]">M</div> Morning</span>
			  <span className="flex items-center gap-1.5"><div className="w-5 h-5 bg-indigo-600 shadow-md shadow-indigo-600/20 text-white flex justify-center items-center rounded text-[10px]">N</div> Night</span>
			  <span className="flex items-center gap-1.5"><div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex justify-center items-center rounded text-[10px]">O</div> Off</span>
			  <span className="flex items-center gap-1.5"><div className="w-5 h-5 bg-amber-500 shadow-md shadow-amber-500/20 text-white flex justify-center items-center rounded text-[10px]">L</div> Leave</span>
			  <span className="flex items-center gap-1.5"><div className="w-5 h-5 bg-red-500 shadow-md shadow-red-500/20 text-white flex justify-center items-center rounded text-[10px]">S</div> Sick</span>
			</div>
		  </div>

		  {/* Master Grid Wrapper */}
		  <div className="flex-1 overflow-x-auto overflow-y-auto relative touch-pan-x touch-pan-y scroll-smooth custom-scrollbar bg-slate-50/30 dark:bg-slate-950/20">
			<table className="w-full text-left text-sm border-collapse min-w-max">
			  
			  <thead className="sticky top-0 z-30">
				<tr>
				  <th className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-900 px-4 py-4 min-w-[200px] border-b border-r border-slate-200 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
					<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personnel Roster</span>
				  </th>
				  {daysArray.map(day => (
					<th key={day} className="bg-slate-100 dark:bg-slate-900 px-1 py-4 min-w-[40px] text-center border-b border-r border-slate-200 dark:border-slate-800 z-30">
					  <span className="text-[11px] font-black text-slate-500">{day}</span>
					</th>
				  ))}
				</tr>
			  </thead>
			  
			  <tbody className="text-slate-800 dark:text-slate-200 relative z-10">
				{Object.entries(groupedStaff).map(([department, deptStaff]) => (
				  deptStaff.length > 0 && (
					<React.Fragment key={department}>
					  <tr>
						<td colSpan={daysInMonth + 1} className="bg-slate-200/50 dark:bg-slate-950/80 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-800 sticky left-0 z-20 backdrop-blur-md">
						  {department} <span className="opacity-50 ml-1">({deptStaff.length})</span>
						</td>
					  </tr>
					  
					  {deptStaff.map(person => (
						<tr key={person.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
						  <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 px-4 py-3 border-b border-r border-slate-100 dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
							<div className="font-bold text-sm truncate w-40 dark:text-white">{person.full_name}</div>
							<div className="text-[9px] font-black tracking-widest text-slate-400 font-mono mt-0.5">{person.pro_id || 'PENDING'}</div>
						  </td>
						  
						  {daysArray.map(day => {
							const shiftVal = roster[`${person.id}_${day}`];
							return (
							  <td key={day} className="border-b border-r border-slate-100 dark:border-slate-800/50 p-1 text-center align-middle bg-white/50 dark:bg-slate-900/30">
								<button 
								  onClick={() => handleShiftClick(person.id, day)}
								  className={`w-7 h-7 md:w-8 md:h-8 mx-auto rounded-lg flex items-center justify-center text-[11px] font-black transition-all active:scale-90 ${shiftVal ? shiftColors[shiftVal] : 'bg-transparent text-transparent hover:bg-slate-200 dark:hover:bg-slate-800'}`}
								>
								  {shiftVal || '-'}
								</button>
							  </td>
							)
						  })}
						</tr>
					  ))}
					</React.Fragment>
				  )
				))}
			  </tbody>
			</table>
		  </div>
		  
		  <div className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-end relative z-40">
			 <button 
			   onClick={handlePublishRoster}
			   disabled={loading}
			   className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
			  >
			   <Save className="w-4 h-4"/> {loading ? 'Transmitting to Server...' : 'Publish Master Roster'}
			 </button>
		  </div>
		</div>
	  )}
	</div>
  );
}