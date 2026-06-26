import React, { useState, useEffect, useRef } from 'react';
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
  } catch (e) {
	return { success: false };
  }
};

// ─── SVG ICONS ───
const Icons = {
  Globe: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
	  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
	</svg>
  ),
  ArrowRight: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
	</svg>
  ),
  ArrowLeft: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
	</svg>
  ),
  Stethoscope: (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
	  <path d="M11 2.05h-.05a10 10 0 0 0-9.9 10 10 10 0 0 0 10 10h.05A10 10 0 0 0 21 12.05"/>
	  <path d="M11 2.05v7.9a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-7.9"/><circle cx="11" cy="20" r="2"/>
	</svg>
  ),
  Mic: (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
	  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
	  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
	</svg>
  ),
  Shield: (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
	  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
	</svg>
  ),
  Scan: (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
	  <polyline points="4 7 4 4 7 4"/><polyline points="20 7 20 4 17 4"/>
	  <polyline points="4 17 4 20 7 20"/><polyline points="20 17 20 20 17 20"/>
	  <line x1="4" y1="12" x2="20" y2="12"/>
	</svg>
  ),
  Heart: (
	<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
	  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
	</svg>
  ),
  Cross: (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
	  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-7 14h-2v-5H5v-2h5V5h2v5h5v2h-5v5z"/>
	</svg>
  ),
  Mail: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
	</svg>
  ),
  ExternalLink: (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
	  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
	</svg>
  ),
  HelpCircle: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <circle cx="12" cy="12" r="10"/>
	  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
	  <line x1="12" y1="17" x2="12.01" y2="17"/>
	</svg>
  ),
  FileText: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
	  <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
	  <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
	</svg>
  ),
  Lock: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
	  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
	</svg>
  ),
  Phone: (
	<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.6 4.5 2 2 0 0 1 3.58 2.34h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.02-1.02a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
	</svg>
  ),
  Pulse: (
	<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
	  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
	</svg>
  ),
  X: (
	<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
	  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
	</svg>
  ),
};

// ─── TRANSLATIONS ───
const translations = {
  en: {
	login: "Login",
	pricing: "Pricing",
	demoBtn: "Book a Demo",
	badge: "Clinical Operations Platform",
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
	// Footer
	footerTagline: "Powering the future of clinical care.",
	footerProduct: "Product",
	footerCompany: "Company",
	footerContact: "Contact",
	footerLinks: ["Features", "Pricing", "Book a Demo", "Login"],
	footerCompanyLinks: ["About OPERIX", "Solutions", "Careers", "Blog"],
	footerRights: "© 2026 OPERIX Solutions. All rights reserved.",
	footerVat: "VAT Reg. No: 310XXXXXXXXX | Riyadh, Saudi Arabia",
	// Support modal
	supportBtn: "Support",
	supportTitle: "Support Center",
	supportSub: "We're here to help you 24/7. Reach out via any channel below.",
	supportInfoEmail: "General Inquiries",
	supportEmail: "Support",
	supportSubEmail: "Subscription",
	supportWebsite: "Website",
	supportClose: "Close",
	// Terms modal
	termsTitle: "Terms of Use & Privacy Policy",
	termsEffective: "Effective Date: January 1, 2026",
	termsClose: "I Understand",
  },
  ar: {
	login: "تسجيل الدخول",
	pricing: "الأسعار",
	demoBtn: "طلب عرض",
	badge: "منصة العمليات السريرية",
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
	// Footer
	footerTagline: "نبني مستقبل الرعاية الصحية الرقمية.",
	footerProduct: "المنتج",
	footerCompany: "الشركة",
	footerContact: "التواصل",
	footerLinks: ["المميزات", "الأسعار", "طلب عرض", "تسجيل الدخول"],
	footerCompanyLinks: ["عن أوبيريكس", "الحلول", "الوظائف", "المدونة"],
	footerRights: "© 2026 أوبيريكس سوليوشنز. جميع الحقوق محفوظة.",
	footerVat: "الرقم الضريبي: 310XXXXXXXXX | الرياض، المملكة العربية السعودية",
	// Support modal
	supportBtn: "الدعم",
	supportTitle: "مركز الدعم",
	supportSub: "نحن هنا لمساعدتك على مدار الساعة. تواصل معنا عبر أي قناة أدناه.",
	supportInfoEmail: "الاستفسارات العامة",
	supportEmail: "الدعم الفني",
	supportSubEmail: "الاشتراكات",
	supportWebsite: "الموقع الإلكتروني",
	supportClose: "إغلاق",
	// Terms modal
	termsTitle: "شروط الاستخدام وسياسة الخصوصية",
	termsEffective: "تاريخ السريان: 1 يناير 2026",
	termsClose: "أوافق",
  }
};

