import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Search, ClipboardList, Calendar, FileText, Activity, Heart, Thermometer, Download } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function PatientHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedChart, setSelectedChart] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Ref for capturing the chart as an image
  const chartRef = useRef(null);

  // Automatically fetch the most recent global clinical archives on mount
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

  // Handle cross-reference search by unique ticket number or string name
  const handleSearch = async (e) => {
	e.preventDefault();
	if (!searchTerm.trim()) return;
	setLoading(true);
	setSelectedChart(null);

	let query = supabase.from('tickets').select('*');

	// If search term is a number, search by exact Ticket ID. Otherwise, match name.
	if (!isNaN(searchTerm)) {
	  query = query.eq('id', parseInt(searchTerm));
	} else {
	  query = query.ilike('patient_name', `%${searchTerm}%`);
	}

	const { data } = await query.order('created_at', { ascending: false });
	if (data) setRecords(data);
	setLoading(false);
  };

  // Image Export Function
  const downloadImage = async () => {
	if (!chartRef.current) return;
	
	try {
	  // Temporarily grab the DOM element and render it to a high-res PNG
	  const dataUrl = await toPng(chartRef.current, { 
		backgroundColor: '#ffffff', // Forces a clean white background for the export
		pixelRatio: 2 // High resolution scale for clear printing
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
	<div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
	  
	  {/* HEADER */}
	  <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4">
		<h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
		  <ClipboardList className="w-7 h-7 text-blue-600" /> Central Medical Archives
		</h1>
		<p className="text-sm text-slate-500 font-medium mt-1">Cross-department patient records & electronic chart lookups.</p>
	  </div>

	  {/* SEARCH ENGAGEMENT GATE */}
	  <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
		<input 
		  required
		  type="text" 
		  value={searchTerm} 
		  onChange={e => setSearchTerm(e.target.value)}
		  className="flex-1 border dark:border-slate-800 p-3 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
		  placeholder="Input Patient Name or Unique Ticket Number (e.g. 1)..."
		/>
		<button type="submit" className="bg-slate-900 dark:bg-slate-800 hover:bg-black text-white px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition">
		  <Search className="w-4 h-4"/> Query Ledger
		</button>
	  </form>

	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
		
		{/* LEFT COLUMN: HISTORY TIMELINE RESULTS */}
		<div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-2">
		  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Matching Records Ledger</h3>
		  
		  {loading ? (
			<div className="text-center p-8 text-slate-400 flex justify-center"><div className="loader border-t-blue-600"></div></div>
		  ) : records.length === 0 ? (
			<div className="bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-sm text-slate-400">
			  No historical chart indexes matching criteria.
			</div>
		  ) : (
			records.map(record => (
			  <div 
				key={record.id}
				onClick={() => setSelectedChart(record)}
				className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${selectedChart?.id === record.id ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-md' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 shadow-sm'}`}
			  >
				<div className="flex justify-between items-start mb-1">
				  <span className="font-mono font-black text-xs text-slate-500">MRN: #{record.id}</span>
				  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${record.status === 'discharged' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
					{record.status.replace(/_/g, ' ')}
				  </span>
				</div>
				<h4 className="font-black text-slate-900 dark:text-white text-base truncate">{record.patient_name}</h4>
				<div className="text-xs font-semibold text-slate-500 flex items-center gap-1 mt-1">
				  <Calendar className="w-3.5 h-3.5"/> {new Date(record.created_at).toLocaleDateString()}
				</div>
			  </div>
			))
		  )}
		</div>

		{/* RIGHT COLUMN: INTERACTIVE COMPREHENSIVE CHART VIEW */}
		<div className="lg:col-span-2 space-y-4">
		  {selectedChart ? (
			<>
			  {/* TARGET FOR IMAGE EXPORT: chartRef is attached here */}
			  <div ref={chartRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden p-6 space-y-6 relative text-slate-900 dark:text-white">
				
				{/* Chart Header Info */}
				<div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
				  <div>
					<span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Electronic Health Record</span>
					<h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{selectedChart.patient_name}</h2>
					<p className="text-xs text-slate-500 font-medium mt-0.5">D.O.B: {selectedChart.date_of_birth || 'N/A'} | Contact: {selectedChart.patient_phone || 'N/A'}</p>
				  </div>
				  <div className="text-right text-xs font-mono text-slate-500">
					Logged: <br/>{new Date(selectedChart.created_at).toLocaleString()}
				  </div>
				</div>

				{/* Triage Grid Segment */}
				<div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
				  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-blue-500"/> Admission Triage Parameters</h4>
				  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
					<div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800"><div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 flex items-center gap-1"><Heart className="w-3 h-3 text-red-500"/> BP</div><span className="font-bold">{selectedChart.blood_pressure || 'N/A'}</span> <span className="text-xs text-slate-400">mmHg</span></div>
					<div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800"><div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 flex items-center gap-1"><Thermometer className="w-3 h-3 text-amber-500"/> TEMP</div><span className="font-bold">{selectedChart.temperature || 'N/A'}</span> <span className="text-xs text-slate-400">°C</span></div>
					<div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800"><div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">HEART RATE</div><span className="font-bold">{selectedChart.heart_rate || 'N/A'}</span> <span className="text-xs text-slate-400">BPM</span></div>
					<div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800"><div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">WEIGHT</div><span className="font-bold">{selectedChart.weight_kg || 'N/A'}</span> <span className="text-xs text-slate-400">KG</span></div>
				  </div>
				  <div className="text-xs text-slate-600 dark:text-slate-400 pt-1">
					<strong>Triage Observation Notes:</strong> <span className="italic">"{selectedChart.nurse_notes || 'No notes added.'}"</span>
				  </div>
				</div>

				{/* Assessment & Treatment Segment */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				  <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2 bg-white dark:bg-slate-900">
					<h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-emerald-600"/> Physician Diagnosis</h4>
					<div className="font-bold text-base">{selectedChart.diagnosis || 'Diagnosis missing/pending.'}</div>
					<p className="text-xs text-slate-500 leading-relaxed pt-1"><strong>Symptoms Reported:</strong> {selectedChart.symptoms || 'None recorded.'}</p>
				  </div>

				  <div className="border border-amber-200 dark:border-amber-900/40 p-4 rounded-xl space-y-2 bg-amber-50/20 dark:bg-amber-950/10">
					<h4 className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1">💊 Therapeutic Treatment / Rx</h4>
					<p className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
					  {selectedChart.prescribed_meds || 'No medications prescribed during this encounter.'}
					</p>
				  </div>
				</div>

				{/* Pharmacy Discharged Segment */}
				{selectedChart.pharmacy_notes && (
				  <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400">
					<strong>Pharmacy Dispensing Verification:</strong> <span className="italic">"{selectedChart.pharmacy_notes}"</span>
				  </div>
				)}

				<div className="text-xs text-slate-400 text-center border-t border-slate-200 dark:border-slate-800 pt-4 font-medium uppercase tracking-widest">
				  Assigned Attending Clinician: Dr. {selectedChart.doctor_name || 'Unassigned'}
				</div>
			  </div>

			  {/* ACTION BAR: DOWNLOAD BUTTON */}
			  <div className="flex justify-end">
				<button 
				  onClick={downloadImage} 
				  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition"
				>
				  <Download className="w-4 h-4" /> Export Medical Record
				</button>
			  </div>
			</>
		  ) : (
			<div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-16 text-center text-slate-400">
			  Select a clinical index profile from the left directory menu to view complete timeline charting records.
			</div>
		  )}
		</div>

	  </div>
	</div>
  );
}