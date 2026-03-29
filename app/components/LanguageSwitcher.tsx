'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';

const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'el', label: 'Ελληνικά', short: 'EL' },
  { code: 'ar', label: 'العربية', short: 'AR' },
  { code: 'it', label: 'Italiano', short: 'IT' },
  { code: 'es', label: 'Español', short: 'ES' },
  { code: 'tr', label: 'Türkçe', short: 'TR' },
  { code: 'zh', label: '中文', short: 'ZH' },
  { code: 'pt', label: 'Português', short: 'PT' }
];

export default function SidebarLanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="px-8 mb-6 relative z-50" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/30 p-3 rounded-xl cursor-pointer hover:border-[#A6947D] transition-colors shadow-inner"
      >
        <div className="flex items-center gap-3 text-[#A6947D]">
          <Globe size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">{currentLang.label}</span>
        </div>
        <ChevronDown size={14} className={`text-[#A6947D] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-8 right-8 mt-2 bg-[#01030A] border border-[#A6947D]/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-between ${language === lang.code ? 'bg-[#A6947D]/20 text-[#A6947D] border-l-2 border-[#A6947D]' : 'text-[#F8F5EE]/60 hover:bg-[#A6947D]/10 hover:text-[#F8F5EE]'}`}
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