// ─── HEARTBEAT LOADER ───
function HeartbeatLoader() {
  return (
	<div style={{
	  position: 'fixed', inset: 0, zIndex: 99999,
	  background: 'linear-gradient(135deg, #0d0820 0%, #1a0a2e 50%, #0d1f3c 100%)',
	  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '32px'
	}}>
	  {/* ECG line + heart */}
	  <div style={{ position: 'relative', width: '280px', height: '80px' }}>
		<svg viewBox="0 0 280 80" width="280" height="80" style={{ overflow: 'visible' }}>
		  <path
			d="M0,40 L60,40 L75,10 L90,70 L105,25 L115,55 L125,40 L280,40"
			fill="none" stroke="url(#ecgGrad)" strokeWidth="2.5" strokeLinecap="round"
			style={{ animation: 'ecgDraw 1.8s ease-in-out infinite' }}
		  />
		  <defs>
			<linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
			  <stop offset="0%" stopColor="#e11d48" stopOpacity="0"/>
			  <stop offset="40%" stopColor="#e11d48"/>
			  <stop offset="70%" stopColor="#a855f7"/>
			  <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
			</linearGradient>
		  </defs>
		</svg>
	  </div>

	  {/* Beating heart */}
	  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
		<div style={{
		  position: 'absolute', width: '80px', height: '80px', borderRadius: '50%',
		  background: 'rgba(225, 29, 72, 0.15)',
		  animation: 'heartPulseRing 1.2s ease-out infinite'
		}} />
		<div style={{
		  position: 'absolute', width: '60px', height: '60px', borderRadius: '50%',
		  background: 'rgba(225, 29, 72, 0.2)',
		  animation: 'heartPulseRing 1.2s ease-out 0.15s infinite'
		}} />
		<div style={{
		  color: '#e11d48', fontSize: '36px',
		  animation: 'heartbeat 1.2s ease-in-out infinite',
		  filter: 'drop-shadow(0 0 12px rgba(225,29,72,0.7))'
		}}>
		  {Icons.Heart}
		</div>
	  </div>

	  <div style={{ textAlign: 'center' }}>
		<div style={{
		  fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px',
		  background: 'linear-gradient(to right, #f43f5e, #a855f7)',
		  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
		}}>
		  OPERIX CARE
		</div>
		<div style={{ color: '#64748b', fontSize: '13px', marginTop: '6px', letterSpacing: '2px', textTransform: 'uppercase' }}>
		  Initializing Clinical System...
		</div>
	  </div>

	  <style>{`
		@keyframes ecgDraw {
		  0% { stroke-dasharray: 0 600; stroke-dashoffset: 0; opacity:1; }
		  70% { stroke-dasharray: 600 600; stroke-dashoffset: 0; opacity:1; }
		  90% { opacity: 0.3; }
		  100% { stroke-dasharray: 600 600; opacity: 1; }
		}
		@keyframes heartbeat {
		  0%, 100% { transform: scale(1); }
		  15% { transform: scale(1.25); }
		  30% { transform: scale(0.95); }
		  45% { transform: scale(1.15); }
		  60% { transform: scale(1); }
		}
		@keyframes heartPulseRing {
		  0% { transform: scale(0.9); opacity: 0.8; }
		  70% { transform: scale(1.5); opacity: 0; }
		  100% { transform: scale(0.9); opacity: 0; }
		}
	  `}</style>
	</div>
  );
}

