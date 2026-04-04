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
    <div className="min-h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center p-4 font-sans text-[#F8F5EE] selection:bg-[#A6947D]/30 relative overflow-hidden antialiased">
      
      {/* BACKGROUND WATERMARK */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
        <Shield size={800} className="text-[#A6947D] shrink-0" strokeWidth={1} />
      </div>

      {/* LANGUAGE SWITCHER */}
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 flex items-center gap-2 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 p-1.5 rounded-xl shadow-lg">
        <Globe size={14} className="text-[#A6947D]/60 ml-2" />
        <div className="flex items-center gap-1">
          <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-[9px] font-bold tracking-widest rounded-lg transition-all ${language === 'en' ? 'bg-[#A6947D]/20 text-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}>EN</button>
          <button onClick={() => setLanguage('el')} className={`px-3 py-1.5 text-[9px] font-bold tracking-widest rounded-lg transition-all ${language === 'el' ? 'bg-[#A6947D]/20 text-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}>EL</button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* LOGO AREA */}
        <div className="flex flex-col items-center mb-8 md:mb-10">
          <div className="w-16 h-16 border border-[#A6947D]/20 rounded-full flex items-center justify-center relative mb-5 bg-[#01030A]/50 shadow-[0_0_20px_rgba(166,148,125,0.05)]">
            <Shield size={28} className="text-[#A6947D]" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif uppercase tracking-[0.3em] font-light text-[#F8F5EE] leading-none">AXON</h1>
          <p className="text-[8px] md:text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-[0.4em] mt-3 text-center">{t('auth')}</p>
        </div>

        {/* AUTH BOX */}
        <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-6 md:p-8 shadow-2xl mx-auto w-full relative">
          
          {/* TABS */}
          <div className="flex mb-8 border-b border-[#A6947D]/10">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${isLogin ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}
            >
              {t('node login')}
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setErrorMsg(''); setSuccessMsg(''); }}
              className={`flex-1 pb-3 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${!isLogin ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}
            >
              {t('auth.request_access')}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-[10px] text-red-400 font-mono uppercase tracking-[0.1em] leading-relaxed">
              <AlertTriangle size={16} className="flex-none text-red-500" /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3 text-[10px] text-emerald-400 font-mono uppercase tracking-[0.1em] leading-relaxed">
              <Shield size={16} className="flex-none text-emerald-500" /> {successMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-1.5"><Building2 size={12}/> {t('auth.corporate_entity')}</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-serif text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 uppercase" placeholder="e.g. Pavlidis S.A." />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-1.5"><FileDigit size={12}/> {t('auth.tax_id')}</label>
                  <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 uppercase tracking-widest" placeholder="Tax Registration No." />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-1.5"><Mail size={12}/> {t('secure email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20" placeholder="admin@corporate.com" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-1.5"><Lock size={12}/> {t('access key')}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-lg font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 tracking-[0.3em]" placeholder="••••••••••••" />
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] md:text-[11px] flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(166,148,125,0.2)] disabled:opacity-50 group">
                {loading ? <><Loader2 size={16} className="animate-spin"/> {t('auth.authenticating')}</> : isLogin ? <>{t('auth.init_connection')} <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/></> : <>{t('auth.submit_credentials')} <Shield size={14} className="group-hover:scale-110 transition-transform"/></>}
              </button>
            </div>
            
          </form>
          
          <div className="mt-8 pt-6 border-t border-[#A6947D]/10 text-center">
             <p className="text-[8px] text-[#A6947D]/40 font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-1.5"><Lock size={10}/> {t('auth.military_encryption')}</p>
          </div>

        </div>
      </div>
    </div>
  );
}