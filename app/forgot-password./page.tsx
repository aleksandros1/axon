'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('SECURE RESET LINK TRANSMITTED TO YOUR EMAIL.');
    }
    setLoading(false);
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
            <KeyRound size={24} className="text-[#A6947D]" />
          </div>
          <h1 className="text-3xl font-serif uppercase tracking-[0.2em] mb-2">AXON</h1>
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#A6947D]/60">PROTOCOL RECOVERY</p>
        </div>

        {/* FORM BOX */}
        <div className="bg-[#01030A]/80 backdrop-blur-xl border border-[#A6947D]/20 p-8 md:p-10 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-serif text-[#F8F5EE] uppercase tracking-widest mb-2">RESTORE ACCESS</h2>
          <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-widest mb-8 leading-relaxed">
            Enter your registered email address. A secure cryptographic link will be transmitted to reset your credentials.
          </p>

          {message ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl text-center animate-in zoom-in">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 leading-relaxed">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Email Identity</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-sm outline-none transition-colors shadow-inner font-mono text-[#F8F5EE]"
                  placeholder="admin@institution.com"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-center gap-3">
                  <AlertTriangle size={16} className="text-red-500 flex-none" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-red-500">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || !email}
                className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'TRANSMIT RESET LINK'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/auth" className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#A6947D]/60 hover:text-[#A6947D] transition-colors">
            <ArrowLeft size={14} /> ABORT AND RETURN TO SECURE LOGIN
          </Link>
        </div>

      </div>
    </div>
  );
}