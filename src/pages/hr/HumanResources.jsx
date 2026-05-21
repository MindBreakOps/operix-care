import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Users, FileText, Download, Eye, Upload, Calendar, ShieldAlert, Edit2, Save, X, Hash, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export default function HumanResources() {
  const [activeTab, setActiveTab] = useState('directory');
  const [staff, setStaff] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeRecord, setEmployeeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);

  // --- ATTENDANCE & ROSTER STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  // Using Underscore (_) to prevent UUID hyphen collisions!
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
	if (!dateString) return { color: 'bg-slate-200', text: 'Not Set', pct: 0 };
	const daysLeft = Math.floor((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
	if (daysLeft < 0) return { color: 'bg-red-500', text: 'Expired', pct: 100 };
	if (daysLeft < 30) return { color: 'bg-amber-500', text: `${daysLeft} Days Left`, pct: 80 };
	return { color: 'bg-emerald-500', text: 'Valid', pct: 30 };
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
	// FIX: Using Underscore to prevent UUID splitting bug
	const key = `${empId}_${day}`;
	const currentShift = roster[key];
	const shiftCycle = { undefined: 'M', 'M': 'N', 'N': 'O', 'O': 'L', 'L': 'S', 'S': undefined };
	setRoster({ ...roster, [key]: shiftCycle[currentShift] });
  };

  // FIX: Publish Roster uses the new Underscore format
  const handlePublishRoster = async () => {
	setLoading(true);
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth() + 1; 

	const recordsToInsert = Object.entries(roster).map(([key, shiftVal]) => {
	  // Split safely using underscore
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

	if (error) {
	  alert("Error publishing roster: " + error.message);
	} else {
	  alert(`Successfully published ${recordsToInsert.length} shift assignments!`);
	}
	setLoading(false);
  };

  const shiftColors = {
	'M': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 font-bold', 
	'N': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 font-bold', 
	'O': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400', 
	'L': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-black', 
	'S': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 font-black' 
  };

  return (
	<div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 w-full">
	  
	  {/* MOBILE OPTIMIZED HEADER */}
	  <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
		<div>
		  <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
			<ShieldAlert className="w-7 h-7 text-indigo-600 shrink-0" /> HR & Compliance Operations
		  </h1>
		</div>
		
		{/* Scrollable tabs for mobile */}
		<div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-full md:w-auto overflow-x-auto whitespace-nowrap hide-scrollbar">
		  <button onClick={() => setActiveTab('directory')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'directory' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>Staff Directory</button>
		  <button onClick={() => setActiveTab('attendance')} className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md transition ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}>Master Timesheet</button>
		</div>
	  </div>

	  {activeTab === 'directory' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		  
		  {/* MOBILE LIST */}
		  <div className={`lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-y-auto p-2 ${selectedEmployee ? 'hidden lg:block' : 'h-[600px]'}`}>
			<h3 className="font-bold text-xs uppercase text-slate-400 p-3">Active Personnel ({staff.length})</h3>
			<div className="space-y-1">
			  {staff.map(person => (
				<div key={person.id} onClick={() => openEmployeeFile(person)} className={`p-3 rounded-lg cursor-pointer transition flex justify-between items-center ${selectedEmployee?.id === person.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}>
				  <div className="truncate pr-2">
					<div className="font-bold text-slate-900 dark:text-white text-sm truncate">{person.full_name}</div>
					<div className="text-[10px] font-black uppercase text-slate-500 tracking-wider mt-0.5">{person.role}</div>
				  </div>
				  <div className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded shrink-0">
					{person.pro_id || 'PENDING'}
				  </div>
				</div>
			  ))}
			</div>
		  </div>

		  {/* DETAILED FILE */}
		  <div className={`lg:col-span-2 ${!selectedEmployee ? 'hidden lg:block' : ''}`}>
			{selectedEmployee && employeeRecord ? (
			  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
				
				<div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start gap-4">
				  <div>
					{/* Mobile Back Button */}
					<button onClick={() => setSelectedEmployee(null)} className="lg:hidden text-indigo-600 font-bold text-xs mb-2 flex items-center gap-1"><ChevronLeft className="w-4 h-4"/> Back to List</button>
					
					<h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
					  {selectedEmployee.full_name}
					  <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded uppercase">{selectedEmployee.role}</span>
					</h2>
					<p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1 uppercase tracking-widest flex items-center gap-1">
					  <Hash className="w-4 h-4"/> {selectedEmployee.pro_id || 'ID GENERATING...'}
					</p>
				  </div>

				  {isEditing ? (
					<div className="flex gap-2 w-full md:w-auto">
					  <button onClick={() => setIsEditing(false)} className="flex-1 md:flex-none px-3 py-2 md:py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1"><X className="w-3 h-3"/> Cancel</button>
					  <button onClick={handleSaveChanges} className="flex-1 md:flex-none px-3 py-2 md:py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1"><Save className="w-3 h-3"/> Save</button>
					</div>
				  ) : (
					<button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-3 py-2 md:py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"><Edit2 className="w-3 h-3"/> Edit File</button>
				  )}
				</div>

				{/* Rest of the Edit Form remains identical... */}
				<div className="p-4 md:p-6 space-y-6 overflow-y-auto">
				  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
					  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Education</div>
					  {isEditing ? <input value={editForm.education_level || ''} onChange={e => setEditForm({...editForm, education_level: e.target.value})} className="w-full text-sm border p-1 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/> : <div className="font-bold text-sm truncate">{employeeRecord.education_level || 'N/A'}</div>}
					</div>
					<div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
					  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Bank Account</div>
					  {isEditing ? <input value={editForm.bank_account || ''} onChange={e => setEditForm({...editForm, bank_account: e.target.value})} className="w-full text-sm font-mono border p-1 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/> : <div className="font-bold text-sm font-mono truncate">{employeeRecord.bank_account || 'Pending'}</div>}
					</div>
					<div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
					  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Contract Status</div>
					  {isEditing ? (
						<select value={editForm.contract_status || 'Active'} onChange={e => setEditForm({...editForm, contract_status: e.target.value})} className="w-full text-sm border p-1 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white">
						  <option>Active</option><option>Probation</option><option>Terminated</option>
						</select>
					  ) : <div className="font-bold text-sm text-emerald-600">{employeeRecord.contract_status || 'Active'}</div>}
					</div>
					<div className="border border-slate-200 dark:border-slate-800 p-3 rounded-xl bg-slate-50 dark:bg-slate-950">
					  <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Leave Balance</div>
					  {isEditing ? (
						<div className="flex gap-1 items-center">
						  <input type="number" value={editForm.total_leave_days || 0} onChange={e => setEditForm({...editForm, total_leave_days: parseInt(e.target.value)})} className="w-12 text-xs border p-1 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/>
						  <span className="text-xs">-</span>
						  <input type="number" value={editForm.used_leave_days || 0} onChange={e => setEditForm({...editForm, used_leave_days: parseInt(e.target.value)})} className="w-12 text-xs border p-1 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white" title="Used Days"/>
						</div>
					  ) : <div className="font-bold text-sm">{employeeRecord.total_leave_days - employeeRecord.used_leave_days} Days</div>}
					</div>
				  </div>

				  <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
					<h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance & Identification</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
						<div className="text-xs font-bold text-slate-500 uppercase mb-2">National ID / Passport</div>
						{isEditing ? (
						  <div className="space-y-2">
							<input placeholder="ID Number" value={editForm.id_number || ''} onChange={e => setEditForm({...editForm, id_number: e.target.value})} className="w-full text-xs border p-2 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/>
							<input type="date" value={editForm.id_expiry || ''} onChange={e => setEditForm({...editForm, id_expiry: e.target.value})} className="w-full text-xs border p-2 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/>
						  </div>
						) : (
						  <>
							<div className="flex justify-between text-sm font-bold mb-1 text-slate-900 dark:text-white"><span>{employeeRecord.id_number || 'No ID'}</span><span className={getExpiryStatus(employeeRecord.id_expiry).text === 'Expired' ? 'text-red-500' : 'text-slate-500'}>{getExpiryStatus(employeeRecord.id_expiry).text}</span></div>
							<div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2"><div className={`h-2 rounded-full ${getExpiryStatus(employeeRecord.id_expiry).color}`} style={{ width: `${getExpiryStatus(employeeRecord.id_expiry).pct}%` }}></div></div>
						  </>
						)}
					  </div>

					  {['doctor', 'nurse', 'chemist'].includes(selectedEmployee.role) && (
						<div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
						  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Practice License</div>
						  {isEditing ? (
							<div className="space-y-2">
							  <input placeholder="License Number" value={editForm.medical_license_no || ''} onChange={e => setEditForm({...editForm, medical_license_no: e.target.value})} className="w-full text-xs border p-2 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/>
							  <input type="date" value={editForm.license_expiry || ''} onChange={e => setEditForm({...editForm, license_expiry: e.target.value})} className="w-full text-xs border p-2 rounded dark:bg-slate-900 dark:border-slate-700 text-slate-900 dark:text-white"/>
							</div>
						  ) : (
							<>
							  <div className="flex justify-between text-sm font-bold mb-1 text-slate-900 dark:text-white"><span>{employeeRecord.medical_license_no || 'No License'}</span><span className={getExpiryStatus(employeeRecord.license_expiry).text === 'Expired' ? 'text-red-500' : 'text-slate-500'}>{getExpiryStatus(employeeRecord.license_expiry).text}</span></div>
							  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2"><div className={`h-2 rounded-full ${getExpiryStatus(employeeRecord.license_expiry).color}`} style={{ width: `${getExpiryStatus(employeeRecord.license_expiry).pct}%` }}></div></div>
							</>
						  )}
						</div>
					  )}
					</div>
				  </div>

				  {!isEditing && (
					<div className="border-t border-slate-200 dark:border-slate-800 pt-6">
					  <div className="flex justify-between items-end mb-4">
						<h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4"/> Files & CV</h4>
						<label className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow flex items-center gap-2">
						  {uploading ? 'Uploading...' : <><Upload className="w-3 h-3"/> Upload</>}
						  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
						</label>
					  </div>
					  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
						{documents.length === 0 ? (
						  <div className="col-span-1 md:col-span-2 text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 text-sm">No files uploaded.</div>
						) : documents.map(file => (
						  <div key={file.name} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
							<span className="text-xs font-medium truncate w-3/4">{file.name.split('_').pop()}</span>
							<div className="flex gap-2">
							  <button onClick={() => handleFileAction(file.name, 'preview')} className="text-slate-400 hover:text-indigo-600 transition"><Eye className="w-4 h-4"/></button>
							  <button onClick={() => handleFileAction(file.name, 'download')} className="text-slate-400 hover:text-emerald-600 transition"><Download className="w-4 h-4"/></button>
							</div>
						  </div>
						))}
					  </div>
					</div>
				  )}
				</div>
			  </div>
			) : (
			  <div className="hidden lg:flex h-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl items-center justify-center p-12 text-center text-slate-400">
				Select a personnel record to view and edit details.
			  </div>
			)}
		  </div>
		</div>
	  )}
	  
	  {/* --- MASTER TIMESHEET TAB (MOBILE OPTIMIZED) --- */}
	  {activeTab === 'attendance' && (
		<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[750px] w-full">
		  
		  <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-4">
			<div className="flex items-center justify-between w-full lg:w-auto gap-4">
			  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-600 transition"><ChevronLeft className="w-5 h-5"/></button>
			  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white text-center whitespace-nowrap">{monthName}</h2>
			  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow hover:bg-slate-100 dark:hover:bg-slate-600 transition"><ChevronRight className="w-5 h-5"/></button>
			</div>
			
			<div className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
			  <span className="flex items-center gap-1"><div className="w-4 h-4 bg-blue-100 text-blue-700 flex justify-center items-center rounded text-[10px]">M</div> Morning</span>
			  <span className="flex items-center gap-1"><div className="w-4 h-4 bg-indigo-100 text-indigo-700 flex justify-center items-center rounded text-[10px]">N</div> Night</span>
			  <span className="flex items-center gap-1"><div className="w-4 h-4 bg-slate-200 text-slate-600 flex justify-center items-center rounded text-[10px]">O</div> Off</span>
			  <span className="flex items-center gap-1"><div className="w-4 h-4 bg-amber-100 text-amber-700 flex justify-center items-center rounded text-[10px]">L</div> Leave</span>
			  <span className="flex items-center gap-1"><div className="w-4 h-4 bg-red-100 text-red-700 flex justify-center items-center rounded text-[10px]">S</div> Sick</span>
			</div>
		  </div>

		  {/* MOBILE SCROLL WRAPPER */}
		  <div className="flex-1 overflow-x-auto overflow-y-auto bg-white dark:bg-slate-900 relative touch-pan-x touch-pan-y scroll-smooth">
			<table className="w-full text-left text-sm border-collapse min-w-max">
			  
			  <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-950 shadow-sm text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
				<tr>
				  <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-950 px-2 md:px-4 py-3 min-w-[120px] md:min-w-[200px] border-b border-r dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Employee</th>
				  {daysArray.map(day => (
					<th key={day} className="px-1 py-3 min-w-[32px] md:min-w-[40px] text-center border-b border-r dark:border-slate-800">{day}</th>
				  ))}
				</tr>
			  </thead>
			  
			  <tbody className="text-slate-800 dark:text-slate-200">
				{Object.entries(groupedStaff).map(([department, deptStaff]) => (
				  deptStaff.length > 0 && (
					<React.Fragment key={department}>
					  <tr>
						<td colSpan={daysInMonth + 1} className="bg-slate-50 dark:bg-slate-900/80 px-2 md:px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-800 sticky left-0 z-10">
						  {department} ({deptStaff.length})
						</td>
					  </tr>
					  
					  {deptStaff.map(person => (
						<tr key={person.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
						  <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-2 md:px-4 py-2 border-b border-r dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
							<div className="font-bold text-xs md:text-sm truncate w-24 md:w-40">{person.full_name}</div>
							<div className="text-[9px] md:text-[10px] text-slate-500 font-mono">{person.pro_id || 'PENDING'}</div>
						  </td>
						  
						  {daysArray.map(day => {
							const shiftVal = roster[`${person.id}_${day}`];
							return (
							  <td key={day} className="border-b border-r border-slate-100 dark:border-slate-800 p-0.5 md:p-1 text-center align-middle">
								<button 
								  onClick={() => handleShiftClick(person.id, day)}
								  className={`w-6 h-6 md:w-8 md:h-8 mx-auto rounded flex items-center justify-center text-[10px] md:text-xs transition hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-700 ${shiftVal ? shiftColors[shiftVal] : 'bg-transparent text-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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
		  
		  <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end">
			 <button 
			   onClick={handlePublishRoster}
			   disabled={loading}
			   className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 md:py-2 rounded-lg font-bold text-sm shadow transition flex items-center justify-center gap-2"
			 >
			   <Save className="w-4 h-4"/> {loading ? 'Publishing...' : 'Publish Roster to Database'}
			 </button>
		  </div>
		</div>
	  )}
	</div>
  );
}