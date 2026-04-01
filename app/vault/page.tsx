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
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 bg-[#000000] shadow-[0_0_15px_rgba(166,148,125,0.1)]">
            <Lock size={18} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">Institutional Grade</p>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><BarChart3 size={16} /> Portfolio</Link>
          <Link href="/trading" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Globe size={16} /> Public Floor</Link>
          <Link href="/vault" className="flex items-center gap-4 px-4 py-3.5 bg-[#050505] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-inner"><Lock size={16} /> Private Vault</Link>
          <Link href="/dashboard/bids" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Gavel size={16} /> My Offers</Link>
          <Link href="/inbox" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><MessageSquare size={16} /> Secure Comms</Link>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> DISCONNECT</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID & ICON */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0 overflow-hidden">
          <Lock size={600} className="text-gray-700 shrink-0" strokeWidth={1} />
        </div>
        
        <div className="p-5 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-4">
              <Lock className="text-[#A6947D]" size={20} strokeWidth={1.5} />
              <p className="text-[9px] text-[#A6947D] uppercase tracking-[0.4em] font-mono">Dark Pool Intelligence</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif uppercase tracking-[0.2em] text-white leading-tight font-light">Private <span className="text-gray-500">Vault</span></h2>
          </header>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-[#A6947D] animate-pulse">
               <div className="w-10 h-10 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
               <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Accessing Ledger...</span>
            </div>
          ) : slabs.length === 0 ? (
            <div className="py-24 text-center border border-gray-900 rounded-sm bg-[#050505] w-full shadow-2xl">
              <Package size={32} className="mx-auto text-gray-800 mb-5" strokeWidth={1} />
              <p className="text-gray-500 uppercase text-[10px] font-mono tracking-[0.3em] px-6">Vault Empty. Digitize off-market assets to store here.</p>
            </div>
          ) : (
            
            /* ASSET GRID - VAULT LAYOUT */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full overflow-hidden pb-10">
              {slabs.map(slab => (
                <div key={slab.id} className="bg-[#050505] rounded-sm overflow-hidden border border-gray-900 hover:border-[#A6947D]/50 transition-all duration-500 group flex flex-col shadow-xl relative w-full">
                  
                  {/* Lock Badge */}
                  <div className="absolute top-3 right-3 z-20 bg-black/60 border border-gray-700 px-2.5 py-1.5 rounded-sm backdrop-blur-md">
                    <Lock size={12} className="text-gray-400" strokeWidth={2} />
                  </div>
                  
                  <Link href={`/trading/${slab.id}`} className="block aspect-[4/3] relative bg-[#020202] overflow-hidden border-b border-gray-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10 opacity-80"></div>
                    {slab.image_url ? (
                      <img src={slab.image_url} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-5"><Package size={48} className="text-gray-500" strokeWidth={1}/></div>
                    )}
                  </Link>
                  
                  <div className="p-6 flex flex-col flex-1 relative z-10">
                    <p className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-2">AX-{slab.id.substring(0,8)}</p>
                    <h3 className="text-base md:text-lg font-serif uppercase mb-6 text-white truncate tracking-widest">{slab.material}</h3>
                    
                    <div className="mt-auto flex items-center justify-between pt-5 border-t border-gray-900">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.3em]">Secured OTC</span>
                      <Link href={`/trading/${slab.id}`} className="text-[#A6947D] hover:text-white transition-colors group-hover:translate-x-1 duration-300">
                        <ArrowRight size={16} strokeWidth={1.5} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE NAV - PRECISION INSTRUMENT STYLE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020202]/95 backdrop-blur-2xl border-t border-gray-900 px-2 py-2 flex justify-between items-center z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-[64px]">
        <Link href="/dashboard" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Port</span></Link>
        <Link href="/trading" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Floor</span></Link>
        <Link href="/vault" className="text-[#A6947D] flex flex-col items-center gap-1 flex-1"><Lock size={20} strokeWidth={2} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Vault</span></Link>
        <Link href="/inbox" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Comms</span></Link>
      </nav>
    </div>
  );
}