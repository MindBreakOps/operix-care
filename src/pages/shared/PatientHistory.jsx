import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Search, User, Activity, Scissors, 
  Paperclip, ShieldAlert, Download, UploadCloud, 
  Clock, CheckCircle, HeartPulse, Stethoscope, Microscope, Users, ChevronLeft, ArrowRight
} from 'lucide-react';

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmd1QUqvJ9FNIGDXAgIFFXUoKip3yeEkQqzbugfJtUsK7YHj8Ma0eMxDl6lLDtzL8f/exec';

export default function PatientHistory() {
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
	  if (pError || !pData) throw new Error("Patient not found.");
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

  // NATIVE BROWSER PDF PRINT
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
		  
		  console.log("Sending to Google Apps Script...");
		  const gasResponse = await fetch(GAS_WEBHOOK_URL, { 
			  method: 'POST', 
			  body: JSON.stringify({ 
				fileName: `DirectUpload_${patientData.id}_${file.name}`, 
				mimeType: file.type, 
				fileData: base64Data 
			  }) 
		  });
		  
		  const gasData = await gasResponse.json();
		  console.log("Google Apps Script Replied:", gasData); // <--- THIS WILL REVEAL THE ISSUE
  
		  if (gasData.error) throw new Error("Google Script Error: " + gasData.error);
		  if (!gasData.fileUrl) throw new Error("File hosting failed. Missing fileUrl in response.");
  
		  await supabase.from('patient_files').insert([{ 
			  patient_id: patientData.id, file_name: file.name, file_type: file.type, file_url: gasData.fileUrl 
		  }]);
		  showSuccess('Document successfully added to patient timeline.');
		  loadPatientTimeline(patientData.id); 
	  } catch (err) { 
		  console.error("Upload process failed:", err);
		  setError("Upload failed: " + err.message); 
	  } finally { 
		  setUploadingFile(false); 
	  }
	};

  return (
	<>
	  {/* ==================================================== */}
	  {/* WEB UI (HIDDEN DURING PDF EXPORT) */}
	  {/* ==================================================== */}
	  <div className="print:hidden relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
		
		<div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

		<div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
			<div>
				<div className="flex items-center gap-2 mb-1">
				  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
				  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Records</span>
				</div>
				<h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">Patient Database</h1>
			</div>
			<form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto bg-slate-100 dark:bg-slate-950 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-inner">
				<Search className="w-5 h-5 text-slate-400 ml-3 self-center" />
				<input type="text" value={directorySearch} onChange={e => setDirectorySearch(e.target.value)} placeholder="Search Name, Phone, or MRN..." className="bg-transparent border-none outline-none px-4 font-bold text-sm w-full md:w-72 text-slate-900 dark:text-white placeholder:text-slate-400" />
				<button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20">Lookup</button>
			</form>
		</div>

		{error && <div className="relative z-10 p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200 flex items-center gap-3"><ShieldAlert className="w-5 h-5"/> {error}</div>}
		{successMsg && <div className="relative z-10 p-4 bg-emerald-50 text-emerald-600 font-bold rounded-xl border border-emerald-200 flex items-center gap-3"><CheckCircle className="w-5 h-5"/> {successMsg}</div>}

		{activeTab === 'directory' && (
		  <div className="relative z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 flex flex-col min-h-[600px]">
			<h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Users className="w-4 h-4"/> Registered Patients Directory</h3>
			
			<div className="flex-1 overflow-x-auto custom-scrollbar border rounded-2xl dark:border-slate-800">
			  <table className="w-full text-left text-sm whitespace-nowrap">
				<thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-[10px] uppercase font-black tracking-widest sticky top-0">
				  <tr>
					<th className="p-4">Patient Name</th><th className="p-4">Contact</th><th className="p-4">DOB & Sex</th><th className="p-4">Blood</th><th className="p-4">Registered</th><th className="p-4 text-right">Action</th>
				  </tr>
				</thead>
				<tbody className="divide-y divide-slate-100 dark:divide-slate-800">
				  {filteredDirectory.map(p => (
					<tr key={p.id} onClick={() => loadPatientTimeline(p.id)} className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group">
					  <td className="p-4"><div className="font-bold text-slate-900 dark:text-white">{p.full_name}</div><div className="text-[9px] font-mono text-slate-400">UUID: {p.id}</div></td>
					  <td className="p-4 text-slate-600 dark:text-slate-300 font-bold">{p.phone || 'N/A'}</td>
					  <td className="p-4 text-slate-600 dark:text-slate-300">{p.date_of_birth} <span className="text-[10px] font-black uppercase text-slate-400 ml-1">({p.sex})</span></td>
					  <td className="p-4"><span className="font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{p.blood_group || '?'}</span></td>
					  <td className="p-4 text-slate-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
					  <td className="p-4 text-right"><button className="text-blue-500 font-bold text-xs uppercase flex items-center justify-end w-full">View <ArrowRight className="w-3 h-3 ml-1"/></button></td>
					</tr>
				  ))}
				</tbody>
			  </table>
			  {filteredDirectory.length === 0 && <div className="text-center py-12 text-slate-400 font-bold uppercase text-xs">No patients found.</div>}
			</div>
		  </div>
		)}

		{activeTab === 'timeline' && patientData && (
			<div className="relative z-10 animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
				<div className="flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
				  <button onClick={() => setActiveTab('directory')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold flex items-center gap-2 text-sm"><ChevronLeft className="w-4 h-4"/> Back to Directory</button>
				  <button onClick={exportMasterRecordPDF} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg text-sm active:scale-95"><Download className="w-4 h-4"/> Save as PDF Document</button>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-1 space-y-8">
						<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
							<h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{patientData.full_name}</h2>
							<div className="font-mono text-[9px] font-bold text-slate-400 mb-8 tracking-widest break-all">UUID: {patientData.id}</div>
							<div className="space-y-4 text-sm">
								<div className="flex justify-between border-b dark:border-slate-800 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px]">DOB</span> <span className="font-black dark:text-white">{patientData.date_of_birth || 'N/A'}</span></div>
								<div className="flex justify-between border-b dark:border-slate-800 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px]">Sex</span> <span className="font-black dark:text-white">{patientData.sex || 'N/A'}</span></div>
								<div className="flex justify-between border-b dark:border-slate-800 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px]">Blood</span> <span className="font-black text-red-600">{patientData.blood_group || 'Unknown'}</span></div>
								<div className="flex justify-between border-b dark:border-slate-800 pb-2"><span className="text-slate-500 font-bold uppercase text-[10px]">Phone</span> <span className="font-black dark:text-white">{patientData.phone || 'N/A'}</span></div>
							</div>
						</div>

						{/* ATTACHED RECORDS WEB UI */}
						<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
						  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6"><Paperclip className="w-5 h-5 text-emerald-500"/> Attached Records</h3>
						  <label className={`block w-full border-2 border-dashed ${uploadingFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400'} rounded-2xl p-6 text-center cursor-pointer mb-6`}>
							  <input type="file" className="hidden" onChange={handleUploadNewFile} disabled={uploadingFile} />
							  <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${uploadingFile ? 'text-emerald-500 animate-bounce' : 'text-slate-400'}`}/>
							  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{uploadingFile ? 'Encrypting...' : 'Click to Upload'}</div>
						  </label>
						  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
							  {documents.map(doc => (
								  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-800 transition-all rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group">
									  <div className="overflow-hidden pr-4">
										  <div className="truncate text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-emerald-600">{doc.file_name}</div>
									  </div>
									  <Download className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 flex-shrink-0"/>
								  </a>
							  ))}
						  </div>
						</div>
					</div>

					<div className="lg:col-span-2">
						<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl min-h-full">
							<h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3 mb-8 border-b dark:border-slate-800 pb-4"><Clock className="w-6 h-6 text-indigo-500"/> Clinical Timeline</h3>
							<div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
								{timelineEvents.map((event, index) => {
									if (event._type === 'visit') return (
										<div key={`v-${event.id}`} className="relative flex items-start gap-6">
											<div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 shrink-0 relative z-10"><Stethoscope className="w-4 h-4" /></div>
											<div className="flex-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
												<div className="flex justify-between mb-2">
													<div className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{event.visit_type} Visit</div>
													<div className="text-[10px] font-black uppercase text-slate-400">{event._date.toLocaleDateString()}</div>
												</div>
												<div className="font-bold text-sm dark:text-white mb-3">{event.services_requested}</div>
												
												<div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100 dark:border-slate-800 mb-3 grid grid-cols-3 gap-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
												  <div>BP: {event.blood_pressure || '-'}</div><div>HR: {event.heart_rate || '-'}</div><div>T: {event.temperature || '-'}</div>
												</div>

												{event.diagnosis && (
													<div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/50">
														<div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Diagnosis</div>
														<div className="font-bold text-sm dark:text-white mb-1">{event.diagnosis}</div>
														<div className="text-xs text-slate-600 dark:text-slate-400 italic">Rx: {event.prescribed_meds || 'None'}</div>
													</div>
												)}
											</div>
										</div>
									);
									if (event._type === 'lab') return (
										<div key={`l-${event.id}`} className="relative flex items-start gap-6">
											<div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 relative z-10 ${event.lab_type === 'Radiology' ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600'}`}>
												{event.lab_type === 'Radiology' ? <Activity className="w-4 h-4" /> : <Microscope className="w-4 h-4"/>}
											</div>
											<div className={`flex-1 p-6 rounded-2xl border bg-white dark:bg-slate-900 ${event.lab_type === 'Radiology' ? 'border-purple-200' : 'border-rose-200'}`}>
												<div className="flex justify-between mb-2">
													<div className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${event.lab_type === 'Radiology' ? 'text-purple-600 bg-purple-50' : 'text-rose-600 bg-rose-50'}`}>{event.lab_type}</div>
													<div className="text-[10px] font-black uppercase text-slate-400">{event._date.toLocaleDateString()}</div>
												</div>
												<div className="font-bold dark:text-white">{event.test_name}</div>
												<div className="text-sm italic text-slate-600 mt-2">{event.result_notes}</div>
											</div>
										</div>
									);
									if (event._type === 'operation') return (
									  <div key={`o-${event.id}`} className="relative flex items-start gap-6 group">
										  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 shrink-0 relative z-10"><Scissors className="w-4 h-4" /></div>
										  <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
											  <div className="flex justify-between items-start mb-2">
												<div className="font-black text-lg text-slate-900 dark:text-white mb-1">{event.operation_name}</div>
												<div className="text-[10px] font-black uppercase text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-md bg-white dark:bg-slate-900">{event._date.toLocaleDateString()}</div>
											  </div>
											  <div className="text-xs font-bold text-slate-500 mb-2">Status: <span className="uppercase text-red-600">{event.status.replace('_', ' ')}</span></div>
											  {event.notes && <div className="text-sm text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-3 rounded-lg border dark:border-slate-800">{event.notes}</div>}
										  </div>
									  </div>
								  );
								})}
							</div>
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
				<h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mt-1">Official Medical Record</h2>
			  </div>
			  <div className="text-right">
				<div className="text-[10px] font-bold text-slate-400 uppercase">Date Generated</div>
				<div className="font-mono font-bold text-slate-900">{new Date().toLocaleDateString()}</div>
			  </div>
		   </div>

		   <div className="border-2 border-slate-200 rounded-xl p-6 mb-8 bg-slate-50 page-break-inside-avoid">
			  <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Patient Demographics</div>
			  <div className="flex justify-between">
				<div>
				  <h3 className="text-2xl font-black text-slate-900">{patientData.full_name}</h3>
				  <div className="text-xs font-mono text-slate-500 mt-1">UUID: {patientData.id}</div>
				</div>
				<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
				  <div><span className="text-[10px] font-black uppercase text-slate-400 block">DOB</span><span className="font-bold">{patientData.date_of_birth}</span></div>
				  <div><span className="text-[10px] font-black uppercase text-slate-400 block">Sex</span><span className="font-bold">{patientData.sex}</span></div>
				  <div><span className="text-[10px] font-black uppercase text-slate-400 block">Blood</span><span className="font-bold text-red-600">{patientData.blood_group}</span></div>
				  <div><span className="text-[10px] font-black uppercase text-slate-400 block">Phone</span><span className="font-bold">{patientData.phone}</span></div>
				</div>
			  </div>
			  <div className="border-t border-slate-200 mt-4 pt-4 text-sm">
				<span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Preexisting History</span>
				<span className="italic text-slate-700">{patientData.medical_history || 'None reported.'}</span>
			  </div>
		   </div>

		   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Detailed Clinical Log</div>
		   <table className="w-full text-left text-sm border-collapse border-2 border-slate-200 rounded-lg overflow-hidden mb-8">
			  <thead className="bg-slate-100">
				<tr>
				  <th className="p-3 border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500 w-24">Date</th>
				  <th className="p-3 border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500 w-32">Event Type</th>
				  <th className="p-3 border-b-2 border-slate-200 text-[10px] font-black uppercase text-slate-500">Clinical Details & Notes</th>
				</tr>
			  </thead>
			  <tbody>
				{timelineEvents.map((evt, idx) => (
				  <tr key={idx} className="border-b border-slate-200 page-break-inside-avoid">
					<td className="p-4 align-top font-mono text-xs text-slate-600">{evt._date.toLocaleDateString()}</td>
					<td className="p-4 align-top font-black text-[10px] uppercase tracking-widest">
					  {evt._type === 'visit' && <span className="text-blue-600">{evt.visit_type} Visit</span>}
					  {evt._type === 'lab' && <span className={evt.lab_type === 'Radiology' ? 'text-purple-600' : 'text-rose-600'}>{evt.lab_type}</span>}
					  {evt._type === 'operation' && <span className="text-red-600">Surgery</span>}
					</td>
					<td className="p-4 align-top">
					  {evt._type === 'visit' && (
						<div className="space-y-3">
						  <div><span className="font-bold text-slate-700">Services Billed:</span> {evt.services_requested}</div>
						  
						  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-xs">
							<div><span className="font-bold text-slate-500">BP:</span> {evt.blood_pressure || 'N/A'}</div>
							<div><span className="font-bold text-slate-500">HR:</span> {evt.heart_rate || 'N/A'}</div>
							<div><span className="font-bold text-slate-500">Temp:</span> {evt.temperature || 'N/A'}</div>
						  </div>

						  {evt.diagnosis && <div><span className="font-bold text-slate-700">Physician Diagnosis:</span> <span className="italic text-slate-800">{evt.diagnosis}</span></div>}
						  {evt.prescribed_meds && <div><span className="font-bold text-slate-700">Prescription (Rx):</span> <span className="italic text-slate-800">{evt.prescribed_meds}</span></div>}
						</div>
					  )}
					  
					  {evt._type === 'lab' && (
						<div className="space-y-2">
						  <div className="font-bold text-base text-slate-900">{evt.test_name}</div>
						  <div className="bg-slate-50 p-3 rounded border border-slate-200">
							<span className="font-bold text-slate-700 block mb-1">Analytical Notes:</span>
							<span className="italic text-slate-800 whitespace-pre-wrap">{evt.result_notes || 'No analytical notes provided.'}</span>
						  </div>
						</div>
					  )}
					  
					  {evt._type === 'operation' && (
						<div className="space-y-2">
						  <div className="font-bold text-base text-slate-900">{evt.operation_name}</div>
						  <div><span className="font-bold text-slate-700">Final Status:</span> <span className="uppercase text-xs font-black text-red-600">{evt.status.replace('_',' ')}</span></div>
						  <div className="bg-slate-50 p-3 rounded border border-slate-200">
							<span className="font-bold text-slate-700 block mb-1">Surgical / Post-Op Notes:</span>
							<span className="italic text-slate-800 whitespace-pre-wrap">{evt.notes || 'No operative notes attached.'}</span>
						  </div>
						</div>
					  )}
					</td>
				  </tr>
				))}
			  </tbody>
		   </table>

		   {/* ATTACHED DOCUMENTS SUMMARY LIST */}
		   <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 page-break-inside-avoid">External Document Archive</div>
		   <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50 mb-8 page-break-inside-avoid">
			 {documents.length === 0 ? (
			   <div className="text-slate-500 italic text-sm">No external files or scans have been uploaded to this patient's record.</div>
			 ) : (
			   <ul className="list-disc list-inside text-sm text-slate-800 space-y-1">
				 {documents.map(doc => (
				   <li key={doc.id}><span className="font-bold">{doc.file_name}</span> <span className="text-slate-400 text-xs ml-2">(Uploaded: {new Date(doc.created_at).toLocaleDateString()})</span></li>
				 ))}
			   </ul>
			 )}
		   </div>

		   <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
			  Confidential Medical Document • Generated via OPERIX Care System
		   </div>
		</div>
	  )}
	</>
  );
}