// src/pages/patient/PatientPortal.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export default function PatientPortal() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
	const fetchPatientData = async () => {
	  setLoading(true);
	  
	  const { data: medicalRecords } = await supabase
		.from('medical_records')
		.select(`
		  id, diagnosis, treatment_plan, created_at,
		  profiles!medical_records_doctor_id_fkey ( full_name )
		`)
		.eq('patient_id', user.id)
		.order('created_at', { ascending: false });

	  if (medicalRecords) setRecords(medicalRecords);

	  const { data: rxData } = await supabase
		.from('prescriptions')
		.select('*')
		.eq('patient_id', user.id)
		.order('created_at', { ascending: false });

	  if (rxData) setPrescriptions(rxData);
	  
	  setLoading(false);
	};

	fetchPatientData();
  }, [user.id]);

  return (
	<div className="max-w-5xl mx-auto space-y-8">
	  <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-md">
		<h1 className="text-3xl font-black tracking-tight mb-2">My Health Dashboard</h1>
		<p className="text-blue-100 font-medium max-w-xl">
		  Welcome to OPERIX Care. View your clinical encounters, track your active prescriptions, and manage your health journey securely.
		</p>
	  </div>

	  {loading ? (
		<div className="flex justify-center p-20"><div className="loader"></div></div>
	  ) : (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
		  
		  {/* Active Prescriptions Column */}
		  <div className="space-y-4">
			<h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
			  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
			  My Prescriptions
			</h2>
			
			{prescriptions.length === 0 ? (
			  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">No prescriptions found.</div>
			) : (
			  prescriptions.map(rx => (
				<div key={rx.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
				  <div className={`absolute top-0 left-0 w-1 h-full ${rx.status === 'dispensed' ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
				  <div className="flex justify-between items-start mb-2 pl-2">
					<div>
					  <h3 className="font-bold text-slate-800 text-lg">{rx.medication_name}</h3>
					  <p className="text-blue-600 font-medium text-sm">{rx.dosage}</p>
					</div>
					<span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${rx.status === 'dispensed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
					  {rx.status}
					</span>
				  </div>
				  <div className="bg-slate-50 p-3 rounded mt-3 ml-2 border border-slate-100">
					<p className="text-xs font-bold text-slate-500 uppercase mb-1">Instructions</p>
					<p className="text-sm text-slate-700">{rx.instructions}</p>
				  </div>
				  <p className="text-xs text-slate-400 mt-3 ml-2">Prescribed on: {new Date(rx.created_at).toLocaleDateString()}</p>
				</div>
			  ))
			)}
		  </div>

		  {/* Clinical Encounters Column */}
		  <div className="space-y-4">
			<h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
			  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
			  Clinical Encounters
			</h2>
			
			{records.length === 0 ? (
			  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">No clinical records found.</div>
			) : (
			  records.map(record => (
				<div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
				  <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
					<span className="text-xs font-bold text-slate-500 uppercase">{new Date(record.created_at).toLocaleDateString()}</span>
					<span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">Provider: {record.profiles?.full_name || 'Unknown'}</span>
				  </div>
				  <h3 className="font-bold text-slate-800 mb-1">Diagnosis: {record.diagnosis}</h3>
				  <p className="text-sm text-slate-600">{record.treatment_plan}</p>
				</div>
			  ))
			)}
		  </div>

		</div>
	  )}
	</div>
  );
}