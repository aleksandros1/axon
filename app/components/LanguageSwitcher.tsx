'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'en', label: 'ENGLISH', short: 'EN' },
    { code: 'el', label: 'ΕΛΛΗΝΙΚΑ', short: 'EL' },
    { code: 'ar', label: 'العربية', short: 'AR' },
    { code: 'it', label: 'ITALIANO', short: 'IT' },
    { code: 'es', label: 'ESPAÑOL', short: 'ES' },
    { code: 'tr', label: 'TÜRKÇE', short: 'TR' },
    { code: 'zh', label: '中文', short: 'ZH' },
    { code: 'pt', label: 'PORTUGUÊS', short: 'PT' },
    { code: 'ru', label: 'РУССКИЙ', short: 'RU' }
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-colors"
      >
        <Globe size={16} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">{currentLang.label}</span>
        <ChevronDown size={14} className={`text-[#A6947D] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 md:left-0 md:right-auto mt-2 bg-[#01030A] border border-[#A6947D]/30 rounded-xl shadow-2xl overflow-hidden py-2 min-w-[140px] animate-in fade-in slide-in-from-top-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any); // <-- ΑΥΤΟ ΔΙΟΡΘΩΝΕΙ ΤΟ ΚΟΚΚΙΝΟ ΣΦΑΛΜΑ!
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${language === lang.code ? 'bg-[#A6947D]/10 text-[#A6947D]' : 'text-[#F8F5EE]/40 hover:bg-[#020509] hover:text-[#F8F5EE]'}`}
            >
              {lang.label}
              <span className="text-[8px] opacity-50">{lang.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}