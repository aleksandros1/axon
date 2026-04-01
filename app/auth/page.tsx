'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Shield, Lock, ChevronRight, Building2, Mail, FileDigit, Loader2, AlertTriangle, Globe } from 'lucide-react';

import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function CorporateAuth() {
  const router = useRouter();
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
          
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#000000] flex flex-col items-center justify-center p-5 font-sans text-gray-200 selection:bg-[#A6947D]/30 relative overflow-hidden antialiased">
      
      {/* BACKGROUND GRID & WATERMARK */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20 z-0"></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0 overflow-hidden">
        <Shield size={600} className="text-[#A6947D] shrink-0" strokeWidth={1} />
      </div>

      {/* LANGUAGE SWITCHER */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-50 flex items-center gap-3 bg-[#020202]/90 backdrop-blur-xl border border-gray-800 p-1.5 rounded-sm shadow-2xl">
        <Globe size={14} className="text-gray-500 ml-2" strokeWidth={1.5} />
        <div className="flex items-center gap-1">
          <button onClick={() => setLanguage('en')} className={`px-4 py-2 text-[9px] font-bold tracking-[0.2em] rounded-sm transition-all ${language === 'en' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EN</button>
          <button onClick={() => setLanguage('el')} className={`px-4 py-2 text-[9px] font-bold tracking-[0.2em] rounded-sm transition-all ${language === 'el' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EL</button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <div className="w-14 h-14 md:w-16 md:h-16 border border-gray-800 rounded-sm flex items-center justify-center relative mb-5 bg-[#030303] shadow-[0_0_30px_rgba(166,148,125,0.05)]">
            <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-8 md:h-8 text-[#A6947D]" fill="none" stroke="currentColor">
                <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" strokeWidth={1.5} strokeOpacity={0.4} fill="#050505" fillOpacity={1}/>
                <path d="M25 75 C 35 65, 45 60, 50 60" strokeWidth={2} strokeOpacity={0.8} strokeLinecap="square"/>
                <path d="M50 60 L75 35" strokeWidth={1.5} strokeOpacity={1} strokeLinecap="square"/>
                <path d="M50 60 L70 40" strokeWidth={1.5} strokeOpacity={0.6} strokeLinecap="square"/>
                <path d="M75 35 C 80 25, 83 20, 85 15" strokeWidth={1} strokeOpacity={0.5} strokeLinecap="square"/>
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif uppercase tracking-[0.3em] font-light text-white">AXON</h1>
          <p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-mono tracking-[0.4em] mt-3 text-center">{t('auth.subtitle')}</p>
        </div>

        {/* AUTH BOX - VAULT DOOR STYLE */}
        <div className="bg-[#030303] border border-gray-900 rounded-sm p-6 md:p-10 shadow-2xl mx-auto w-full relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6947D]/5 rounded-full blur-[40px] pointer-events-none"></div>

          {/* TABS */}
          <div className="flex mb-10 border-b border-gray-900 relative z-10">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-4 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] transition-all ${isLogin ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}
            >
              {t('auth.node_login')}
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-4 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] transition-all ${!isLogin ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}
            >
              {t('auth.request_access')}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-8 bg-red-950/20 border border-red-900/50 p-4 rounded-sm flex items-center gap-4 text-[10px] text-red-500 font-mono uppercase tracking-[0.2em] leading-relaxed shadow-inner">
              <AlertTriangle size={16} strokeWidth={1.5} className="flex-none" /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-8 bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-sm flex items-center gap-4 text-[10px] text-emerald-500 font-mono uppercase tracking-[0.2em] leading-relaxed shadow-inner">
              <Shield size={16} strokeWidth={1.5} className="flex-none" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6 relative z-10">
            
            {!isLogin && (
              <>
                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] flex items-center gap-2"><Building2 size={12}/> {t('auth.corporate_entity')}</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-5 text-sm font-serif text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all shadow-inner placeholder:text-gray-700 uppercase" placeholder="e.g. Pavlidis S.A." />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] flex items-center gap-2"><FileDigit size={12}/> {t('auth.tax_id')}</label>
                  <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} required className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-5 text-sm font-mono text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all shadow-inner placeholder:text-gray-700 uppercase tracking-widest" placeholder="Tax Registration No." />
                </div>
              </>
            )}

            <div className="space-y-3">
              <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] flex items-center gap-2"><Mail size={12}/> {t('auth.secure_email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-5 text-sm font-mono text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all shadow-inner placeholder:text-gray-700" placeholder="admin@corporate.com" />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] flex items-center gap-2"><Lock size={12}/> {t('auth.access_key')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-5 text-lg font-mono text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all shadow-inner placeholder:text-gray-700 tracking-[0.3em]" placeholder="••••••••••••" />
            </div>

            <div className="pt-6">
              <button type="submit" disabled={loading} className="w-full h-16 bg-white text-black font-extrabold uppercase tracking-[0.3em] rounded-sm transition-all text-[10px] md:text-[11px] flex items-center justify-center gap-3 disabled:opacity-20 hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.05)] group">
                {loading ? <><Loader2 size={16} className="animate-spin"/> {t('auth.authenticating')}</> : isLogin ? <>{t('auth.init_connection')} <ChevronRight size={16} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform"/></> : <>{t('auth.submit_credentials')} <Shield size={14} strokeWidth={2.5} className="group-hover:scale-110 transition-transform"/></>}
              </button>
            </div>
            
          </form>
          
          <div className="mt-10 pt-6 border-t border-gray-900 text-center relative z-10">
             <p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.4em] flex items-center justify-center gap-2"><Lock size={10} strokeWidth={1.5}/> {t('auth.military_encryption')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}