import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OPS_API  = 'https://script.google.com/macros/s/AKfycby7xDEoYBzGM7sAAAkX0LDTKNHo63LjbgmaC-0VLXESPFj7BSl10GE-sIqM-Ss3wE8/exec';
const DOCS_API = 'https://script.google.com/macros/s/AKfycbxX5si41SuQj-yhGsrexa8snsaT0VgoPw0EHo7GGE9AAbEN6uKTA4qpmA9jdQFJpEC_/exec';
const TARGET_EMAIL = 'operixsolution@gmail.com';
const VAT_RATE = 0.15;

// ─── USER TIER PLANS ───────────────────────────────────────────────────────────
// Single full package — price scales with number of user accounts
const USER_TIERS = [
  {
	key: 'starter',
	users: '1 – 5',
	usersAr: '١ – ٥',
	maxUsers: 5,
	label: { en: 'Starter', ar: 'المبتدئ' },
	tagline: { en: 'Clinics & small practices', ar: 'العيادات والممارسات الصغيرة' },
	priceMonthly: 1200,
	accent: '#10b981',   // emerald
	badge: null,
  },
  {
	key: 'clinic',
	users: '6 – 20',
	usersAr: '٦ – ٢٠',
	maxUsers: 20,
	label: { en: 'Clinic', ar: 'العيادة' },
	tagline: { en: 'Polyclinics & medical centers', ar: 'المراكز الطبية والعيادات المتعددة' },
	priceMonthly: 2800,
	accent: '#3b82f6',   // blue
	badge: null,
  },
  {
	key: 'hospital',
	users: '21 – 100',
	usersAr: '٢١ – ١٠٠',
	maxUsers: 100,
	label: { en: 'Hospital', ar: 'المستشفى' },
	tagline: { en: 'Mid-size hospitals & groups', ar: 'المستشفيات المتوسطة والمجموعات' },
	priceMonthly: 6500,
	accent: '#a855f7',   // purple
	badge: { en: 'Most Popular', ar: 'الأكثر طلباً' },
  },
  {
	key: 'enterprise',
	users: '101+',
	usersAr: '١٠١+',
	maxUsers: null,
	label: { en: 'Enterprise', ar: 'المؤسسي' },
	tagline: { en: 'Large hospital networks', ar: 'شبكات المستشفيات الكبرى' },
	priceMonthly: null,  // custom
	accent: '#e11d48',   // crimson
	badge: { en: 'Custom Quote', ar: 'سعر مخصص' },
  },
];

