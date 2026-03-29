'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Shield, Lock, ChevronRight, Building2, Mail, FileDigit, Loader2, AlertTriangle, Globe } from 'lucide-react';

// Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: useLanguage αντί για useTranslation
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function CorporateAuth() {
  const router = useRouter();
  
  // Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: language & setLanguage αντί για locale & switchLanguage
  const { t, language, setLanguage } = useLanguage(); 
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // --- ΔΙΑΔΙΚΑΣΙΑ LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        router.push('/dashboard');
      } else {
        // --- ΔΙΑΔΙΚΑΣΙΑ REGISTRATION ---
        // Περνάμε τα δεδομένα στα user_metadata για να τα έχουμε ακόμα κι αν σκάσει το RLS
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              company_name: companyName,
              vat_number: vatNumber,
            }
          }
        });
        
        if (error) throw error;

        if (data.user) {
          // Προσπαθούμε να κάνουμε το Sync στο Profile
          const { error: profileError } = await supabase.from('profiles').upsert([
            {
              id: data.user.id,
              email: email,
              company_name: companyName,
              vat_number: vatNumber,
              status: 'pending'
            }
          ]);
          
          if (profileError) {
            console.error("Profile Sync Error Details:", profileError);
          }
          
          if (data.session === null) {
            setSuccessMsg(t('auth.email_confirm'));
          } else {
            setSuccessMsg(t('auth.reg_success'));
          }
          
          setIsLogin(true); // Τον γυρνάμε στο Login
          setPassword(''); // Καθαρίζουμε τον κωδικό για ασφάλεια
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center p-4 font-sans text-[#F8F5EE] selection:bg-[#A6947D]/30 relative overflow-hidden">
      
      {/* BACKGROUND WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0">
        <Shield size={800} className="text-[#A6947D]" />
      </div>

      {/* LANGUAGE SWITCHER (TOP RIGHT) */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 p-1.5 rounded-xl shadow-lg">
        <Globe size={14} className="text-[#A6947D]/60 ml-2" />
        <div className="flex items-center gap-1 ml-2">
          {/* Διορθώθηκε το switchLanguage σε setLanguage */}
          <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all ${language === 'en' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EN</button>
          <button onClick={() => setLanguage('el')} className={`px-3 py-1.5 text-[9px] font-bold rounded-lg transition-all ${language === 'el' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EL</button>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-6 shadow-[0_0_25px_rgba(166,148,125,0.05)] bg-[#01030A]">
            <svg viewBox="0 0 100 100" className="w-6 h-6 text-[#A6947D]" fill="none" stroke="currentColor">
                <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" strokeWidth={1.5} strokeOpacity={0.25} fill="#01030A" fillOpacity={0.9}/>
                <path d="M25 75 C 35 65, 45 60, 50 60" strokeWidth={2.5} strokeOpacity={0.8} strokeLinecap="round"/>
                <path d="M50 60 L75 35" strokeWidth={1.5} strokeOpacity={1} strokeLinecap="round"/>
                <path d="M50 60 L70 40" strokeWidth={1.5} strokeOpacity={0.6} strokeLinecap="round"/>
                <path d="M75 35 C 80 25, 83 20, 85 15" strokeWidth={1.2} strokeOpacity={0.5} strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-serif uppercase tracking-[0.2em] font-light">AXON Core</h1>
          <p className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.4em] mt-2">{t('auth.subtitle')}</p>
        </div>

        {/* AUTH BOX */}
        <div className="bg-[#01030A]/80 backdrop-blur-xl border border-[#A6947D]/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(166,148,125,0.05)]">
          
          <div className="flex mb-8 border-b border-[#A6947D]/10">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${isLogin ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}
            >
              {t('auth.node_login')}
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${!isLogin ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}
            >
              {t('auth.request_access')}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-[10px] text-red-400 font-mono uppercase tracking-widest leading-relaxed">
              <AlertTriangle size={16} className="flex-none" /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-[10px] text-emerald-400 font-mono uppercase tracking-widest leading-relaxed">
              <Shield size={16} className="flex-none" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] flex items-center gap-2"><Building2 size={12}/> {t('auth.corporate_entity')}</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-5 py-4 text-sm font-serif text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" placeholder="e.g. Hellenic Marble Group" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] flex items-center gap-2"><FileDigit size={12}/> {t('auth.tax_id')}</label>
                  <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-5 py-4 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" placeholder="e.g. EL099887766" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] flex items-center gap-2"><Mail size={12}/> {t('auth.secure_email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-5 py-4 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" placeholder="admin@corporate.com" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] flex items-center gap-2"><Lock size={12}/> {t('auth.access_key')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-5 py-4 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" placeholder="••••••••••••" />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full bg-transparent border border-[#A6947D]/40 text-[#A6947D] hover:bg-[#A6947D]/10 hover:border-[#A6947D] font-bold uppercase tracking-[0.2em] py-5 rounded-xl transition-all text-[10px] flex items-center justify-center gap-3 disabled:opacity-50 group">
                {loading ? <><Loader2 size={16} className="animate-spin"/> {t('auth.authenticating')}</> : isLogin ? <>{t('auth.init_connection')} <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform"/></> : <>{t('auth.submit_credentials')} <Shield size={14} className="group-hover:scale-110 transition-transform"/></>}
              </button>
            </div>
            
          </form>
          
          <div className="mt-8 pt-6 border-t border-[#A6947D]/10 text-center">
             <p className="text-[8px] text-[#F8F5EE]/30 font-mono uppercase tracking-widest flex items-center justify-center gap-2"><Lock size={8}/> {t('auth.military_encryption')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}