import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Users, FileText, Download, Eye, Upload, Calendar, ShieldAlert, 
  Edit2, Save, X, Hash, ChevronLeft, ChevronRight, Fingerprint, 
  Briefcase, Activity, User, Banknote, FileSignature, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function HumanResources() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('directory');
  const [staff, setStaff] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeRecord, setEmployeeRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [uploading, setUploading] = useState({ photo: false, general: false, contract: false, offer: false });
  const [documents, setDocuments] = useState([]);

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
	setSelectedEmployee(person); setEmployeeRecord(null); setIsEditing(false); setDocuments([]);

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
	const gross = (parseFloat(editForm.base_salary) || 0) + (parseFloat(editForm.housing_allowance) || 0) + (parseFloat(editForm.transport_allowance) || 0);
	const finalForm = { ...editForm, gross_salary: gross };

	const { error } = await supabase.from('employee_records').update(finalForm).eq('staff_id', selectedEmployee.id);
	if (error) alert(t("Error saving: ") + error.message);
	else { setEmployeeRecord(finalForm); setIsEditing(false); }
	setLoading(false);
  };

  const handleSpecificFileUpload = async (e, type, dbColumnName) => {
	if (!e.target.files || e.target.files.length === 0 || !selectedEmployee) return;
	setUploading(prev => ({...prev, [type]: true}));
	
	const file = e.target.files[0];
	const filePath = `${selectedEmployee.id}/${type}_${Math.random().toString(36).substring(7)}_${file.name}`;
	
	const { error } = await supabase.storage.from('hr_documents').upload(filePath, file);
	if (!error) {
	   const { data } = supabase.storage.from('hr_documents').getPublicUrl(filePath);
	   await supabase.from('employee_records').update({ [dbColumnName]: data.publicUrl }).eq('staff_id', selectedEmployee.id);
	   openEmployeeFile(selectedEmployee);
	} else alert(t("Error uploading file."));
	
	setUploading(prev => ({...prev, [type]: false}));
  };

  const handlePhotoUpload = async (e) => {
	if (!e.target.files || e.target.files.length === 0 || !selectedEmployee) return;
	setUploading(prev => ({...prev, photo: true}));
	const file = e.target.files[0];
	const filePath = `${selectedEmployee.id}/face_id.jpeg`; 

	const { error } = await supabase.storage.from('employee_photos').upload(filePath, file, { upsert: true });
	if (!error) {
	  const { data } = supabase.storage.from('employee_photos').getPublicUrl(filePath);
	  await supabase.from('employee_records').update({ profile_url: data.publicUrl }).eq('staff_id', selectedEmployee.id);
	  openEmployeeFile(selectedEmployee); 
	}
	setUploading(prev => ({...prev, photo: false}));
  };

  const handleFileAction = async (fileName, action) => {
	const { data, error } = await supabase.storage.from('hr_documents').createSignedUrl(`${selectedEmployee.id}/${fileName}`, 60);
	if (error) return alert(t("Error accessing file."));
	if (action === 'preview') window.open(data.signedUrl, '_blank');
  };

  const getExpiryStatus = (dateString) => {
	if (!dateString) return { bg: 'bg-slate-200 dark:bg-slate-800', bar: 'bg-slate-400', text: t('Not Set'), pct: 0, textColor: 'text-slate-500' };
	const daysLeft = Math.floor((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
	if (daysLeft < 0) return { bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500', text: t('Expired'), pct: 100, textColor: 'text-red-500' };
	if (daysLeft < 30) return { bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500', text: `${daysLeft} ${t('Days Left')}`, pct: 80, textColor: 'text-amber-500' };
	return { bg: 'bg-emerald-50 dark:bg-emerald-900/20', bar: 'bg-emerald-500', text: t('Valid & Active'), pct: 100, textColor: 'text-emerald-500' };
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

  const handlePublishRoster = async () => { /* Roster publish logic remains unchanged */ };

  const shiftColors = {
	'M': 'bg-blue-500 text-white shadow-blue-500/30 ring-2 ring-blue-200', 
	'N': 'bg-indigo-600 text-white shadow-indigo-600/30 ring-2 ring-indigo-200', 
	'O': 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400', 
	'L': 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-200', 
	'S': 'bg-red-500 text-white shadow-red-500/30 ring-2 ring-red-200' 
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans">
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Department of People')}</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">{t('HR & Compliance Ops')}</h1>
		</div>
		
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button onClick={() => setActiveTab('directory')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'directory' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95'}`}><Users className="w-4 h-4"/> {t('Staff Directory')}</button>
		  <button onClick={() => setActiveTab('attendance')} className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400 scale-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 scale-95'}`}><Calendar className="w-4 h-4"/> {t('Master Timesheet')}</button>
		</div>
	  </div>

	  {activeTab === 'directory' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  
		  {/* DIRECTORY LIST */}
		  <div className={`lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col ${selectedEmployee ? 'hidden lg:flex h-[900px]' : 'h-[650px]'}`}>
			<div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
			  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2"><Briefcase className="w-4 h-4"/> {t('Active Personnel')} ({staff.length})</h3>
			</div>
			<div className="overflow-y-auto p-3 space-y-2 custom-scrollbar">
			  {staff.map(person => (
				<div key={person.id} onClick={() => openEmployeeFile(person)} className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex justify-between items-center group ${selectedEmployee?.id === person.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700/50'} border`}>
				  <div className="truncate pr-3">
					<div className={`font-bold text-sm truncate transition-colors ${selectedEmployee?.id === person.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white group-hover:text-indigo-600'}`}>{person.full_name}</div>
					<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{person.role}</div>
				  </div>
				  <div className={`text-[9px] font-mono font-black px-2 py-1 rounded-md shrink-0 transition-colors ${selectedEmployee?.id === person.id ? 'bg-indigo-200/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-indigo-500'}`}>{person.pro_id || t('PENDING')}</div>
				</div>
			  ))}
			</div>
		  </div>

		  {/* EMPLOYEE RECORD */}
		  <div className={`lg:col-span-2 ${!selectedEmployee ? 'hidden lg:block' : ''}`}>
			{selectedEmployee && employeeRecord ? (
			  <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[900px]">
				
				{/* Header */}
				<div className="relative p-6 md:p-8 overflow-hidden border-b border-slate-100 dark:border-slate-800">
				  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
				  <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
					<div className="flex items-center gap-5">
					  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 shrink-0 shadow-inner group">
						{employeeRecord?.profile_url ? <img src={employeeRecord.profile_url} alt="Face ID Profile" className="w-full h-full object-cover" /> : <User className="w-10 h-10 m-5 text-slate-400" />}
						{isEditing && (
						  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
							<Upload className="w-5 h-5 text-white mb-1" />
							<span className="text-[9px] font-black uppercase text-white tracking-widest text-center px-1">{t('Sync Photo')}</span>
							<input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handlePhotoUpload} disabled={uploading.photo} />
						  </label>
						)}
					  </div>
					  
					  <div>
						<button onClick={() => setSelectedEmployee(null)} className="lg:hidden text-indigo-600 font-bold text-xs mb-4 flex items-center gap-1"><ChevronLeft className="w-4 h-4"/> {t('Back')}</button>
						<div className="flex flex-wrap items-center gap-3 mb-1">
						  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{selectedEmployee.full_name}</h2>
						  <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ring-1 ring-indigo-200 dark:ring-indigo-500/30">{selectedEmployee.role}</span>
						</div>
						<p className="text-sm font-black text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-1.5"><Fingerprint className="w-4 h-4 text-indigo-400"/> {selectedEmployee.pro_id || t('ID GENERATING...')}</p>
					  </div>
					</div>

					{isEditing ? (
					  <div className="flex gap-2 w-full md:w-auto">
						<button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition"><X className="w-4 h-4 inline"/> {t('Cancel')}</button>
						<button onClick={handleSaveChanges} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"><Save className="w-4 h-4 inline"/> {t('Save Profile')}</button>
					  </div>
					) : (
					  <button onClick={() => setIsEditing(true)} className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"><Edit2 className="w-4 h-4 inline"/> {t('Modify Record')}</button>
					)}
				  </div>
				</div>

				<div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
				  
				  {/* COMPENSATION & CONTRACTS */}
				  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
					<h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800"><Banknote className="w-4 h-4"/> {t('Compensation & Contracts')}</h4>
					
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					  {/* Salary Breakdown */}
					  <div className="space-y-4">
						<div className="flex justify-between items-center">
							<span className="text-xs font-bold text-slate-500">{t('Base Salary')}</span>
							{isEditing ? <input type="number" value={editForm.base_salary || 0} onChange={e=>setEditForm({...editForm, base_salary: e.target.value})} className="w-24 text-right p-1.5 border rounded-lg text-sm outline-none dark:bg-slate-900 dark:border-slate-700"/> : <span className="font-mono font-bold">{parseFloat(employeeRecord.base_salary||0).toLocaleString()}</span>}
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs font-bold text-slate-500">{t('Housing Allowance')}</span>
							{isEditing ? <input type="number" value={editForm.housing_allowance || 0} onChange={e=>setEditForm({...editForm, housing_allowance: e.target.value})} className="w-24 text-right p-1.5 border rounded-lg text-sm outline-none dark:bg-slate-900 dark:border-slate-700"/> : <span className="font-mono font-bold">{parseFloat(employeeRecord.housing_allowance||0).toLocaleString()}</span>}
						</div>
						<div className="flex justify-between items-center">
							<span className="text-xs font-bold text-slate-500">{t('Transport Allowance')}</span>
							{isEditing ? <input type="number" value={editForm.transport_allowance || 0} onChange={e=>setEditForm({...editForm, transport_allowance: e.target.value})} className="w-24 text-right p-1.5 border rounded-lg text-sm outline-none dark:bg-slate-900 dark:border-slate-700"/> : <span className="font-mono font-bold">{parseFloat(employeeRecord.transport_allowance||0).toLocaleString()}</span>}
						</div>
						<div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
							<span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest">{t('Gross Monthly Salary')}</span>
							<span className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
								{isEditing ? 
									((parseFloat(editForm.base_salary)||0) + (parseFloat(editForm.housing_allowance)||0) + (parseFloat(editForm.transport_allowance)||0)).toLocaleString() 
									: parseFloat(employeeRecord.gross_salary||0).toLocaleString()
								} 
								<span className="text-xs text-slate-400 ml-1">{employeeRecord.salary_currency || 'SAR'}</span>
							</span>
						</div>
						{isEditing && (
							<select value={editForm.salary_currency || 'SAR'} onChange={e=>setEditForm({...editForm, salary_currency: e.target.value})} className="w-full mt-2 p-2 text-xs font-bold rounded-lg border dark:bg-slate-900 dark:border-slate-700 outline-none">
								<option value="SAR">SAR</option><option value="USD">USD</option><option value="SDG">SDG</option>
							</select>
						)}
					  </div>

					  {/* Official Documents Upload */}
					  <div className="space-y-4 border-l-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-8">
						<div>
							<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Employment Contract')}</div>
							{employeeRecord.contract_file_url ? (
								<a href={employeeRecord.contract_file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:shadow-md transition group">
									<span className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> {t('Signed Contract Valid')}</span>
									<Eye className="w-4 h-4 group-hover:scale-110 transition"/>
								</a>
							) : (
								<div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center">{t('No Contract on File')}</div>
							)}
							{isEditing && (
								<label className="mt-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold py-2 rounded-lg cursor-pointer flex justify-center gap-2 transition hover:opacity-90">
									{uploading.contract ? t('Syncing...') : <><Upload className="w-3.5 h-3.5"/> {t('Upload Contract')}</>}
									<input type="file" className="hidden" onChange={(e) => handleSpecificFileUpload(e, 'contract', 'contract_file_url')} disabled={uploading.contract} />
								</label>
							)}
						</div>

						<div>
							<div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Job Offer Letter')}</div>
							{employeeRecord.job_offer_file_url ? (
								<a href={employeeRecord.job_offer_file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-xs font-bold hover:shadow-md transition group">
									<span className="flex items-center gap-2"><FileSignature className="w-4 h-4"/> {t('Offer Letter Accepted')}</span>
									<Eye className="w-4 h-4 group-hover:scale-110 transition"/>
								</a>
							) : (
								<div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center">{t('No Offer on File')}</div>
							)}
							{isEditing && (
								<label className="mt-2 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold py-2 rounded-lg cursor-pointer flex justify-center gap-2 transition hover:opacity-90">
									{uploading.offer ? t('Syncing...') : <><Upload className="w-3.5 h-3.5"/> {t('Upload Offer Letter')}</>}
									<input type="file" className="hidden" onChange={(e) => handleSpecificFileUpload(e, 'offer', 'job_offer_file_url')} disabled={uploading.offer} />
								</label>
							)}
						</div>
					  </div>
					</div>
				  </div>

				  {/* General Info Grid */}
				  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Education Level')}</div>
					  {isEditing ? <input value={editForm.education_level || ''} onChange={e => setEditForm({...editForm, education_level: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none"/> : <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{employeeRecord.education_level || t('Not specified')}</div>}
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Routing / Bank Acc')}</div>
					  {isEditing ? <input value={editForm.bank_account || ''} onChange={e => setEditForm({...editForm, bank_account: e.target.value})} className="w-full text-sm font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none"/> : <div className="font-bold text-sm font-mono text-slate-800 dark:text-slate-200 truncate">{employeeRecord.bank_account || t('Pending Info')}</div>}
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Contract Status')}</div>
					  {isEditing ? (
						<select value={editForm.contract_status || 'Active'} onChange={e => setEditForm({...editForm, contract_status: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none">
						  <option value="Active">{t('Active')}</option><option value="Probation">{t('Probation')}</option><option value="Terminated">{t('Terminated')}</option>
						</select>
					  ) : <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">{t(employeeRecord.contract_status || 'Active')}</div>}
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Leave Allowance')}</div>
					  {isEditing ? (
						<div className="flex gap-2 items-center">
						  <input type="number" value={editForm.total_leave_days || 0} onChange={e => setEditForm({...editForm, total_leave_days: parseInt(e.target.value)})} className="w-14 text-sm font-semibold text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none"/>
						  <span className="text-slate-400">-</span>
						  <input type="number" value={editForm.used_leave_days || 0} onChange={e => setEditForm({...editForm, used_leave_days: parseInt(e.target.value)})} className="w-14 text-sm font-semibold text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 rounded-lg outline-none"/>
						</div>
					  ) : <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{employeeRecord.total_leave_days - employeeRecord.used_leave_days} {t('Days Rem.')}</div>}
					</div>
				  </div>

				  {/* Expiry Meters */}
				  <div className="space-y-5 pt-4">
					<h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> {t('Biometric & Credential Compliance')}</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					  <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
						<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('National ID / Passport')}</div>
						{isEditing ? (
						  <div className="space-y-3">
							<input placeholder={t('ID Number')} value={editForm.id_number || ''} onChange={e => setEditForm({...editForm, id_number: e.target.value})} className="w-full text-sm font-mono border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none"/>
							<input type="date" value={editForm.id_expiry || ''} onChange={e => setEditForm({...editForm, id_expiry: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg outline-none"/>
						  </div>
						) : (
						  <>
							<div className="flex justify-between items-end mb-2">
							  <span className="text-sm font-mono font-bold">{employeeRecord.id_number || t('No Record')}</span>
							  <span className={`text-[10px] font-black uppercase tracking-wider ${getExpiryStatus(employeeRecord.id_expiry).textColor}`}>{getExpiryStatus(employeeRecord.id_expiry).text}</span>
							</div>
							<div className={`w-full rounded-full h-1.5 overflow-hidden ${getExpiryStatus(employeeRecord.id_expiry).bg}`}>
							  <div className={`h-full rounded-full ${getExpiryStatus(employeeRecord.id_expiry).bar}`} style={{ width: `${getExpiryStatus(employeeRecord.id_expiry).pct}%` }}></div>
							</div>
						  </>
						)}
					  </div>

					  {['doctor', 'nurse', 'chemist'].includes(selectedEmployee.role) && (
						<div className="p-5 bg-indigo-50/30 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-sm relative overflow-hidden">
						  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/10 rounded-full blur-2xl"></div>
						  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4 relative z-10">{t('Medical Practice License')}</div>
						  {isEditing ? (
							<div className="space-y-3 relative z-10">
							  <input placeholder={t('License Number')} value={editForm.medical_license_no || ''} onChange={e => setEditForm({...editForm, medical_license_no: e.target.value})} className="w-full text-sm font-mono border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 rounded-lg outline-none"/>
							  <input type="date" value={editForm.license_expiry || ''} onChange={e => setEditForm({...editForm, license_expiry: e.target.value})} className="w-full text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 rounded-lg outline-none"/>
							</div>
						  ) : (
							<div className="relative z-10">
							  <div className="flex justify-between items-end mb-2">
								<span className="text-sm font-mono font-bold">{employeeRecord.medical_license_no || t('Unlicensed')}</span>
								<span className={`text-[10px] font-black uppercase tracking-wider ${getExpiryStatus(employeeRecord.license_expiry).textColor}`}>{getExpiryStatus(employeeRecord.license_expiry).text}</span>
							  </div>
							  <div className={`w-full rounded-full h-1.5 overflow-hidden ${getExpiryStatus(employeeRecord.license_expiry).bg}`}>
								<div className={`h-full rounded-full ${getExpiryStatus(employeeRecord.license_expiry).bar}`} style={{ width: `${getExpiryStatus(employeeRecord.license_expiry).pct}%` }}></div>
							  </div>
							</div>
						  )}
						</div>
					  )}
					</div>
				  </div>

				</div>
			  </div>
			) : (
			  <div className="hidden lg:flex h-[900px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl items-center justify-center p-12 text-center text-slate-400 backdrop-blur-sm">
				<div className="space-y-3">
				  <Fingerprint className="w-12 h-12 mx-auto opacity-20" />
				  <p className="font-medium" dangerouslySetInnerHTML={{__html: t('Select a personnel record to decrypt <br/>and view secure information.')}}></p>
				</div>
			  </div>
			)}
		  </div>
		</div>
	  )}
	  
	  {/* --- REDESIGNED MASTER TIMESHEET TAB --- */}
	  {activeTab === 'attendance' && (
		<div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-[850px] w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
		  
		  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-6">
			<div className="flex items-center justify-between w-full lg:w-auto gap-8 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
			  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all hover:shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
			  <h2 className="text-xl font-black text-indigo-600 dark:text-indigo-400 text-center min-w-[160px] tracking-tight">{monthName}</h2>
			  <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all hover:shadow-sm"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300"/></button>
			</div>
			
			<div className="flex flex-wrap justify-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">
			  <span className="flex items-center gap-2"><div className="w-6 h-6 bg-blue-500 shadow-md text-white flex justify-center items-center rounded-lg ring-2 ring-blue-100">M</div> {t('Morning')}</span>
			  <span className="flex items-center gap-2"><div className="w-6 h-6 bg-indigo-600 shadow-md text-white flex justify-center items-center rounded-lg ring-2 ring-indigo-100">N</div> {t('Night')}</span>
			  <span className="flex items-center gap-2"><div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 text-slate-400 flex justify-center items-center rounded-lg">O</div> {t('Off')}</span>
			  <span className="flex items-center gap-2"><div className="w-6 h-6 bg-amber-500 shadow-md text-white flex justify-center items-center rounded-lg ring-2 ring-amber-100">L</div> {t('Leave')}</span>
			  <span className="flex items-center gap-2"><div className="w-6 h-6 bg-red-500 shadow-md text-white flex justify-center items-center rounded-lg ring-2 ring-red-100">S</div> {t('Sick')}</span>
			</div>
		  </div>

		  <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
			<table className="w-full text-left text-sm border-collapse min-w-max">
			  <thead className="sticky top-0 z-30">
				<tr>
				  <th className="sticky left-0 z-40 bg-white dark:bg-slate-900 px-6 py-5 min-w-[240px] border-b border-r border-slate-200 dark:border-slate-800 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
					<span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('Personnel Roster')}</span>
				  </th>
				  {daysArray.map(day => (
					<th key={day} className="bg-white dark:bg-slate-900 px-2 py-4 min-w-[45px] text-center border-b border-r border-slate-100 dark:border-slate-800 z-30">
					  <div className="text-[11px] font-black text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-lg py-1">{day}</div>
					</th>
				  ))}
				</tr>
			  </thead>
			  
			  <tbody className="text-slate-800 dark:text-slate-200 relative z-10">
				{Object.entries(groupedStaff).map(([department, deptStaff]) => (
				  deptStaff.length > 0 && (
					<React.Fragment key={department}>
					  <tr>
						<td colSpan={daysInMonth + 1} className="bg-indigo-50/50 dark:bg-indigo-900/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-800 sticky left-0 z-20 backdrop-blur-md">
						  {t(department)} <span className="opacity-50 ml-2 bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded-full">{deptStaff.length}</span>
						</td>
					  </tr>
					  
					  {deptStaff.map(person => (
						<tr key={person.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors">
						  <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 px-6 py-4 border-b border-r border-slate-100 dark:border-slate-800 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
							<div className="font-bold text-sm truncate w-48 dark:text-white">{person.full_name}</div>
							<div className="text-[9px] font-black tracking-widest text-slate-400 font-mono mt-1">{person.pro_id || t('PENDING')}</div>
						  </td>
						  
						  {daysArray.map(day => {
							const shiftVal = roster[`${person.id}_${day}`];
							return (
							  <td key={day} className="border-b border-r border-slate-100 dark:border-slate-800/50 p-1.5 text-center align-middle bg-white/50 dark:bg-slate-900/30">
								<button onClick={() => handleShiftClick(person.id, day)} className={`w-full h-8 md:h-10 mx-auto rounded-xl flex items-center justify-center text-[11px] font-black transition-all active:scale-90 ${shiftVal ? shiftColors[shiftVal] : 'bg-transparent text-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
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
		  
		  <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end relative z-40">
			 <button onClick={handlePublishRoster} disabled={loading} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-black text-sm shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 uppercase tracking-widest">
			   <Save className="w-5 h-5"/> {loading ? t('Transmitting...') : t('Publish Master Roster')}
			 </button>
		  </div>
		</div>
	  )}
	</div>
  );
}