'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Lock, Globe, BarChart3, Gavel, MessageSquare, 
  Activity, Crosshair, User, Users, LogOut, Package, ArrowRight, Menu, X, FileSignature
} from 'lucide-react';
import Link from 'next/link';

export default function PrivateVault() {
  const router = useRouter();
  const [slabs, setSlabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE ΓΙΑ ΤΟ SMART MENU ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchVaultAssets();
  }, []);

  const fetchVaultAssets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth'); return; }

    const { data } = await supabase.from('slabs').select('*').eq('user_id', session.user.id).eq('is_vault', true);
    if (data) setSlabs(data);
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

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
              <Link href="/me" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner col-span-2">
                <User size={24} className="text-[#A6947D]" />
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

      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A] shadow-[0_0_15px_rgba(166,148,125,0.05)]">
            <Lock size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">Institutional Grade</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> Portfolio</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> Public Floor</Link>
          <Link href="/vault" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Lock size={16} /> Private Vault</Link>
          <Link href="/dashboard/bids" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Gavel size={16} /> My Offers</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> Secure Comms</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"><LogOut size={16} /> DISCONNECT</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID & ICON */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Lock size={600} className="text-[#A6947D] shrink-0" strokeWidth={1} />
        </div>
        
        <div className="p-5 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-[#A6947D]" size={20} strokeWidth={1.5} />
              <p className="text-[9px] text-[#A6947D] uppercase tracking-[0.4em] font-mono">Dark Pool Intelligence</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE] leading-tight font-light">Private <span className="text-[#A6947D]/60">Vault</span></h2>
          </header>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#A6947D] animate-pulse">
               <div className="w-10 h-10 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
               <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Accessing Ledger...</span>
            </div>
          ) : slabs.length === 0 ? (
            <div className="py-24 text-center border border-[#A6947D]/20 rounded-2xl bg-[#01030A] w-full shadow-2xl">
              <Package size={32} className="mx-auto text-[#A6947D]/40 mb-5" strokeWidth={1} />
              <p className="text-[#A6947D]/60 uppercase text-[10px] font-mono tracking-[0.3em] px-6">Vault Empty. Digitize off-market assets to store here.</p>
            </div>
          ) : (
            
            /* ASSET GRID - VAULT LAYOUT */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full overflow-hidden pb-10">
              {slabs.map(slab => (
                <div key={slab.id} className="bg-[#01030A] rounded-2xl overflow-hidden border border-[#A6947D]/20 hover:border-[#A6947D]/50 transition-all duration-500 group flex flex-col shadow-xl relative w-full">
                  
                  {/* Lock Badge */}
                  <div className="absolute top-3 right-3 z-20 bg-[#020509]/80 border border-[#A6947D]/30 px-2.5 py-1.5 rounded-lg backdrop-blur-md shadow-lg">
                    <Lock size={12} className="text-[#A6947D]" strokeWidth={2} />
                  </div>
                  
                  <Link href={`/trading/${slab.id}`} className="block aspect-[4/3] relative bg-[#020509] overflow-hidden border-b border-[#A6947D]/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#01030A] to-transparent z-10 opacity-90"></div>
                    {slab.image_url ? (
                      <img src={slab.image_url} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} className="text-[#A6947D]" strokeWidth={1}/></div>
                    )}
                  </Link>
                  
                  <div className="p-6 flex flex-col flex-1 relative z-10">
                    <p className="text-[8px] font-mono text-[#A6947D]/60 uppercase tracking-[0.3em] mb-2">AX-{slab.id.substring(0,8)}</p>
                    <h3 className="text-base md:text-lg font-serif uppercase mb-6 text-[#F8F5EE] truncate tracking-widest">{slab.material}</h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-[#A6947D]/10">
                      <span className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest">Secured OTC</span>
                      <Link href={`/trading/${slab.id}`} className="text-[#A6947D]/60 hover:text-[#A6947D] transition-colors group-hover:translate-x-1 duration-300">
                        <ArrowRight size={16} strokeWidth={2} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION (THE STRICT 4-BUTTON BAR) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/vault" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Lock size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Vault</span></Link>
        {/* THE TRIGGER FOR THE COMMAND OVERLAY */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}