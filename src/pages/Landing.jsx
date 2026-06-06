import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OPS_API = 'https://script.google.com/macros/s/AKfycbxzwlFPfOFiUS5atnjkAuXDcr-L_-LSY33_S9d6t12P36qmTWthc00ywCKpReFxzLY/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';

import logoImg from '../assets/favicon.ico';

const gasCall = async (payload) => {
  try {
	await fetch(OPS_API, { 
	  method: 'POST', mode: 'no-cors', cache: 'no-cache', 
	  headers: { 'Content-Type': 'text/plain' }, 
	  body: JSON.stringify(payload) 
	});
	return { success: true };
  } catch(e) { 
	return { success: false }; 
  }
};

const Icons = {
  Globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  ArrowRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  ArrowLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Stethoscope: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2.05h-.05a10 10 0 0 0-9.9 10 10 10 0 0 0 10 10h.05A10 10 0 0 0 21 12.05"/><path d="M11 2.05v7.9a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-7.9"/><circle cx="11" cy="20" r="2"/></svg>,
  Mic: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>,
  Shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Scan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 7 4"/><polyline points="20 7 20 4 17 4"/><polyline points="4 17 4 20 7 20"/><polyline points="20 17 20 20 17 20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
};

const translations = {
  en: {
	login: "Login",
	pricing: "Pricing", // <--- Added
	demoBtn: "Book a Demo",
	badge: "Clinical Operations",
	heroTitle: "The modern operating system for your ",
	heroHighlight: "healthcare facility.",
	heroSub: "A lightning-fast clinical platform that automates patient history, streamlines diagnosis, and manages administrative control in real-time.",
	pillarsTitle: "Experience OPERIX Care",
	pillarsSub: "Interact with the modules below to see how our system unifies clinical workflows.",
	p1Title: "Clinical Portals",
	p1Desc: "Unified interfaces for doctors and nurses to manage patient history.",
	p2Title: "Voice-to-Text Diagnosis",
	p2Desc: "Automated clinical notes using advanced voice recognition.",
	p3Title: "Administrative Control",
	p3Desc: "Strict role-based access and authorized deletion rights.",
	p4Title: "Smart Admissions",
	p4Desc: "Automated patient intake using OCR technology.",
	modalTitle: "Request a Demo",
	modalSub: "Fill out the details below and our team will be in touch.",
	submit: "Send Request",
	submitting: "Sending...",
	footer: "© 2026 Operix. All rights reserved."
  },
  ar: {
	login: "تسجيل الدخول",
	pricing: "الأسعار", // <--- Added
	demoBtn: "طلب عرض",
	badge: "العمليات السريرية",
	heroTitle: "نظام التشغيل الحديث لـ ",
	heroHighlight: "منشأتك الصحية.",
	heroSub: "منصة طبية سريعة تعمل على أتمتة سجلات المرضى، وتسهيل التشخيص، وإدارة الصلاحيات الإدارية في الوقت الفعلي.",
	pillarsTitle: "اكتشف منصة الرعاية",
	pillarsSub: "تفاعل مع الوحدات أدناه لترى كيف يوحد أوبيريكس كير سير العمل السريري.",
	p1Title: "البوابات الطبية",
	p1Desc: "واجهات موحدة للأطباء والممرضين لإدارة سجلات المرضى.",
	p2Title: "التشخيص الصوتي",
	p2Desc: "أتمتة الملاحظات السريرية باستخدام التعرف المتقدم على الصوت.",
	p3Title: "التحكم الإداري",
	p3Desc: "إدارة الصلاحيات المبنية على الأدوار وحقوق الحذف المصرح بها.",
	p4Title: "الدخول الذكي",
	p4Desc: "أتمتة تسجيل المرضى باستخدام تقنية التعرف البصري (OCR).",
	modalTitle: "طلب عرض تجريبي",
	modalSub: "أدخل بياناتك أدناه وسيتواصل معك فريقنا.",
	submit: "إرسال الطلب",
	submitting: "جاري الإرسال...",
	footer: "© 2026 أوبيريكس. جميع الحقوق محفوظة."
  }
};

