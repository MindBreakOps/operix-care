import { useState, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { toPng } from 'html-to-image';
import { 
  Search, User, FileText, Activity, Scissors, 
  Paperclip, ShieldAlert, Download, UploadCloud, 
  Clock, CheckCircle, HeartPulse, Stethoscope 
} from 'lucide-react';

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmd1QUqvJ9FNIGDXAgIFFXUoKip3yeEkQqzbugfJtUsK7YHj8Ma0eMxDl6lLDtzL8f/exec';

export default function PatientHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const exportRef = useRef(null);

  const [patientData, setPatientData] = useState(null);
  const [visits, setVisits] = useState([]);
  const [operations, setOperations] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  const [uploadingFile, setUploadingFile] = useState(false);

  const showSuccess = (msg) => {
	setSuccessMsg(msg);
	setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleSearch = async (e) => {
	e?.preventDefault();
	if (!searchQuery.trim()) return;
	
	setLoading(true); setError(''); setSuccessMsg(''); setPatientData(null);

	try {
	  let patientId = searchQuery.trim();
	  let patientRecord = null;

	  // 1. Try fetching by direct Patient ID
	  const { data: pData } = await supabase.from('patient_files').select('*').eq('id', patientId).single();
	  
	  if (pData) {
		  patientRecord = pData;
	  } else {
		  // 2. Fallback: Lookup by Ticket MRN
		  const { data: ticketData } = await supabase.from('tickets').select('patient_id').eq('id', patientId).single();
		  if (ticketData) {
			  patientId = ticketData.patient_id;
			  const { data: nestedPatient } = await supabase.from('patient_files').select('*').eq('id', patientId).single();
			  patientRecord = nestedPatient;
		  } else {
			  throw new Error("No patient or MRN ticket found matching that ID.");
		  }
	  }

	  setPatientData(patientRecord);

	  // Fetch Timeline Data
	  const [visitsRes, opsRes, docsRes] = await Promise.all([
		  supabase.from('tickets').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
		  supabase.from('operations').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
		  supabase.from('patient_files').select('id, file_name, file_url, created_at, file_type').eq('patient_id', patientId).not('file_url', 'is', null).order('created_at', { ascending: false })
	  ]);

	  setVisits(visitsRes.data || []);
	  setOperations(opsRes.data || []);
	  setDocuments(docsRes.data || []);

	} catch (err) {
	  setError(err.message);
	} finally {
	  setLoading(false);
	}
  };

  // --- EXPORT MASTER RECORD ---
  const exportMasterRecord = async () => {
	if (!exportRef.current || !patientData) return;
	try {
	  showSuccess('Generating Master Record Export...');
	  const dataUrl = await toPng(exportRef.current, { backgroundColor: '#0f172a', pixelRatio: 2, style: { transform: 'scale(1)', padding: '20px' } });
	  const link = document.createElement('a'); 
	  link.href = dataUrl; 
	  link.download = `Master_Record_${patientData.full_name.replace(/\s+/g, '_')}.png`; 
	  link.click();
	} catch (err) {
	  setError('Failed to export record. Try again.');
	}
  };

  // --- DIRECT FILE UPLOAD ---
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
		
		// 1. Send to GAS Webhook
		const gasResponse = await fetch(GAS_WEBHOOK_URL, { 
			method: 'POST', 
			body: JSON.stringify({ fileName: `DirectUpload_${patientData.id}_${file.name}`, mimeType: file.type, fileData: base64Data }) 
		});
		const gasData = await gasResponse.json();
		
		if (!gasData.fileUrl) throw new Error("File hosting failed.");

		// 2. Save link to Supabase
		const { error: dbError } = await supabase.from('patient_files').insert([{ 
			patient_id: patientData.id, file_name: file.name, file_type: file.type, file_url: gasData.fileUrl 
		}]);

		if (dbError) throw dbError;

		showSuccess('Document successfully added to patient timeline.');
		handleSearch(); // Refresh data silently
	} catch (err) {
		setError("Upload failed: " + err.message);
	} finally {
		setUploadingFile(false);
	}
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  
	  {/* AMBIENT GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
	  <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

	  {/* SEARCH HEADER */}
	  <div className="relative z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
		  <div>
			  <div className="flex items-center gap-2 mb-1">
				<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
				<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Records</span>
			  </div>
			  <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
				Unified Master Timeline
			  </h1>
		  </div>
		  <form onSubmit={handleSearch} className="flex w-full md:w-auto bg-slate-100 dark:bg-slate-950 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500/50 transition-colors shadow-inner">
			  <Search className="w-5 h-5 text-slate-400 ml-3 self-center" />
			  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Scan MRN or Patient ID..." className="bg-transparent border-none outline-none px-4 font-bold text-sm w-full md:w-72 text-slate-900 dark:text-white placeholder:text-slate-400" />
			  <button disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20">
				  {loading ? 'Searching...' : 'Lookup'}
			  </button>
		  </form>
	  </div>

	  {/* NOTIFICATIONS */}
	  {error && <div className="relative z-10 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 font-bold rounded-xl border border-red-200 dark:border-red-500/20 flex items-center gap-3 animate-in slide-in-from-top-2"><ShieldAlert className="w-5 h-5"/> {error}</div>}
	  {successMsg && <div className="relative z-10 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-3 animate-in slide-in-from-top-2"><CheckCircle className="w-5 h-5"/> {successMsg}</div>}

	  {/* PATIENT DATA RENDER */}
	  {patientData && (
		  <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
			  
			  {/* ACTION BAR */}
			  <div className="flex justify-end">
				<button onClick={exportMasterRecord} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg">
					<Download className="w-4 h-4"/> Export Full Master Record
				</button>
			  </div>

			  {/* EXPORTABLE WRAPPER */}
			  <div ref={exportRef} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				  
				  {/* LEFT COLUMN: DEMOGRAPHICS & FILES */}
				  <div className="lg:col-span-1 space-y-8">
					  
					  {/* Demographics Card */}
					  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
						  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
						  
						  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-500/20 shadow-inner">
							  <User className="w-10 h-10"/>
						  </div>
						  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{patientData.full_name}</h2>
						  <div className="font-mono text-xs font-bold text-slate-400 mb-8 tracking-widest break-all">ID: {patientData.id}</div>
						  
						  <div className="space-y-5 text-sm">
							  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"><span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Date of Birth</span> <span className="font-black text-slate-800 dark:text-slate-200">{patientData.date_of_birth || 'N/A'}</span></div>
							  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"><span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Biological Sex</span> <span className="font-black text-slate-800 dark:text-slate-200">{patientData.sex || 'N/A'}</span></div>
							  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"><span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Blood Group</span> <span className="font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/50">{patientData.blood_group || 'Unknown'}</span></div>
							  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3"><span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Contact</span> <span className="font-black text-slate-800 dark:text-slate-200">{patientData.phone || 'N/A'}</span></div>
						  </div>

						  <div className="mt-8 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
							  <div className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center gap-2"><Activity className="w-3 h-3 text-blue-500"/> Known Medical History</div>
							  <div className="text-sm font-medium text-slate-700 dark:text-slate-300 italic leading-relaxed">{patientData.medical_history || 'No preexisting conditions noted.'}</div>
						  </div>
					  </div>

					  {/* Documents & Upload Card */}
					  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
						  <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6"><Paperclip className="w-5 h-5 text-emerald-500"/> Attached Records</h3>
						  
						  {/* Direct Upload Dropzone */}
						  <label className={`block w-full border-2 border-dashed ${uploadingFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800'} rounded-2xl p-6 text-center cursor-pointer transition-all mb-6 group`}>
							  <input type="file" className="hidden" onChange={handleUploadNewFile} disabled={uploadingFile} />
							  <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${uploadingFile ? 'text-emerald-500 animate-bounce' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}`}/>
							  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
								  {uploadingFile ? 'Uploading & Encrypting...' : 'Click to Upload Document'}
							  </div>
							  <div className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG (GAS Indexed)</div>
						  </label>

						  {/* Document List */}
						  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
							  {documents.length === 0 ? <p className="text-xs font-bold text-slate-400 text-center py-4">No external documents attached.</p> : documents.map(doc => (
								  <a key={doc.id} href={doc.file_url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-800 transition-all rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group">
									  <div className="overflow-hidden pr-4">
										  <div className="truncate text-xs font-black text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{doc.file_name}</div>
										  <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">{doc.file_type.split('/')[1] || 'FILE'}</div>
									  </div>
									  <Download className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0"/>
								  </a>
							  ))}
						  </div>
					  </div>
				  </div>

				  {/* RIGHT COLUMN: CLINICAL TIMELINE */}
				  <div className="lg:col-span-2 space-y-8">
					  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl min-h-full">
						  <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
							  <Clock className="w-6 h-6 text-indigo-500"/> Clinical Timeline
						  </h3>

						  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent dark:before:from-slate-800">
							  
							  {/* Map Operations (Red Theme) */}
							  {operations.map(op => (
								  <div key={op.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
									  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
										  <Scissors className="w-4 h-4" />
									  </div>
									  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-all">
										  <div className="flex items-center justify-between mb-2">
											  <div className="font-black text-lg text-slate-900 dark:text-white">{op.operation_name}</div>
											  <div className="text-[10px] font-black uppercase text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800">{new Date(op.created_at).toLocaleDateString()}</div>
										  </div>
										  <div className="text-xs font-bold text-slate-500 mb-4">Status: <span className="uppercase text-red-600 dark:text-red-400">{op.status.replace('_', ' ')}</span></div>
										  {op.notes && <div className="text-sm text-slate-600 dark:text-slate-400 italic mb-4">{op.notes}</div>}
										  {op.blood_units_required > 0 && (
											  <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
												  <HeartPulse className="w-3 h-3"/> Utilized {op.blood_units_required} Blood Units
											  </div>
										  )}
									  </div>
								  </div>
							  ))}

							  {/* Map Visits/Tickets (Blue Theme) */}
							  {visits.map(visit => (
								  <div key={visit.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
									  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
										  <Stethoscope className="w-4 h-4" />
									  </div>
									  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
										  <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
											  <div>
												  <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 inline-block px-2 py-1 rounded-md mb-2">{visit.visit_type} Visit</div>
												  <div className="font-mono text-[10px] font-bold text-slate-400 tracking-widest">MRN: {visit.id}</div>
											  </div>
											  <div className="text-right">
												  <div className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 mb-2">{new Date(visit.created_at).toLocaleDateString()}</div>
												  <div className="font-black text-emerald-600 dark:text-emerald-400">{visit.currency || '$'} {visit.total_bill}</div>
											  </div>
										  </div>
										  
										  <div className="mb-4">
											  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Services Billed</div>
											  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{visit.services_requested}</div>
										  </div>

										  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-4">
											  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><HeartPulse className="w-3 h-3 text-red-400"/> Triage Vitals</div>
											  <div className="grid grid-cols-3 gap-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
												  <div>BP: {visit.blood_pressure || '-'}</div>
												  <div>HR: {visit.heart_rate || '-'}</div>
												  <div>T: {visit.temperature || '-'}</div>
											  </div>
										  </div>

										  {visit.diagnosis && (
											  <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50">
												  <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Physician Diagnosis</div>
												  <div className="font-bold text-sm text-slate-900 dark:text-white mb-2">{visit.diagnosis}</div>
												  <div className="text-xs text-slate-600 dark:text-slate-400 italic">Rx: {visit.prescribed_meds || 'None'}</div>
											  </div>
										  )}
									  </div>
								  </div>
							  ))}

							  {visits.length === 0 && operations.length === 0 && (
								  <div className="text-center py-12 text-sm font-bold text-slate-400 uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">No clinical events recorded yet.</div>
							  )}
						  </div>
					  </div>
				  </div>

			  </div>
		  </div>
	  )}
	</div>
  );
}