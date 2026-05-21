import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Search, ClipboardList, Calendar, FileText, Activity, Heart, Thermometer, Download, Hash } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function PatientHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const chartRef = useRef(null);

  useEffect(() => {
	const fetchRecentHistory = async () => {
	  setLoading(true);
	  const { data } = await supabase
		.from('tickets')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(10);
	  if (data) setRecords(data);
	  setLoading(false);
	};
	fetchRecentHistory();
  }, []);

  const handleSearch = async (e) => {
	e.preventDefault();
	if (!searchTerm.trim()) return;
	setLoading(true);
	setSelectedChart(null);

	let query = supabase.from('tickets').select('*');

	if (!isNaN(searchTerm)) {
	  query = query.eq('id', parseInt(searchTerm));
	} else {
	  query = query.ilike('patient_name', `%${searchTerm}%`);
	}

	const { data } = await query.order('created_at', { ascending: false });
	if (data) setRecords(data);
	setLoading(false);
  };

  const downloadImage = async () => {
	if (!chartRef.current) return;
	try {
	  const dataUrl = await toPng(chartRef.current, { 
		backgroundColor: '#ffffff', 
		pixelRatio: 2 
	  });
	  const link = document.createElement('a');
	  link.href = dataUrl;
	  link.download = `OPERIX_Medical_Record_${selectedChart.id}.png`;
	  link.click();
	} catch (error) {
	  console.error('Failed to generate image:', error);
	  alert('Error generating the medical record image. Please try again.');
	}
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans overflow-hidden min-h-screen">
	  
	  {/* AMBIENT BACKGROUND GLOWS */}
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
	  <div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER SECTION */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Records</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
			Central Archives
		  </h1>
		  <p className="text-sm text-slate-500 font-medium mt-1">Cross-department patient records & electronic chart lookups.</p>
		</div>
		
		{/* PREMIUM SEARCH BAR */}
		<form onSubmit={handleSearch} className="flex bg-slate-200/50 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl w-full md:w-auto border border-slate-300/50 dark:border-slate-700/50 shadow-sm">
		  <input 
			required
			type="text" 
			value={searchTerm} 
			onChange={e => setSearchTerm(e.target.value)}
			className="flex-1 md:w-72 bg-transparent border-none outline-none px-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0" 
			placeholder="Search Name or MRN (e.g. 1)..."
		  />
		  <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2">
			<Search className="w-4 h-4"/> Query Ledger
		  </button>
		</form>
	  </div>

	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
		
		{/* LEFT COLUMN: HISTORY TIMELINE RESULTS */}
		<div className={`lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col ${selectedChart ? 'hidden lg:flex h-[750px]' : 'h-[650px]'}`}>
		  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
			<h3 className="font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
			  <ClipboardList className="w-4 h-4"/> Matching Ledgers
			</h3>
		  </div>
		  
		  <div className="overflow-y-auto p-3 space-y-2 custom-scrollbar flex-1">
			{loading ? (
			  <div className="p-8 text-center text-slate-400 animate-pulse text-xs font-bold uppercase tracking-widest">Scanning Archives...</div>
			) : records.length === 0 ? (
			  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium m-2">
				No historical chart indexes matching criteria.
			  </div>
			) : (
			  records.map(record => (
				<div 
				  key={record.id}
				  onClick={() => setSelectedChart(record)}
				  className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col gap-2 group ${selectedChart?.id === record.id ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700/50'} border`}
				>
				  <div className="flex justify-between items-start">
					<span className={`text-[9px] font-mono font-black px-2 py-1 rounded-md shrink-0 transition-colors ${selectedChart?.id === record.id ? 'bg-blue-200/50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
					  MRN: #{record.id}
					</span>
					<span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${record.status === 'discharged' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
					  {record.status.replace(/_/g, ' ')}
					</span>
				  </div>
				  <h4 className={`font-bold text-sm truncate transition-colors ${selectedChart?.id === record.id ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
					{record.patient_name}
				  </h4>
				  <div className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-widest">
					<Calendar className="w-3 h-3"/> {new Date(record.created_at).toLocaleDateString()}
				  </div>
				</div>
			  ))
			)}
		  </div>
		</div>

		{/* RIGHT COLUMN: INTERACTIVE COMPREHENSIVE CHART VIEW */}
		<div className={`lg:col-span-2 ${!selectedChart ? 'hidden lg:block' : ''}`}>
		  {selectedChart ? (
			<div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl overflow-hidden flex flex-col h-full min-h-[750px]">
			  
			  {/* TARGET FOR IMAGE EXPORT */}
			  <div ref={chartRef} className="p-6 md:p-8 space-y-8 bg-white dark:bg-slate-900 h-full">
				
				{/* Chart Header */}
				<div className="relative overflow-hidden border-b border-slate-100 dark:border-slate-800 pb-6">
				  <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
				  <div className="flex justify-between items-start relative z-10">
					<div>
					  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-md mb-2 inline-block">Electronic Health Record</span>
					  <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{selectedChart.patient_name}</h2>
					  <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest flex gap-3">
						<span>DOB: {selectedChart.date_of_birth || 'N/A'}</span>
						<span className="text-slate-300 dark:text-slate-700">|</span>
						<span>TEL: {selectedChart.patient_phone || 'N/A'}</span>
					  </p>
					</div>
					<div className="text-right border-l border-slate-200 dark:border-slate-800 pl-4">
					  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Logged</div>
					  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
						{new Date(selectedChart.created_at).toLocaleDateString()}<br/>
						{new Date(selectedChart.created_at).toLocaleTimeString()}
					  </div>
					</div>
				  </div>
				</div>

				{/* Triage Grid Segment */}
				<div className="space-y-4">
				  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
					<Activity className="w-4 h-4 text-blue-500"/> Admission Triage Parameters
				  </h4>
				  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Heart className="w-3 h-3 text-red-500"/> Blood Press.</div>
					  <div className="font-bold text-lg text-slate-900 dark:text-white font-mono">{selectedChart.blood_pressure || '---'} <span className="text-xs text-slate-400 font-sans">mmHg</span></div>
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Thermometer className="w-3 h-3 text-amber-500"/> Core Temp</div>
					  <div className="font-bold text-lg text-slate-900 dark:text-white font-mono">{selectedChart.temperature || '---'} <span className="text-xs text-slate-400 font-sans">°C</span></div>
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="w-3 h-3 text-blue-500"/> Heart Rate</div>
					  <div className="font-bold text-lg text-slate-900 dark:text-white font-mono">{selectedChart.heart_rate || '---'} <span className="text-xs text-slate-400 font-sans">BPM</span></div>
					</div>
					<div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/80 dark:border-slate-800/80">
					  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Hash className="w-3 h-3 text-emerald-500"/> Weight</div>
					  <div className="font-bold text-lg text-slate-900 dark:text-white font-mono">{selectedChart.weight_kg || '---'} <span className="text-xs text-slate-400 font-sans">KG</span></div>
					</div>
				  </div>
				  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
					<strong className="text-slate-900 dark:text-white">Triage Observation:</strong> <span className="italic">"{selectedChart.nurse_notes || 'No triage notes added.'}"</span>
				  </div>
				</div>

				{/* Assessment & Treatment Segment */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
				  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
					<h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
					  <FileText className="w-3.5 h-3.5"/> Physician Diagnosis
					</h4>
					<div className="font-black text-lg text-slate-900 dark:text-white">{selectedChart.diagnosis || 'Pending Diagnosis'}</div>
					<p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
					  <strong className="text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[9px] block mb-1">Symptoms Reported:</strong> 
					  {selectedChart.symptoms || 'None recorded.'}
					</p>
				  </div>

				  <div className="p-5 rounded-2xl bg-amber-50/30 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/20 shadow-sm space-y-3 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl"></div>
					<h4 className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest relative z-10">💊 Therapeutic Rx</h4>
					<p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed relative z-10">
					  {selectedChart.prescribed_meds || 'No medications prescribed.'}
					</p>
				  </div>
				</div>

				{selectedChart.pharmacy_notes && (
				  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 text-sm text-blue-900 dark:text-blue-200">
					<strong className="uppercase tracking-widest text-[10px] block mb-1">Pharmacy Dispensing Verification:</strong> 
					<span className="italic font-medium">"{selectedChart.pharmacy_notes}"</span>
				  </div>
				)}

				<div className="text-[10px] text-slate-400 text-center border-t border-slate-200 dark:border-slate-800 pt-6 font-black uppercase tracking-widest">
				  Attending Clinician: <span className="text-slate-900 dark:text-white">Dr. {selectedChart.doctor_name || 'Unassigned'}</span>
				</div>
			  </div>

			  {/* ACTION BAR */}
			  <div className="p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-end">
				<button 
				  onClick={downloadImage} 
				  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
				>
				  <Download className="w-4 h-4" /> Export Encrypted Record
				</button>
			  </div>
			</div>
		  ) : (
			<div className="hidden lg:flex h-[750px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl items-center justify-center p-12 text-center text-slate-400 backdrop-blur-sm">
			  <div className="space-y-3">
				<ClipboardList className="w-12 h-12 mx-auto opacity-20" />
				<p className="font-medium text-sm">Select a clinical index profile to <br/>decrypt and view secure timeline.</p>
			  </div>
			</div>
		  )}
		</div>

	  </div>
	</div>
  );
}