export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', employees: '1-50' });

  const [activeTab, setActiveTab] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); 

  const t = translations[lang];
  const isAr = lang === 'ar';

  const handleDemoRequest = async (e) => {
	e.preventDefault();
	setIsSubmitting(true);

	const adminPayload = {
	  action: 'sendEmail', 
	  to: TARGET_EMAIL, 
	  subject: `New Care Lead: ${demoForm.company}`,
	  body: `NEW CARE DEMO REQUEST 🩺\n\nName: ${demoForm.name}\nEmail: ${demoForm.email}\nFacility: ${demoForm.company}\nBeds/Staff: ${demoForm.employees}`,
	  senderName: 'Operix Care',
	  senderEmail: 'system@operix.com'
	};

	const userPayload = {
	  action: 'sendEmail', 
	  to: demoForm.email, 
	  subject: `Request Confirmed - Operix Care`,
	  body: `Hello ${demoForm.name},\n\nThank you for your interest in Operix Care. Our team has received your details for ${demoForm.company}.\n\nAn executive will reach out to you shortly to schedule your live walkthrough of the healthcare system.\n\nBest regards,\nThe Operix Team`,
	  senderName: 'Operix Team',
	  senderEmail: 'system@operix.com'
	};

	await Promise.all([gasCall(adminPayload), gasCall(userPayload)]);

	setIsSubmitting(false);
	setShowDemoModal(false);
	alert(isAr ? `تم الإرسال بنجاح يا ${demoForm.name}! سنتواصل معك قريباً.` : `Request sent, ${demoForm.name}! We will be in touch.`);
	setDemoForm({ name: '', email: '', company: '', employees: '1-50' });
  };

  const toggleDictation = () => {
	if (isListening) {
	  setIsListening(false);
	} else {
	  setIsListening(true);
	  setDictationText('');
	  let i = 0;
	  const textToType = isAr 
		? "المريض يعاني من ارتفاع طفيف في ضغط الدم. يوصى بمراقبة يومية وتعديل الجرعة..." 
		: "Patient presents with mild hypertension. Recommend daily monitoring and dosage adjustment...";
	  
	  const interval = setInterval(() => {
		setDictationText((prev) => prev + textToType.charAt(i));
		i++;
		if (i >= textToType.length) {
		  clearInterval(interval);
		  setIsListening(false);
		}
	  }, 40);
	}
  };

  const triggerScan = () => {
	setScanStatus('scanning');
	setTimeout(() => setScanStatus('complete'), 2000);
  };

  return (
	<div style={{ minHeight: '100vh', background: '#fafafa', color: '#111111', direction: isAr ? 'rtl' : 'ltr', fontFamily: isAr ? 'system-ui, sans-serif' : 'Inter, system-ui, sans-serif' }}>
	  
	  <style>{`
		.interactive-container { display: flex; flex-direction: column; gap: 24px; }
		@media (min-width: 900px) {
		  .interactive-container { flex-direction: row; }
		  .interactive-sidebar { width: 340px; flex-shrink: 0; }
		}
		.mockup-window {
		  flex: 1; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;
		  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column;
		}
		.mockup-header { display: flex; gap: 6px; padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
		.mockup-dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
		.tab-btn {
		  display: flex; align-items: flex-start; gap: 16px; padding: 20px; width: 100%;
		  text-align: ${isAr ? 'right' : 'left'}; background: transparent; border: 1px solid transparent;
		  border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;
		}
		.tab-btn.active { background: #ffffff; border-color: #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
		.tab-btn:hover:not(.active) { background: #f1f5f9; }
		.pulse-ring { animation: pulse 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
		@keyframes pulse {
		  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
		  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
		  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
		}
		@keyframes scanline { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
	  `}</style>

	  {/* ─── NAVBAR ─── */}
	  <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
		  <img src={logoImg} alt="Operix" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'contain' }} />
		  <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.5px' }}>OPERIX <span style={{color: '#10b981'}}>CARE</span></span>
		</div>
		
		<div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
		  <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
			{Icons.Globe} {isAr ? 'EN' : 'AR'}
		  </button>
		  <button style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/subscription')}>
			{t.pricing}
		  </button>
		  <button style={{ background: 'transparent', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/login')}>
			{t.login}
		  </button>
		  <button style={{ background: '#0a0a0a', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => setShowDemoModal(true)}>
			{t.demoBtn}
		  </button>
		</div>
	  </nav>

	  {/* ─── HERO SECTION ─── */}
	  <header style={{ padding: '100px 24px', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
		<div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '32px' }}>
		  <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
		  {t.badge}
		</div>
		
		<h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: '24px', color: '#0a0a0a' }}>
		  {t.heroTitle} 
		  <span style={{ background: 'linear-gradient(to right, #059669, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
			{t.heroHighlight}
		  </span>
		</h1>
		
		<p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 48px', fontWeight: 400 }}>
		  {t.heroSub}
		</p>
		
		<div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
		  <button style={{ background: '#0a0a0a', color: '#ffffff', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowDemoModal(true)}>
			{t.demoBtn} {isAr ? Icons.ArrowLeft : Icons.ArrowRight}
		  </button>
		  <button style={{ background: '#e2e8f0', color: '#0a0a0a', border: 'none', padding: '14px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/subscription')}>
			{t.pricing}
		  </button>
		</div>
	  </header>

	  {/* ─── INTERACTIVE SYSTEM PREVIEW SECTION ─── */}
	  <section style={{ padding: '80px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
		<div style={{ maxWidth: '1100px', margin: '0 auto' }}>
		  
		  <div style={{ marginBottom: '48px', textAlign: 'center' }}>
			<h2 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px', margin: 0, color: '#0a0a0a' }}>{t.pillarsTitle}</h2>
			<p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>{t.pillarsSub}</p>
		  </div>

		  <div className="interactive-container">
			<div className="interactive-sidebar">
			  {[
				{ id: 0, icon: Icons.Stethoscope, title: t.p1Title, desc: t.p1Desc },
				{ id: 1, icon: Icons.Mic, title: t.p2Title, desc: t.p2Desc },
				{ id: 2, icon: Icons.Shield, title: t.p3Title, desc: t.p3Desc },
				{ id: 3, icon: Icons.Scan, title: t.p4Title, desc: t.p4Desc }
			  ].map((tab) => (
				<button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
				  <div style={{ color: activeTab === tab.id ? '#10b981' : '#94a3b8', transition: 'color 0.2s' }}>{tab.icon}</div>
				  <div>
					<h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: activeTab === tab.id ? '#0a0a0a' : '#475569' }}>{tab.title}</h3>
					<p style={{ fontSize: '13px', margin: 0, color: '#64748b', lineHeight: 1.5 }}>{tab.desc}</p>
				  </div>
				</button>
			  ))}
			</div>

			<div className="mockup-window">
			  <div className="mockup-header" style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}>
				<div className="mockup-dot" style={{ background: '#f87171' }}></div>
				<div className="mockup-dot" style={{ background: '#fbbf24' }}></div>
				<div className="mockup-dot" style={{ background: '#34d399' }}></div>
			  </div>
			  
			  <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
				{/* MOCKUP 1: CLINICAL PORTAL */}
				{activeTab === 0 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
					  <div>
						<h4 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#0a0a0a', fontWeight: 700 }}>{isAr ? 'د. سارة الأحمد' : 'Dr. Sarah Alahmad'}</h4>
						<p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>{isAr ? 'بوابة الطبيب - قسم الباطنية' : 'Doctor Portal - Internal Medicine'}</p>
					  </div>
					  <div style={{ background: '#f1f5f9', color: '#64748b', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
						{isAr ? 'مرضى اليوم: 12' : 'Today\'s Patients: 12'}
					  </div>
					</div>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: isAr ? 'right' : 'left' }}>
					  <thead>
						<tr style={{ borderBottom: '2px solid #e2e8f0' }}>
						  <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: 600 }}>{isAr ? 'رقم الملف' : 'MRN'}</th>
						  <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: 600 }}>{isAr ? 'المريض' : 'Patient'}</th>
						  <th style={{ padding: '12px 8px', color: '#64748b', fontWeight: 600 }}>{isAr ? 'الحالة' : 'Status'}</th>
						</tr>
					  </thead>
					  <tbody>
						{[
						  { mrn: 'PT-88392', name: isAr ? 'خالد عبدالله' : 'Khalid Abdullah', status: 'Waiting' },
						  { mrn: 'PT-88393', name: isAr ? 'نورة سعد' : 'Noura Saad', status: 'In Consultation' }
						].map((row, i) => (
						  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
							<td style={{ padding: '16px 8px', fontWeight: 600, color: '#475569' }}>{row.mrn}</td>
							<td style={{ padding: '16px 8px', fontWeight: 600, color: '#0a0a0a' }}>{row.name}</td>
							<td style={{ padding: '16px 8px' }}>
							  <span style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700, background: row.status === 'Waiting' ? '#fef3c7' : '#d1fae5', color: row.status === 'Waiting' ? '#d97706' : '#059669' }}>
								{row.status === 'Waiting' ? (isAr ? 'في الانتظار' : 'Waiting') : (isAr ? 'في العيادة' : 'In Consultation')}
							  </span>
							</td>
						  </tr>
						))}
					  </tbody>
					</table>
				  </div>
				)}

				{/* MOCKUP 2: VOICE TO TEXT */}
				{activeTab === 1 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
					  <h4 style={{ margin: 0, fontSize: '20px', color: '#0a0a0a', fontWeight: 700 }}>{isAr ? 'الملاحظات السريرية' : 'Clinical Notes Dictation'}</h4>
					  <button 
						onClick={toggleDictation} 
						className={isListening ? 'pulse-ring' : ''}
						style={{ background: isListening ? '#ef4444' : '#0a0a0a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
					  >
						{Icons.Mic} {isListening ? (isAr ? 'جاري الاستماع...' : 'Listening...') : (isAr ? 'بدء التسجيل' : 'Start Dictation')}
					  </button>
					</div>
					<div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', minHeight: '150px', background: '#f8fafc' }}>
					  {dictationText ? (
						<p style={{ margin: 0, fontSize: '15px', color: '#334155', lineHeight: 1.6 }}>{dictationText}<span style={{ opacity: isListening ? 1 : 0, transition: 'opacity 0.2s' }}>|</span></p>
					  ) : (
						<p style={{ margin: 0, fontSize: '15px', color: '#94a3b8', fontStyle: 'italic' }}>
						  {isAr ? 'اضغط على زر التسجيل وتحدث لإضافة الملاحظات التلقائية...' : 'Press Start Dictation and speak to generate clinical notes...'}
						</p>
					  )}
					</div>
				  </div>
				)}

				{/* MOCKUP 3: ADMIN CONTROL */}
				{activeTab === 2 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<h4 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#0a0a0a', fontWeight: 700 }}>{isAr ? 'لوحة التحكم الإدارية' : 'Admin Deletion Rights'}</h4>
					<div style={{ border: '1px solid #fecaca', background: '#fff5f5', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
					  <div style={{ color: '#ef4444' }}>{Icons.Shield}</div>
					  <div>
						<h5 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '14px' }}>{isAr ? 'سجل الحذف الحساس' : 'Sensitive Deletion Log'}</h5>
						<p style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>{isAr ? 'تتطلب السجلات أدناه تفويض الإدارة العُليا لإزالتها من النظام.' : 'The records below require higher management authorization to be removed.'}</p>
					  </div>
					</div>
					
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
					  <div>
						<p style={{ margin: '0 0 4px 0', fontWeight: 600, fontSize: '14px', color: '#0a0a0a' }}>{isAr ? 'طلب حذف سجل مريض' : 'Patient Record Deletion Request'}</p>
						<p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>MRN: PT-29188 | Requester: Dr. Ahmed</p>
					  </div>
					  <div style={{ display: 'flex', gap: '8px' }}>
						<button style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{isAr ? 'رفض' : 'Deny'}</button>
						<button style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>{isAr ? 'تأكيد الحذف' : 'Force Delete'}</button>
					  </div>
					</div>
				  </div>
				)}

				{/* MOCKUP 4: SMART ADMISSION (OCR) */}
				{activeTab === 3 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
					  <h4 style={{ margin: 0, fontSize: '20px', color: '#0a0a0a', fontWeight: 700 }}>{isAr ? 'تسجيل دخول ذكي (OCR)' : 'Smart Admissions (OCR)'}</h4>
					  <button 
						onClick={triggerScan}
						disabled={scanStatus !== 'idle'}
						style={{ background: '#0a0a0a', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: scanStatus === 'idle' ? 'pointer' : 'default', opacity: scanStatus === 'idle' ? 1 : 0.7 }}
					  >
						{scanStatus === 'idle' && (isAr ? 'مسح الهوية' : 'Scan ID Card')}
						{scanStatus === 'scanning' && (isAr ? 'جاري المسح...' : 'Scanning...')}
						{scanStatus === 'complete' && (isAr ? 'تم استخراج البيانات' : 'Data Extracted ✓')}
					  </button>
					</div>

					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
					  <div style={{ height: '140px', background: '#e2e8f0', borderRadius: '8px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<div style={{ color: '#94a3b8' }}>[ ID Card Placeholder ]</div>
						{scanStatus === 'scanning' && (
						  <div style={{ position: 'absolute', width: '100%', height: '4px', background: '#10b981', animation: 'scanline 1s linear infinite', boxShadow: '0 0 8px #10b981' }}></div>
						)}
					  </div>

					  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<div>
						  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
						  <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '14px', color: scanStatus === 'complete' ? '#0a0a0a' : '#cbd5e1' }}>
							{scanStatus === 'complete' ? (isAr ? 'يوسف محمد عبدالله' : 'Yousef Mohammed Abdullah') : '---'}
						  </div>
						</div>
						<div>
						  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{isAr ? 'رقم الهوية' : 'National ID'}</label>
						  <div style={{ background: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '14px', color: scanStatus === 'complete' ? '#0a0a0a' : '#cbd5e1' }}>
							{scanStatus === 'complete' ? '1088492019' : '---'}
						  </div>
						</div>
					  </div>
					</div>
				  </div>
				)}
			  </div>
			</div>
		  </div>
		</div>
	  </section>

	  <footer style={{ padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', borderTop: '1px solid #e2e8f0' }}>
		{t.footer}
	  </footer>

	  {/* ─── DEMO MODAL ─── */}
	  {showDemoModal && (
		<div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 10, 10, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
		  <div style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0' }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
			  <div>
				<h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px 0', color: '#0a0a0a' }}>{t.modalTitle}</h3>
				<p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>{t.modalSub}</p>
			  </div>
			  <button onClick={() => setShowDemoModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '6px', fontSize: '20px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
			</div>
			
			<form onSubmit={handleDemoRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			  <div>
				<label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>{isAr ? 'الاسم' : 'Full Name'}</label>
				<input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box' }} value={demoForm.name} onChange={e => setDemoForm({...demoForm, name: e.target.value})} required />
			  </div>
			  <div>
				<label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>{isAr ? 'البريد' : 'Work Email'}</label>
				<input type="email" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box' }} value={demoForm.email} onChange={e => setDemoForm({...demoForm, email: e.target.value})} required />
			  </div>
			  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>{isAr ? 'المنشأة الطبية' : 'Healthcare Facility'}</label>
				  <input type="text" style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box' }} value={demoForm.company} onChange={e => setDemoForm({...demoForm, company: e.target.value})} required />
				</div>
				<div>
				  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>{isAr ? 'حجم المنشأة' : 'Facility Size'}</label>
				  <select style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer' }} value={demoForm.employees} onChange={e => setDemoForm({...demoForm, employees: e.target.value})}>
					<option value="1-50">1 - 50 Beds</option>
					<option value="51-200">51 - 200 Beds</option>
					<option value="201-500">201 - 500 Beds</option>
					<option value="500+">500+ Beds</option>
				  </select>
				</div>
			  </div>

			  <button type="submit" style={{ width: '100%', padding: '12px', background: '#0a0a0a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '12px', transition: 'background 0.2s' }} disabled={isSubmitting}>
				{isSubmitting ? t.submitting : t.submit}
			  </button>
			</form>
		  </div>
		</div>
	  )}

	  <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
	</div>
  );
}