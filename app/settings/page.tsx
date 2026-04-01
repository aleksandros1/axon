'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Building2, Save, Upload, MapPin, FileText, Mail, 
  Phone, Info, ShieldCheck, Users, Gavel, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function VendorSettings() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

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
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 bg-[#000000] shadow-[0_0_15px_rgba(166,148,125,0.1)]">
            <Info size={18} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">INSTITUTIONAL GRADE</p>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><BarChart3 size={16} /> Portfolio</Link>
          <Link href="/scanner" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Crosshair size={16} /> Asset Scanner</Link>
          <Link href="/trading" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Globe size={16} /> Public Floor</Link>
          <Link href="/network" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Users size={16} /> Global Network</Link>
          <Link href="/settings" className="flex items-center gap-4 px-4 py-3.5 bg-[#050505] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-inner"><Info size={16} /> Profile Settings</Link>
          <Link href="/inbox" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><MessageSquare size={16} /> Secure Comms</Link>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> DISCONNECT</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>

        <div className="max-w-6xl mx-auto p-5 md:p-12 relative z-10 w-full overflow-x-hidden">
          
          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 w-full animate-in fade-in duration-500">
            <div className="overflow-hidden w-full">
              <div className="flex items-center space-x-2 text-[8px] text-[#A6947D] font-mono tracking-[0.4em] uppercase mb-3">
                <ShieldCheck size={12} className="text-[#A6947D]" />
                <span>Entity Command & Control</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-serif text-white uppercase truncate font-light tracking-wide">Corporate Profile</h1>
            </div>
            
            {saveStatus && (
              <div className="hidden sm:block px-6 py-2 bg-emerald-950/30 border border-emerald-900/50 rounded-sm text-emerald-500 text-[9px] font-mono tracking-[0.3em] uppercase text-center animate-pulse shadow-inner">
                {saveStatus}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 w-full overflow-hidden animate-in fade-in duration-500 delay-100">
            
            {/* LEFT COLUMN: IDENTITY & AVATAR */}
            <div className="space-y-6 md:space-y-8 w-full">
              
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-8 text-center w-full shadow-2xl relative overflow-hidden">
                {/* Subtle Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6947D]/5 rounded-full blur-[40px] pointer-events-none"></div>

                <div className="relative inline-block mb-6 z-10">
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-[#020202] border border-gray-800 rounded-sm flex items-center justify-center group overflow-hidden shadow-inner">
                    <Building2 size={32} className="text-gray-700 group-hover:scale-110 group-hover:text-[#A6947D] transition-all duration-500 stroke-1" />
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
                      <Upload size={20} className="text-[#A6947D]" strokeWidth={1.5}/>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-white font-serif uppercase tracking-widest text-base mb-2 truncate px-2 z-10 relative">{profile.name}</h3>
                <p className="text-[9px] text-[#A6947D] font-mono tracking-[0.3em] mb-6 uppercase z-10 relative">Verified Entity</p>
                
                <div className="pt-6 border-t border-gray-900 z-10 relative">
                  <p className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-3 text-left">Trust Rating</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1 bg-[#020202] rounded-full overflow-hidden border border-gray-800">
                      <div className="h-full bg-[#A6947D] shadow-[0_0_10px_#A6947D] transition-all duration-1000" style={{ width: `${profile.trust_score}%` }}></div>
                    </div>
                    <span className="text-[11px] font-mono text-white">{profile.trust_score}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-sm p-6 w-full shadow-inner">
                <div className="flex items-center gap-3 text-emerald-500 mb-4">
                  <ShieldCheck size={16} strokeWidth={1.5} />
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em]">Clearance Level 3</span>
                </div>
                <p className="text-[9px] text-emerald-500/60 leading-[1.8] font-mono uppercase tracking-[0.1em]">
                  VAT and legal documents validated by AXON Compliance Protocol. To update foundational data, contact High Command.
                </p>
              </div>

            </div>

            {/* RIGHT COLUMN: DATA FIELDS */}
            <div className="lg:col-span-2 space-y-6 w-full">
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-10 space-y-8 w-full shadow-2xl relative z-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><Building2 size={12} className="text-[#A6947D]"/> Corporate Identity</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full h-14 bg-[#020202] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><FileText size={12} className="text-[#A6947D]"/> VAT / Tax ID <Lock size={10} className="text-amber-500 ml-auto"/></label>
                    <input 
                      type="text" 
                      disabled 
                      value={profile.vat} 
                      className="w-full h-14 bg-[#020202]/50 border border-gray-900 rounded-sm px-4 font-mono text-sm text-gray-600 cursor-not-allowed uppercase" 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><Info size={12} className="text-[#A6947D]"/> Corporate Bio</label>
                  <textarea 
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="w-full bg-[#020202] border border-gray-800 rounded-sm px-5 py-4 font-mono text-xs text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] resize-none shadow-inner custom-scrollbar uppercase tracking-widest leading-relaxed" 
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-4 border-t border-gray-900 w-full">
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><MapPin size={12} className="text-[#A6947D]"/> Jurisdiction</label>
                    <input 
                      type="text" 
                      value={profile.location} 
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      className="w-full h-14 bg-[#020202] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><Globe size={12} className="text-[#A6947D]"/> Domain</label>
                    <input 
                      type="text" 
                      value={profile.website} 
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="w-full h-14 bg-[#020202] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><Mail size={12} className="text-[#A6947D]"/> Secure Comm Channel</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full h-14 bg-[#020202] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] flex items-center gap-2"><Phone size={12} className="text-[#A6947D]"/> Direct Line</label>
                    <input 
                      type="text" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full h-14 bg-[#020202] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner" 
                    />
                  </div>
                </div>

              </div>

              {/* SAVE BUTTON - MOVED TO BOTTOM RIGHT FOR BETTER FLOW */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-6 w-full">
                <p className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em] text-center sm:text-left">
                  Modifications are timestamped on the AXON Ledger.
                </p>
                
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto h-16 bg-white text-black px-10 rounded-sm font-extrabold uppercase text-[10px] md:text-xs tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all disabled:opacity-30 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2}/>}
                  {isSaving ? 'SYNCHRONIZING...' : 'UPDATE SYSTEM'}
                </button>
              </div>

              {/* MOBILE STATUS (Visible only on mobile if saved) */}
              {saveStatus && (
                <div className="sm:hidden px-4 py-3 bg-emerald-950/30 border border-emerald-900/50 rounded-sm text-emerald-500 text-[9px] font-mono tracking-[0.3em] uppercase text-center animate-pulse shadow-inner mt-4">
                  {saveStatus}
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

      {/* MOBILE NAV - PRECISION INSTRUMENT STYLE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020202]/95 backdrop-blur-2xl border-t border-gray-900 px-2 py-2 flex justify-between items-center z-50 pb-[env(safe-area-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-[64px]">
        <Link href="/dashboard" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Port</span></Link>
        <Link href="/trading" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Floor</span></Link>
        <Link href="/settings" className="text-[#A6947D] flex flex-col items-center gap-1 flex-1"><Info size={20} strokeWidth={2} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Profile</span></Link>
        <Link href="/inbox" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Comms</span></Link>
      </nav>
    </div>
  );
}