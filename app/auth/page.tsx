'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Loader2, ArrowRight, AlertTriangle, Building2, Globe } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'BUYER' | 'SELLER'>('BUYER'); // <-- ΝΕΟ: Επιλογή Ρόλου
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        // --- SIGN UP ---
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { role: selectedRole } // Αποθήκευση ρόλου στα μεταδεδομένα του χρήστη
          }
        });
        if (error) throw error;

        // Ενημέρωση και του πίνακα profiles με τον ρόλο που επέλεξε
        if (data?.user) {
          await supabase.from('profiles').update({ role: selectedRole }).eq('id', data.user.id);
        }

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
            
            {/* ΝΕΟ: ΕΠΙΛΟΓΗ ΡΟΛΟΥ (Φαίνεται ΜΟΝΟ στο Sign Up) */}
            {!isLogin && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Entity Classification</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setSelectedRole('BUYER')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                      selectedRole === 'BUYER' 
                        ? 'bg-[#A6947D]/10 border-[#A6947D] text-[#A6947D] shadow-inner' 
                        : 'bg-[#020509] border-[#A6947D]/20 text-[#A6947D]/40 hover:border-[#A6947D]/50 hover:text-[#A6947D]/80'
                    }`}
                  >
                    <Globe size={16} /> BUYER
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSelectedRole('SELLER')}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                      selectedRole === 'SELLER' 
                        ? 'bg-[#A6947D]/10 border-[#A6947D] text-[#A6947D] shadow-inner' 
                        : 'bg-[#020509] border-[#A6947D]/20 text-[#A6947D]/40 hover:border-[#A6947D]/50 hover:text-[#A6947D]/80'
                    }`}
                  >
                    <Building2 size={16} /> VENDOR
                  </button>
                </div>
              </div>
            )}

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
              <div className={`p-4 rounded-xl flex items-start gap-3 border ${error.includes('SUCCESSFUL') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                {error.includes('SUCCESSFUL') ? <Shield size={16} className="flex-none mt-0.5" /> : <AlertTriangle size={16} className="flex-none mt-0.5" />}
                <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
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

        <div className="mt-8 text-center">
          <Link href="/support" className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#A6947D]/40 hover:text-[#A6947D] transition-colors group">
            REQUIRE ASSISTANCE? <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}