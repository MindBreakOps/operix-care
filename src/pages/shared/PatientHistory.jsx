import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext'; // <-- ADDED
import { 
  Search, User, Activity, Scissors, 
  Paperclip, ShieldAlert, Download, UploadCloud, 
  Clock, CheckCircle, HeartPulse, Stethoscope, Microscope, 
  Users, ChevronLeft, ArrowRight, FileText, Loader2, Calendar, Phone, Droplet,
  Trash2 
} from 'lucide-react';

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmd1QUqvJ9FNIGDXAgIFFXUoKip3yeEkQqzbugfJtUsK7YHj8Ma0eMxDl6lLDtzL8f/exec';

export default function PatientHistory() {
  const { role } = useAuth(); 
  const { t } = useLanguage(); // <-- INIT TRANSLATOR

  const [activeTab, setActiveTab] = useState('directory'); 
  
  const [patientsDirectory, setPatientsDirectory] = useState([]);
  const [filteredDirectory, setFilteredDirectory] = useState([]);
  const [directorySearch, setDirectorySearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [patientData, setPatientData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const showSuccess = (msg) => {
	setSuccessMsg(msg);
	setTimeout(() => setSuccessMsg(''), 5000);
  };

  const fetchDirectory = async () => {
	setLoading(true);
	const { data } = await supabase.from('patient_files').select('*').order('created_at', { ascending: false });
	if (data) {
	  setPatientsDirectory(data);
	  setFilteredDirectory(data);
	}
	setLoading(false);
  };

  useEffect(() => { fetchDirectory(); }, []);

  useEffect(() => {
	const q = directorySearch.toLowerCase();
	setFilteredDirectory(patientsDirectory.filter(p => 
	  p.full_name?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q) || p.phone?.includes(q)
	));
  }, [directorySearch, patientsDirectory]);

  const loadPatientTimeline = async (patientId) => {
	setLoading(true); setError(''); setSuccessMsg(''); setPatientData(null);
	try {
	  const { data: pData, error: pError } = await supabase.from('patient_files').select('*').eq('id', patientId).single();
	  if (pError || !pData) throw new Error(t("Patient not found."));
	  setPatientData(pData);

	  const [visitsRes, opsRes, docsRes, labsRes] = await Promise.all([
		  supabase.from('tickets').select('*').eq('patient_id', patientId),
		  supabase.from('operations').select('*').eq('patient_id', patientId),
		  supabase.from('patient_files').select('id, file_name, file_url, created_at, file_type').eq('patient_id', patientId).not('file_url', 'is', null),
		  supabase.from('lab_requests').select('*').eq('patient_id', patientId)
	  ]);

	  setDocuments(docsRes.data || []);

	  const combinedEvents = [
		...(visitsRes.data || []).map(v => ({ ...v, _type: 'visit', _date: new Date(v.created_at) })),
		...(opsRes.data || []).map(o => ({ ...o, _type: 'operation', _date: new Date(o.created_at) })),
		...(labsRes.data || []).map(l => ({ ...l, _type: 'lab', _date: new Date(l.created_at) }))
	  ].sort((a, b) => b._date - a._date);

	  setTimelineEvents(combinedEvents);
	  setActiveTab('timeline');
	} catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSearchSubmit = async (e) => {
	e.preventDefault();
	if (!directorySearch.trim()) return;
	const { data: ticket } = await supabase.from('tickets').select('patient_id').eq('id', directorySearch.trim()).single();
	if (ticket) loadPatientTimeline(ticket.patient_id);
	else loadPatientTimeline(directorySearch.trim());
  };

  const handleDeletePatient = async (e, patientId, patientName) => {
	  e.stopPropagation(); 
	  
	  if (role !== 'admin') {
		alert(t("Access Denied: Only administrators can delete patient records."));
		return;
	  }
  
	  if (window.confirm(`${t('WARNING: Are you sure you want to permanently delete the file for')} ${patientName}?\n\n${t('This action cannot be undone.')}`)) {
		
		const btn = e.currentTarget;
		btn.style.opacity = '0.5'; 
		
		try {
		  const { data, error: deleteError } = await supabase
			.from('patient_files')
			.delete()
			.eq('id', patientId)
			.select(); 
  
		  if (deleteError) {
			console.error("Supabase Error:", deleteError);
			alert(`${t('Database Error:')} ${deleteError.message}`);
			return;
		  }
  
		  if (!data || data.length === 0) {
			alert(t("Delete Blocked: The database prevented the deletion."));
			return;
		  }
		  
		  setPatientsDirectory(prev => prev.filter(p => p.id !== patientId));
		  setFilteredDirectory(prev => prev.filter(p => p.id !== patientId));
		  
		  showSuccess(`${patientName}'s ${t('file has been permanently deleted.')}`);
  
		} catch (err) {
		  alert(`${t('Unexpected Error:')} ` + err.message);
		} finally {
		  btn.style.opacity = '1'; 
		}
	  }
	};

  const exportMasterRecordPDF = () => {
	window.print();
  };

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader(); reader.readAsDataURL(file); 
	reader.onload = () => resolve(reader.result.split(',')[1]); 
	reader.onerror = error => reject(error);
  });

  const handleUploadNewFile = async (e) => {
	  const file = e.target.files[0];
	  if (!file || !patientData) return;
	  setUploadingFile(true);
	  try {
		  const base64Data = await fileToBase64(file);
		  const gasResponse = await fetch(GAS_WEBHOOK_URL, { 
			  method: 'POST', 
			  body: JSON.stringify({ fileName: `DirectUpload_${patientData.id}_${file.name}`, mimeType: file.type, fileData: base64Data }) 
		  });
		  const gasData = await gasResponse.json();
  
		  if (gasData.error) throw new Error(`${t('Google Script Error:')} ` + gasData.error);
		  if (!gasData.fileUrl) throw new Error(t("File hosting failed. Missing fileUrl in response."));
  
		  await supabase.from('patient_files').insert([{ 
			  patient_id: patientData.id, file_name: file.name, file_type: file.type, file_url: gasData.fileUrl 
		  }]);
		  showSuccess(t('Document successfully added to patient timeline.'));
		  loadPatientTimeline(patientData.id); 
	  } catch (err) { 
		  console.error("Upload process failed:", err);
		  setError(t("Upload failed: ") + err.message); 
	  } finally { 
		  setUploadingFile(false); 
	  }
	};

  return (
	<>
	  <div className="print:hidden relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
		
		<div className="absolute top-[5%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

		{/* HEADER & SEARCH */}
		<div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-all">
			<div>
				<div className="flex items-center gap-2 mb-2">
				  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
				  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Medical Records')}</span>
				</div>
				<h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t('Patient Database')}</h1>
			</div>
			
			<form onSubmit={handleSearchSubmit} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1 sm:w-80">
				  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<Search className="w-5 h-5 text-slate-400" />
				  </div>
				  <input type="text" value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} placeholder={t("Search Name, Phone, or MRN...")} className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner" />
				</div>
				<button disabled={loading || isDeleting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/25 flex items-center justify-center gap-2">
				  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('Lookup')}
				</button>
			</form>
		</div>

		{/* ALERTS */}
		{error && <div className="relative z-10 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"><ShieldAlert className="w-5 h-5"/> {error}</div>}
		{successMsg && <div className="relative z-10 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"><CheckCircle className="w-5 h-5"/> {successMsg}</div>}

		{/* DIRECTORY VIEW */}
		{activeTab === 'directory' && (
		  <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col min-h-[600px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
			<div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
			  <h3 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-2">
				<Users className="w-5 h-5 text-blue-500"/> {t('Registered Patients Directory')}
			  </h3>
			  <span className="text-xs font-bold bg-white dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
				{filteredDirectory.length} {t('Records')}
			  </span>
			</div>
			
			<div className="flex-1 overflow-x-auto">
			  <table className="w-full text-left text-sm whitespace-nowrap">
				<thead className="bg-white dark:bg-slate-950 text-slate-400 text-[10px] uppercase font-black tracking-widest sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 shadow-sm">
				  <tr>
					<th className="px-6 py-4">{t('Patient Profile')}</th>
					<th className="px-6 py-4">{t('Contact Details')}</th>
					<th className="px-6 py-4">{t('Demographics')}</th>
					<th className="px-6 py-4 text-center">{t('Blood')}</th>
					<th className="px-6 py-4 text-right">{t('Action')}</th>
				  </tr>
				</thead>
				<tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
				  {filteredDirectory.map(p => (
					<tr key={p.id} onClick={() => loadPatientTimeline(p.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group">
					  <td className="px-6 py-4">
						<div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors">{p.full_name}</div>
						<div className="text-[10px] font-mono text-slate-400 mt-0.5">{t('ID:')} {p.id.substring(0, 12)}...</div>
					  </td>
					  <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">
						<div className="flex items-center gap-2"><Phone className="w-3 h-3 text-slate-400" /> {p.phone || t('N/A')}</div>
					  </td>
					  <td className="px-6 py-4">
						<div className="flex items-center gap-2">
						  <span className="text-slate-700 dark:text-slate-200 font-medium">{p.date_of_birth || t('N/A')}</span>
						  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase">{p.sex || t('?')}</span>
						</div>
					  </td>
					  <td className="px-6 py-4 text-center">
						<span className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-1 rounded-lg ${p.blood_group ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-100 dark:border-red-500/20' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
						  {p.blood_group || t('?')}
						</span>
					  </td>
					  <td className="px-6 py-4">
						<div className="flex items-center justify-end gap-4">
						  {role === 'admin' && (
							<button onClick={(e) => handleDeletePatient(e, p.id, p.full_name)} className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title={t("Delete Patient Record")}><Trash2 className="w-4 h-4" /></button>
						  )}
						  <button className="text-blue-600 font-bold text-xs uppercase flex items-center group-hover:translate-x-1 transition-transform">
							{t('Open Chart')} <ArrowRight className="w-4 h-4 ml-1.5"/>
						  </button>
						</div>
					  </td>
					</tr>
				  ))}
				</tbody>
			  </table>
			  {filteredDirectory.length === 0 && !loading && (
				<div className="text-center py-20 flex flex-col items-center justify-center">
				  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4"><Search className="w-8 h-8 text-slate-300 dark:text-slate-500" /></div>
				  <div className="text-slate-500 font-bold text-sm">{t('No patient records found.')}</div>
				  <div className="text-slate-400 text-xs mt-1">{t('Try adjusting your search criteria.')}</div>
				</div>
			  )}
			</div>
		  </div>
		)}

		{/* TIMELINE VIEW */}
		{activeTab === 'timeline' && patientData && (
			<div className="relative z-10 animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
				
				<div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
				  <button onClick={() => setActiveTab('directory')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-2 text-sm transition-colors group">
					<div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors"><ChevronLeft className="w-4 h-4"/></div> 
					{t('Back to Directory')}
				  </button>
				  <button onClick={exportMasterRecordPDF} className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-black px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg text-sm active:scale-95 transition-all">
					<Download className="w-4 h-4"/> {t('Export PDF')}
				  </button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
					<div className="lg:col-span-4 space-y-6">
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-lg">
						  <div className="bg-blue-600 p-6 text-white text-center">
							<div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border-2 border-white/30"><User className="w-10 h-10 text-white" /></div>
							<h2 className="text-2xl font-black mb-1">{patientData.full_name}</h2>
							<div className="font-mono text-[9px] uppercase tracking-widest text-blue-200 bg-blue-900/30 inline-block px-3 py-1 rounded-full border border-blue-500/30 break-all">{t('ID:')} {patientData.id}</div>
						  </div>
						  <div className="p-6 space-y-4">
							<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
								<div className="flex items-center gap-3 text-slate-500"><Calendar className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wide">{t('DOB / Sex')}</span></div>
								<div className="font-black text-sm text-slate-900 dark:text-white text-right">{patientData.date_of_birth || t('N/A')} <span className="text-slate-400">({patientData.sex || '-'})</span></div>
							</div>
							<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
								<div className="flex items-center gap-3 text-slate-500"><Droplet className="w-4 h-4 text-red-400" /> <span className="text-xs font-bold uppercase tracking-wide">{t('Blood Type')}</span></div>
								<div className="font-black text-lg text-red-600">{patientData.blood_group || t('Unknown')}</div>
							</div>
							<div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
								<div className="flex items-center gap-3 text-slate-500"><Phone className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wide">{t('Contact')}</span></div>
								<div className="font-black text-sm text-slate-900 dark:text-white">{patientData.phone || t('N/A')}</div>
							</div>
						  </div>
						</div>

						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
						  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800"><Paperclip className="w-5 h-5 text-emerald-500"/> {t('External Records')}</h3>
						  <label className={`block w-full border-2 border-dashed ${uploadingFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'} rounded-2xl p-6 text-center cursor-pointer mb-5 transition-all group`}>
							  <input type="file" className="hidden" onChange={handleUploadNewFile} disabled={uploadingFile} />
							  {uploadingFile ? <Loader2 className="w-8 h-8 mx-auto mb-3 text-emerald-500 animate-spin" /> : <UploadCloud className="w-8 h-8 mx-auto mb-3 text-slate-300 group-hover:text-emerald-500 transition-colors group-hover:-translate-y-1"/>}
							  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{uploadingFile ? t('Encrypting & Uploading...') : t('Click to Upload Document')}</div>
						  </label>
						  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
							  {documents.length === 0 ? (
								<div className="text-center py-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">{t('No Files Attached')}</div>
							  ) : documents.map(doc => (
								  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all rounded-xl border border-slate-100 dark:border-slate-800 group">
									  <div className="flex items-center gap-3 overflow-hidden">
										  <div className="bg-slate-200 dark:bg-slate-800 p-2 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors"><FileText className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" /></div>
										  <div className="truncate text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 transition-colors">{doc.file_name}</div>
									  </div>
									  <Download className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors"/>
								  </a>
							  ))}
						  </div>
						</div>
					</div>

					<div className="lg:col-span-8">
						<div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-lg min-h-full">
							<h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800"><Activity className="w-6 h-6 text-blue-500"/> {t('Clinical Timeline')}</h3>
							
							{timelineEvents.length === 0 ? (
								<div className="text-center py-20"><Clock className="w-12 h-12 text-slate-200 mx-auto mb-4" /><div className="text-slate-500 font-bold">{t('No clinical history recorded.')}</div></div>
							) : (
								<div className="space-y-8 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
									{timelineEvents.map((event, index) => {
										
										if (event._type === 'visit') return (
											<div key={`v-${event.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
												<div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-blue-100 text-blue-600 shrink-0 md:order-1 md:group-odd:-ml-6 md:group-even:-mr-6 z-10 shadow-sm transition-transform group-hover:scale-110"><Stethoscope className="w-5 h-5" /></div>
												<div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
													<div className="flex justify-between items-center mb-3">
														<div className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1 rounded-full">{t(event.visit_type)} {t('Visit')}</div>
														<div className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {event._date.toLocaleDateString()}</div>
													</div>
													<div className="font-bold text-slate-900 dark:text-white mb-4 text-lg leading-tight">{event.services_requested}</div>
													
													<div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 mb-4 grid grid-cols-3 gap-2 divide-x divide-slate-200 dark:divide-slate-700 text-center">
													  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">{t('BP')}</div><div className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">{event.blood_pressure || '--/--'}</div></div>
													  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">{t('HR')}</div><div className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1"><HeartPulse className="w-3 h-3 text-rose-400"/>{event.heart_rate || '--'}</div></div>
													  <div><div className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">{t('Temp')}</div><div className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">{event.temperature || '--'}</div></div>
													</div>

													{event.diagnosis && (
														<div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
															<div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">{t('Diagnosis & Rx')}</div>
															<div className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">{event.diagnosis}</div>
															<div className="text-xs font-medium text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{event.prescribed_meds || t('No prescriptions issued.')}</div>
														</div>
													)}
												</div>
											</div>
										);
										
										if (event._type === 'lab') return (
											<div key={`l-${event.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
												<div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 shrink-0 md:order-1 md:group-odd:-ml-6 md:group-even:-mr-6 z-10 shadow-sm transition-transform group-hover:scale-110 ${event.lab_type === 'Radiology' ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600'}`}>
													{event.lab_type === 'Radiology' ? <Activity className="w-5 h-5" /> : <Microscope className="w-5 h-5"/>}
												</div>
												<div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border bg-white dark:bg-slate-950 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${event.lab_type === 'Radiology' ? 'border-purple-200 dark:border-purple-900/50' : 'border-rose-200 dark:border-rose-900/50'}`}>
													<div className="flex justify-between items-center mb-3">
														<div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${event.lab_type === 'Radiology' ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' : 'text-rose-600 bg-rose-50 dark:bg-rose-900/20'}`}>{t(event.lab_type)}</div>
														<div className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {event._date.toLocaleDateString()}</div>
													</div>
													<div className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-3">{event.test_name}</div>
													<div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">{event.result_notes || t('Pending results...')}</div>
												</div>
											</div>
										);

										if (event._type === 'operation') return (
										  <div key={`o-${event.id}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
											  <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-red-100 text-red-600 shrink-0 md:order-1 md:group-odd:-ml-6 md:group-even:-mr-6 z-10 shadow-sm transition-transform group-hover:scale-110"><Scissors className="w-5 h-5" /></div>
											  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-950 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
												  <div className="flex justify-between items-center mb-3">
													<div className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">{t('Surgical Op')}</div>
													<div className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> {event._date.toLocaleDateString()}</div>
												  </div>
												  <div className="font-black text-xl text-slate-900 dark:text-white mb-3 leading-tight">{event.operation_name}</div>
												  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-4 bg-slate-50 dark:bg-slate-900 inline-flex px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
													{t('Status:')} <span className="uppercase text-red-600 flex items-center gap-1"><Activity className="w-3 h-3"/> {t(event.status.replace('_', ' '))}</span>
												  </div>
												  {event.notes && (
													<div className="text-sm font-medium text-slate-700 dark:text-slate-300 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">{event.notes}</div>
												  )}
											  </div>
										  </div>
										);
									})}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		)}
	  </div>

	  {/* ==================================================== */}
	  {/* PDF PRINT TEMPLATE (ONLY VISIBLE DURING EXPORT) */}
	  {/* ==================================================== */}
	  {patientData && (
		<div className="hidden print:block bg-white text-black font-sans p-8 absolute top-0 left-0 w-full min-h-screen z-50">
		   
		   <div className="border-b-4 border-slate-900 pb-4 mb-8 flex justify-between items-end">
			 <div>
				<h1 className="text-4xl font-black text-slate-900 leading-none">OPERIX CARE HRIS</h1>
				<h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">{t('Official Medical Record')}</h2>
			 </div>
			 <div className="text-right">
				<div className="text-[10px] font-bold text-slate-400 uppercase">{t('Date Generated')}</div>
				<div className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString()}</div>
			 </div>
		   </div>

		   <div className="border-2 border-slate-200 rounded-xl p-6 mb-8 bg-slate-50 page-break-inside-avoid">
			 <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">{t('Patient Demographics')}</div>
			 <div className="flex justify-between">
				<div>
				 <h3 className="text-2xl font-black text-slate-900">{patientData.full_name}</h3>
				 <div className="text-xs font-mono text-slate-500 mt-1">UUID: {patientData.id}</div>
				</div>
				<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
				 <div><span className="text-[10px] font-black uppercase text-slate-400 block">{t('DOB')}</span><span className="font-bold">{patientData.date_of_birth}</span></div>
				 <div><span className="text-[10px] font-black uppercase text-slate-400 block">{t('Sex')}</span><span className="font-bold">{patientData.sex}</span></div>
				 <div><span className="text-[10px] font-black uppercase text-slate-400 block">{t('Blood')}</span><span className="font-bold text-red-600">{patientData.blood_group}</span></div>
				 <div><span className="text-[10px] font-black uppercase text-slate-400 block">{t('Phone')}</span><span className="font-bold">{patientData.phone}</span></div>
				</div>
			 </div>
			 <div className="border-t border-slate-200 mt-4 pt-4 text-sm">
				<span className="text-[10px] font-black uppercase text-slate-400 block mb-1">{t('Preexisting History')}</span>
				<span className="italic text-slate-700">{patientData.medical_history || t('None reported.')}</span>
			 </div>
		   </div>

		   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('Detailed Clinical Log')}</div>
		   <table className="w-full text-left text-sm border-collapse border-2 border-slate-200 rounded-lg overflow-hidden mb-8">
			 <thead className="bg-slate-100">
				<tr>
				 <th className="p-3 border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500 w-24">{t('Date')}</th>
				 <th className="p-3 border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500 w-32">{t('Event Type')}</th>
				 <th className="p-3 border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500">{t('Clinical Details & Notes')}</th>
				</tr>
			 </thead>
			 <tbody>
				{timelineEvents.map((evt, idx) => (
				 <tr key={idx} className="border-b border-slate-200 page-break-inside-avoid">
					<td className="p-4 align-top font-mono text-xs text-slate-600">{evt._date.toLocaleDateString()}</td>
					<td className="p-4 align-top font-black text-[10px] uppercase tracking-widest">
					 {evt._type === 'visit' && <span className="text-blue-600">{t(evt.visit_type)} {t('Visit')}</span>}
					 {evt._type === 'lab' && <span className={evt.lab_type === 'Radiology' ? 'text-purple-600' : 'text-rose-600'}>{t(evt.lab_type)}</span>}
					 {evt._type === 'operation' && <span className="text-red-600">{t('Surgical Op')}</span>}
					</td>
					<td className="p-4 align-top">
					 {evt._type === 'visit' && (
						<div className="space-y-3">
						 <div><span className="font-bold text-slate-700">{t('Services Billed:')}</span> {evt.services_requested}</div>
						 <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
							<div><span className="font-bold text-slate-500">{t('BP:')}</span> {evt.blood_pressure || t('N/A')}</div>
							<div><span className="font-bold text-slate-500">{t('HR:')}</span> {evt.heart_rate || t('N/A')}</div>
							<div><span className="font-bold text-slate-500">{t('Temp:')}</span> {evt.temperature || t('N/A')}</div>
						 </div>
						 {evt.diagnosis && <div><span className="font-bold text-slate-700">{t('Physician Diagnosis:')}</span> <span className="italic text-slate-800">{evt.diagnosis}</span></div>}
						 {evt.prescribed_meds && <div><span className="font-bold text-slate-700">{t('Prescription (Rx):')}</span> <span className="italic text-slate-800">{evt.prescribed_meds}</span></div>}
						</div>
					 )}
					 
					 {evt._type === 'lab' && (
						<div className="space-y-2">
						 <div className="font-bold text-base text-slate-900">{evt.test_name}</div>
						 <div className="bg-slate-50 p-3 rounded border border-slate-200">
							<span className="font-bold text-slate-700 block mb-1">{t('Analytical Notes:')}</span>
							<span className="italic text-slate-800 whitespace-pre-wrap">{evt.result_notes || t('No analytical notes provided.')}</span>
						 </div>
						</div>
					 )}
					 
					 {evt._type === 'operation' && (
						<div className="space-y-2">
						 <div className="font-bold text-base text-slate-900">{evt.operation_name}</div>
						 <div><span className="font-bold text-slate-700">{t('Final Status:')}</span> <span className="uppercase text-xs font-black text-red-600">{t(evt.status.replace('_',' '))}</span></div>
						 <div className="bg-slate-50 p-3 rounded border border-slate-200">
							<span className="font-bold text-slate-700 block mb-1">{t('Surgical / Post-Op Notes:')}</span>
							<span className="italic text-slate-800 whitespace-pre-wrap">{evt.notes || t('No operative notes attached.')}</span>
						 </div>
						</div>
					 )}
					</td>
				 </tr>
				))}
			 </tbody>
		   </table>

		   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 page-break-inside-avoid">{t('External Document Archive')}</div>
		   <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 mb-8 page-break-inside-avoid">
			 {documents.length === 0 ? (
			   <div className="text-slate-500 italic text-sm">{t("No external files or scans have been uploaded to this patient's record.")}</div>
			 ) : (
			   <ul className="list-disc list-inside text-sm text-slate-800 space-y-1">
				 {documents.map(doc => (
				   <li key={doc.id}><span className="font-bold">{doc.file_name}</span> <span className="text-slate-400 text-xs ml-2">(Uploaded: {new Date(doc.created_at).toLocaleDateString()})</span></li>
				 ))}
			   </ul>
			 )}
		   </div>

		   <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
			 {t('Confidential Medical Document • Generated via OPERIX Care System')}
		   </div>
		</div>
	  )}
	</>
  );
}