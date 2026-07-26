import { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import te from '../i18n/te.json';

const LanguageContext = createContext();
const translations = { en, te };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('svlogics-lang') || 'en');

  useEffect(() => {
    localStorage.setItem('svlogics-lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) { val = val?.[k]; }
    return val || key;
  };

  const toggleLang = () => setLang(l => l === 'en' ? 'te' : 'en');

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, isTelugu: lang === 'te' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLang = () => useContext(LanguageContext);
