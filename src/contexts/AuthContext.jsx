// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  // loading defaults to true so the app waits during the initial boot
  const [loading, setLoading] = useState(true);

  useEffect(() => {
	const checkUser = async () => {
	  try {
		const { data: { session } } = await supabase.auth.getSession();
		
		if (session?.user) {
		  const { data: profile, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', session.user.id)
			.single();
		  
		  if (error) {
			console.error("Error fetching profile:", error);
			await supabase.auth.signOut();
			setUser(null);
			setRole(null);
		  } else if (profile && (profile.status === 'pending' || profile.status === 'rejected')) {
			await supabase.auth.signOut();
			setUser(null);
			setRole(null);
		  } else {
			setUser(session.user);
			setRole(profile?.role || 'patient');
		  }
		}
	  } catch (error) {
		console.error("Auth check failed:", error);
	  } finally {
		// This clears the initial loading screen
		setLoading(false);
	  }
	};

	checkUser();

	// Listen for auth events (like signing in, out, or tab-focus token refreshes)
	const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
	  // CRITICAL FIX: Do NOT put setLoading(true) here!
	  // Doing so destroys the 'children' prop, causing a full app reload on tab focus.
	  
	  try {
		if (session?.user) {
		  // Optimization: Only re-fetch the profile if it's a brand new sign-in
		  // We don't need to query the database again just because a token refreshed in the background
		  if (event === 'SIGNED_IN') {
			const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
			if (profile && (profile.status === 'pending' || profile.status === 'rejected')) {
			  await supabase.auth.signOut();
			  setUser(null);
			  setRole(null);
			} else {
			  setUser(session.user);
			  setRole(profile?.role || 'patient');
			}
		  } else {
			// For token refreshes, just update the user object silently
			setUser(session.user);
		  }
		} else {
		  setUser(null);
		  setRole(null);
		}
	  } catch (error) {
		 console.error("State change error:", error);
	  }
	  // CRITICAL FIX: No setLoading(false) here either, leave the global loading state alone.
	});

	return () => subscription.unsubscribe();
  }, []);

  return (
	<AuthContext.Provider value={{ user, role, loading }}>
	  {!loading && children}
	</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);