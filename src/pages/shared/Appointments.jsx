// src/pages/shared/Appointments.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function Appointments() {
  const { user, role } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [newAppt, setNewAppt] = useState({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });
  const [booking, setBooking] = useState(false);

  const fetchData = async () => {
	setLoading(true);
	
	// 1. Fetch Users for the Booking Form (Only needed for Admins/Receptionists)
	if (['admin', 'receptionist'].includes(role)) {
	  const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role');
	  if (profiles) {
		setPatients(profiles.filter(p => p.role === 'patient'));
		setDoctors(profiles.filter(p => p.role === 'doctor'));
	  }
	}

	// 2. Fetch Appointments based on Role
	let query = supabase.from('appointments').select(`
	  id, appointment_date, time_slot, status, reason,
	  patient:profiles!appointments_patient_id_fkey(full_name),
	  doctor:profiles!appointments_doctor_id_fkey(full_name)
	`).order('appointment_date', { ascending: true }).order('time_slot', { ascending: true });

	// Doctors only see their own schedule
	if (role === 'doctor') {
	  query = query.eq('doctor_id', user.id);
	}

	const { data } = await query;
	if (data) setAppointments(data);
	
	setLoading(false);
  };

  useEffect(() => { fetchData(); }, [role, user.id]);

  const handleBookAppointment = async (e) => {
	e.preventDefault();
	setBooking(true);
	try {
	  const { error } = await supabase.from('appointments').insert({
		patient_id: newAppt.patient_id,
		doctor_id: newAppt.doctor_id,
		appointment_date: newAppt.date,
		time_slot: newAppt.time,
		reason: newAppt.reason
	  });

	  if (error) throw error;
	  
	  setNewAppt({ patient_id: '', doctor_id: '', date: '', time: '', reason: '' });
	  fetchData();
	  alert("Appointment successfully scheduled!");
	} catch (error) {
	  alert("Error booking appointment: " + error.message);
	} finally {
	  setBooking(false);
	}
  };

  const updateStatus = async (id, newStatus) => {
	await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
	fetchData();
  };

  return (
	<div className="max-w-6xl mx-auto space-y-6">
	  <div className="border-b-2 border-slate-200 pb-4">
		<h1 className="text-2xl font-black text-slate-800">Scheduling & Appointments</h1>
		<p className="text-sm text-slate-500 font-medium mt-1">Manage future clinic visits and provider calendars.</p>
	  </div>

	  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
		
		{/* Booking Panel (Visible to Front Desk & Admins) */}
		{['admin', 'receptionist'].includes(role) && (
		  <div className="col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
			<h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
			  <Calendar className="w-5 h-5 text-blue-600" />
			  Book New Slot
			</h2>
			<form onSubmit={handleBookAppointment} className="space-y-4">
			  <div>
				<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient</label>
				<select required value={newAppt.patient_id} onChange={e => setNewAppt({...newAppt, patient_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none">
				  <option value="">Select Patient...</option>
				  {patients.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
				</select>
			  </div>
			  <div>
				<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provider</label>
				<select required value={newAppt.doctor_id} onChange={e => setNewAppt({...newAppt, doctor_id: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none">
				  <option value="">Select Doctor...</option>
				  {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.full_name || d.email}</option>)}
				</select>
			  </div>
			  <div className="grid grid-cols-2 gap-4">
				<div>
				  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
				  <input required type="date" value={newAppt.date} onChange={e => setNewAppt({...newAppt, date: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" />
				</div>
				<div>
				  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time</label>
				  <input required type="time" value={newAppt.time} onChange={e => setNewAppt({...newAppt, time: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" />
				</div>
			  </div>
			  <div>
				<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for Visit</label>
				<textarea required value={newAppt.reason} onChange={e => setNewAppt({...newAppt, reason: e.target.value})} rows="2" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" placeholder="Routine checkup..."></textarea>
			  </div>
			  <button type="submit" disabled={booking} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg p-3 text-sm transition shadow-sm">
				{booking ? 'Scheduling...' : 'Confirm Booking'}
			  </button>
			</form>
		  </div>
		)}

		{/* Master Schedule List */}
		<div className={`col-span-1 ${['admin', 'receptionist'].includes(role) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
		  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
			<div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
			  <h3 className="font-bold text-slate-700">Upcoming Schedule</h3>
			</div>
			
			{loading ? (
			  <div className="p-10 text-center text-slate-500">Loading schedule...</div>
			) : appointments.length === 0 ? (
			  <div className="p-10 text-center text-slate-500 font-medium">No appointments scheduled.</div>
			) : (
			  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
				{appointments.map(appt => (
				  <div key={appt.id} className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-4 group">
					
					<div className="flex items-start gap-4">
					  <div className="bg-blue-50 text-blue-600 p-3 rounded-lg text-center min-w-[80px] border border-blue-100">
						<div className="text-xs font-bold uppercase">{new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
						<div className="text-sm font-black mt-0.5">{appt.time_slot}</div>
					  </div>
					  
					  <div>
						<h4 className="font-bold text-slate-800 text-lg">{appt.patient?.full_name}</h4>
						<div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
						  <span className="flex items-center gap-1"><User className="w-3 h-3"/> Dr. {appt.doctor?.full_name}</span>
						  <span className="flex items-center gap-1"><FileText className="w-3 h-3"/> {appt.reason}</span>
						</div>
					  </div>
					</div>

					<div className="flex items-center gap-3 justify-end md:opacity-0 group-hover:opacity-100 transition">
					  <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${appt.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
						{appt.status}
					  </span>
					  {appt.status === 'scheduled' && (
						<>
						  <button onClick={() => updateStatus(appt.id, 'completed')} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition" title="Mark Completed"><CheckCircle className="w-5 h-5" /></button>
						  <button onClick={() => updateStatus(appt.id, 'cancelled')} className="text-red-600 hover:bg-red-50 p-1.5 rounded transition" title="Cancel Appointment"><XCircle className="w-5 h-5" /></button>
						</>
					  )}
					</div>
					
				  </div>
				))}
			  </div>
			)}
		  </div>
		</div>

	  </div>
	</div>
  );
}