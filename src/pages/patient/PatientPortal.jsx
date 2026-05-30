import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Calendar, Pill, FileText, Activity } from 'lucide-react';

// 1. IMPORT THE LANGUAGE HOOK
import { useLanguage } from '../../contexts/LanguageContext';

export default function PatientPortal() {
  // 2. INITIALIZE TRANSLATION FUNCTION
  const { t } = useLanguage();
  
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
	  <h1 className="text-3xl font-black">{t('My Health Records')}</h1>
	  
	  {/* Quick Dashboard */}
	  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
		  <Calendar className="text-blue-600 dark:text-blue-400 mb-2"/>
		  <h3 className="font-bold dark:text-white">{t('Appointments')}</h3>
		  <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{data.visits.length}</p>
		</div>
		<div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/50">
		  <Pill className="text-amber-600 dark:text-amber-400 mb-2"/>
		  <h3 className="font-bold dark:text-white">{t('Active Rx')}</h3>
		  <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{data.rx.length}</p>
		</div>
		<div className="p-6 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800/50">
		  <FileText className="text-teal-600 dark:text-teal-400 mb-2"/>
		  <h3 className="font-bold dark:text-white">{t('Lab Results')}</h3>
		  <p className="text-2xl font-black text-teal-700 dark:text-teal-300">{data.labs.length}</p>
		</div>
	  </div>
	</div>
  );
}