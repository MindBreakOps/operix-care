import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { Lock, Mail, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import logo from '../../assets/logo.jpg';

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSuperLogin = async (e) => {
	e.preventDefault();
	setLoading(true);
	setErrorMsg('');

	try {
	  // 1. Authenticate with Supabase
	  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
	  
	  if (authError) throw authError;

	  // 2. IMMEDIATELY verify if this user is a super_admin
	  const { data: profile, error: profileError } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', authData.user.id)
		.single();

	  if (profileError || !profile) throw new Error("Could not verify administrative clearance.");

	  if (profile.role !== 'super_admin') {
		// Kick them out immediately if they are just a regular admin or doctor
		await supabase.auth.signOut();
		throw new Error("ACCESS DENIED: Required 'super_admin' clearance not found.");
	  }

	  // 3. Success! Route directly to the SaaS Control Plane
	  navigate('/superadmin');

	} catch (error) {
	  setErrorMsg(error.message);
	} finally {
	  setLoading(false);
	}
  };

  return (
	<div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-sans">
	  
	  {/* Intense Red/Blue Ambient Glow for SaaS Control Plane */}
	  <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none"></div>
	  <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

	  <div className="w-full max-w-md bg-[#0a0a0d]/90 backdrop-blur-2xl p-10 rounded-3xl border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10">
		
		<div className="text-center mb-10">
		  <div className="inline-flex items-center justify-center p-4 bg-slate-900 rounded-2xl border border-slate-800 mb-6 shadow-inner">
			<ShieldCheck className="w-10 h-10 text-red-500" />
		  </div>
		  <h1 className="text-2xl font-black text-white tracking-tight uppercase">Operix Command</h1>
		  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">SaaS Control Plane Access</p>
		</div>

		{errorMsg && (
		  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
			<ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
			<span className="text-sm font-bold text-red-400 leading-snug">{errorMsg}</span>
		  </div>
		)}

		<form onSubmit={handleSuperLogin} className="space-y-6">
		  <div>
			<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">HQ Email</label>
			<div className="relative group">
			  <Mail className="w-4 h-4 absolute left-4 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
			  <input 
				required 
				type="email" 
				value={email} 
				onChange={(e) => setEmail(e.target.value)} 
				className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-white placeholder:text-slate-600" 
				placeholder="admin@operix.com"
			  />
			</div>
		  </div>
		  
		  <div>
			<label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Master Password</label>
			<div className="relative group">
			  <Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
			  <input 
				required 
				type="password" 
				value={password} 
				onChange={(e) => setPassword(e.target.value)} 
				className="w-full pl-11 pr-4 py-3 bg-[#050505] border border-slate-800 rounded-xl text-sm font-bold outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all text-white placeholder:text-slate-600" 
				placeholder="••••••••"
			  />
			</div>
		  </div>

		  <button 
			type="submit" 
			disabled={loading} 
			className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl mt-4 transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50"
		  >
			{loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Authenticate'}
		  </button>
		</form>

		<div className="mt-8 text-center border-t border-slate-800/60 pt-6">
			<p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Authorized Personnel Only</p>
		</div>
	  </div>
	</div>
  );
}