// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
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
			// If we can't fetch the profile, log them out for safety
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
		// ALWAYS run this, even if the database crashes, so the white screen goes away!
		setLoading(false);
	  }
	};

	checkUser();

	const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
	  setLoading(true);
	  try {
		if (session?.user) {
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
		  setUser(null);
		  setRole(null);
		}
	  } catch (error) {
		 console.error("State change error:", error);
	  } finally {
		 setLoading(false);
	  }
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