import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import defaultLogo from '../../assets/logo.jpg';
import { Mail, Lock, KeyRound, ShieldAlert, User, ArrowLeft, CheckCircle, ChevronRight, Hospital, Globe, Building2, XOctagon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { workspace, setWorkspaceAndPersist } = useAuth(); 
  const [mode, setMode] = useState(workspace ? 'login' : 'find_workspace'); 
  const [enteredDomain, setEnteredDomain] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
	if (workspace?.domain) setEnteredDomain(workspace.domain);
  }, [workspace]);

  const clearMessages = () => {
	setErrorMsg('');
	setSuccessMsg('');
  };

const handleVerifyWorkspace = async (e) => {
	  e.preventDefault();
	  setLoading(true);
	  clearMessages();
  
	  const searchTerm = enteredDomain.trim();
  
	  const { data, error } = await supabase
		.from('workspaces')
		.select('id, name, domain, status, subscription_type')
		.ilike('domain', searchTerm)
		.limit(1)
		.maybeSingle();
  
	  // FIXED: Actually print the error message to the screen so we know what's wrong!
	  if (error) {
		console.error("Detailed Error:", error);
		setErrorMsg(`Database Error: ${error.message || error.details || JSON.stringify(error)}`);
		setLoading(false);
		return;
	  }
  
	  if (!data) {
		setErrorMsg("ACCESS DENIED: The workspace domain you entered does not exist in our registry.");
		setWorkspaceAndPersist(null);
	  } else if (data.status === 'inactive' || data.status === 'suspended') {
		setErrorMsg("ACCESS DENIED: This workspace is currently suspended. Please contact administration.");
		setWorkspaceAndPersist(null);
	  } else {
		setWorkspaceAndPersist(data); 
		setSuccessMsg(`Workspace Verified! Preparing ${data.name} environment...`);
		setTimeout(() => {
		  setMode('login');
		  setSuccessMsg(''); 
		}, 1500);
	  }
	  setLoading(false);
	};

  const handlePasswordLogin = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	
	if (error) {
		setErrorMsg(error.message);
		setLoading(false);
	} else {
		// STRICT SEPARATION: Block Super Admins from the normal portal!
		const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
		if (profile?.role === 'super_admin') {
			await supabase.auth.signOut();
			setErrorMsg("ACCESS DENIED: Super Admins must authenticate via the dedicated /saas-login Command Center.");
			setLoading(false);
		} else {
			setSuccessMsg('Authenticating & loading workspace...');
			// App.jsx will automatically handle routing the doctor/nurse/admin to their dashboard.
		}
	}
  };

  const handleGoogleLogin = async () => {
	setLoading(true);
	const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
	if (error) setErrorMsg(error.message);
	setLoading(false);
  };

  const handleRegister = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.signUp({
	  email, password,
	  options: { data: { full_name: fullName, role: 'patient', status: 'pending', workspace_id: workspace?.id } }
	});

	if (error) {
		setErrorMsg(error.message);
	} else {
	  setSuccessMsg('Registration successful! Please wait for administrative approval.');
	  setMode('login');
	}
	setLoading(false);
  };

  const handleRequestOTP = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const fp = await FingerprintJS.load();
	const result = await fp.get();
	const { error } = await supabase.auth.signInWithOtp({ email, options: { data: { device_id: result.visitorId } } });

	if (error) setErrorMsg(error.message);
	else {
	  setSuccessMsg('A secure One-Time Password has been sent to your email.');
	  setMode('otp_verify');
	}
	setLoading(false);
  };

  const handleVerifyOTP = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

	if (error) {
		setErrorMsg(error.message);
		setLoading(false);
	} else {
		setSuccessMsg('Authenticating & loading workspace...');
	}
  };

  return (
	<div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300 font-sans">
	  <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
	  <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

	  <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/60 backdrop-blur-2xl p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
		
		<div className="text-center mb-8">
		  <div className="flex justify-center mb-6">
			<img src={workspace?.logo_url || defaultLogo} alt={workspace?.name || "Logo"} className="w-16 h-16 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 object-cover transition-all" />
		  </div>

		  {workspace ? (
			<div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-800 mb-4 animate-in zoom-in duration-300">
			   <Hospital className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
			   <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">{workspace.name}</span>
			</div>
		  ) : (
			<div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 mb-4">
			   <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
			   <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">OPERIX NETWORK</span>
			</div>
		  )}
		  
		  <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
			{mode === 'find_workspace' && 'Locate Workspace'}
			{mode === 'login' && 'Access Portal'}
			{mode === 'register' && 'Patient Enrollment'}
			{(mode === 'otp_req' || mode === 'otp_verify') && 'Secure OTP Login'}
			{mode === 'forgot' && 'Reset Password'}
		  </h1>
		</div>

		{errorMsg && (
		  <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
			<XOctagon className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
			<span className="text-sm font-bold text-red-700 dark:text-red-400 leading-snug">{errorMsg}</span>
		  </div>
		)}
		{successMsg && (
		  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
			<CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
			<span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 leading-snug">{successMsg}</span>
		  </div>
		)}

		{mode === 'find_workspace' && (
		  <form onSubmit={handleVerifyWorkspace} className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">Workspace Domain</label>
			  <div className="relative group">
				<Globe className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="text" value={enteredDomain} onChange={(e) => setEnteredDomain(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="e.g. general-hospital"/>
			  </div>
			</div>
			
			<button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black py-3.5 rounded-xl mt-4 transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2">
			  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Verify & Continue'}
			</button>
		  </form>
		)}

		{mode === 'login' && (
		  <form onSubmit={handlePasswordLogin} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">Work Email</label>
			  <div className="relative group">
				<Mail className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="staff@operix.com"/>
			  </div>
			</div>
			
			<div>
			  <div className="flex justify-between items-center mb-2 ml-1 mr-1">
				<label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
				<button type="button" onClick={() => {setMode('forgot'); clearMessages();}} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Forgot?</button>
			  </div>
			  <div className="relative group">
				<Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="••••••••"/>
			  </div>
			</div>

			<button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black py-3.5 rounded-xl mt-4 transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2">
			  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Secure Login'}
			</button>

			<div className="relative flex items-center justify-center py-2">
			  <div className="absolute border-t border-slate-200 dark:border-slate-800 w-full"></div>
			  <span className="bg-white dark:bg-[#0a0a0a] px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest relative z-10">Or connect with</span>
			</div>

			<button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl transition-all shadow-sm flex justify-center items-center gap-3">
			  <svg className="w-4 h-4" viewBox="0 0 24 24">
				<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
				<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
				<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
				<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
			  </svg>
			  Google Workspace
			</button>

			<div className="flex justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/60 mt-4 pt-4">
			  <button type="button" onClick={() => {setMode('otp_req'); clearMessages();}} className="flex-1 py-3 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800">Passwordless OTP</button>
			  <button type="button" onClick={() => {setMode('register'); clearMessages();}} className="flex-1 py-3 text-[11px] font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800">Patient Enrollment</button>
			</div>
			
			<div className="text-center pt-2">
			  <button type="button" onClick={() => {setMode('find_workspace'); clearMessages(); setWorkspaceAndPersist(null);}} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline">
				Not your workspace? Change domain.
			  </button>
			</div>
		  </form>
		)}

		{mode === 'register' && (
		  <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1">Full Name</label>
			  <div className="relative group">
				<User className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white" placeholder="John Doe"/>
			  </div>
			</div>
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1">Email Address</label>
			  <div className="relative group">
				<Mail className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white" placeholder="patient@example.com"/>
			  </div>
			</div>
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-1">Create Password</label>
			  <div className="relative group">
				<Lock className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white" placeholder="••••••••"/>
			  </div>
			</div>
			<div className="flex gap-3 pt-2">
			  <button type="button" onClick={() => setMode('login')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shadow-sm">
				<ArrowLeft className="w-5 h-5"/>
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-black py-3 rounded-xl transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2">
				{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <>Submit Profile <ChevronRight className="w-4 h-4"/></>}
			  </button>
			</div>
		  </form>
		)}

		{mode === 'otp_req' && (
		  <form onSubmit={handleRequestOTP} className="space-y-5 animate-in fade-in slide-in-from-left-8 duration-300">
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">Registered Email</label>
			  <div className="relative group">
				<Mail className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400" placeholder="staff@operix.com"/>
			  </div>
			</div>
			<div className="flex gap-3 pt-2">
			  <button type="button" onClick={() => setMode('login')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shadow-sm">
				<ArrowLeft className="w-5 h-5"/>
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2">
				{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Send OTP Code'}
			  </button>
			</div>
		  </form>
		)}

		{mode === 'otp_verify' && (
		  <form onSubmit={handleVerifyOTP} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-300">
			<div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
			  <span className="font-bold">Code sent to:</span><br/>{email}
			</div>
			<div>
			  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1 mb-2">6-Digit Access Code</label>
			  <div className="relative group">
				<KeyRound className="w-4 h-4 absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
				<input required type="text" maxLength={6} value={token} onChange={(e) => setToken(e.target.value)} className="w-full pl-11 pr-4 py-3 text-center tracking-[0.5em] font-mono text-xl bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white" placeholder="000000"/>
			  </div>
			</div>
			<div className="flex gap-3 pt-2">
			  <button type="button" onClick={() => setMode('otp_req')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shadow-sm">
				<ArrowLeft className="w-5 h-5"/>
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2">
				{loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : 'Authenticate'}
			  </button>
			</div>
		  </form>
		)}

	  </div>
	</div>
  );
}