'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function SidebarLanguageSwitcher() {
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
    <div className="px-6 mb-6 relative z-50 w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[#01030A] border border-[#A6947D]/20 hover:border-[#A6947D]/50 px-4 py-3 rounded-xl transition-all shadow-inner group"
      >
        <div className="flex items-center gap-3 text-[#A6947D]">
          <Globe size={14} className="group-hover:animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase">{currentLang.label}</span>
        </div>
        <ChevronDown size={14} className={`text-[#A6947D]/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-6 right-6 top-full mt-2 bg-[#01030A] border border-[#A6947D]/20 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 text-[9px] font-bold tracking-widest transition-colors ${language === lang.code ? 'bg-[#A6947D]/10 text-[#A6947D]' : 'text-[#F8F5EE]/40 hover:bg-[#020509] hover:text-[#F8F5EE]'}`}
            >
              <span className="uppercase">{lang.label}</span>
              <span className="font-mono text-[#A6947D]/40">{lang.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}