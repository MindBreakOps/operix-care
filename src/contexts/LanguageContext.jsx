// src/contexts/LanguageContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: { 
	settings: "System Settings", profile: "My Profile", prefs: "Preferences", security: "Security", lang: "Language", theme: "Interface Theme", save: "Save", logout: "Log Out",
	nav_admin: "Command Center", nav_front: "Front Desk", nav_nurse: "Nursing Station", nav_doc: "Provider Workspace", nav_op: "Operating Board", nav_rx: "Pharmacy Queue", nav_hist: "Patient History", nav_appt: "Appointments", nav_myhealth: "My Health"
  },
  ar: { 
	settings: "إعدادات النظام", profile: "ملفي الشخصي", prefs: "التفضيلات", security: "الأمان", lang: "اللغة", theme: "مظهر الواجهة", save: "حفظ", logout: "تسجيل خروج",
	nav_admin: "مركز القيادة", nav_front: "الاستقبال", nav_nurse: "محطة التمريض", nav_doc: "مساحة الطبيب", nav_op: "لوحة العمليات", nav_rx: "صيدلية", nav_hist: "سجل المرضى", nav_appt: "المواعيد", nav_myhealth: "صحتي"
  },
  fr: { 
	settings: "Paramètres", profile: "Mon Profil", prefs: "Préférences", security: "Sécurité", lang: "Langue", theme: "Thème", save: "Enregistrer", logout: "Déconnexion",
	nav_admin: "Centre de Commande", nav_front: "Accueil", nav_nurse: "Station Infirmière", nav_doc: "Espace Médecin", nav_op: "Bloc Opératoire", nav_rx: "Pharmacie", nav_hist: "Dossier Patient", nav_appt: "Rendez-vous", nav_myhealth: "Ma Santé"
  },
  es: { 
	settings: "Configuración", profile: "Mi Perfil", prefs: "Preferencias", security: "Seguridad", lang: "Idioma", theme: "Tema", save: "Guardar", logout: "Cerrar sesión",
	nav_admin: "Centro de Mando", nav_front: "Recepción", nav_nurse: "Enfermería", nav_doc: "Espacio Médico", nav_op: "Quirófano", nav_rx: "Farmacia", nav_hist: "Historial Clínico", nav_appt: "Citas", nav_myhealth: "Mi Salud"
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('operix_lang') || 'en');

  useEffect(() => {
	localStorage.setItem('operix_lang', language);
	document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key) => translations[language][key] || key;

  return (
	<LanguageContext.Provider value={{ language, setLanguage, t }}>
	  {children}
	</LanguageContext.Provider>
  );
}

// THIS IS THE MISSING BINDING THAT CAUSED THE CRASH!
export const useLanguage = () => useContext(LanguageContext);