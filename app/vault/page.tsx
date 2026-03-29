'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Lock, Globe, BarChart3, Gavel, MessageSquare, 
  Activity, Crosshair, User, Users, LogOut, Package, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function PrivateVault() {
  const router = useRouter();
  const [slabs, setSlabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ: w-full και overflow-hidden για να μην κουνιέται η οθόνη */
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]">
            <Shield size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">Institutional Grade</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> Portfolio</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> Public Floor</Link>
          <Link href="/vault" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Lock size={16} /> Private Vault</Link>
          <Link href="/dashboard/bids" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Gavel size={16} /> My Offers</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> Secure Comms</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> Disconnect</button></div>
      </aside>

      {/* MAIN CONTENT - NO OVERFLOW-X */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar w-full">
        {/* BACKGROUND ICON - LOCKED */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Shield size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          <header className="mb-10 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="text-[#A6947D]" size={24} />
              <p className="text-[9px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.3em] font-mono">Dark Pool Intelligence</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif uppercase tracking-[0.1em] text-[#F8F5EE] leading-tight font-light">Private <span className="text-[#A6947D]">Vault</span></h2>
          </header>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse">
              <Activity className="animate-spin mb-4" size={32} />
              <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Accessing Secured Ledger...</p>
            </div>
          ) : slabs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#A6947D]/20 rounded-3xl bg-[#01030A]/50 w-full">
              <Package size={40} className="mx-auto text-[#A6947D]/20 mb-4" />
              <p className="text-[#A6947D]/60 uppercase text-[10px] font-black tracking-widest px-6">Vault Empty. Use scanner to digitize off-market assets.</p>
            </div>
          ) : (
            /* ASSET GRID - NO WIGGLE */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full overflow-hidden">
              {slabs.map(slab => (
                <div key={slab.id} className="bg-[#01030A]/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-[#A6947D]/15 hover:border-[#A6947D]/40 transition-all duration-500 group flex flex-col shadow-2xl relative w-full">
                  <div className="absolute top-3 right-3 z-20 bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 rounded-lg backdrop-blur-md">
                    <Lock size={10} className="text-indigo-400" />
                  </div>
                  
                  <div className="aspect-[4/3] relative bg-[#020509] overflow-hidden border-b border-[#A6947D]/10">
                    {slab.image_url ? (
                      <img src={slab.image_url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} className="text-[#A6947D]"/></div>
                    )}
                  </div>
                  
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-[8px] font-mono text-[#A6947D] uppercase tracking-widest mb-1">AX-{slab.id.substring(0,8)}</p>
                    <h3 className="text-lg font-serif uppercase mb-4 text-[#F8F5EE] truncate">{slab.material}</h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#A6947D]/10">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Secured OTC</span>
                      <Link href={`/trading/${slab.id}`} className="text-[#A6947D] hover:text-[#F8F5EE] transition-colors"><ArrowRight size={16}/></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-4 py-3 flex justify-between items-center z-50 pb-[calc(0.7rem+env(safe-area-inset-bottom))] shadow-2xl w-full">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 flex-1"><BarChart3 size={20} className="text-[#A6947D]/40" /><span className="text-[8px] uppercase font-bold text-[#A6947D]/40">Port</span></Link>
        <Link href="/trading" className="flex flex-col items-center gap-1 flex-1"><Globe size={20} className="text-[#A6947D]/40" /><span className="text-[8px] uppercase font-bold text-[#A6947D]/40">Floor</span></Link>
        <Link href="/vault" className="flex flex-col items-center gap-1 flex-1"><Lock size={20} className="text-[#A6947D]" /><span className="text-[8px] uppercase font-bold text-[#A6947D]">Vault</span></Link>
        <Link href="/inbox" className="flex flex-col items-center gap-1 flex-1"><MessageSquare size={20} className="text-[#A6947D]/40" /><span className="text-[8px] uppercase font-bold text-[#A6947D]/40">Comms</span></Link>
      </nav>
    </div>
  );
}