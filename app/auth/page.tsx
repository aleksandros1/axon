'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setError('REGISTRATION SUCCESSFUL. PLEASE AWAIT INSTITUTIONAL CLEARANCE.');
      }
    } catch (err: any) {
      setError(err.message || 'AUTHENTICATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center relative overflow-hidden font-sans text-[#F8F5EE] selection:bg-[#A6947D]/30 p-4">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <Shield size={800} className="text-[#A6947D]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 border border-[#A6947D]/30 rounded-full flex items-center justify-center bg-[#01030A] shadow-[0_0_30px_rgba(166,148,125,0.1)] mb-6">
            <Shield size={24} className="text-[#A6947D]" />
          </div>
          <h1 className="text-3xl font-serif uppercase tracking-[0.2em] mb-2">AXON</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#A6947D]/60">{t('common.institutional_grade')}</p>
        </div>

        {/* AUTH BOX */}
        <div className="bg-[#01030A]/80 backdrop-blur-xl border border-[#A6947D]/20 p-8 md:p-10 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-serif text-[#F8F5EE] uppercase tracking-widest mb-8">
            {isLogin ? 'SECURE LOGIN' : t('auth.request_access')}
          </h2>

          <form onSubmit={handleAuth} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-2">
                <Mail size={12}/> Email Identity
              </label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-sm outline-none transition-colors shadow-inner font-mono text-[#F8F5EE]"
                placeholder="admin@institution.com"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-2">
                  <Lock size={12}/> Passcode
                </label>
                
                {/* 1. Η ΣΥΝΔΕΣΗ ΜΕ ΤΟ FORGOT PASSWORD */}
                {isLogin && (
                  <Link href="/forgot-password" className="text-[8px] text-[#A6947D]/60 hover:text-[#A6947D] uppercase font-bold tracking-widest transition-colors">
                    Protocol Recovery?
                  </Link>
                )}
              </div>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-sm outline-none transition-colors shadow-inner font-mono text-[#F8F5EE]"
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-500 flex-none" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-500 leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" disabled={loading || !email || !password}
              className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_15px_rgba(166,148,125,0.2)]"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? 'AUTHORIZE ACCESS' : 'SUBMIT REQUEST')}
            </button>
          </form>
          
          <div className="mt-6 flex flex-col gap-4 text-center">
            <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-[9px] text-[#A6947D]/60 hover:text-[#A6947D] font-bold uppercase tracking-widest transition-colors">
              {isLogin ? 'REQUEST NEW ENTITY ACCESS' : 'RETURN TO LOGIN'}
            </button>
          </div>
        </div>

        {/* 2. Η ΣΥΝΔΕΣΗ ΜΕ ΤΟ SUPPORT CENTER */}
        <div className="mt-8 text-center">
          <Link href="/support" className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#A6947D]/40 hover:text-[#A6947D] transition-colors group">
            REQUIRE ASSISTANCE? <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}