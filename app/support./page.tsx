'use client';

import React, { useState } from 'react';
import { Shield, ArrowLeft, Loader2, CheckCircle2, MessageSquare, Send, Mail, User } from 'lucide-react';
import Link from 'next/link';

export default function SupportCenter() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Προσομοίωση αποστολής στο σύστημα (Μελλοντικά συνδέεται με Supabase ή Email API)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] flex flex-col relative overflow-x-hidden font-sans text-[#F8F5EE] selection:bg-[#A6947D]/30">
      
      {/* TOP NAV */}
      <nav className="px-4 md:px-12 py-6 border-b border-[#A6947D]/10 bg-[#01030A]/90 backdrop-blur-xl flex justify-between items-center sticky top-0 z-40 w-full">
        <Link href="/" className="flex items-center gap-2 text-[#A6947D]/60 hover:text-[#A6947D] text-[9px] font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} /> BACK TO TERMINAL
        </Link>
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-[#A6947D]" />
        </div>
      </nav>

      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <MessageSquare size={800} className="text-[#A6947D]" />
      </div>

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 py-12 md:py-20">
        
        {/* HEADER */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-[#A6947D]/30"></span>
            <p className="text-[9px] text-[#A6947D] uppercase tracking-[0.3em] font-mono">AXON ASSISTANCE</p>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif uppercase tracking-[0.05em] mb-4">SUPPORT CENTER</h1>
          <p className="text-xs md:text-sm text-[#A6947D]/60 font-mono uppercase tracking-widest leading-relaxed max-w-xl">
            Our institutional support team is monitoring all channels. Transmit your inquiry below and an agent will respond securely.
          </p>
        </div>

        {/* FORM OR SUCCESS STATE */}
        <div className="bg-[#01030A]/80 backdrop-blur-xl border border-[#A6947D]/20 p-6 md:p-10 rounded-2xl shadow-2xl">
          {success ? (
            <div className="text-center py-12 animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-serif text-emerald-400 uppercase tracking-widest mb-4">TRANSMISSION SUCCESSFUL</h2>
              <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-widest leading-relaxed max-w-md mx-auto mb-8">
                Your encrypted message has been received by our command center. An operator will reach out to you shortly.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="border border-[#A6947D]/30 hover:bg-[#A6947D]/10 text-[#A6947D] px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                TRANSMIT ANOTHER MESSAGE
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-2"><User size={12}/> Entity / Full Name</label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-sm outline-none transition-colors shadow-inner text-[#F8F5EE]"
                    placeholder="E.g. Global Stones LLC"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-2"><Mail size={12}/> Registered Email</label>
                  <input 
                    type="email" required
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-sm outline-none transition-colors shadow-inner font-mono text-[#F8F5EE]"
                    placeholder="admin@institution.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Subject Protocol</label>
                <select 
                  required
                  value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-xs font-bold tracking-widest uppercase outline-none transition-colors shadow-inner text-[#A6947D]"
                >
                  <option value="" disabled>SELECT CLASSIFICATION...</option>
                  <option value="access">Access & Credentials</option>
                  <option value="escrow">Escrow & Payments</option>
                  <option value="logistics">Logistics & Shipping</option>
                  <option value="technical">Technical Support</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Transmission Body</label>
                <textarea 
                  required rows={6}
                  value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-xl px-4 py-4 text-sm outline-none transition-colors shadow-inner text-[#F8F5EE] resize-none custom-scrollbar"
                  placeholder="Detail your inquiry here..."
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full md:w-auto md:ml-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 px-8 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={16} /> TRANSMIT MESSAGE</>}
              </button>
            </form>
          )}
        </div>

      </main>
    </div>
  );
}