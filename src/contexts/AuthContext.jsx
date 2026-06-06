import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [workspaceError, setWorkspaceError] = useState(false);
  const [loading, setLoading] = useState(true);

  const setWorkspaceAndPersist = (tenantData) => {
	setWorkspace(tenantData);
	if (tenantData) {
	  localStorage.setItem('operix_workspace_id', tenantData.id);
	} else {
	  localStorage.removeItem('operix_workspace_id');
	}
  };

  useEffect(() => {
	let isMounted = true;
	let currentTenantId = null;

	const verifyAndSetUser = async (authUser, tenantId) => {
	  try {
		const { data: profile, error } = await supabase
		  .from('profiles')
		  .select('*')
		  .eq('id', authUser.id)
		  .single();
		
		if (error || !profile) {
		  console.error("Error fetching profile or profile missing.");
		  await supabase.auth.signOut();
		  if(isMounted) { setUser(null); setRole(null); }
		} else if (tenantId && profile.workspace_id !== tenantId && profile.role !== 'super_admin') {
		  // STRICT TENANT ISOLATION CHECK (Bypassed if you are a super_admin)
		  console.error("User does not belong to this workspace.");
		  await supabase.auth.signOut();
		  if(isMounted) { setUser(null); setRole(null); }
		  alert("Unauthorized: Your account does not belong to this facility's workspace.");
		} else if (profile.status === 'pending' || profile.status === 'rejected') {
		  await supabase.auth.signOut();
		  if(isMounted) { setUser(null); setRole(null); }
		} else {
		  if(isMounted) {
			setUser(authUser);
			setRole(profile.role || 'patient');
		  }
		}
	  } catch (err) {
		console.error("Verification error:", err);
	  }
	};

	const initializeTenantAndAuth = async () => {
	  try {
		const path = window.location.pathname;
		// Whitelisted public routes
		const isPublic = path === '/' || path === '/subscription' || path === '/login' || path === '/saas-login';
		
		let tenantData = null;

		// Try local storage
		const savedWorkspaceId = localStorage.getItem('operix_workspace_id');
		if (savedWorkspaceId) {
		  const { data } = await supabase.from('workspaces').select('*').eq('id', savedWorkspaceId).single();
		  if (data) tenantData = data;
		}

		// Fallback to domain
		if (!tenantData) {
		  let currentDomain = window.location.hostname;
		  if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
			 currentDomain = 'operix-solutions';
		  }
		  const { data } = await supabase.from('workspaces').select('*').eq('domain', currentDomain).maybeSingle();
		  if (data) tenantData = data;
		}
	
		// Block if not public and no tenant found
		if (!isPublic && !tenantData) {
		  if(isMounted) { setWorkspaceError(true); setLoading(false); }
		  return;
		}
		
		if (tenantData && isMounted) {
		  setWorkspace(tenantData);
		  currentTenantId = tenantData.id;
		}
	
		// Init Auth session
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.user) {
		  await verifyAndSetUser(session.user, currentTenantId);
		}
	  } catch (error) {
		console.error("Auth check failed:", error);
	  } finally {
		if(isMounted) setLoading(false);
	  }
	};

	initializeTenantAndAuth();

	// Listen for auth events
	const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
	  try {
		if (session?.user) {
		  if (event === 'SIGNED_IN') {
			await verifyAndSetUser(session.user, currentTenantId);
		  } else {
			if(isMounted) setUser(session.user); // silent update on refresh
		  }
		} else {
		  if(isMounted) { setUser(null); setRole(null); }
		}
	  } catch (error) {
		 console.error("State change error:", error);
	  }
	});

	return () => {
	  isMounted = false;
	  subscription?.unsubscribe();
	};
  }, []);

  const signOut = async () => {
	await supabase.auth.signOut();
	localStorage.removeItem('operix_workspace_id'); // Clear tenant on sign out
	setWorkspace(null);
	setUser(null);
	setRole(null);
  };

  if (workspaceError) {
	return (
	  <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-sans p-6 text-center">
		<div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mb-6">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
		</div>
		<h1 className="text-4xl font-black mb-2 text-white">Workspace Not Found</h1>
		<p className="text-slate-400 max-w-md">No registered medical facility was found. Please access the system via the main landing page.</p>
	  </div>
	);
  }

  return (
	<AuthContext.Provider value={{ user, role, workspace, loading, signOut, setWorkspaceAndPersist }}>
	  {!loading && children}
	</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);