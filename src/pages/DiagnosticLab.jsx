import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { toPng } from 'html-to-image';
import { 
  Search, ShieldAlert, CheckCircle, UploadCloud, 
  Microscope, Activity, FileText, Download, Check, Upload, FolderOpen
} from 'lucide-react';

const GAS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwmd1QUqvJ9FNIGDXAgIFFXUoKip3yeEkQqzbugfJtUsK7YHj8Ma0eMxDl6lLDtzL8f/exec'; // Replace with your GAS API

export default function DiagnosticLab({ labTypeOverride }) {
  const { role } = useAuth();
  
  const isRadiology = labTypeOverride === 'Radiology' || role === 'radiologist';
  const labType = isRadiology ? 'Radiology' : 'Pathology';
  
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'archive'
  
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [activeRequest, setActiveRequest] = useState(null);
  const [resultNotes, setResultNotes] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  const reportRef = useRef(null);

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

const fetchQueue = async () => {
	  setLoading(true);
	  // Remove the strict lab_type filter temporarily to see if data appears
	  const { data, error } = await supabase
		.from('lab_requests')
		.select('*, patient:patient_files(full_name, phone)')
		.eq('status', 'pending'); // Only filter by status
		
	  if (error) console.error("Fetch Error:", error);
	  if (data) {
		// Filter by labType here in JavaScript to avoid SQL case-sensitivity issues
		const filtered = data.filter(item => item.lab_type === labType);
		setRequests(filtered);
		setFilteredRequests(filtered);
	  }
	  setLoading(false);
	};

  useEffect(() => { fetchQueue(); }, [labType]);

  // SMART SEARCH (MRN, Name, Phone)
  useEffect(() => {
	const q = searchQuery.toLowerCase();
	setFilteredRequests(requests.filter(req => 
	  req.patient_name.toLowerCase().includes(q) ||
	  String(req.ticket_id).includes(q) ||
	  (req.patient?.phone && req.patient.phone.includes(q))
	));
  }, [searchQuery, requests]);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader(); reader.readAsDataURL(file); 
	reader.onload = () => resolve(reader.result.split(',')[1]); 
	reader.onerror = error => reject(error);
  });

  const handleCompleteTest = async (e) => {
	e.preventDefault();
	if (!resultNotes && !uploadFile) return showMessage('error', 'You must provide notes or upload a result file.');
	
	setProcessing(true);
	try {
	  let fileUrl = null;

	  if (uploadFile) {
		const base64Data = await fileToBase64(uploadFile);
		const gasResponse = await fetch(GAS_WEBHOOK_URL, { 
			method: 'POST', 
			body: JSON.stringify({ fileName: `${activeRequest.id}_Result_${uploadFile.name}`, mimeType: uploadFile.type, fileData: base64Data }) 
		});
		const gasData = await gasResponse.json();
		if (gasData.fileUrl) fileUrl = gasData.fileUrl;
	  }

	  await supabase.from('lab_requests').update({
		status: 'completed', result_notes: resultNotes, result_file_url: fileUrl, completed_at: new Date().toISOString()
	  }).eq('id', activeRequest.id);

	  await supabase.from('patient_files').insert([{
		patient_id: activeRequest.patient_id, file_name: `${labType} Result: ${activeRequest.test_name}`,
		file_url: fileUrl, file_type: uploadFile ? uploadFile.type : 'text/plain',
		medical_history: `Diagnostic Result [${labType}]: ${activeRequest.test_name}. Notes: ${resultNotes}`
	  }]);

	  showMessage('success', `${activeRequest.test_name} results submitted to Patient File.`);
	  setActiveRequest(null); setResultNotes(''); setUploadFile(null);
	  fetchQueue();

	} catch (err) { showMessage('error', "Failed to submit results: " + err.message); } finally { setProcessing(false); }
  };

  const exportReport = async () => {
	if (!reportRef.current) return;
	const dataUrl = await toPng(reportRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
	const link = document.createElement('a'); link.href = dataUrl; link.download = `Lab_Report_${activeRequest.patient_name}.png`; link.click();
  };

  // ARCHIVE UPLOAD STATE
  const [archivePatientId, setArchivePatientId] = useState('');
  const [archiveFile, setArchiveFile] = useState(null);
  const [archiveUploading, setArchiveUploading] = useState(false);

  const handleUploadArchive = async (e) => {
	e.preventDefault();
	if (!archivePatientId || !archiveFile) return showMessage('error', 'Please provide Patient ID and select a file.');
	
	setArchiveUploading(true);
	try {
	  const base64Data = await fileToBase64(archiveFile);
	  const gasResponse = await fetch(GAS_WEBHOOK_URL, { 
		  method: 'POST', 
		  body: JSON.stringify({ fileName: `Historical_${labType}_${archiveFile.name}`, mimeType: archiveFile.type, fileData: base64Data }) 
	  });
	  const gasData = await gasResponse.json();
	  if (!gasData.fileUrl) throw new Error("Upload failed.");

	  await supabase.from('patient_files').insert([{
		patient_id: archivePatientId.trim(), file_name: `Historical ${labType} Upload`,
		file_url: gasData.fileUrl, file_type: archiveFile.type, medical_history: `Manually archived historical ${labType} record.`
	  }]);

	  showMessage('success', 'Historical file uploaded to patient record.');
	  setArchivePatientId(''); setArchiveFile(null);
	} catch (err) { showMessage('error', err.message); } finally { setArchiveUploading(false); }
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  <div className={`absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none ${isRadiology ? 'bg-purple-500/10' : 'bg-rose-500/10'}`}></div>

	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className={`w-2 h-2 rounded-full animate-pulse ${isRadiology ? 'bg-purple-500' : 'bg-rose-500'}`}></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Diagnostic Department</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			{isRadiology ? <Activity className="w-8 h-8 text-purple-500"/> : <Microscope className="w-8 h-8 text-rose-500"/>}
			{isRadiology ? 'Radiography Lab' : 'Medical Pathology'}
		  </h1>
		</div>
		
		<div className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto border border-slate-300/50 dark:border-slate-700/50">
		  <button onClick={() => setActiveTab('queue')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'queue' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Active Queue</button>
		  <button onClick={() => setActiveTab('archive')} className={`flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === 'archive' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}><FolderOpen className="w-4 h-4 inline mr-1"/> Upload Archive</button>
		</div>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  {activeTab === 'queue' && (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		  
		  {/* PENDING QUEUE */}
		  <div className="lg:col-span-1 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 h-[700px] flex flex-col">
			<div className="flex bg-slate-100 dark:bg-slate-950 rounded-xl p-2 mb-4 border border-slate-200 dark:border-slate-800">
				<Search className="w-4 h-4 text-slate-400 self-center ml-2"/>
				<input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search MRN, Name, Phone..." className="bg-transparent border-none outline-none px-3 text-sm font-bold w-full dark:text-white placeholder:text-slate-400"/>
			</div>

			<div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
			  {filteredRequests.length === 0 ? (
				<div className="text-center py-12 text-slate-400 font-bold uppercase text-xs">No matching orders found.</div>
			  ) : filteredRequests.map(req => (
				<div key={req.id} onClick={() => setActiveRequest(req)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${activeRequest?.id === req.id ? `border-${isRadiology ? 'purple' : 'rose'}-500 bg-${isRadiology ? 'purple' : 'rose'}-50 dark:bg-${isRadiology ? 'purple' : 'rose'}-900/20` : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'}`}>
				  <div className="font-black text-sm text-slate-900 dark:text-white mb-1">{req.patient_name}</div>
				  <div className="flex justify-between items-center">
					<div className={`text-xs font-bold ${isRadiology ? 'text-purple-600' : 'text-rose-600'}`}>{req.test_name}</div>
					<div className="text-[10px] text-slate-400 font-bold">MRN: {req.ticket_id}</div>
				  </div>
				</div>
			  ))}
			</div>
		  </div>

		  {/* RESULTS ENTRY & EXPORT */}
		  <div className="lg:col-span-2">
			{!activeRequest ? (
			   <div className="h-full min-h-[500px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 bg-white/40 dark:bg-slate-900/40">
				 {isRadiology ? <Activity className="w-16 h-16 opacity-20 mb-4" /> : <Microscope className="w-16 h-16 opacity-20 mb-4" />}
				 <p className="font-bold uppercase tracking-widest text-sm">Select an order from the queue</p>
			   </div>
			) : (
			  <div className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 backdrop-blur-xl flex flex-col relative">
				
				{/* Export Button Top Right */}
				<button onClick={exportReport} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Export Blank/Current Report as Image">
					<Download className="w-6 h-6"/>
				</button>

				<div ref={reportRef} className="bg-white dark:bg-transparent rounded-xl p-2">
					<div className="mb-6 pb-6 border-b dark:border-slate-800">
						<h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Patient: {activeRequest.patient_name}</h2>
						<div className="flex gap-3">
							<span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${isRadiology ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700'}`}>
								Test: {activeRequest.test_name}
							</span>
							<span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-500">
								MRN: {activeRequest.ticket_id || 'N/A'}
							</span>
						</div>
					</div>

					<form onSubmit={handleCompleteTest} className="flex-1 flex flex-col space-y-6">
						<div className="flex-1">
						<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Clinical Observations & Results</label>
						<textarea 
							required={!uploadFile} value={resultNotes} onChange={e => setResultNotes(e.target.value)} 
							className="w-full min-h-[200px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm dark:text-white outline-none" 
							placeholder="Enter analytical results, diagnosis findings, or ranges..."
						></textarea>
						</div>

						<div>
						<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Attach Report / Imagery (Optional)</label>
						<label className={`flex items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploadFile ? `border-${isRadiology ? 'purple' : 'rose'}-500 bg-${isRadiology ? 'purple' : 'rose'}-50 dark:bg-${isRadiology ? 'purple' : 'rose'}-900/10` : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
							<input type="file" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
							<div className="flex items-center gap-3 text-sm font-bold text-slate-500">
							{uploadFile ? <><Check className={`w-5 h-5 text-${isRadiology ? 'purple' : 'rose'}-500`}/> {uploadFile.name}</> : <><UploadCloud className="w-5 h-5"/> Click to upload file</>}
							</div>
						</label>
						</div>

						<button type="submit" disabled={processing} className={`w-full text-white font-black py-4 rounded-xl active:scale-95 flex justify-center items-center gap-2 transition-all shadow-lg ${isRadiology ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'}`}>
							{processing ? 'Uploading & Finalizing...' : <><CheckCircle className="w-5 h-5"/> Finalize & Send to Patient File</>}
						</button>
					</form>
				</div>
			  </div>
			)}
		  </div>
		</div>
	  )}

	  {/* ARCHIVE UPLOAD TAB */}
	  {activeTab === 'archive' && (
		  <div className="max-w-2xl mx-auto bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4">
			  <div className="text-center mb-8">
				  <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-4"/>
				  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Historical Record Archive</h2>
				  <p className="text-sm text-slate-500 mt-2">Upload old X-Rays, lab results, or scans directly to a patient's master file without creating a new clinical ticket.</p>
			  </div>

			  <form onSubmit={handleUploadArchive} className="space-y-6">
				  <div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Target Patient UUID</label>
					  <input required type="text" value={archivePatientId} onChange={e => setArchivePatientId(e.target.value)} placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-mono text-sm dark:text-white outline-none focus:border-blue-500"/>
				  </div>
				  
				  <div>
					  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Select Historic File</label>
					  <label className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${archiveFile ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
						  <input required type="file" className="hidden" onChange={e => setArchiveFile(e.target.files[0])} />
						  {archiveFile ? (
							  <div className="text-blue-600 font-bold flex flex-col items-center gap-2"><CheckCircle className="w-8 h-8"/><span className="text-sm">{archiveFile.name}</span></div>
						  ) : (
							  <div className="text-slate-400 font-bold flex flex-col items-center gap-2"><Upload className="w-8 h-8"/><span className="text-sm">Click to browse files</span></div>
						  )}
					  </label>
				  </div>

				  <button type="submit" disabled={archiveUploading} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-xl active:scale-95 flex justify-center items-center gap-2">
					  {archiveUploading ? 'Archiving to Patient File...' : 'Upload to Master Record'}
				  </button>
			  </form>
		  </div>
	  )}

	</div>
  );
}