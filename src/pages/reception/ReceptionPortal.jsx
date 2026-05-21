import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Ticket, UserPlus, Image as ImageIcon, CheckCircle, Hospital } from 'lucide-react';
import { toPng } from 'html-to-image';

export default function ReceptionPortal() {
  const [staffMembers, setStaffMembers] = useState([]);
  const [formData, setFormData] = useState({ name: '', phone: '', dob: '', staffId: '', fee: '50.00' });
  const [latestTicket, setLatestTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // This ref grabs the receipt box to convert to an image
  const receiptRef = useRef(null);

  useEffect(() => {
	const fetchStaff = async () => {
	  const { data } = await supabase.from('profiles').select('id, full_name, role').in('role', ['doctor', 'nurse', 'admin']);
	  if (data) setStaffMembers(data);
	};
	fetchStaff();
  }, []);

  const handleCheckIn = async (e) => {
	e.preventDefault();
	setLoading(true);
	const selectedStaff = staffMembers.find(s => s.id === formData.staffId);

	const { data, error } = await supabase
	  .from('tickets')
	  .insert([{
		patient_name: formData.name,
		patient_phone: formData.phone,
		date_of_birth: formData.dob,
		assigned_doctor_id: formData.staffId || null,
		doctor_name: selectedStaff ? `${selectedStaff.full_name}` : 'Unassigned',
		consultation_fee: parseFloat(formData.fee),
		status: 'waiting_for_vitals',
		payment_status: 'paid'
	  }])
	  .select().single();

	if (!error && data) {
	  setLatestTicket(data);
	  setFormData({ name: '', phone: '', dob: '', staffId: '', fee: '50.00' });
	}
	setLoading(false);
  };

// NEW FUNCTION: Uses modern html-to-image to bypass Safari & Tailwind bugs
	const downloadImage = async () => {
	  if (!receiptRef.current) return;
	  
	  try {
		// toPng uses the browser's native engine, making it much safer
		const dataUrl = await toPng(receiptRef.current, { 
		  backgroundColor: '#ffffff',
		  pixelRatio: 2 // High resolution scale
		});
		
		const link = document.createElement('a');
		link.href = dataUrl;
		link.download = `OPERIX_Ticket_${latestTicket.id}.png`;
		link.click();
	  } catch (error) {
		console.error('Failed to generate image:', error);
		alert('Error generating the image. Please try again.');
	  }
	};

  return (
	<div className="max-w-5xl mx-auto space-y-6 p-4">
	  <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4">
		<h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
		  <Ticket className="w-7 h-7 text-blue-600" /> Intake & Registration
		</h1>
	  </div>

	  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
		
		{/* INTAKE FORM */}
		<form onSubmit={handleCheckIn} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
		  <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><UserPlus className="w-5 h-5"/> New Encounter</h2>
		  
		  <div>
			<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Full Name</label>
			<input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
		  </div>

		  <div className="grid grid-cols-2 gap-2">
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
			  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">D.O.B</label>
			  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"/>
			</div>
		  </div>

		  <div>
			<label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Provider</label>
			<select required value={formData.staffId} onChange={e => setFormData({...formData, staffId: e.target.value})} className="w-full border dark:border-slate-800 p-2.5 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
			  <option value="">Select Provider...</option>
			  {staffMembers.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
			</select>
		  </div>

		  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition">
			{loading ? 'Processing...' : 'Authorize Ticket & Generate Paperwork'}
		  </button>
		</form>

		{/* IMAGE GENERATION TARGET */}
		<div>
		  {latestTicket ? (
			<>
			  {/* This is the box html2canvas will take a picture of */}
			  <div ref={receiptRef} className="bg-white p-8 border-2 border-slate-300 relative text-black font-serif w-full max-w-md mx-auto">
				<div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
				  <div>
					<div className="flex items-center gap-2 text-xl font-black uppercase tracking-tighter mb-1">
					  <Hospital className="w-6 h-6"/> OPERIX MEDICAL
					</div>
					<div className="text-[10px] font-bold tracking-widest uppercase text-slate-600">Official Encounter Record</div>
					<div className="text-[10px] mt-1">{new Date().toLocaleString()}</div>
				  </div>
				  <div className="text-right">
					<div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Encounter ID</div>
					<div className="text-3xl font-black font-mono tracking-widest border-4 border-black px-3 py-1 bg-slate-100">
					  #{latestTicket.id}
					</div>
				  </div>
				</div>

				<div className="grid grid-cols-2 gap-4 mb-6 border border-black p-4 bg-slate-50">
				  <div>
					<div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Patient Name</div>
					<div className="font-bold text-sm">{latestTicket.patient_name}</div>
				  </div>
				  <div>
					<div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Date of Birth</div>
					<div className="font-bold text-sm">{latestTicket.date_of_birth || 'N/A'}</div>
				  </div>
				  <div>
					<div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Contact Details</div>
					<div className="font-bold text-sm">{latestTicket.patient_phone || 'N/A'}</div>
				  </div>
				  <div>
					<div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Assigned Physician</div>
					<div className="font-bold uppercase text-sm">Dr. {latestTicket.doctor_name}</div>
				  </div>
				</div>

				<div className="flex justify-between items-end border-b-2 border-dashed border-slate-400 pb-4">
				  <div>
					<div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Required Action Route</div>
					<div className="font-black text-sm uppercase tracking-wider">➔ Proceed to Triage</div>
				  </div>
				  <div className="text-right">
					<div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Consultation Fee</div>
					<div className="font-bold text-lg">${latestTicket.consultation_fee.toFixed(2)}</div>
					<div className="text-[10px] font-bold flex items-center justify-end gap-1 mt-1 uppercase tracking-widest border border-black px-2 py-0.5 bg-black text-white">
					  <CheckCircle className="w-3 h-3"/> PAID IN FULL
					</div>
				  </div>
				</div>
			  </div>

			  {/* Download Button */}
			  <button onClick={downloadImage} className="w-full max-w-md mx-auto mt-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-sm font-black uppercase tracking-widest transition shadow-lg">
				<ImageIcon className="w-5 h-5"/> Download Image Ticket
			  </button>
			</>
		  ) : (
			<div className="h-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl flex items-center justify-center p-8 text-center text-slate-400">
			  Generate an intake form to create the image ticket.
			</div>
		  )}
		</div>
	  </div>
	</div>
  );
}