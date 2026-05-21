import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Calendar, Pill, FileText, Activity } from 'lucide-react';

export default function PatientPortal() {
  const [data, setData] = useState({ visits: [], rx: [], labs: [] });

  useEffect(() => {
	const fetchData = async () => {
	  const { data: { user } } = await supabase.auth.getUser();
	  if (!user) return;

	  const [visits, rx, labs] = await Promise.all([
		supabase.from('visits').select('*').eq('patient_id', user.id),
		supabase.from('prescriptions').select('*').eq('patient_id', user.id),
		supabase.from('lab_tests').select('*').eq('patient_id', user.id)
	  ]);
	  setData({ visits: visits.data, rx: rx.data, labs: labs.data });
	};
	fetchData();
  }, []);

  return (
	<div className="max-w-5xl mx-auto p-6 space-y-8">
	  <h1 className="text-3xl font-black">My Health Records</h1>
	  
	  {/* Quick Dashboard */}
	  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
		  <Calendar className="text-blue-600 mb-2"/>
		  <h3 className="font-bold">Appointments</h3>
		  <p className="text-2xl font-black">{data.visits.length}</p>
		</div>
		<div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
		  <Pill className="text-amber-600 mb-2"/>
		  <h3 className="font-bold">Active Rx</h3>
		  <p className="text-2xl font-black">{data.rx.length}</p>
		</div>
		<div className="p-6 bg-teal-50 rounded-2xl border border-teal-100">
		  <FileText className="text-teal-600 mb-2"/>
		  <h3 className="font-bold">Lab Results</h3>
		  <p className="text-2xl font-black">{data.labs.length}</p>
		</div>
	  </div>
	</div>
  );
}