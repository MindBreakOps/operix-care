const verifyLogin = async (user, currentFingerprint) => {
  // 1. Check if device is known
  const { data: session } = await supabase
	.from('user_sessions')
	.select('*')
	.eq('user_id', user.id)
	.eq('device_fingerprint', currentFingerprint)
	.single();

  if (session && session.is_trusted) {
	return 'LOGIN_SUCCESS'; // Trusted device
  } else {
	// 2. Trigger AI Face ID or OTP fallback
	return 'REQUIRE_SECURITY_VERIFICATION'; 
  }
};