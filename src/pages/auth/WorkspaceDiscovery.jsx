import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ArrowRight, Hospital } from 'lucide-react';

export default function WorkspaceDiscovery() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const { setWorkspaceAndPersist } = useAuth();
  const navigate = useNavigate();

  const handleLookup = async (e) => {
	e.preventDefault();
	setLoading(true);
	
	// Query your workspaces table
	const { data, error } = await supabase
	  .from('workspaces')
	  .select('*')
	  .eq('domain', domain.toLowerCase())
	  .single();

	if (error || !data) {
	  alert("Workspace not found. Check the domain.");
	} else {
	  setWorkspaceAndPersist(data);
	  navigate('/login');
	}
	setLoading(false);
  };

  return (
	<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
	  <div className="w-full max-w-sm bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center">
		<Hospital className="w-12 h-12 text-blue-500 mx-auto mb-6" />
		<h2 className="text-2xl font-black text-white mb-2">Find your Workspace</h2>
		<p className="text-slate-400 text-sm mb-8">Enter your facility domain to continue.</p>
		
		<form onSubmit={handleLookup} className="space-y-4">
		  <div className="relative">
			<input 
			  required
			  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-4 outline-none focus:ring-2 focus:ring-blue-500"
			  placeholder="e.g. operix-solutions"
			  value={domain}
			  onChange={(e) => setDomain(e.target.value)}
			/>
		  </div>
		  <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
			{loading ? <Loader2 className="animate-spin"/> : <>Continue <ArrowRight size={16}/></>}
		  </button>
		</form>
	  </div>
	</div>
  );
}