// ─── SUPPORT MODAL ───
function SupportModal({ t, isAr, onClose }) {
  const contacts = [
	{ icon: Icons.Mail, label: t.supportInfoEmail, value: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com', accent: '#e11d48' },
	{ icon: Icons.HelpCircle, label: t.supportEmail, value: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com', accent: '#a855f7' },
	{ icon: Icons.FileText, label: t.supportSubEmail, value: 'subscription@operix-solutions.com', href: 'mailto:subscription@operix-solutions.com', accent: '#3b82f6' },
	{ icon: Icons.Globe, label: t.supportWebsite, value: 'www.operix-solutions.com/about', href: 'https://www.operix-solutions.com', accent: '#10b981' },
  ];
  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,30,0.75)', backdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
	  <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
		{/* Header bar */}
		<div style={{ background: 'linear-gradient(135deg, #e11d48, #a855f7)', padding: '24px 28px 20px', position: 'relative' }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			<div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px', color: '#fff' }}>{Icons.HelpCircle}</div>
			<div>
			  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>{t.supportTitle}</h3>
			  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{t.supportSub}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position: 'absolute', top: '16px', [isAr ? 'left' : 'right']: '16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
			{Icons.X}
		  </button>
		</div>
		{/* Contact cards */}
		<div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
		  {contacts.map((c, i) => (
			<a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
			  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: `1px solid ${c.accent}22`, background: `${c.accent}08`, textDecoration: 'none', transition: 'all 0.2s' }}>
			  <div style={{ background: `${c.accent}18`, color: c.accent, padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				{c.icon}
			  </div>
			  <div>
				<div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
				<div style={{ fontSize: '13px', fontWeight: 700, color: c.accent, marginTop: '2px' }}>{c.value}</div>
			  </div>
			  {c.href.startsWith('http') && <div style={{ marginLeft: 'auto', color: '#94a3b8' }}>{Icons.ExternalLink}</div>}
			</a>
		  ))}
		  <button onClick={onClose} style={{ marginTop: '8px', width: '100%', padding: '12px', background: 'linear-gradient(135deg, #e11d48, #a855f7)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
			{t.supportClose}
		  </button>
		</div>
	  </div>
	</div>
  );
}

// ─── TERMS MODAL ───
function TermsModal({ t, isAr, onClose }) {
  const sections = isAr ? [
	{
	  title: '١. القبول والاتفاقية',
	  body: 'باستخدامك منصة OPERIX Care، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت تستخدم المنصة نيابةً عن مؤسسة صحية، فإن المؤسسة توافق أيضاً على هذه الشروط.'
	},
	{
	  title: '٢. استخدام المنصة',
	  body: 'يُسمح باستخدام OPERIX Care للأغراض الطبية والإدارية المشروعة فقط. يُحظر استخدام المنصة في أنشطة غير قانونية أو انتهاك خصوصية المرضى أو الوصول غير المصرح به إلى البيانات.'
	},
	{
	  title: '٣. الخصوصية وحماية البيانات',
	  body: 'نلتزم بسياسة صارمة لحماية البيانات وفقاً للوائح هيئة الصحة السعودية (CCHI) ومعايير HIPAA الدولية. يتم تشفير جميع بيانات المرضى وتخزينها بأمان في مراكز بيانات معتمدة داخل المملكة العربية السعودية.'
	},
	{
	  title: '٤. المسؤوليات والالتزامات',
	  body: 'تتحمل المنشأة الصحية المسؤولية الكاملة عن دقة البيانات المُدخلة. تقدم OPERIX Solutions المنصة كأداة مساعدة، ولا تتحمل مسؤولية القرارات الطبية المتخذة بناءً على البيانات.'
	},
	{
	  title: '٥. الاشتراكات والأسعار',
	  body: 'تُحتسب رسوم الاشتراك شهرياً أو سنوياً وفقاً للباقة المختارة. تخضع جميع الأسعار لضريبة القيمة المضافة بنسبة 15%. يحق لأوبيريكس تعديل الأسعار مع إشعار مسبق مدته 30 يوماً.'
	},
	{
	  title: '٦. التعديلات على الشروط',
	  body: 'تحتفظ OPERIX Solutions بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل.'
	},
  ] : [
	{
	  title: '1. Acceptance & Agreement',
	  body: 'By using the OPERIX Care platform, you agree to comply with these Terms of Use. If you are using the platform on behalf of a healthcare organization, the organization also agrees to these terms.'
	},
	{
	  title: '2. Permitted Use',
	  body: 'OPERIX Care is authorized for lawful medical and administrative purposes only. Unauthorized access, data extraction, or use in illegal activities is strictly prohibited.'
	},
	{
	  title: '3. Privacy & Data Protection',
	  body: 'We are committed to strict data protection in compliance with Saudi CCHI regulations and international HIPAA standards. All patient data is encrypted and stored securely in certified data centers within the Kingdom of Saudi Arabia.'
	},
	{
	  title: '4. Responsibilities & Obligations',
	  body: 'The healthcare facility bears full responsibility for the accuracy of data entered into the system. OPERIX Solutions provides the platform as an operational tool and bears no responsibility for clinical decisions made based on system data.'
	},
	{
	  title: '5. Subscriptions & Pricing',
	  body: 'Subscription fees are billed monthly or annually depending on the selected plan. All prices are subject to 15% VAT. OPERIX reserves the right to modify pricing with 30 days prior written notice.'
	},
	{
	  title: '6. Modifications to Terms',
	  body: 'OPERIX Solutions reserves the right to modify these Terms at any time. You will be notified of any material changes via your registered email address.'
	},
  ];

  return (
	<div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,30,0.8)', backdropFilter: 'blur(6px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={onClose}>
	  <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '560px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px rgba(0,0,0,0.25)', direction: isAr ? 'rtl' : 'ltr' }} onClick={e => e.stopPropagation()}>
		{/* Header */}
		<div style={{ background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)', padding: '24px 28px', position: 'relative', flexShrink: 0 }}>
		  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
			<div style={{ background: 'rgba(255,255,255,0.15)', padding: '8px', borderRadius: '10px', color: '#c4b5fd' }}>{Icons.FileText}</div>
			<div>
			  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#fff' }}>{t.termsTitle}</h3>
			  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(196,181,253,0.8)', marginTop: '2px' }}>{t.termsEffective}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position: 'absolute', top: '16px', [isAr ? 'left' : 'right']: '16px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#c4b5fd' }}>
			{Icons.X}
		  </button>
		</div>
		{/* Scrollable body */}
		<div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>
		  {sections.map((s, i) => (
			<div key={i} style={{ marginBottom: '20px' }}>
			  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: '#4c1d95' }}>{s.title}</h4>
			  <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.7 }}>{s.body}</p>
			</div>
		  ))}
		  {/* Privacy sub-section */}
		  <div style={{ background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '14px 16px', marginTop: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
			<div style={{ color: '#a855f7', flexShrink: 0, marginTop: '2px' }}>{Icons.Lock}</div>
			<p style={{ margin: 0, fontSize: '12px', color: '#6d28d9', lineHeight: 1.6 }}>
			  {isAr
				? 'نحن لا نبيع بيانات المرضى أو نشاركها مع أطراف ثالثة. جميع البيانات مشفرة ومحمية وفق أعلى معايير الأمن السيبراني.'
				: 'We never sell or share patient data with third parties. All data is encrypted and protected according to the highest cybersecurity standards.'}
			</p>
		  </div>
		</div>
		{/* Footer */}
		<div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
		  <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #4c1d95, #a855f7)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
			{t.termsClose}
		  </button>
		</div>
	  </div>
	</div>
  );
}

