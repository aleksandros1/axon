'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Εισαγωγή όλων των λεξικών
import en from './en.json';
import el from './el.json';
import ar from './ar.json';
import it from './it.json';
import es from './es.json';
import tr from './tr.json';
import zh from './zh.json';
import pt from './pt.json';

const translations: Record<string, any> = { en, el, ar, it, es, tr, zh, pt };

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('en'); // Προεπιλογή τα Αγγλικά

  useEffect(() => {
    // Φόρτωση της γλώσσας του χρήστη αν υπάρχει αποθηκευμένη
    const savedLang = localStorage.getItem('axon_language');
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('axon_language', lang); // Αποθήκευση επιλογής
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[language];
    
    // Πλοήγηση μέσα στο JSON (π.χ. "menu.portfolio")
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback: Αν λείπει κάτι στη μετάφραση, δείξε το στα Αγγλικά
        let fallback = translations['en'];
        for (const fk of keys) {
          if (fallback && fallback[fk]) {
            fallback = fallback[fk];
          } else {
            return key; // Αν δεν υπάρχει ούτε στα Αγγλικά, δείξε το key
          }
        }
        return fallback as string;
      }
    }
    return value as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};