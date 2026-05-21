import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { Mail, Lock, KeyRound, ShieldAlert, Activity, User, ArrowLeft, CheckCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  
  // Auth Modes: 'login', 'register', 'otp_req', 'otp_verify', 'forgot'
  const [mode, setMode] = useState('login'); 
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => {
	setErrorMsg('');
	setSuccessMsg('');
  };

  // 1. Standard Email & Password Login
  const handlePasswordLogin = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.signInWithPassword({ email, password });
	
	if (error) setErrorMsg(error.message);
	else navigate('/');
	
	setLoading(false);
  };

  // 2. Google OAuth Login
  const handleGoogleLogin = async () => {
	setLoading(true);
	clearMessages();
	const { error } = await supabase.auth.signInWithOAuth({ 
	  provider: 'google',
	  options: { redirectTo: window.location.origin }
	});
	if (error) setErrorMsg(error.message);
	setLoading(false);
  };

  // 3. Request Account (Sign Up) -> Goes to Admin Pending List
  const handleSignUp = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.signUp({
	  email,
	  password,
	  options: { data: { full_name: fullName } } // This feeds the SQL trigger we built!
	});

	if (error) {
	  setErrorMsg(error.message);
	} else {
	  setSuccessMsg("Application submitted successfully! Please wait for System Administrator approval.");
	  setMode('login'); // Send them back to the login screen to wait
	}
	setLoading(false);
  };

  // 4. OTP: Request Code
  const handleSendOTP = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });

	if (error) setErrorMsg(error.message);
	else setMode('otp_verify');
	
	setLoading(false);
  };

  // 5. OTP: Verify 8-Digit Code
  const handleVerifyOTP = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

	if (error) setErrorMsg("Invalid or expired authorization pin.");
	else navigate('/');
	
	setLoading(false);
  };

  // 6. Forgot Password Reset
  const handleResetPassword = async (e) => {
	e.preventDefault();
	setLoading(true);
	clearMessages();

	const { error } = await supabase.auth.resetPasswordForEmail(email, {
	  redirectTo: `${window.location.origin}/reset-password`,
	});

	if (error) setErrorMsg(error.message);
	else setSuccessMsg("Password reset directives have been dispatched to your email.");
	
	setLoading(false);
  };

  return (
	<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12">
	  <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 transition-all">
		
		{/* BRAND HEADER */}
		<div className="text-center space-y-2">
		  <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl mb-1">
			<Activity className="w-8 h-8" />
		  </div>
		  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">OPERIX Care</h1>
		  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Health Information System</p>
		</div>

		{/* ALERTS */}
		{errorMsg && (
		  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-2">
			<ShieldAlert className="w-4 h-4 shrink-0" /> {errorMsg}
		  </div>
		)}
		{successMsg && (
		  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-start gap-2">
			<CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {successMsg}
		  </div>
		)}

		{/* ============================== */}
		{/* MODE: LOGIN                      */}
		{/* ============================== */}
		{mode === 'login' && (
		  <div className="space-y-6">
			<form onSubmit={handlePasswordLogin} className="space-y-4">
			  <div>
				<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Registered Email</label>
				<div className="relative">
				  <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="staff@operix.com"/>
				</div>
			  </div>

			  <div>
				<div className="flex justify-between items-center mb-1.5">
				  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password</label>
				  <button type="button" onClick={() => { setMode('forgot'); clearMessages(); }} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition">Forgot?</button>
				</div>
				<div className="relative">
				  <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				  <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="••••••••"/>
				</div>
			  </div>

			  <button type="submit" disabled={loading} className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition hover:opacity-90 disabled:opacity-50">
				{loading ? 'Authenticating...' : 'Secure Login'}
			  </button>
			</form>

			<div className="relative flex items-center py-2">
			  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
			  <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or access via</span>
			  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
			</div>

			<div className="grid grid-cols-2 gap-3">
			  <button onClick={() => { setMode('otp_req'); clearMessages(); }} className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition">
				<KeyRound className="w-4 h-4" /> OTP Token
			  </button>
			  
			  <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition">
				<svg className="w-4 h-4" viewBox="0 0 24 24">
				  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
				  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
				  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
				  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
				</svg>
				Google
			  </button>
			</div>

			<div className="text-center pt-2">
			  <button onClick={() => { setMode('register'); clearMessages(); }} className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">
				New staff member? <span className="text-blue-600 dark:text-blue-400">Apply for Account</span>
			  </button>
			</div>
		  </div>
		)}

		{/* ============================== */}
		{/* MODE: REGISTER (Request Acc)   */}
		{/* ============================== */}
		{mode === 'register' && (
		  <form onSubmit={handleSignUp} className="space-y-4">
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Legal Full Name</label>
			  <div className="relative">
				<User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				<input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="Dr. Jane Doe"/>
			  </div>
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Work Email</label>
			  <div className="relative">
				<Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="jane.doe@operix.com"/>
			  </div>
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Create Password</label>
			  <div className="relative">
				<Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="••••••••"/>
			  </div>
			</div>
			
			<div className="flex gap-2 pt-2">
			  <button type="button" onClick={() => setMode('login')} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition">
				<ArrowLeft className="w-5 h-5" />
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition disabled:opacity-50">
				{loading ? 'Submitting...' : 'Submit Application'}
			  </button>
			</div>
		  </form>
		)}

		{/* ============================== */}
		{/* MODE: OTP REQUEST              */}
		{/* ============================== */}
		{mode === 'otp_req' && (
		  <form onSubmit={handleSendOTP} className="space-y-4">
			<p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-4">Enter your email to receive a secure, one-time 8-digit access token.</p>
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Registered Email</label>
			  <div className="relative">
				<Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="staff@operix.com"/>
			  </div>
			</div>
			<div className="flex gap-2 pt-2">
			  <button type="button" onClick={() => setMode('login')} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition">
				<ArrowLeft className="w-5 h-5" />
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-slate-950 dark:bg-white text-white dark:text-slate-950 py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition hover:opacity-90 disabled:opacity-50">
				{loading ? 'Dispersing Token...' : 'Request Code'}
			  </button>
			</div>
		  </form>
		)}

		{/* ============================== */}
		{/* MODE: OTP VERIFY               */}
		{/* ============================== */}
		{mode === 'otp_verify' && (
		  <form onSubmit={handleVerifyOTP} className="space-y-4">
			<div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
			  Token dispatched to <strong>{email}</strong>. Enter parameters below to link session credentials.
			</div>
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Verification PIN</label>
			  <div className="relative">
				<KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				<input required type="text" maxLength={8} value={token} onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-center font-mono text-lg font-black tracking-[0.5em] outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="00000000"/>
			  </div>
			</div>
			<div className="flex gap-2 pt-2">
			  <button type="button" onClick={() => setMode('otp_req')} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition">
				<ArrowLeft className="w-5 h-5" />
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition disabled:opacity-50">
				{loading ? 'Verifying...' : 'Authenticate Session'}
			  </button>
			</div>
		  </form>
		)}

		{/* ============================== */}
		{/* MODE: FORGOT PASSWORD          */}
		{/* ============================== */}
		{mode === 'forgot' && (
		  <form onSubmit={handleResetPassword} className="space-y-4">
			<p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-4">Enter your email to receive password reset directives.</p>
			<div>
			  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Registered Email</label>
			  <div className="relative">
				<Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
				<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white" placeholder="staff@operix.com"/>
			  </div>
			</div>
			<div className="flex gap-2 pt-2">
			  <button type="button" onClick={() => setMode('login')} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition">
				<ArrowLeft className="w-5 h-5" />
			  </button>
			  <button type="submit" disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-sm tracking-wide shadow-md transition disabled:opacity-50">
				{loading ? 'Sending...' : 'Issue Reset Link'}
			  </button>
			</div>
		  </form>
		)}
	  </div>
	</div>
  );
}