// Every tier includes the full OPERIX Care feature set
const ALL_FEATURES = {
  en: [
	{ cat: 'Clinical', items: ['Voice-to-Text Clinical Dictation', 'Smart Admissions & OCR Triage', 'Doctor & Nurse Portals', 'Patient History & Records', 'Encrypted PDF Patient Files'] },
	{ cat: 'Operations', items: ['Real-time Blood Bank Vault', 'Dynamic Pharmacy Cart & Billing', 'Diagnostic Queue Routing', 'Lab & Radiology Workflow'] },
	{ cat: 'Admin & HR', items: ['Role-Based Access Control', 'Employee Directory & Payroll', 'Financial Ledger & VAT Reports', 'ZATCA-Compliant Tax Invoices'] },
	{ cat: 'Platform', items: ['Arabic RTL & English UI', '99.9% Uptime SLA', 'Saudi-hosted Data Centers', '24 / 7 Priority Support'] },
  ],
  ar: [
	{ cat: 'سريري', items: ['الإملاء الصوتي للملاحظات السريرية', 'الدخول الذكي عبر OCR', 'بوابات الأطباء والممرضين', 'سجلات وتاريخ المرضى', 'ملفات PDF مشفرة للمرضى'] },
	{ cat: 'العمليات', items: ['بنك الدم الفوري', 'سلة الصيدلية والفواتير الآلية', 'توزيع قوائم التشخيص', 'سير عمل المختبرات والأشعة'] },
	{ cat: 'الإدارة والموارد البشرية', items: ['التحكم في الصلاحيات حسب الدور', 'دليل الموظفين وكشف الرواتب', 'دفتر الأستاذ المالي وتقارير ضريبة القيمة المضافة', 'فواتير ضريبية متوافقة مع زاتكا'] },
	{ cat: 'المنصة', items: ['واجهة عربية وإنجليزية', 'اتفاقية خدمة 99.9% وقت تشغيل', 'مراكز بيانات داخل المملكة', 'دعم فني على مدار الساعة'] },
  ],
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const Icon = {
  ArrowLeft: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  ArrowRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Users: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Heart: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  Mail: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  Shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Zap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Star: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  FileText: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  ExternalLink: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  HelpCircle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Lock: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  X: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  CreditCard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  Building: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="18" height="18" rx="1"/><path d="M10 3v4"/><path d="M14 3v4"/><path d="M10 11h4"/><path d="M10 15h4"/><path d="M2 7h18"/></svg>,
};

// ─── SUPPORT MODAL ────────────────────────────────────────────────────────────
function SupportModal({ isAr, onClose }) {
  const contacts = [
	{ icon: Icon.Mail,       label: isAr ? 'الاستفسارات العامة' : 'General Inquiries',  value: 'info@operix-solutions.com',         href: 'mailto:info@operix-solutions.com',         accent: '#e11d48' },
	{ icon: Icon.HelpCircle, label: isAr ? 'الدعم الفني'        : 'Technical Support',   value: 'support@operix-solutions.com',      href: 'mailto:support@operix-solutions.com',      accent: '#a855f7' },
	{ icon: Icon.CreditCard, label: isAr ? 'الاشتراكات'          : 'Subscriptions',       value: 'subscription@operix-solutions.com', href: 'mailto:subscription@operix-solutions.com', accent: '#3b82f6' },
	{ icon: Icon.Globe,      label: isAr ? 'الموقع الإلكتروني'  : 'Website',             value: 'www.operix-solutions.com',          href: 'https://www.operix-solutions.com',         accent: '#10b981', ext: true },
  ];
  return (
	<div style={{ position:'fixed', inset:0, background:'rgba(10,10,30,0.78)', backdropFilter:'blur(6px)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={onClose}>
	  <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'440px', overflow:'hidden', boxShadow:'0 32px 64px rgba(0,0,0,0.28)' }} onClick={e=>e.stopPropagation()}>
		<div style={{ background:'linear-gradient(135deg,#e11d48,#a855f7)', padding:'22px 26px 18px', position:'relative' }}>
		  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
			<div style={{ background:'rgba(255,255,255,0.2)', padding:'8px', borderRadius:'10px', color:'#fff' }}>{Icon.HelpCircle}</div>
			<div>
			  <h3 style={{ margin:0, fontSize:'17px', fontWeight:800, color:'#fff' }}>{isAr ? 'مركز الدعم' : 'Support Center'}</h3>
			  <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.75)', marginTop:'2px' }}>{isAr ? 'نحن هنا على مدار الساعة' : 'We\'re here 24 / 7 for you'}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position:'absolute', top:'14px', [isAr?'left':'right']:'14px', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'8px', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>{Icon.X}</button>
		</div>
		<div style={{ padding:'18px 24px 24px', display:'flex', flexDirection:'column', gap:'8px' }}>
		  {contacts.map((c,i)=>(
			<a key={i} href={c.href} target={c.ext?'_blank':undefined} rel="noreferrer"
			  style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'10px', border:`1px solid ${c.accent}22`, background:`${c.accent}08`, textDecoration:'none' }}>
			  <div style={{ background:`${c.accent}18`, color:c.accent, padding:'7px', borderRadius:'8px', display:'flex' }}>{c.icon}</div>
			  <div>
				<div style={{ fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>{c.label}</div>
				<div style={{ fontSize:'13px', fontWeight:700, color:c.accent, marginTop:'2px' }}>{c.value}</div>
			  </div>
			  {c.ext && <div style={{ marginLeft:'auto', color:'#94a3b8' }}>{Icon.ExternalLink}</div>}
			</a>
		  ))}
		  <button onClick={onClose} style={{ marginTop:'8px', width:'100%', padding:'11px', background:'linear-gradient(135deg,#e11d48,#a855f7)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
			{isAr ? 'إغلاق' : 'Close'}
		  </button>
		</div>
	  </div>
	</div>
  );
}

// ─── TERMS MODAL ──────────────────────────────────────────────────────────────
function TermsModal({ isAr, onClose }) {
  const sections = isAr ? [
	{ title:'١. القبول والاتفاقية', body:'باستخدامك منصة OPERIX Care فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت تستخدم المنصة نيابةً عن مؤسسة صحية فإن المؤسسة توافق أيضاً على هذه الشروط.' },
	{ title:'٢. استخدام المنصة', body:'يُسمح باستخدام OPERIX Care للأغراض الطبية والإدارية المشروعة فقط. يُحظر استخدام المنصة في أنشطة غير قانونية أو انتهاك خصوصية المرضى.' },
	{ title:'٣. الخصوصية وحماية البيانات', body:'نلتزم بسياسة صارمة لحماية البيانات وفقاً للوائح هيئة الصحة السعودية (CCHI) ومعايير HIPAA الدولية. يتم تشفير جميع بيانات المرضى وتخزينها في مراكز بيانات داخل المملكة.' },
	{ title:'٤. الاشتراكات والأسعار', body:'تُحتسب رسوم الاشتراك شهرياً أو سنوياً وفقاً للباقة المختارة وعدد المستخدمين. تخضع جميع الأسعار لضريبة القيمة المضافة 15%. يحق لأوبيريكس تعديل الأسعار مع إشعار مسبق مدته 30 يوماً.' },
	{ title:'٥. التعديلات على الشروط', body:'تحتفظ OPERIX Solutions بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني المسجل.' },
  ] : [
	{ title:'1. Acceptance & Agreement', body:'By using the OPERIX Care platform, you agree to comply with these Terms of Use. If you are using the platform on behalf of a healthcare organization, the organization also agrees to these terms.' },
	{ title:'2. Permitted Use', body:'OPERIX Care is authorized for lawful medical and administrative purposes only. Unauthorized access, data extraction, or use in illegal activities is strictly prohibited.' },
	{ title:'3. Privacy & Data Protection', body:'We are committed to strict data protection per Saudi CCHI regulations and international HIPAA standards. All patient data is encrypted and stored in certified Saudi-hosted data centers.' },
	{ title:'4. Subscriptions & Pricing', body:'Subscription fees are billed monthly or annually based on the selected user tier. All prices are subject to 15% VAT. OPERIX reserves the right to modify pricing with 30 days prior written notice.' },
	{ title:'5. Modifications to Terms', body:'OPERIX Solutions reserves the right to modify these Terms at any time. You will be notified of any material changes via your registered email address.' },
  ];
  return (
	<div style={{ position:'fixed', inset:0, background:'rgba(10,10,30,0.8)', backdropFilter:'blur(6px)', zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }} onClick={onClose}>
	  <div style={{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'540px', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 64px rgba(0,0,0,0.28)', direction:isAr?'rtl':'ltr' }} onClick={e=>e.stopPropagation()}>
		<div style={{ background:'linear-gradient(135deg,#1e1b4b,#4c1d95)', padding:'22px 26px', position:'relative', flexShrink:0 }}>
		  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
			<div style={{ background:'rgba(255,255,255,0.15)', padding:'8px', borderRadius:'10px', color:'#c4b5fd' }}>{Icon.FileText}</div>
			<div>
			  <h3 style={{ margin:0, fontSize:'16px', fontWeight:800, color:'#fff' }}>{isAr ? 'شروط الاستخدام وسياسة الخصوصية' : 'Terms of Use & Privacy Policy'}</h3>
			  <p style={{ margin:0, fontSize:'11px', color:'rgba(196,181,253,0.8)', marginTop:'2px' }}>{isAr ? 'تاريخ السريان: ١ يناير ٢٠٢٦' : 'Effective Date: January 1, 2026'}</p>
			</div>
		  </div>
		  <button onClick={onClose} style={{ position:'absolute', top:'14px', [isAr?'left':'right']:'14px', background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'30px', height:'30px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#c4b5fd' }}>{Icon.X}</button>
		</div>
		<div style={{ overflowY:'auto', padding:'22px 26px', flex:1 }}>
		  {sections.map((s,i)=>(
			<div key={i} style={{ marginBottom:'18px' }}>
			  <h4 style={{ margin:'0 0 6px 0', fontSize:'13px', fontWeight:700, color:'#4c1d95' }}>{s.title}</h4>
			  <p style={{ margin:0, fontSize:'13px', color:'#475569', lineHeight:1.7 }}>{s.body}</p>
			</div>
		  ))}
		  <div style={{ background:'#fdf4ff', border:'1px solid #e9d5ff', borderRadius:'10px', padding:'12px 14px', marginTop:'4px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
			<div style={{ color:'#a855f7', flexShrink:0, marginTop:'2px' }}>{Icon.Lock}</div>
			<p style={{ margin:0, fontSize:'12px', color:'#6d28d9', lineHeight:1.6 }}>
			  {isAr ? 'نحن لا نبيع بيانات المرضى أو نشاركها مع أطراف ثالثة. جميع البيانات مشفرة ومحمية.' : "We never sell or share patient data with third parties. All data is encrypted and protected."}
			</p>
		  </div>
		</div>
		<div style={{ padding:'14px 24px', borderTop:'1px solid #e2e8f0', flexShrink:0 }}>
		  <button onClick={onClose} style={{ width:'100%', padding:'11px', background:'linear-gradient(135deg,#4c1d95,#a855f7)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'14px', fontWeight:700, cursor:'pointer' }}>
			{isAr ? 'أوافق' : 'I Understand'}
		  </button>
		</div>
	  </div>
	</div>
  );
}

// ─── FEATURE TABLE COMPARISON ─────────────────────────────────────────────────
function FeatureTable({ isAr }) {
  const cats = ALL_FEATURES[isAr ? 'ar' : 'en'];
  return (
	<div style={{ maxWidth:'860px', margin:'0 auto', padding:'0 24px 80px' }}>
	  <h2 style={{ textAlign:'center', fontSize:'28px', fontWeight:800, letterSpacing:'-0.8px', color:'#0a0a0a', marginBottom:'6px' }}>
		{isAr ? 'كل ما تحتاجه — في كل الباقات' : 'Everything included — in every tier'}
	  </h2>
	  <p style={{ textAlign:'center', color:'#64748b', fontSize:'15px', marginBottom:'40px' }}>
		{isAr ? 'ليس عليك الاختيار بين الميزات. جميع الباقات تشمل المنصة الكاملة.' : 'You never choose between features. Every plan ships the full platform.'}
	  </p>
	  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px' }}>
		{cats.map((cat, ci) => (
		  <div key={ci} style={{ background:'#fff', border:'1px solid #f1f5f9', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
			<div style={{ fontSize:'10px', fontWeight:800, color:'#e11d48', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'6px' }}>
			  <span style={{ width:'18px', height:'2px', background:'linear-gradient(to right,#e11d48,#a855f7)', borderRadius:'2px', display:'inline-block' }} />
			  {cat.cat}
			</div>
			<ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'10px' }}>
			  {cat.items.map((f, fi) => (
				<li key={fi} style={{ display:'flex', alignItems:'flex-start', gap:'8px', fontSize:'13px', color:'#334155', fontWeight:500 }}>
				  <span style={{ color:'#10b981', marginTop:'1px', flexShrink:0 }}>{Icon.Check}</span>
				  {f}
				</li>
			  ))}
			</ul>
		  </div>
		))}
	  </div>
	</div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Subscription() {
  const navigate = useNavigate();
  const [lang, setLang]                 = useState('en');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedTier, setSelectedTier] = useState(null);   // tier key
  const [showModal, setShowModal]       = useState(false);
  const [showSupport, setShowSupport]   = useState(false);
  const [showTerms, setShowTerms]       = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData]         = useState({ name:'', email:'', company:'', facilitySize:'', message:'' });

  const isAr  = lang === 'ar';
  const t     = (en, ar) => isAr ? ar : en;

  // Price helpers
  const getPrice = (base) => billingCycle === 'yearly' ? Math.round(base * 0.8) : base;
  const addVat   = (price) => Math.round(price * (1 + VAT_RATE));

  const activeTier = selectedTier ? USER_TIERS.find(t => t.key === selectedTier) : null;

  // ── Checkout submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
	e.preventDefault();
	if (!selectedTier) return;
	setIsSubmitting(true);

	const tier  = USER_TIERS.find(t => t.key === selectedTier);
	const price = tier.priceMonthly ? getPrice(tier.priceMonthly) : null;
	const total = price ? addVat(price) : null;
	const cycle = billingCycle === 'yearly' ? t('Annual (20% off)', 'سنوي (خصم 20%)') : t('Monthly', 'شهري');
	const planLabel = `OPERIX Care – ${tier.label[lang]} (${tier.users} ${t('users', 'مستخدم')})`;

	const adminBody =
	  `NEW OPERIX CARE SUBSCRIPTION\n\n` +
	  `Contact : ${formData.name}\nEmail   : ${formData.email}\nCompany : ${formData.company}\nSize    : ${formData.facilitySize}\n\n` +
	  `Plan    : ${planLabel}\nCycle   : ${cycle}\n` +
	  (price ? `Subtotal: SAR ${price.toLocaleString()}\nVAT 15% : SAR ${Math.round(price*VAT_RATE).toLocaleString()}\nTotal   : SAR ${total.toLocaleString()} /mo\n` : `Price   : Custom Quote Requested\n`) +
	  (formData.message ? `\nMessage :\n${formData.message}` : '');

	const htmlQuote = `
<div style="font-family:sans-serif;max-width:620px;margin:0 auto;border:1px solid #1e1b4b;padding:40px;border-radius:16px;background:#0f0820;color:#f8fafc">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
	<h1 style="color:#fff;margin:0;font-size:24px">OPERIX Care</h1>
	<span style="background:linear-gradient(135deg,#e11d48,#a855f7);padding:4px 10px;border-radius:99px;font-size:11px;font-weight:700;color:#fff">SUBSCRIPTION</span>
  </div>
  <p style="color:#94a3b8;font-size:13px;margin-bottom:28px">${isAr ? 'عرض أسعار الاشتراك (شامل ضريبة القيمة المضافة 15%)' : 'Subscription Quotation (inc. 15% VAT)'}</p>
  <hr style="border:none;border-top:1px solid #1e293b;margin-bottom:24px"/>
  <table style="width:100%;border-collapse:collapse;font-size:14px;color:#f8fafc;margin-bottom:24px">
	<tr style="border-bottom:1px solid #1e293b"><td style="padding:12px 0;color:#94a3b8">${isAr?'الباقة':'Plan'}</td><td style="padding:12px 0;text-align:right;font-weight:700">${planLabel}</td></tr>
	<tr style="border-bottom:1px solid #1e293b"><td style="padding:12px 0;color:#94a3b8">${isAr?'دورة الفوترة':'Billing Cycle'}</td><td style="padding:12px 0;text-align:right">${cycle}</td></tr>
	<tr style="border-bottom:1px solid #1e293b"><td style="padding:12px 0;color:#94a3b8">${isAr?'المنشأة':'Facility'}</td><td style="padding:12px 0;text-align:right">${formData.company}</td></tr>
  </table>
  ${price ? `
  <div style="background:#1e1040;padding:20px;border-radius:12px">
	<div style="display:flex;justify-content:space-between;font-size:14px;color:#94a3b8;margin-bottom:8px"><span>${isAr?'المبلغ قبل الضريبة':'Subtotal'}</span><span>SAR ${price.toLocaleString()}</span></div>
	<div style="display:flex;justify-content:space-between;font-size:14px;color:#94a3b8;margin-bottom:12px"><span>${isAr?'ضريبة القيمة المضافة 15%':'VAT 15%'}</span><span>SAR ${Math.round(price*VAT_RATE).toLocaleString()}</span></div>
	<hr style="border:none;border-top:1px solid #2d2060"/>
	<div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#fff;margin-top:12px"><span>${isAr?'الإجمالي':'Grand Total'}</span><span style="background:linear-gradient(to right,#e11d48,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent">SAR ${total.toLocaleString()} /mo</span></div>
  </div>` : `<div style="background:#1e1040;padding:20px;border-radius:12px;text-align:center;color:#a855f7;font-weight:700;font-size:16px">${isAr?'سيتم إعداد عرض سعر مخصص من فريقنا':'Our team will prepare a custom quotation'}</div>`}
  <p style="color:#475569;font-size:12px;margin-top:28px">© 2026 OPERIX Solutions · operix-solutions.com</p>
</div>`;

	try {
	  await fetch(OPS_API,  { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body:JSON.stringify({ action:'sendEmail', to:TARGET_EMAIL, subject:`OPERIX Care Subscription – ${formData.company}`, body:adminBody }) });
	  await fetch(DOCS_API, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain'}, body:JSON.stringify({ action:'sendContract', email:formData.email, subject:t('Your OPERIX Care Subscription Quotation','عرض اشتراك أوبيريكس كير'), htmlBody:htmlQuote }) });
	  alert(t(`Quotation sent to ${formData.email}. Our team will be in touch shortly.`, `تم إرسال العرض إلى ${formData.email}. سيتواصل معك فريقنا قريباً.`));
	  setShowModal(false);
	  setFormData({ name:'', email:'', company:'', facilitySize:'', message:'' });
	} catch {
	  alert(t('Error sending request. Please try again.', 'حدث خطأ. يرجى المحاولة مرة أخرى.'));
	} finally {
	  setIsSubmitting(false);
	}
  };

  // ── Computed financials ──────────────────────────────────────────────────────
  const tierPrice = activeTier?.priceMonthly ? getPrice(activeTier.priceMonthly) : null;
  const tierVat   = tierPrice ? Math.round(tierPrice * VAT_RATE) : null;
  const tierTotal = tierPrice ? tierPrice + tierVat : null;

  return (
	<div style={{
	  minHeight:'100vh', background:'#f8fafc', color:'#111',
	  direction: isAr ? 'rtl' : 'ltr',
	  fontFamily: isAr ? "'Noto Sans Arabic',system-ui,sans-serif" : "'Inter',system-ui,sans-serif",
	}}>

	  {/* ── GLOBAL STYLES ─────────────────────────────────────────────────── */}
	  <style>{`
		@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Arabic:wght@400;500;600;700;800;900&display=swap');
		* { box-sizing:border-box; }
		@keyframes heartbeat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.3)} 30%{transform:scale(0.95)} 45%{transform:scale(1.15)} }
		@keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
		@keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
		@keyframes ecgDraw  {
		  0%  { stroke-dasharray:0 600; opacity:1; }
		  70% { stroke-dasharray:600 600; opacity:1; }
		  90% { opacity:0.3; }
		  100%{ stroke-dasharray:600 600; opacity:1; }
		}
		.tier-card { transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1); cursor:pointer; }
		.tier-card:hover:not(.selected) { transform:translateY(-4px); }
		.tier-card.selected { transform:translateY(-6px); }
		.med-input:focus { outline:none; border-color:#e11d48 !important; box-shadow:0 0 0 3px rgba(225,29,72,0.1) !important; }
		.footer-link { color:#94a3b8; font-size:12px; text-decoration:none; font-weight:500; }
		.footer-link:hover { color:#e11d48; }
		.contact-chip { display:flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid #e2e8f0;border-radius:7px;background:#f8fafc;color:#475569;font-size:11px;font-weight:600;text-decoration:none; }
		.contact-chip:hover { border-color:#fecdd3;background:#fff1f2;color:#e11d48; }
		.animate-in { animation: fadeUp 0.45s ease both; }
	  `}</style>

	  {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
	  <nav style={{
		display:'flex', justifyContent:'space-between', alignItems:'center',
		padding:'14px 32px', background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)',
		borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, zIndex:100,
		boxShadow:'0 1px 20px rgba(0,0,0,0.05)'
	  }}>
		<button onClick={()=>navigate('/')} style={{ background:'transparent', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'7px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'7px', fontSize:'13px', fontWeight:700, color:'#475569' }}>
		  {isAr ? Icon.ArrowRight : Icon.ArrowLeft} {t('Back to Platform','العودة للمنصة')}
		</button>
		<div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
		  <span style={{ color:'#e11d48', animation:'heartbeat 1.4s ease-in-out infinite', display:'flex' }}>{Icon.Heart}</span>
		  <span style={{ fontSize:'17px', fontWeight:900, letterSpacing:'-0.5px', color:'#0a0a0a' }}>
			OPERIX <span style={{ background:'linear-gradient(to right,#e11d48,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>CARE</span>
		  </span>
		</div>
		<div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
		  <button onClick={()=>setLang(isAr?'en':'ar')} style={{ background:'transparent', border:'1px solid #e2e8f0', borderRadius:'6px', padding:'6px 10px', color:'#64748b', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:600 }}>
			{Icon.Globe} {isAr?'EN':'AR'}
		  </button>
		  <button onClick={()=>setShowSupport(true)} style={{ background:'transparent', border:'1px solid #fecdd3', borderRadius:'6px', padding:'6px 12px', color:'#e11d48', fontWeight:600, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
			{Icon.HelpCircle} {t('Support','الدعم')}
		  </button>
		</div>
	  </nav>

	  {/* ── HERO HEADER ───────────────────────────────────────────────────── */}
	  <div style={{ background:'linear-gradient(180deg,#fff 0%,#f8fafc 100%)', borderBottom:'1px solid #f1f5f9', padding:'60px 24px 52px', textAlign:'center', position:'relative', overflow:'hidden' }}>
		{/* BG ECG */}
		<svg style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', opacity:0.04, pointerEvents:'none' }} width="900" height="80" viewBox="0 0 900 80">
		  <path d="M0,40 L180,40 L210,5 L235,75 L260,18 L280,62 L300,40 L900,40" fill="none" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" style={{ animation:'ecgDraw 2.5s ease-in-out infinite' }} />
		</svg>

		{/* Badge */}
		<div style={{ display:'inline-flex', alignItems:'center', gap:'8px', border:'1px solid #fecdd3', background:'#fff1f2', padding:'5px 14px', borderRadius:'99px', fontSize:'11px', fontWeight:700, color:'#e11d48', marginBottom:'22px' }}>
		  <span style={{ animation:'heartbeat 1.4s ease-in-out infinite', display:'flex' }}>{Icon.Heart}</span>
		  {t('OPERIX Care — Full Clinical Platform','أوبيريكس كير — المنصة الطبية الكاملة')}
		</div>

		<h1 style={{ fontSize:isAr?'38px':'44px', fontWeight:900, letterSpacing:'-1.5px', margin:'0 0 14px', lineHeight:1.08, color:'#0a0a0a' }}>
		  {t('One platform. Every role.','منصة واحدة. كل الأدوار.')}<br/>
		  <span style={{ background:'linear-gradient(135deg,#e11d48,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
			{t('Priced by your team size.','السعر حسب حجم فريقك.')}
		  </span>
		</h1>
		<p style={{ color:'#64748b', fontSize:'16px', maxWidth:'560px', margin:'0 auto 36px', lineHeight:1.65 }}>
		  {t('Every subscription includes the complete OPERIX Care feature set — clinical, operational, administrative. The only variable is the number of user accounts.',
			 'كل اشتراك يشمل المنصة الكاملة — سريري، تشغيلي، إداري. المتغير الوحيد هو عدد حسابات المستخدمين.')}
		</p>

		{/* Billing toggle */}
		<div style={{ display:'inline-flex', padding:'4px', borderRadius:'12px', border:'1px solid #e2e8f0', background:'#fff', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', gap:'2px' }}>
		  {['monthly','yearly'].map(cy=>(
			<button key={cy} onClick={()=>setBillingCycle(cy)} style={{
			  padding:'9px 22px', borderRadius:'9px', fontSize:'13px', fontWeight:700,
			  border:'none', cursor:'pointer', transition:'all 0.2s',
			  background: billingCycle===cy ? 'linear-gradient(135deg,#e11d48,#a855f7)' : 'transparent',
			  color: billingCycle===cy ? '#fff' : '#64748b',
			  boxShadow: billingCycle===cy ? '0 4px 10px rgba(225,29,72,0.3)' : 'none',
			}}>
			  {cy==='monthly' ? t('Monthly','شهري') : (
				<span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
				  {t('Annual','سنوي')}
				  <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:'99px', padding:'2px 8px', fontSize:'10px', fontWeight:800 }}>{t('–20%','خصم 20%')}</span>
				</span>
			  )}
			</button>
		  ))}
		</div>
	  </div>

	  {/* ── TIER CARDS ────────────────────────────────────────────────────── */}
	  <section style={{ padding:'52px 24px 20px', maxWidth:'1140px', margin:'0 auto' }}>
		<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'20px' }}>
		  {USER_TIERS.map((tier) => {
			const price    = tier.priceMonthly ? getPrice(tier.priceMonthly) : null;
			const total    = price ? addVat(price) : null;
			const isActive = selectedTier === tier.key;
			return (
			  <div
				key={tier.key}
				className={`tier-card${isActive?' selected':''} animate-in`}
				onClick={()=>setSelectedTier(tier.key)}
				style={{
				  background:'#fff', borderRadius:'20px', overflow:'hidden',
				  border: isActive ? `2px solid ${tier.accent}` : '2px solid #f1f5f9',
				  boxShadow: isActive ? `0 16px 48px ${tier.accent}28` : '0 4px 16px rgba(0,0,0,0.05)',
				  position:'relative', display:'flex', flexDirection:'column',
				}}
			  >
				{/* Top accent bar */}
				<div style={{ height:'4px', background: isActive ? tier.accent : '#f1f5f9', transition:'background 0.3s' }} />

				{/* Badge */}
				{tier.badge && (
				  <div style={{ position:'absolute', top:'16px', [isAr?'left':'right']:'16px',
					background: tier.key==='enterprise' ? 'linear-gradient(135deg,#e11d48,#be123c)' : 'linear-gradient(135deg,#a855f7,#7c3aed)',
					color:'#fff', fontSize:'10px', fontWeight:800, padding:'3px 10px', borderRadius:'99px', letterSpacing:'0.5px'
				  }}>
					{tier.badge[lang]}
				  </div>
				)}

				<div style={{ padding:'24px 24px 20px' }}>
				  {/* Icon + label */}
				  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
					<div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${tier.accent}15`, display:'flex', alignItems:'center', justifyContent:'center', color:tier.accent, flexShrink:0 }}>
					  {Icon.Users}
					</div>
					<div>
					  <div style={{ fontSize:'16px', fontWeight:800, color:'#0a0a0a' }}>{tier.label[lang]}</div>
					  <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:500, marginTop:'1px' }}>{tier.tagline[lang]}</div>
					</div>
				  </div>

				  {/* Users range pill */}
				  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${tier.accent}10`, border:`1px solid ${tier.accent}30`, borderRadius:'8px', padding:'6px 12px', marginBottom:'20px' }}>
					<span style={{ color:tier.accent }}>{Icon.Users}</span>
					<span style={{ fontSize:'13px', fontWeight:700, color:tier.accent }}>
					  {isAr ? tier.usersAr : tier.users} {t('users','مستخدم')}
					</span>
				  </div>

				  {/* Price */}
				  {price ? (
					<div style={{ marginBottom:'20px' }}>
					  <div style={{ display:'flex', alignItems:'baseline', gap:'4px' }}>
						<span style={{ fontSize:'13px', fontWeight:700, color:'#94a3b8' }}>SAR</span>
						<span style={{ fontSize:'40px', fontWeight:900, letterSpacing:'-2px', color:'#0a0a0a', lineHeight:1 }}>
						  {price.toLocaleString()}
						</span>
						<span style={{ fontSize:'12px', fontWeight:600, color:'#94a3b8' }}>{t('/mo','/ شهر')}</span>
					  </div>
					  <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px' }}>
						{t('SAR','ريال')} {total?.toLocaleString()} {t('incl. 15% VAT','شامل ضريبة 15%')}
					  </div>
					  {billingCycle==='yearly' && (
						<div style={{ fontSize:'11px', color:'#64748b', marginTop:'3px', textDecoration:'line-through' }}>
						  {t('SAR','ريال')} {tier.priceMonthly.toLocaleString()} {t('/mo (monthly rate)','/ شهر (السعر الشهري)')}
						</div>
					  )}
					</div>
				  ) : (
					<div style={{ marginBottom:'20px' }}>
					  <div style={{ fontSize:'32px', fontWeight:900, color:'#0a0a0a', letterSpacing:'-1px', lineHeight:1 }}>
						{t('Custom','مخصص')}
					  </div>
					  <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'5px' }}>
						{t('Tailored to your network','مصمم لشبكتك')}
					  </div>
					</div>
				  )}

				  {/* CTA button */}
				  <button
					onClick={(e)=>{ e.stopPropagation(); setSelectedTier(tier.key); setShowModal(true); }}
					style={{
					  width:'100%', padding:'11px', borderRadius:'10px', fontSize:'13px', fontWeight:700,
					  border:'none', cursor:'pointer', transition:'all 0.2s',
					  background: isActive ? tier.accent : `${tier.accent}12`,
					  color: isActive ? '#fff' : tier.accent,
					  boxShadow: isActive ? `0 4px 12px ${tier.accent}40` : 'none',
					}}>
					{tier.priceMonthly ? t('Get Started','ابدأ الآن') : t('Request Quote','طلب عرض سعر')}
				  </button>
				</div>

				{/* Selection ring indicator */}
				{isActive && (
				  <div style={{ margin:'0 24px 20px', display:'flex', alignItems:'center', gap:'6px', color:tier.accent, fontSize:'12px', fontWeight:700 }}>
					<div style={{ width:'8px', height:'8px', borderRadius:'50%', background:tier.accent, animation:'heartbeat 1.4s ease-in-out infinite' }} />
					{t('Selected plan','الباقة المختارة')}
				  </div>
				)}
			  </div>
			);
		  })}
		</div>

		{/* Savings callout for yearly */}
		{billingCycle==='yearly' && (
		  <div style={{ marginTop:'20px', textAlign:'center', padding:'12px 20px', background:'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.06))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'12px', fontSize:'13px', fontWeight:600, color:'#059669', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
			{Icon.Zap}
			{t('Annual billing saves you up to SAR 15,600 per year on the Hospital plan.','الفوترة السنوية توفر لك حتى 15,600 ريال سنوياً على باقة المستشفى.')}
		  </div>
		)}
	  </section>

	  {/* ── FEATURE TABLE ─────────────────────────────────────────────────── */}
	  <FeatureTable isAr={isAr} />

	  {/* ── TRUST BAR ─────────────────────────────────────────────────────── */}
	  <section style={{ background:'#fff', borderTop:'1px solid #f1f5f9', borderBottom:'1px solid #f1f5f9', padding:'28px 24px', marginBottom:'0' }}>
		<div style={{ maxWidth:'860px', margin:'0 auto', display:'flex', justifyContent:'center', gap:'32px', flexWrap:'wrap', alignItems:'center' }}>
		  {[
			{ icon:Icon.Shield,  label:t('Saudi-hosted data','بيانات داخل المملكة') },
			{ icon:Icon.Lock,    label:t('HIPAA + CCHI compliant','متوافق مع HIPAA و CCHI') },
			{ icon:Icon.Zap,     label:t('99.9% uptime SLA','اتفاقية 99.9% وقت تشغيل') },
			{ icon:Icon.Users,   label:t('24/7 clinical support','دعم سريري على مدار الساعة') },
			{ icon:Icon.FileText,label:t('ZATCA tax invoices','فواتير ضريبية متوافقة مع زاتكا') },
		  ].map((item,i)=>(
			<div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', fontWeight:600, color:'#475569' }}>
			  <span style={{ color:'#e11d48' }}>{item.icon}</span> {item.label}
			</div>
		  ))}
		</div>
	  </section>

	  {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
	  <footer style={{ background:'#0a0a14', color:'#e2e8f0', padding:'52px 32px 0' }}>
		<div style={{ maxWidth:'1100px', margin:'0 auto' }}>
		  <div style={{ display:'grid', gridTemplateColumns: isAr ? 'repeat(3,1fr)' : '2fr 1fr 1.6fr', gap:'40px', paddingBottom:'40px', borderBottom:'1px solid #1e293b' }}>

			{/* Brand */}
			<div>
			  <div style={{ fontSize:'17px', fontWeight:900, letterSpacing:'-0.5px', marginBottom:'12px' }}>
				OPERIX <span style={{ background:'linear-gradient(to right,#e11d48,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>CARE</span>
			  </div>
			  <p style={{ color:'#64748b', fontSize:'13px', lineHeight:1.7, margin:'0 0 18px' }}>
				{t('Powering the future of clinical care in the Arab world.','نبني مستقبل الرعاية الصحية الرقمية في العالم العربي.')}
			  </p>
			  <svg width="100" height="24" viewBox="0 0 100 24" style={{ opacity:0.3 }}>
				<path d="M0,12 L22,12 L30,2 L37,22 L43,7 L48,17 L53,12 L100,12" fill="none" stroke="url(#fG)" strokeWidth="1.5" strokeLinecap="round"/>
				<defs><linearGradient id="fG" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#e11d48"/><stop offset="100%" stopColor="#a855f7"/></linearGradient></defs>
			  </svg>
			</div>

			{/* Links */}
			<div>
			  <div style={{ fontSize:'10px', fontWeight:800, color:'#e11d48', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px' }}>{t('Platform','المنصة')}</div>
			  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
				{[
				  { label:t('Features','المميزات'),          fn:()=>navigate('/') },
				  { label:t('Pricing','الأسعار'),             fn:()=>{} },
				  { label:t('Book a Demo','طلب عرض'),        fn:()=>setShowModal(true) },
				  { label:t('Login','تسجيل الدخول'),         fn:()=>navigate('/login') },
				].map((l,i)=>(
				  <button key={i} onClick={l.fn} style={{ background:'none', border:'none', cursor:'pointer', padding:0, textAlign:isAr?'right':'left' }} className="footer-link">{l.label}</button>
				))}
			  </div>
			</div>

			{/* Contact */}
			<div>
			  <div style={{ fontSize:'10px', fontWeight:800, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px' }}>{t('Contact','التواصل')}</div>
			  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
				{[
				  { icon:Icon.Mail,       val:'info@operix-solutions.com',         href:'mailto:info@operix-solutions.com' },
				  { icon:Icon.HelpCircle, val:'support@operix-solutions.com',      href:'mailto:support@operix-solutions.com' },
				  { icon:Icon.CreditCard, val:'subscription@operix-solutions.com', href:'mailto:subscription@operix-solutions.com' },
				  { icon:Icon.Globe,      val:'www.operix-solutions.com',          href:'https://www.operix-solutions.com', ext:true },
				].map((c,i)=>(
				  <a key={i} href={c.href} target={c.ext?'_blank':undefined} rel="noreferrer" className="contact-chip">
					<span style={{ color:'#64748b' }}>{c.icon}</span>
					<span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.val}</span>
					{c.ext && <span style={{ color:'#64748b' }}>{Icon.ExternalLink}</span>}
				  </a>
				))}
			  </div>
			</div>
		  </div>

		  {/* Bottom bar */}
		  <div style={{ padding:'18px 0 22px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
			<div>
			  <div style={{ color:'#475569', fontSize:'12px' }}>© 2026 OPERIX Solutions. {t('All rights reserved.','جميع الحقوق محفوظة.')}</div>
			  <div style={{ color:'#334155', fontSize:'11px', marginTop:'2px' }}>{t('VAT Reg. No: 310XXXXXXXXX | Riyadh, Saudi Arabia','الرقم الضريبي: 310XXXXXXXXX | الرياض، المملكة العربية السعودية')}</div>
			</div>
			<div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
			  <button onClick={()=>setShowTerms(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'12px', fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }} className="footer-link">
				{Icon.FileText} {t('Terms & Privacy','الشروط والخصوصية')}
			  </button>
			  <button onClick={()=>setShowSupport(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b', fontSize:'12px', fontWeight:600, display:'flex', alignItems:'center', gap:'5px' }} className="footer-link">
				{Icon.HelpCircle} {t('Support','الدعم')}
			  </button>
			  <span style={{ color:'#e11d48', animation:'heartbeat 1.4s ease-in-out infinite', display:'flex' }}>{Icon.Heart}</span>
			</div>
		  </div>
		</div>
	  </footer>

	  {/* ── STICKY CHECKOUT BAR ───────────────────────────────────────────── */}
	  {selectedTier && (
		<div style={{
		  position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)',
		  zIndex:50, width:'calc(100% - 48px)', maxWidth:'840px',
		  background:'linear-gradient(135deg,#0f0820,#1a0a2e)',
		  border:'1px solid rgba(168,85,247,0.25)', borderRadius:'20px',
		  padding:'18px 28px', display:'flex', alignItems:'center', justifyContent:'space-between',
		  boxShadow:'0 20px 60px rgba(0,0,0,0.35)', backdropFilter:'blur(12px)',
		  flexWrap:'wrap', gap:'14px',
		}}>
		  <div>
			<div style={{ fontSize:'12px', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>
			  {t('Selected Plan','الباقة المختارة')} · OPERIX Care
			</div>
			<div style={{ display:'flex', alignItems:'baseline', gap:'8px', flexWrap:'wrap' }}>
			  <span style={{ color:'#fff', fontWeight:900, fontSize:'22px', letterSpacing:'-0.5px' }}>
				{activeTier?.label[lang]} — {isAr ? activeTier?.usersAr : activeTier?.users} {t('users','مستخدم')}
			  </span>
			  {tierTotal ? (
				<span style={{ color:'#a78bfa', fontSize:'14px', fontWeight:700 }}>
				  SAR {tierTotal.toLocaleString()} {t('/mo incl. VAT','/شهر شامل الضريبة')}
				</span>
			  ) : (
				<span style={{ color:'#f43f5e', fontSize:'13px', fontWeight:700 }}>{t('Custom Quote','سعر مخصص')}</span>
			  )}
			</div>
		  </div>
		  <button
			onClick={()=>setShowModal(true)}
			style={{
			  background:'linear-gradient(135deg,#e11d48,#a855f7)', color:'#fff',
			  border:'none', padding:'13px 28px', borderRadius:'12px', fontSize:'14px',
			  fontWeight:800, cursor:'pointer', whiteSpace:'nowrap',
			  boxShadow:'0 6px 20px rgba(225,29,72,0.45)', flexShrink:0
			}}>
			{activeTier?.priceMonthly ? t('Proceed to Checkout','المتابعة للدفع') : t('Request Custom Quote','طلب عرض سعر')}
		  </button>
		</div>
	  )}

	  {/* ── CHECKOUT MODAL ────────────────────────────────────────────────── */}
	  {showModal && selectedTier && (
		<div style={{ position:'fixed', inset:0, background:'rgba(10,10,30,0.8)', backdropFilter:'blur(5px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
		  <div style={{ background:'#fff', borderRadius:'22px', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(0,0,0,0.3)' }}>

			{/* Gradient strip */}
			<div style={{ height:'4px', background:`linear-gradient(to right,#e11d48,${activeTier?.accent||'#a855f7'},#3b82f6)`, flexShrink:0 }} />

			{/* Header */}
			<div style={{ padding:'24px 28px 18px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
			  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
				<div>
				  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
					<span style={{ color:'#e11d48', animation:'heartbeat 1.4s ease-in-out infinite', display:'flex' }}>{Icon.Heart}</span>
					<h3 style={{ margin:0, fontSize:'19px', fontWeight:800, color:'#0a0a0a' }}>
					  {activeTier?.priceMonthly ? t('Complete Subscription','إتمام الاشتراك') : t('Request a Quote','طلب عرض سعر')}
					</h3>
				  </div>
				  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'6px', flexWrap:'wrap' }}>
					<span style={{ background:`${activeTier?.accent}15`, color:activeTier?.accent, border:`1px solid ${activeTier?.accent}30`, padding:'3px 10px', borderRadius:'99px', fontSize:'11px', fontWeight:700 }}>
					  {activeTier?.label[lang]}
					</span>
					<span style={{ fontSize:'12px', color:'#94a3b8', fontWeight:600 }}>
					  {isAr ? activeTier?.usersAr : activeTier?.users} {t('users','مستخدم')}
					</span>
					{tierTotal && (
					  <span style={{ fontSize:'12px', color:'#0a0a0a', fontWeight:700 }}>
						· SAR {tierTotal.toLocaleString()} {t('/mo','/ شهر')}
					  </span>
					)}
				  </div>
				</div>
				<button onClick={()=>setShowModal(false)} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#94a3b8', flexShrink:0 }}>
				  {Icon.X}
				</button>
			  </div>
			</div>

			{/* Scrollable form body */}
			<div style={{ overflowY:'auto', flex:1 }}>
			  <form onSubmit={handleSubmit} style={{ padding:'22px 28px', display:'flex', flexDirection:'column', gap:'14px' }}>

				<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
				  {[
					{ label:t('Full Name','الاسم الكامل'),         field:'name',        type:'text' },
					{ label:t('Work Email','البريد الإلكتروني'),    field:'email',       type:'email' },
					{ label:t('Healthcare Facility','المنشأة الطبية'), field:'company',   type:'text' },
					{ label:t('Facility Size (beds)','حجم المنشأة (أسرة)'), field:'facilitySize', type:'text', placeholder:t('e.g. 120 beds','مثال: 120 سريراً') },
				  ].map(({ label, field, type, placeholder })=>(
					<div key={field}>
					  <label style={{ display:'block', fontSize:'10px', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>{label}</label>
					  <input
						type={type}
						placeholder={placeholder||''}
						value={formData[field]}
						onChange={e=>setFormData({...formData,[field]:e.target.value})}
						required={field!=='facilitySize'}
						className="med-input"
						style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', background:'#f8fafc', color:'#0a0a0a', fontSize:'13px', transition:'all 0.2s' }}
					  />
					</div>
				  ))}
				</div>

				<div>
				  <label style={{ display:'block', fontSize:'10px', fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'5px' }}>
					{t('Additional Notes (optional)','ملاحظات إضافية (اختياري)')}
				  </label>
				  <textarea
					value={formData.message}
					onChange={e=>setFormData({...formData,message:e.target.value})}
					rows={3}
					className="med-input"
					placeholder={t('Any specific requirements or questions...','أي متطلبات أو أسئلة خاصة...')}
					style={{ width:'100%', padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:'8px', background:'#f8fafc', color:'#0a0a0a', fontSize:'13px', resize:'vertical', transition:'all 0.2s', fontFamily:'inherit' }}
				  />
				</div>

				{/* Order summary card */}
				<div style={{ background:'linear-gradient(135deg,#0f0820,#1a0a2e)', borderRadius:'12px', padding:'18px 20px', color:'#fff' }}>
				  <div style={{ fontSize:'10px', fontWeight:800, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.08)', paddingBottom:'10px' }}>
					{t('Order Summary','ملخص الطلب')}
				  </div>
				  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'8px', color:'rgba(255,255,255,0.75)' }}>
					<span>OPERIX Care — {activeTier?.label[lang]}</span>
					<span>{isAr ? activeTier?.usersAr : activeTier?.users} {t('users','مستخدم')}</span>
				  </div>
				  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>
					<span>{t('Billing','الفوترة')}</span>
					<span>{billingCycle==='yearly' ? t('Annual (–20%)','سنوي (خصم 20%)') : t('Monthly','شهري')}</span>
				  </div>
				  {tierPrice ? (
					<>
					  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b', marginBottom:'6px' }}>
						<span>{t('Subtotal','المبلغ')}</span><span>SAR {tierPrice.toLocaleString()}</span>
					  </div>
					  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#64748b', marginBottom:'10px' }}>
						<span>{t('VAT 15%','ضريبة 15%')}</span><span>SAR {tierVat?.toLocaleString()}</span>
					  </div>
					  <div style={{ display:'flex', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
						<span style={{ fontSize:'13px', fontWeight:700, color:'#fff' }}>{t('Grand Total /mo','الإجمالي / شهر')}</span>
						<span style={{ fontSize:'18px', fontWeight:900, background:'linear-gradient(to right,#e11d48,#a855f7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
						  SAR {tierTotal?.toLocaleString()}
						</span>
					  </div>
					</>
				  ) : (
					<div style={{ textAlign:'center', padding:'10px', color:'#a855f7', fontWeight:700, fontSize:'14px' }}>
					  {t('Custom enterprise pricing','تسعير مؤسسي مخصص')}
					</div>
				  )}
				</div>

				<button
				  type="submit"
				  disabled={isSubmitting}
				  style={{
					width:'100%', padding:'14px',
					background: isSubmitting ? '#e9d5ff' : 'linear-gradient(135deg,#e11d48,#a855f7)',
					color:'#fff', border:'none', borderRadius:'12px',
					fontSize:'14px', fontWeight:800, cursor: isSubmitting?'default':'pointer',
					boxShadow: isSubmitting?'none':'0 6px 20px rgba(225,29,72,0.35)',
					display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
					transition:'all 0.2s',
				  }}>
				  {isSubmitting ? (
					<><span style={{ animation:'heartbeat 1.2s ease-in-out infinite', display:'flex' }}>{Icon.Heart}</span> {t('Sending…','جاري الإرسال…')}</>
				  ) : (
					activeTier?.priceMonthly ? t('Confirm & Send Quotation','تأكيد وإرسال العرض') : t('Send Quote Request','إرسال طلب العرض')
				  )}
				</button>

				<p style={{ textAlign:'center', fontSize:'11px', color:'#94a3b8', margin:'0', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
				  {Icon.Lock} {t('Your information is secure and never shared.','معلوماتك آمنة ولن تُشارك مع أي طرف.')}
				</p>
			  </form>
			</div>
		  </div>
		</div>
	  )}

	  {/* ── SUPPORT / TERMS MODALS ────────────────────────────────────────── */}
	  {showSupport && <SupportModal isAr={isAr} onClose={()=>setShowSupport(false)} />}
	  {showTerms   && <TermsModal  isAr={isAr} onClose={()=>setShowTerms(false)}   />}

	</div>
  );
}