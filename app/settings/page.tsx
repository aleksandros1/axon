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
      setSaveStatus('PROFILE UPDATED SUCCESSFULLY');
      setTimeout(() => setSaveStatus(''), 3000);
    }, 1500);
  };

  return (
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ: w-full και overflow-hidden για να μην κουνιέται η οθόνη */
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#020509] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="p-8 pb-12">
          <div className="flex items-center gap-3 text-[#A6947D]">
            <Shield size={24} />
            <h1 className="text-3xl font-serif uppercase text-[#F8F5EE]">AXON</h1>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> Portfolio</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> Asset Scanner</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><Globe size={16} /> Public Floor</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><Users size={16} /> Global Network</Link>
          <Link href="/dashboard/bids" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><Gavel size={16} /> My Offers</Link>
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest border border-[#A6947D]/20 transition-all"><Info size={16} /> Profile Settings</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> Secure Comms</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10">
          <button onClick={handleLogout} className="text-red-400 text-[10px] font-bold uppercase flex items-center gap-2">
            <LogOut size={16} /> Disconnect
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - NO OVERFLOW-X */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar w-full">
        <div className="max-w-4xl mx-auto p-4 md:p-12 relative z-10 w-full overflow-x-hidden">
          
          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 w-full">
            <div className="overflow-hidden w-full">
              <div className="flex items-center space-x-2 text-[10px] text-[#A6947D] tracking-[0.2em] uppercase mb-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Entity Command & Control</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif text-[#F8F5EE] uppercase truncate">Company Profile</h1>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-[#A6947D] text-[#020509] px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xl"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {isSaving ? 'Synchronizing...' : 'Save Changes'}
            </button>
          </div>

          {saveStatus && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-[10px] font-bold tracking-widest uppercase text-center animate-pulse w-full">
              {saveStatus}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full overflow-hidden">
            
            {/* LEFT COLUMN: IDENTITY & AVATAR - STABILIZED */}
            <div className="space-y-6 w-full">
              <div className="bg-[#0A1122] border border-[#A6947D]/10 rounded-2xl p-6 text-center w-full">
                <div className="relative inline-block mb-4">
                  <div className="w-28 h-28 md:w-32 md:h-32 bg-[#020509] border-2 border-[#A6947D]/20 rounded-2xl flex items-center justify-center group overflow-hidden">
                    <Building2 size={40} className="text-[#A6947D]/40 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Upload size={20} className="text-[#A6947D]" />
                    </div>
                  </div>
                </div>
                <h3 className="text-[#F8F5EE] font-bold uppercase text-sm mb-1 truncate px-2">{profile.name}</h3>
                <p className="text-[10px] text-[#A6947D] font-mono tracking-widest mb-4 uppercase">Verified Entity</p>
                
                <div className="pt-4 border-t border-[#A6947D]/10">
                  <p className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest mb-2 text-left">Trust Rating</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#020509] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${profile.trust_score}%` }}></div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">{profile.trust_score}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5 w-full">
                <div className="flex items-center gap-2 text-emerald-500 mb-3">
                  <ShieldCheck size={16} />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Active Verification</span>
                </div>
                <p className="text-[9px] text-emerald-500/70 leading-relaxed uppercase tracking-tighter">
                  VAT and legal documents validated by AXON Compliance. To update legal data, contact High Command.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: DATA FIELDS - STABILIZED */}
            <div className="lg:col-span-2 space-y-6 w-full">
              <div className="bg-[#0A1122] border border-[#A6947D]/10 rounded-2xl p-6 md:p-8 space-y-6 w-full">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Building2 size={12}/> Company Name</label>
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60 transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><FileText size={12}/> VAT Number</label>
                    <input 
                      type="text" 
                      disabled 
                      value={profile.vat} 
                      className="w-full bg-[#020509]/50 border border-[#A6947D]/10 rounded-xl px-4 py-3 text-sm text-[#F8F5EE]/40 cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Info size={12}/> Company Bio</label>
                  <textarea 
                    rows={3}
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60 resize-none shadow-inner custom-scrollbar" 
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 w-full">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><MapPin size={12}/> Headquarters</label>
                    <input 
                      type="text" 
                      value={profile.location} 
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Globe size={12}/> Website</label>
                    <input 
                      type="text" 
                      value={profile.website} 
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Mail size={12}/> Public Email</label>
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Phone size={12}/> Contact Phone</label>
                    <input 
                      type="text" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60" 
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4">
                <p className="text-[7px] md:text-[8px] text-[#A6947D]/40 uppercase tracking-[0.2em] text-right">Updates are timestamped on the AXON Secure Ledger.</p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-4 py-3 flex justify-between items-center z-50 pb-[calc(0.7rem+env(safe-area-inset-bottom))] shadow-2xl w-full">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 flex-1"><BarChart3 size={20} className="text-[#A6947D]/40" /><span className="text-[8px] font-bold uppercase text-[#A6947D]/40">Port</span></Link>
        <Link href="/trading" className="flex flex-col items-center gap-1 flex-1"><Globe size={20} className="text-[#A6947D]/40" /><span className="text-[8px] font-bold uppercase text-[#A6947D]/40">Floor</span></Link>
        <Link href="/settings" className="flex flex-col items-center gap-1 flex-1"><Info size={20} className="text-[#A6947D]" /><span className="text-[8px] font-bold uppercase text-[#A6947D]">Profile</span></Link>
        <Link href="/inbox" className="flex flex-col items-center gap-1 flex-1"><MessageSquare size={20} className="text-[#A6947D]/40" /><span className="text-[8px] font-bold uppercase text-[#A6947D]/40">Comms</span></Link>
      </nav>
    </div>
  );
}