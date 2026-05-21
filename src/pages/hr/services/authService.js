import { supabase } from '../config/supabaseClient';

export const verifyLogin = async (user, currentFingerprint) => {
  const { data: session } = await supabase
	.from('user_sessions')
	.select('*')
	.eq('user_id', user.id)
	.eq('device_fingerprint', currentFingerprint)
	.single();

  if (session && session.is_trusted) {
	return 'LOGIN_SUCCESS';
  } else {
	return 'REQUIRE_SECURITY_VERIFICATION'; 
  }
};