import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { 
  Activity, Scissors, CheckCircle, PlusCircle, AlertCircle, 
  RefreshCw, User, Droplet, FileText, ShieldAlert, HeartPulse, ChevronRight,
  Mic, MicOff
} from 'lucide-react';

// 1. IMPORT THE LANGUAGE HOOK
import { useLanguage } from '../../contexts/LanguageContext';

export default function OperationsBoard() {
  // 2. INITIALIZE TRANSLATION FUNCTION
  const { t } = useLanguage();

  const [operations, setOperations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [surgeons, setSurgeons] = useState([]);
  const [bloodBank, setBloodBank] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({ patient_id: '', surgeon_id: '', operation_name: '', blood_units_required: 0, notes: '' });
  const [isListening, setIsListening] = useState(false);

  const showMessage = (type, text) => {
	setMessage({ type, text });
	setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchData = async () => {
	setLoading(true);
	const { data: pFiles } = await supabase.from('patient_files').select('id, full_name, blood_group');
	if (pFiles) setPatients(pFiles);

	const { data: profiles } = await supabase.from('profiles').select('id, full_name, role');
	if (profiles) setSurgeons(profiles.filter(p => p.role === 'doctor' || p.role === 'admin'));

	const { data: ops } = await supabase.from('operations').select('*').order('created_at', { ascending: true });
	if (ops) setOperations(ops);

	const { data: bank } = await supabase.from('blood_bank').select('*');
	if (bank) {
		const inventory = {};
		bank.forEach(b => inventory[b.blood_group] = b.units_available);
		setBloodBank(inventory);
	}
	setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // VOICE DICTATION FOR SURGICAL NOTES
  const toggleVoiceDictation = () => {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) {
	  showMessage('error', t('Voice recognition is not supported in your browser. Please use Chrome or Edge.'));
	  return;
	}

	if (isListening) {
	  setIsListening(false);
	  return;
	}

	const recognition = new SpeechRecognition();
	recognition.lang = 'en-US';
	recognition.interimResults = false;
	
	recognition.onstart = () => setIsListening(true);
	recognition.onresult = (event) => {
	  const transcript = event.results[0][0].transcript;
	  setFormData(prev => ({ ...prev, notes: prev.notes ? `${prev.notes} ${transcript}` : transcript }));
	};
	recognition.onerror = (event) => {
	  showMessage('error', `${t('Voice dictation error:')} ${event.error}`);
	  setIsListening(false);
	};
	recognition.onend = () => setIsListening(false);

	recognition.start();
  };

  const handleScheduleSurgery = async (e) => {
	e.preventDefault();
	
	const patient = patients.find(p => p.id === formData.patient_id);
	const requiredUnits = parseInt(formData.blood_units_required);
	
	// STRICT BLOOD BANK VERIFICATION
	if (requiredUnits > 0) {
		if (!patient.blood_group) {
			showMessage('error', t('Patient has no blood group registered. Cannot verify inventory.'));
			return;
		}
		const available = bloodBank[patient.blood_group] || 0;
		if (available < requiredUnits) {
			showMessage('error', `${t('INSUFFICIENT BLOOD: Patient is')} ${patient.blood_group}. ${t('Need')} ${requiredUnits} ${t('units, but Bank only has')} ${available}. ${t('Request units first.')}`);
			return;
		}
	}

	setLoading(true);
	const { error } = await supabase.from('operations').insert([{
	  patient_id: formData.patient_id, surgeon_id: formData.surgeon_id, operation_name: formData.operation_name, 
	  blood_units_required: requiredUnits, notes: formData.notes, status: 'scheduled'
	}]);
	
	if (error) showMessage('error', error.message);
	else {
	  showMessage('success', t("Surgery successfully scheduled."));
	  setFormData({ patient_id: '', surgeon_id: '', operation_name: '', blood_units_required: 0, notes: '' });
	  fetchData();
	}
	setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
	await supabase.from('operations').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  const getName = (id) => {
	const person = [...patients, ...surgeons].find(p => p.id === id);
	return person ? person.full_name : t('Unknown Record');
  };

  return (
	<div className="relative max-w-7xl mx-auto space-y-8 p-4 md:p-8 font-sans min-h-screen overflow-hidden">
	  <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>

	  {/* HEADER & BLOOD BANK TICKER */}
	  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-800/60">
		<div>
		  <div className="flex items-center gap-2 mb-1">
			<div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
			<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('Operating Room')}</span>
		  </div>
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t('Surgical Board')}</h1>
		</div>
		
		<div className="flex gap-2 flex-wrap">
			{Object.entries(bloodBank).map(([type, units]) => (
				<div key={type} className={`px-3 py-1.5 rounded-lg border text-xs font-black flex items-center gap-1 ${units === 0 ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-800'}`}>
					<Droplet className="w-3 h-3"/> {type}: {units}
				</div>
			))}
		</div>
	  </div>

	  {message.text && (
		<div className={`relative z-10 p-4 rounded-xl text-xs font-bold flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
		  {message.type === 'error' ? <ShieldAlert className="w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>} {message.text}
		</div>
	  )}

	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
		
		{/* SCHEDULING FORM */}
		<div className="lg:col-span-1 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 lg:p-8 h-fit">
		  <h2 className="text-lg font-black flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6"><PlusCircle className="w-5 h-5 text-red-600"/> {t('Book Procedure')}</h2>
		  <form onSubmit={handleScheduleSurgery} className="space-y-5">
			<select required value={formData.patient_id} onChange={e => setFormData({...formData, patient_id: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm dark:text-white">
			  <option value="">{t('Choose Patient...')}</option>
			  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name} ({p.blood_group || t('No Blood Data')})</option>)}
			</select>
			
			<select required value={formData.surgeon_id} onChange={e => setFormData({...formData, surgeon_id: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm dark:text-white">
			  <option value="">{t('Choose Surgeon...')}</option>
			  {surgeons.map(s => <option key={s.id} value={s.id}>{t('Dr.')} {s.full_name}</option>)}
			</select>
			
			<input required type="text" value={formData.operation_name} onChange={e => setFormData({...formData, operation_name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm dark:text-white outline-none" placeholder={t('Operation Name')}/>
			
			<div>
			  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2"><Droplet className="w-3 h-3 inline text-red-500"/> {t('Blood Units Required')}</label>
			  <input required type="number" min="0" value={formData.blood_units_required} onChange={e => setFormData({...formData, blood_units_required: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm dark:text-white outline-none"/>
			</div>

			{/* NEW: SURGICAL NOTES WITH VOICE DICTATION */}
			<div className="pt-2 border-t border-slate-100 dark:border-slate-800">
			  <div className="flex justify-between items-end mb-2">
				<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Surgical Notes')}</label>
				<button type="button" onClick={toggleVoiceDictation} className={`px-4 py-2 rounded-xl border-2 text-xs font-black flex items-center gap-2 transition-all shadow-sm active:scale-95 ${isListening ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-500/10 animate-pulse' : 'border-red-200 dark:border-red-800/50 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
				  {isListening ? <><MicOff className="w-4 h-4"/> {t('Recording...')}</> : <><Mic className="w-4 h-4"/> {t('Dictate')}</>}
				</button>
			  </div>
			  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm dark:text-white outline-none focus:border-red-500 min-h-[100px]" placeholder={t("Add surgical notes or special requirements...")}></textarea>
			</div>

			<button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 flex justify-center items-center gap-2 transition-all mt-4">
			  <Scissors className="w-4 h-4"/> {t('Verify Blood & Schedule')}
			</button>
		  </form>
		</div>

		{/* LIVE TRACKING BOARD */}
		<div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl p-6 lg:p-8 min-h-[600px] flex flex-col">
			{operations.filter(op => op.status !== 'completed').length === 0 ? (
			  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 bg-white/40 dark:bg-slate-900/40">
				<HeartPulse className="w-16 h-16 opacity-20 mb-4" />
				<p className="font-bold uppercase tracking-widest text-sm">{t('No active operations.')}</p>
			  </div>
			) : (
			  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
				
				{/* SCHEDULED */}
				<div className="space-y-4">
				  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl text-center font-black text-slate-500 text-[10px] uppercase tracking-widest">{t('Pre-Op / Scheduled')}</div>
				  {operations.filter(op => op.status === 'scheduled').map(op => (
					<div key={op.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 border-l-4 border-l-amber-500 shadow-sm">
					  <h3 className="font-black text-lg flex items-center gap-2 dark:text-white"><User className="w-4 h-4 text-slate-400"/> {getName(op.patient_id)}</h3>
					  <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2 mb-1">{op.operation_name}</div>
					  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('Surgeon: Dr.')} {getName(op.surgeon_id)}</div>
					  {op.blood_units_required > 0 && (
						<div className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-900/30 px-2.5 py-1.5 rounded-lg mb-4 flex items-center gap-1.5 border border-red-100 dark:border-red-900/50"><Droplet className="w-3 h-3"/> {t('REQUIRES')} {op.blood_units_required} {t('UNITS')}</div>
					  )}
					  {op.notes && (
						<div className="text-xs text-slate-500 italic mb-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{op.notes}</div>
					  )}
					  <button onClick={() => updateStatus(op.id, 'in_progress')} className="w-full bg-slate-50 dark:bg-slate-800 dark:text-white hover:text-red-600 hover:border-red-200 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border dark:border-slate-700 transition-colors">
						{t('Commence Surgery')} <ChevronRight className="w-3 h-3"/>
					  </button>
					</div>
				  ))}
				</div>

				{/* IN PROGRESS */}
				<div className="space-y-4">
				  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-center font-black text-red-600 text-[10px] uppercase tracking-widest border border-red-200 dark:border-red-900/50 flex justify-center items-center gap-2">
					<span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> {t('In Surgery')}
				  </div>
				  
				  {operations.filter(op => op.status === 'in_progress').map(op => (
					<div key={op.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-sm border-l-4 border-l-red-600">
					  <h3 className="font-black text-lg flex items-center gap-2 dark:text-white"><User className="w-4 h-4 text-red-400"/> {getName(op.patient_id)}</h3>
					  <div className="text-sm font-bold text-red-600 mt-2 mb-1">{op.operation_name}</div>
					  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t('Surgeon: Dr.')} {getName(op.surgeon_id)}</div>
					  {op.notes && (
						<div className="text-xs text-slate-500 italic mb-4 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">{op.notes}</div>
					  )}
					  <button onClick={() => updateStatus(op.id, 'completed')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-2 active:scale-95 shadow-md shadow-emerald-500/20 transition-all">
						<CheckCircle className="w-4 h-4"/> {t('Sign Off / Completed')}
					  </button>
					</div>
				  ))}
				</div>
			  </div>
			)}
		  </div>
		</div>
	  </div>
	
  );
}