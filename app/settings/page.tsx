'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Building2, Save, Upload, MapPin, FileText, Mail, 
  Phone, Info, ShieldCheck, Users, Gavel, Loader2, Menu, X, FileSignature
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

export default function VendorSettings() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // --- STATE ΓΙΑ ΤΟ SMART MENU ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Κατάσταση Προφίλ
  const [profile, setProfile] = useState({
    name: 'Pavlidis Marble King',
    vat: 'EL094123456',
    email: 'ops@pavlidis.gr',
    phone: '+30 25210 12345',
    location: 'Drama, Greece',
    bio: 'Leading global supplier of premium white marble, specializing in Sivec and Thassos extra-fine slabs.',
    website: 'www.pavlidis.gr',
    trust_score: 99.8
  });

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const handleSave = () => {
    setIsSaving(true);
    // Προσομοίωση αποθήκευσης στη βάση
    setTimeout(() => {
      setIsSaving(false);
      setSaveStatus('LEDGER SYNCHRONIZED');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1500);
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* --------------------------------------------------------- */}
      {/* EXECUTIVE COMMAND OVERLAY (THE SMART MENU) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#A6947D]" />
              <h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">Command Center</h2>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">Core Modules</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard/bids" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Gavel size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Offers</span>
              </Link>
              <Link href="/contracts" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <FileSignature size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Deals Vault</span>
              </Link>
              <Link href="/scanner" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Crosshair size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">AI Scanner</span>
              </Link>
              <Link href="/network" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Users size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Network</span>
              </Link>
              <Link href="/me" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/30 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/20 transition-colors shadow-inner col-span-2">
                <Info size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Profile Settings</span>
              </Link>
            </div>

            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">System</p>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest">
              <LogOut size={16} /> Disconnect Session
            </button>
          </div>
        </div>
      )}
      {/* --------------------------------------------------------- */}

      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A] shadow-[0_0_15px_rgba(166,148,125,0.05)]">
            <Info size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Info size={16} /> {t('menu.profile')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Info size={800} className="text-[#A6947D] shrink-0" />
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-12 relative z-10 w-full overflow-x-hidden">
          
          <div className="mb-8 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 w-full animate-in fade-in duration-500">
            <div className="overflow-hidden w-full">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span>
                <p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono flex items-center gap-2">
                  <ShieldCheck size={12} className="text-[#A6947D]" />
                  Entity Command & Control
                </p>
              </div>
              <h1 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase truncate font-light tracking-wide">Corporate Profile</h1>
            </div>
            
            {saveStatus && (
              <div className="hidden sm:block px-6 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[9px] font-mono tracking-widest uppercase text-center animate-pulse shadow-inner">
                {saveStatus}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 w-full overflow-hidden animate-in fade-in duration-500 delay-100">
            
            {/* LEFT COLUMN: IDENTITY & AVATAR */}
            <div className="space-y-6 md:space-y-8 w-full">
              
              <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-6 md:p-8 text-center w-full shadow-lg relative overflow-hidden">
                {/* Subtle Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6947D]/5 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="relative inline-block mb-6 z-10">
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-[#020509] border border-[#A6947D]/30 rounded-2xl flex items-center justify-center group overflow-hidden shadow-inner">
                    <Building2 size={32} className="text-[#A6947D]/40 group-hover:scale-110 group-hover:text-[#A6947D] transition-all duration-500 stroke-1" />
                    <div className="absolute inset-0 bg-[#01030A]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                      <Upload size={20} className="text-[#A6947D]" strokeWidth={1.5}/>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-[#F8F5EE] font-serif uppercase tracking-widest text-base md:text-lg mb-2 truncate px-2 z-10 relative">{profile.name}</h3>
                <p className="text-[9px] text-[#A6947D] font-bold tracking-widest mb-6 uppercase z-10 relative">Verified Entity</p>
                
                <div className="pt-6 border-t border-[#A6947D]/10 z-10 relative">
                  <p className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-3 text-left">Trust Rating</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-[#020509] rounded-full overflow-hidden border border-[#A6947D]/20">
                      <div className="h-full bg-[#A6947D] shadow-[0_0_10px_#A6947D] transition-all duration-1000" style={{ width: `${profile.trust_score}%` }}></div>
                    </div>
                    <span className="text-[11px] font-mono text-[#F8F5EE] font-bold">{profile.trust_score}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 w-full shadow-inner">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                  <ShieldCheck size={16} strokeWidth={1.5} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Clearance Level 3</span>
                </div>
                <p className="text-[9px] text-emerald-400/80 leading-[1.8] font-mono uppercase tracking-widest">
                  VAT and legal documents validated by AXON Compliance Protocol. To update foundational data, contact High Command.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: DATA FIELDS */}
            <div className="lg:col-span-2 space-y-6 w-full">
              <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-6 md:p-10 space-y-6 md:space-y-8 w-full shadow-lg relative z-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><Building2 size={12} className="text-[#A6947D]"/> Corporate Identity</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full h-12 md:h-14 bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 font-sans text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all uppercase shadow-inner placeholder:text-[#F8F5EE]/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><FileText size={12} className="text-[#A6947D]"/> VAT / Tax ID <Lock size={10} className="text-amber-500 ml-auto"/></label>
                    <input 
                      type="text" 
                      disabled 
                      value={profile.vat} 
                      className="w-full h-12 md:h-14 bg-[#020509]/50 border border-[#A6947D]/10 rounded-xl px-4 font-mono text-sm text-[#F8F5EE]/40 cursor-not-allowed uppercase" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><Info size={12} className="text-[#A6947D]"/> Corporate Bio</label>
                  <textarea 
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-5 py-4 font-sans text-xs text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] resize-none shadow-inner custom-scrollbar uppercase tracking-wider leading-relaxed placeholder:text-[#F8F5EE]/20" 
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4 border-t border-[#A6947D]/10 w-full">
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-[#A6947D]"/> Jurisdiction</label>
                    <input 
                      type="text" 
                      value={profile.location} 
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      className="w-full h-12 md:h-14 bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 font-sans text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all uppercase shadow-inner placeholder:text-[#F8F5EE]/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><Globe size={12} className="text-[#A6947D]"/> Domain</label>
                    <input 
                      type="text" 
                      value={profile.website} 
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="w-full h-12 md:h-14 bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 font-sans text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all uppercase shadow-inner placeholder:text-[#F8F5EE]/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><Mail size={12} className="text-[#A6947D]"/> Secure Comm Channel</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full h-12 md:h-14 bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 font-mono text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all shadow-inner placeholder:text-[#F8F5EE]/20" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest flex items-center gap-2"><Phone size={12} className="text-[#A6947D]"/> Direct Line</label>
                    <input 
                      type="text" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full h-12 md:h-14 bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 font-mono text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all shadow-inner placeholder:text-[#F8F5EE]/20" 
                    />
                  </div>
                </div>

              </div>

              {/* SAVE BUTTON - MOVED TO BOTTOM RIGHT FOR BETTER FLOW */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-6 w-full">
                <p className="text-[8px] font-bold text-[#A6947D]/60 uppercase tracking-widest text-center sm:text-left">
                  Modifications are timestamped on the AXON Ledger.
                </p>
                
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto h-14 md:h-16 bg-[#A6947D] text-[#020509] px-10 rounded-xl font-bold uppercase text-[10px] md:text-xs tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#c4b198] transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(166,148,125,0.2)]"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5}/>}
                  {isSaving ? 'SYNCHRONIZING...' : 'UPDATE SYSTEM'}
                </button>
              </div>

              {/* MOBILE STATUS (Visible only on mobile if saved) */}
              {saveStatus && (
                <div className="sm:hidden px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[9px] font-bold tracking-widest uppercase text-center animate-pulse shadow-inner mt-4">
                  {saveStatus}
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION (THE STRICT 4-BUTTON BAR) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors">
          <MessageSquare size={20} />
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        {/* THE TRIGGER FOR THE COMMAND OVERLAY (ACTIVE BECAUSE WE ARE IN PROFILE VIA MENU) */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}