// ─── MAIN COMPONENT ───
export default function Landing() {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', email: '', company: '', employees: '1-50' });
  const [activeTab, setActiveTab] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [dictationText, setDictationText] = useState('');
  const [scanStatus, setScanStatus] = useState('idle');

  const t = translations[lang];
  const isAr = lang === 'ar';

  // Heartbeat loader on mount
  useEffect(() => {
	const timer = setTimeout(() => setLoading(false), 2200);
	return () => clearTimeout(timer);
  }, []);

  const handleDemoRequest = async (e) => {
	e.preventDefault();
	setIsSubmitting(true);
	const adminPayload = {
	  action: 'sendEmail', to: TARGET_EMAIL,
	  subject: `New Care Lead: ${demoForm.company}`,
	  body: `NEW CARE DEMO REQUEST 🩺\n\nName: ${demoForm.name}\nEmail: ${demoForm.email}\nFacility: ${demoForm.company}\nBeds/Staff: ${demoForm.employees}`,
	  senderName: 'Operix Care', senderEmail: 'system@operix.com'
	};
	const userPayload = {
	  action: 'sendEmail', to: demoForm.email,
	  subject: `Request Confirmed - Operix Care`,
	  body: `Hello ${demoForm.name},\n\nThank you for your interest in Operix Care. Our team has received your details for ${demoForm.company}.\n\nAn executive will reach out to you shortly.\n\nBest regards,\nThe Operix Team`,
	  senderName: 'Operix Team', senderEmail: 'system@operix.com'
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
		if (i >= textToType.length) { clearInterval(interval); setIsListening(false); }
	  }, 40);
	}
  };

  const triggerScan = () => {
	setScanStatus('scanning');
	setTimeout(() => setScanStatus('complete'), 2000);
  };

  if (loading) return <HeartbeatLoader />;

  return (
	<div style={{
	  minHeight: '100vh',
	  background: '#fafafa',
	  color: '#111111',
	  direction: isAr ? 'rtl' : 'ltr',
	  fontFamily: isAr ? "'Noto Sans Arabic', system-ui, sans-serif" : "'Inter', system-ui, sans-serif"
	}}>

	  <style>{`
		* { box-sizing: border-box; }
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');

		.interactive-container { display: flex; flex-direction: column; gap: 24px; }
		@media (min-width: 900px) {
		  .interactive-container { flex-direction: row; }
		  .interactive-sidebar { width: 340px; flex-shrink: 0; }
		}
		.mockup-window {
		  flex: 1; border: 1px solid #e2e8f0; border-radius: 14px; background: #ffffff;
		  box-shadow: 0 10px 30px rgba(0,0,0,0.06); overflow: hidden; display: flex; flex-direction: column;
		}
		.mockup-header { display: flex; gap: 6px; padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
		.mockup-dot { width: 10px; height: 10px; border-radius: 50%; }
		.tab-btn {
		  display: flex; align-items: flex-start; gap: 16px; padding: 18px 20px; width: 100%;
		  text-align: ${isAr ? 'right' : 'left'}; background: transparent; border: 1px solid transparent;
		  border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 8px;
		}
		.tab-btn.active {
		  background: #ffffff; border-color: #fecdd3;
		  box-shadow: 0 4px 12px rgba(225,29,72,0.1);
		}
		.tab-btn:hover:not(.active) { background: #fdf2f8; }

		/* ECG Background decoration */
		.ecg-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.04; }

		/* Medical badge pill */
		.med-badge {
		  display: inline-flex; align-items: center; gap: 8px;
		  border: 1px solid #fecdd3; background: #fff1f2;
		  padding: 6px 14px; border-radius: 99px;
		  font-size: 12px; font-weight: 700; color: #e11d48; margin-bottom: 32px;
		}

		/* Heartbeat on tab icon */
		@keyframes heartbeat {
		  0%, 100% { transform: scale(1); }
		  15% { transform: scale(1.3); }
		  30% { transform: scale(0.95); }
		  45% { transform: scale(1.15); }
		}
		.beat { animation: heartbeat 1.4s ease-in-out infinite; }

		@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
		@keyframes scanline { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
		@keyframes pulse {
		  0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.5); }
		  70% { box-shadow: 0 0 0 12px rgba(225, 29, 72, 0); }
		  100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
		}
		.pulse-ring { animation: pulse 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
		@keyframes ecgScroll {
		  from { transform: translateX(0); }
		  to { transform: translateX(-50%); }
		}
		.ecg-scroll { animation: ecgScroll 8s linear infinite; }

		/* Footer */
		.footer-link { color: #94a3b8; font-size: 13px; text-decoration: none; font-weight: 500; transition: color 0.2s; }
		.footer-link:hover { color: #e11d48; }
		.contact-chip {
		  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
		  border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;
		  color: #475569; font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.2s;
		}
		.contact-chip:hover { border-color: #fecdd3; background: #fff1f2; color: #e11d48; }

		/* Vital stats row */
		.vital-card { text-align: center; padding: 28px 20px; }
		.vital-num {
		  font-size: 42px; font-weight: 900; letter-spacing: -2px; line-height: 1;
		  background: linear-gradient(135deg, #e11d48, #a855f7);
		  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
		}
		.vital-label { font-size: 13px; color: #64748b; font-weight: 600; margin-top: 6px; }

		/* Gradient hero text */
		.hero-grad {
		  background: linear-gradient(135deg, #e11d48 0%, #a855f7 60%, #3b82f6 100%);
		  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
		}

		/* Input focus */
		.med-input:focus { outline: none; border-color: #e11d48 !important; box-shadow: 0 0 0 3px rgba(225,29,72,0.1) !important; }
	  `}</style>

	  {/* ─── NAVBAR ─── */}
	  <nav style={{
		display: 'flex', justifyContent: 'space-between', alignItems: 'center',
		padding: '14px 32px', background: 'rgba(255,255,255,0.95)',
		backdropFilter: 'blur(12px)', borderBottom: '1px solid #f1f5f9',
		position: 'sticky', top: 0, zIndex: 100,
		boxShadow: '0 1px 20px rgba(0,0,0,0.05)'
	  }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
		  <img src={logoImg} alt="Operix" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'contain' }} />
		  <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>
			OPERIX <span style={{ background: 'linear-gradient(to right, #e11d48, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CARE</span>
		  </span>
		</div>

		<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
		  <button onClick={() => setLang(isAr ? 'en' : 'ar')} style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 10px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
			{Icons.Globe} {isAr ? 'EN' : 'AR'}
		  </button>
		  <button style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/subscription')}>
			{t.pricing}
		  </button>
		  <button
			onClick={() => setShowSupportModal(true)}
			style={{ background: 'transparent', border: '1px solid #fecdd3', borderRadius: '6px', padding: '6px 12px', color: '#e11d48', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
			{Icons.HelpCircle} {t.supportBtn}
		  </button>
		  <button style={{ background: 'transparent', border: 'none', color: '#0a0a0a', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => navigate('/login')}>
			{t.login}
		  </button>
		  <button style={{
			background: 'linear-gradient(135deg, #e11d48, #a855f7)', color: '#ffffff', border: 'none',
			padding: '9px 18px', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
			boxShadow: '0 4px 12px rgba(225,29,72,0.3)'
		  }} onClick={() => setShowDemoModal(true)}>
			{t.demoBtn}
		  </button>
		</div>
	  </nav>

	  {/* ─── HERO ─── */}
	  <header style={{ padding: '96px 24px 80px', textAlign: 'center', maxWidth: '860px', margin: '0 auto', position: 'relative' }}>
		{/* Decorative bg blobs */}
		<div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(225,29,72,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
		<div style={{ position: 'absolute', top: '40px', right: '-80px', width: '300px', height: '300px', background: 'radial-gradient(ellipse, rgba(168,85,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

		{/* Medical badge */}
		<div className="med-badge">
		  <span style={{ color: '#e11d48' }}>{Icons.Cross}</span>
		  {t.badge}
		  <span style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '4px' }}>
			<span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#e11d48', animation: 'heartbeat 1.4s ease-in-out infinite' }} />
			<span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#a855f7', animation: 'heartbeat 1.4s ease-in-out 0.2s infinite' }} />
			<span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#3b82f6', animation: 'heartbeat 1.4s ease-in-out 0.4s infinite' }} />
		  </span>
		</div>

		<h1 style={{ fontSize: '58px', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '24px', color: '#0a0a0a', position: 'relative' }}>
		  {t.heroTitle}
		  <span className="hero-grad">{t.heroHighlight}</span>
		</h1>

		<p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.65, maxWidth: '620px', margin: '0 auto 52px', fontWeight: 400 }}>
		  {t.heroSub}
		</p>

		<div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
		  <button style={{
			background: 'linear-gradient(135deg, #e11d48, #a855f7)', color: '#ffffff', border: 'none',
			padding: '15px 30px', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
			display: 'flex', alignItems: 'center', gap: '8px',
			boxShadow: '0 8px 24px rgba(225,29,72,0.35)'
		  }} onClick={() => setShowDemoModal(true)}>
			{t.demoBtn} {isAr ? Icons.ArrowLeft : Icons.ArrowRight}
		  </button>
		  <button style={{
			background: '#ffffff', color: '#0a0a0a', border: '1px solid #e2e8f0',
			padding: '15px 30px', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
			boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
		  }} onClick={() => navigate('/subscription')}>
			{t.pricing}
		  </button>
		</div>
	  </header>

	  {/* ─── VITALS STATS BAR ─── */}
	  <section style={{ background: '#ffffff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
		<div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
		  {[
			{ num: '500+', label: isAr ? 'منشأة طبية' : 'Healthcare Facilities' },
			{ num: '2M+', label: isAr ? 'سجل مريض' : 'Patient Records' },
			{ num: '99.9%', label: isAr ? 'وقت التشغيل' : 'System Uptime' },
			{ num: isAr ? 'مباشر' : 'Live', label: isAr ? 'الدعم الفني' : 'Clinical Support' },
		  ].map((v, i) => (
			<div key={i} className="vital-card" style={{ borderRight: i < 3 ? '1px solid #f1f5f9' : 'none' }}>
			  <div className="vital-num">{v.num}</div>
			  <div className="vital-label">{v.label}</div>
			</div>
		  ))}
		</div>
	  </section>

	  {/* ─── INTERACTIVE SECTION ─── */}
	  <section style={{ padding: '80px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
		<div style={{ maxWidth: '1100px', margin: '0 auto' }}>
		  <div style={{ marginBottom: '48px', textAlign: 'center' }}>
			<h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 8px 0', color: '#0a0a0a' }}>{t.pillarsTitle}</h2>
			<p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>{t.pillarsSub}</p>
		  </div>

		  <div className="interactive-container">
			<div className="interactive-sidebar">
			  {[
				{ id: 0, icon: Icons.Stethoscope, title: t.p1Title, desc: t.p1Desc, color: '#e11d48' },
				{ id: 1, icon: Icons.Mic, title: t.p2Title, desc: t.p2Desc, color: '#a855f7' },
				{ id: 2, icon: Icons.Shield, title: t.p3Title, desc: t.p3Desc, color: '#3b82f6' },
				{ id: 3, icon: Icons.Scan, title: t.p4Title, desc: t.p4Desc, color: '#10b981' },
			  ].map((tab) => (
				<button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
				  <div style={{ color: activeTab === tab.id ? tab.color : '#cbd5e1', transition: 'color 0.2s', ...(activeTab === tab.id ? { animation: 'heartbeat 1.4s ease-in-out infinite' } : {}) }}>
					{tab.icon}
				  </div>
				  <div style={{ textAlign: isAr ? 'right' : 'left' }}>
					<h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: activeTab === tab.id ? '#0a0a0a' : '#475569' }}>{tab.title}</h3>
					<p style={{ fontSize: '13px', margin: 0, color: '#94a3b8', lineHeight: 1.5 }}>{tab.desc}</p>
				  </div>
				</button>
			  ))}
			</div>

			<div className="mockup-window">
			  <div className="mockup-header" style={{ flexDirection: isAr ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
				<div style={{ display: 'flex', gap: '6px' }}>
				  <div className="mockup-dot" style={{ background: '#fca5a5' }} />
				  <div className="mockup-dot" style={{ background: '#fbbf24' }} />
				  <div className="mockup-dot" style={{ background: '#6ee7b7' }} />
				</div>
				{/* ECG mini in header */}
				<svg width="80" height="20" viewBox="0 0 80 20" style={{ opacity: 0.4 }}>
				  <path d="M0,10 L18,10 L22,2 L26,18 L30,6 L34,14 L38,10 L80,10" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round"/>
				</svg>
				<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
				  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#e11d48', animation: 'heartbeat 1.4s ease-in-out infinite' }} />
				  <span style={{ fontSize: '10px', fontWeight: 700, color: '#e11d48', letterSpacing: '0.5px' }}>LIVE</span>
				</div>
			  </div>

			  <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column' }}>
				{/* MOCKUP 1: CLINICAL PORTAL */}
				{activeTab === 0 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
					  <div>
						<h4 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#0a0a0a', fontWeight: 800 }}>{isAr ? 'د. سارة الأحمد' : 'Dr. Sarah Alahmad'}</h4>
						<p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>{isAr ? 'بوابة الطبيب - قسم الباطنية' : 'Doctor Portal – Internal Medicine'}</p>
					  </div>
					  <div style={{ background: '#fff1f2', color: '#e11d48', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '6px' }}>
						<span style={{ animation: 'heartbeat 1.4s ease-in-out infinite', display: 'flex' }}>{Icons.Heart}</span>
						{isAr ? 'مرضى اليوم: 12' : "Today's Patients: 12"}
					  </div>
					</div>
					<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: isAr ? 'right' : 'left' }}>
					  <thead>
						<tr style={{ borderBottom: '2px solid #f1f5f9' }}>
						  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isAr ? 'رقم الملف' : 'MRN'}</th>
						  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isAr ? 'المريض' : 'Patient'}</th>
						  <th style={{ padding: '10px 8px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isAr ? 'الحالة' : 'Status'}</th>
						</tr>
					  </thead>
					  <tbody>
						{[
						  { mrn: 'PT-88392', name: isAr ? 'خالد عبدالله' : 'Khalid Abdullah', status: 'Waiting' },
						  { mrn: 'PT-88393', name: isAr ? 'نورة سعد' : 'Noura Saad', status: 'In Consultation' },
						].map((row, i) => (
						  <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
							<td style={{ padding: '14px 8px', fontWeight: 700, color: '#94a3b8', fontFamily: 'monospace', fontSize: '13px' }}>{row.mrn}</td>
							<td style={{ padding: '14px 8px', fontWeight: 700, color: '#0a0a0a' }}>{row.name}</td>
							<td style={{ padding: '14px 8px' }}>
							  <span style={{
								padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
								background: row.status === 'Waiting' ? '#fff7ed' : '#fdf4ff',
								color: row.status === 'Waiting' ? '#c2410c' : '#a855f7',
								border: `1px solid ${row.status === 'Waiting' ? '#fed7aa' : '#e9d5ff'}`
							  }}>
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
					  <h4 style={{ margin: 0, fontSize: '18px', color: '#0a0a0a', fontWeight: 800 }}>{isAr ? 'الملاحظات السريرية' : 'Clinical Notes Dictation'}</h4>
					  <button
						onClick={toggleDictation}
						className={isListening ? 'pulse-ring' : ''}
						style={{
						  background: isListening ? 'linear-gradient(135deg, #e11d48, #be123c)' : 'linear-gradient(135deg, #a855f7, #7c3aed)',
						  color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px',
						  fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
						  boxShadow: isListening ? '0 4px 12px rgba(225,29,72,0.4)' : '0 4px 12px rgba(168,85,247,0.4)'
						}}>
						{Icons.Mic} {isListening ? (isAr ? 'جاري الاستماع...' : 'Listening...') : (isAr ? 'بدء التسجيل' : 'Start Dictation')}
					  </button>
					</div>
					<div style={{ border: '1px solid #e9d5ff', borderRadius: '10px', padding: '20px', minHeight: '150px', background: '#fdf4ff' }}>
					  {dictationText ? (
						<p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
						  {dictationText}<span style={{ opacity: isListening ? 1 : 0, transition: 'opacity 0.2s', color: '#a855f7' }}>|</span>
						</p>
					  ) : (
						<p style={{ margin: 0, fontSize: '14px', color: '#c4b5fd', fontStyle: 'italic' }}>
						  {isAr ? 'اضغط على زر التسجيل وتحدث لإضافة الملاحظات التلقائية...' : 'Press Start Dictation and speak to generate clinical notes...'}
						</p>
					  )}
					</div>
				  </div>
				)}

				{/* MOCKUP 3: ADMIN CONTROL */}
				{activeTab === 2 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<h4 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0a0a0a', fontWeight: 800 }}>{isAr ? 'لوحة التحكم الإدارية' : 'Admin Deletion Rights'}</h4>
					<div style={{ border: '1px solid #fecaca', background: '#fff5f5', padding: '16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
					  <div style={{ color: '#e11d48', flexShrink: 0 }}>{Icons.Shield}</div>
					  <div>
						<h5 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '13px', fontWeight: 700 }}>{isAr ? 'سجل الحذف الحساس' : 'Sensitive Deletion Log'}</h5>
						<p style={{ margin: 0, color: '#b91c1c', fontSize: '12px' }}>{isAr ? 'تتطلب السجلات أدناه تفويض الإدارة العُليا.' : 'Records below require higher management authorization.'}</p>
					  </div>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
					  <div>
						<p style={{ margin: '0 0 3px 0', fontWeight: 700, fontSize: '14px', color: '#0a0a0a' }}>{isAr ? 'طلب حذف سجل مريض' : 'Patient Record Deletion Request'}</p>
						<p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>MRN: PT-29188 | Requester: Dr. Ahmed</p>
					  </div>
					  <div style={{ display: 'flex', gap: '8px' }}>
						<button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '7px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}>{isAr ? 'رفض' : 'Deny'}</button>
						<button style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', border: 'none', padding: '7px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{isAr ? 'تأكيد الحذف' : 'Force Delete'}</button>
					  </div>
					</div>
				  </div>
				)}

				{/* MOCKUP 4: SMART ADMISSION (OCR) */}
				{activeTab === 3 && (
				  <div style={{ animation: 'fadeIn 0.3s' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
					  <h4 style={{ margin: 0, fontSize: '18px', color: '#0a0a0a', fontWeight: 800 }}>{isAr ? 'تسجيل دخول ذكي (OCR)' : 'Smart Admissions (OCR)'}</h4>
					  <button
						onClick={triggerScan}
						disabled={scanStatus !== 'idle'}
						style={{
						  background: scanStatus === 'idle' ? 'linear-gradient(135deg, #10b981, #059669)' : '#f1f5f9',
						  color: scanStatus === 'idle' ? '#fff' : '#94a3b8', border: 'none',
						  padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
						  cursor: scanStatus === 'idle' ? 'pointer' : 'default',
						  boxShadow: scanStatus === 'idle' ? '0 4px 12px rgba(16,185,129,0.35)' : 'none'
						}}>
						{scanStatus === 'idle' && (isAr ? 'مسح الهوية' : 'Scan ID Card')}
						{scanStatus === 'scanning' && (isAr ? 'جاري المسح...' : 'Scanning...')}
						{scanStatus === 'complete' && (isAr ? 'تم استخراج البيانات ✓' : 'Data Extracted ✓')}
					  </button>
					</div>
					<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
					  <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '10px', border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 600 }}>{isAr ? 'صورة الهوية' : '[ ID Card ]'}</div>
						{scanStatus === 'scanning' && (
						  <div style={{ position: 'absolute', width: '100%', height: '3px', background: 'linear-gradient(to right, transparent, #10b981, transparent)', animation: 'scanline 1s linear infinite', boxShadow: '0 0 10px #10b981' }} />
						)}
					  </div>
					  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						{[
						  { label: isAr ? 'الاسم الكامل' : 'Full Name', val: isAr ? 'يوسف محمد عبدالله' : 'Yousef Mohammed Abdullah' },
						  { label: isAr ? 'رقم الهوية' : 'National ID', val: '1088492019' },
						].map((f, i) => (
						  <div key={i}>
							<label style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
							<div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${scanStatus === 'complete' ? '#bbf7d0' : '#e2e8f0'}`, fontSize: '13px', color: scanStatus === 'complete' ? '#0a0a0a' : '#cbd5e1', fontWeight: 600, marginTop: '3px', transition: 'all 0.3s' }}>
							  {scanStatus === 'complete' ? f.val : '—'}
							</div>
						  </div>
						))}
					  </div>
					</div>
				  </div>
				)}
			  </div>
			</div>
		  </div>
		</div>
	  </section>

	  {/* ─── FOOTER ─── */}
	  <footer style={{ background: '#0a0a14', color: '#e2e8f0', padding: '64px 32px 0' }}>
		<div style={{ maxWidth: '1100px', margin: '0 auto' }}>
		  {/* Top row */}
		  <div style={{ display: 'grid', gridTemplateColumns: isAr ? 'repeat(4, 1fr)' : '2fr 1fr 1fr 1.5fr', gap: '40px', paddingBottom: '48px', borderBottom: '1px solid #1e293b' }}>

			{/* Brand column */}
			<div>
			  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
				<img src={logoImg} alt="OPERIX" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
				<span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.5px' }}>
				  OPERIX <span style={{ background: 'linear-gradient(to right, #e11d48, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CARE</span>
				</span>
			  </div>
			  <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.7, margin: '0 0 20px 0' }}>{t.footerTagline}</p>
			  {/* ECG decoration */}
			  <svg width="120" height="30" viewBox="0 0 120 30" style={{ opacity: 0.35 }}>
				<path d="M0,15 L30,15 L38,3 L45,27 L52,8 L58,22 L64,15 L120,15" fill="none" stroke="url(#fEcg)" strokeWidth="1.5" strokeLinecap="round"/>
				<defs>
				  <linearGradient id="fEcg" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" stopColor="#e11d48"/>
					<stop offset="100%" stopColor="#a855f7"/>
				  </linearGradient>
				</defs>
			  </svg>
			</div>

			{/* Product column */}
			<div>
			  <div style={{ fontSize: '11px', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{t.footerProduct}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				{t.footerLinks.map((link, i) => (
				  <a key={i} href="#" className="footer-link" onClick={i === 0 ? undefined : i === 1 ? () => navigate('/subscription') : i === 2 ? () => setShowDemoModal(true) : () => navigate('/login')}>
					{link}
				  </a>
				))}
			  </div>
			</div>

			{/* Company column */}
			<div>
			  <div style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{t.footerCompany}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
				{t.footerCompanyLinks.map((link, i) => (
				  <a key={i} href="https://www.operix-solutions.com" target="_blank" rel="noreferrer" className="footer-link">{link}</a>
				))}
			  </div>
			</div>

			{/* Contact column */}
			<div>
			  <div style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>{t.footerContact}</div>
			  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
				{[
				  { icon: Icons.Mail, val: 'info@operix-solutions.com', href: 'mailto:info@operix-solutions.com' },
				  { icon: Icons.Phone, val: 'support@operix-solutions.com', href: 'mailto:support@operix-solutions.com' },
				  { icon: Icons.FileText, val: 'subscription@operix-solutions.com', href: 'mailto:subscription@operix-solutions.com' },
				  { icon: Icons.Globe, val: 'www.operix-solutions.com', href: 'https://www.operix-solutions.com/about', ext: true },
				].map((c, i) => (
				  <a key={i} href={c.href} target={c.ext ? '_blank' : undefined} rel="noreferrer" className="contact-chip">
					<span style={{ color: '#64748b' }}>{c.icon}</span>
					<span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.val}</span>
					{c.ext && <span style={{ color: '#64748b', flexShrink: 0 }}>{Icons.ExternalLink}</span>}
				  </a>
				))}
			  </div>
			</div>
		  </div>

		  {/* Bottom bar */}
		  <div style={{ padding: '20px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
			<div>
			  <div style={{ color: '#475569', fontSize: '12px' }}>{t.footerRights}</div>
			  <div style={{ color: '#334155', fontSize: '11px', marginTop: '3px' }}>{t.footerVat}</div>
			</div>
			<div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
			  <button onClick={() => setShowTermsModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s' }}
				onMouseOver={e => e.currentTarget.style.color = '#a855f7'}
				onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
				{Icons.FileText} {isAr ? 'الشروط والخصوصية' : 'Terms & Privacy'}
			  </button>
			  <button onClick={() => setShowSupportModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', transition: 'color 0.2s' }}
				onMouseOver={e => e.currentTarget.style.color = '#e11d48'}
				onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
				{Icons.HelpCircle} {t.supportBtn}
			  </button>
			  {/* Heartbeat icon */}
			  <div style={{ color: '#e11d48', display: 'flex', alignItems: 'center', animation: 'heartbeat 1.4s ease-in-out infinite' }}>
				{Icons.Heart}
			  </div>
			</div>
		  </div>
		</div>
	  </footer>

	  {/* ─── DEMO MODAL ─── */}
	  {showDemoModal && (
		<div style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,30,0.75)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
		  <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>
			{/* Gradient header strip */}
			<div style={{ height: '4px', background: 'linear-gradient(to right, #e11d48, #a855f7, #3b82f6)' }} />
			<div style={{ padding: '32px' }}>
			  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
				<div>
				  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
					<span style={{ color: '#e11d48', animation: 'heartbeat 1.4s ease-in-out infinite', display: 'flex' }}>{Icons.Heart}</span>
					<h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0a0a0a' }}>{t.modalTitle}</h3>
				  </div>
				  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>{t.modalSub}</p>
				</div>
				<button onClick={() => setShowDemoModal(false)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
				  {Icons.X}
				</button>
			  </div>

			  <form onSubmit={handleDemoRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
				{[
				  { label: isAr ? 'الاسم' : 'Full Name', field: 'name', type: 'text' },
				  { label: isAr ? 'البريد الإلكتروني' : 'Work Email', field: 'email', type: 'email' },
				].map(({ label, field, type }) => (
				  <div key={field}>
					<label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
					<input
					  type={type}
					  className="med-input"
					  style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box', transition: 'all 0.2s' }}
					  value={demoForm[field]}
					  onChange={e => setDemoForm({ ...demoForm, [field]: e.target.value })}
					  required
					/>
				  </div>
				))}
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
				  <div>
					<label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isAr ? 'المنشأة الطبية' : 'Healthcare Facility'}</label>
					<input type="text" className="med-input" style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box', transition: 'all 0.2s' }} value={demoForm.company} onChange={e => setDemoForm({ ...demoForm, company: e.target.value })} required />
				  </div>
				  <div>
					<label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '6px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{isAr ? 'حجم المنشأة' : 'Facility Size'}</label>
					<select style={{ width: '100%', padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#0a0a0a', fontSize: '14px', boxSizing: 'border-box', cursor: 'pointer', transition: 'all 0.2s' }} value={demoForm.employees} onChange={e => setDemoForm({ ...demoForm, employees: e.target.value })}>
					  <option value="1-50">1 - 50 Beds</option>
					  <option value="51-200">51 - 200 Beds</option>
					  <option value="201-500">201 - 500 Beds</option>
					  <option value="500+">500+ Beds</option>
					</select>
				  </div>
				</div>

				<button
				  type="submit"
				  style={{ width: '100%', padding: '13px', background: isSubmitting ? '#e9d5ff' : 'linear-gradient(135deg, #e11d48, #a855f7)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: isSubmitting ? 'default' : 'pointer', marginTop: '8px', transition: 'all 0.2s', boxShadow: isSubmitting ? 'none' : '0 4px 12px rgba(225,29,72,0.3)' }}
				  disabled={isSubmitting}>
				  {isSubmitting ? (
					<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
					  <span style={{ animation: 'heartbeat 1.2s ease-in-out infinite', display: 'flex' }}>{Icons.Heart}</span>
					  {t.submitting}
					</span>
				  ) : t.submit}
				</button>
			  </form>
			</div>
		  </div>
		</div>
	  )}

	  {/* ─── SUPPORT MODAL ─── */}
	  {showSupportModal && <SupportModal t={t} isAr={isAr} onClose={() => setShowSupportModal(false)} />}

	  {/* ─── TERMS MODAL ─── */}
	  {showTermsModal && <TermsModal t={t} isAr={isAr} onClose={() => setShowTermsModal(false)} />}

	</div>
  );
}