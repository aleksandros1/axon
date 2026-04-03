'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Building2, ShieldCheck, Users, 
  Loader2, X, Package, ArrowRight, Layers3, UserCircle, Menu,
  MapPin, Layers, Activity, Zap
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

export default function TradingFloor() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PREMIUM' | 'COMMERCIAL'>('ALL');

  useEffect(() => {
    const fetchSlabs = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data, error } = await supabase
        .from('slabs')
        .select('*, profiles(company_name, status, country)')
        .eq('is_available', true)
        .neq('visibility', 'private')
        .order('created_at', { ascending: false });

      if (!error && data) setSlabs(data);
      setLoading(false);
    };
    fetchSlabs();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };
  const formatCurrency = (val: any) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

  // --- MARKET METRICS ---
  const marketCap = useMemo(() => slabs.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0), [slabs]);

  // --- FILTERING & GROUPING LOGIC (ΟΠΩΣ ΣΤΗ ΦΩΤΟΓΡΑΦΙΑ) ---
  const filteredSlabs = slabs.filter(slab => {
    const matchesSearch = (slab.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (slab.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedSlabs = useMemo(() => {
    return filteredSlabs.reduce((acc: any, slab) => {
      const loc = slab.location || 'GLOBAL HUB';
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(slab);
      return acc;
    }, {});
  }, [filteredSlabs]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans relative antialiased">
      
      {/* MOBILE MENU (SMART OVERLAY) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">{t('common.command_center')}</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">{t('common.core_modules')}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Layers3 size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE]">{t('menu.portfolio')}</span></Link>
              <Link href="/trading" className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Globe size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE]">{t('menu.floor')}</span></Link>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px]">{t('common.disconnect')}</button>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL SIDEBAR */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl fixed h-full">
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]">
            <Globe size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.3em]">{t('common.institutional_grade')}</p>
        </div>
        <SidebarLanguageSwitcher />
        <nav className="flex-1 px-4 space-y-2 relative z-10 text-[10px] font-bold uppercase tracking-widest">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><Layers3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl border border-[#A6947D]/20"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><UserCircle size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* PUBLIC FLOOR MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pl-[280px] custom-scrollbar w-full">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden"><Globe size={1000} className="text-[#A6947D]" /></div>

        <div className="p-4 md:p-12 max-w-7xl mx-auto relative z-10 w-full">
          
          <header className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-[#A6947D]/30"></span>
                    <p className="text-[9px] text-[#A6947D] uppercase tracking-[0.3em] font-mono">GLOBAL TRADING NETWORK</p>
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[8px] text-emerald-500/80 font-bold uppercase tracking-widest">REAL-TIME FEED</p>
                </div>
            </div>
            <h2 className="text-4xl md:text-7xl font-serif text-[#F8F5EE] uppercase tracking-[0.05em] mb-12">PUBLIC FLOOR</h2>

            <div className="flex flex-col lg:flex-row items-center gap-4 bg-[#01030A]/50 backdrop-blur-md border border-[#A6947D]/20 p-2 rounded-2xl">
              <div className="flex-1 flex items-center bg-[#020509] rounded-xl px-4 w-full">
                <Search size={18} className="text-[#A6947D]/40" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Material or ID..." className="w-full bg-transparent border-none py-4 px-4 text-xs md:text-sm font-mono outline-none text-[#F8F5EE] uppercase" />
              </div>
              <div className="flex bg-[#020509] p-1 rounded-xl border border-[#A6947D]/10 shrink-0">
                {['ALL', 'PREMIUM', 'COMMERCIAL'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)} className={`px-5 py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-[#111] text-[#A6947D] shadow-inner' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>{f}</button>
                ))}
              </div>
            </div>
          </header>

          {/* MARKET METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-[#01030A]/80 border border-[#A6947D]/10 p-6 rounded-2xl shadow-lg group hover:border-[#A6947D]/30 transition-all">
                <div className="flex items-center gap-3 mb-3 text-[#A6947D]/60"><Activity size={14} /><p className="text-[8px] font-bold uppercase tracking-widest">MARKET CAP</p></div>
                <p className="text-2xl font-mono text-[#F8F5EE] group-hover:text-[#A6947D] transition-colors">{formatCurrency(marketCap)}</p>
             </div>
             <div className="bg-[#01030A]/80 border border-[#A6947D]/10 p-6 rounded-2xl shadow-lg group hover:border-[#A6947D]/30 transition-all">
                <div className="flex items-center gap-3 mb-3 text-[#A6947D]/60"><Package size={14} /><p className="text-[8px] font-bold uppercase tracking-widest">ACTIVE ASSETS</p></div>
                <p className="text-2xl font-mono text-[#F8F5EE] group-hover:text-[#A6947D] transition-colors">{slabs.length}</p>
             </div>
          </div>

          {/* GROUPED ASSETS BY LOCATION */}
          <div className="space-y-32">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]"><Loader2 size={32} className="animate-spin mb-4" /> Syncing Nodes...</div>
            ) : Object.entries(groupedSlabs).map(([location, items]: [string, any]) => (
                <section key={location} className="animate-in fade-in duration-1000">
                  <div className="flex items-center gap-5 mb-12">
                    <MapPin size={24} className="text-[#A6947D]" />
                    <h3 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.2em]">{location}</h3>
                    <div className="h-px flex-1 bg-[#A6947D]/20"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.map((slab: any) => (
                      <div key={slab.id} className="flex flex-col group transition-all duration-500">
                        {/* ID & LIVE BADGE ROW */}
                        <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-[8px] font-mono font-bold text-[#A6947D]/60 uppercase tracking-widest">AX-{slab.id.substring(0,8)}</span>
                            <div className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">LIVE</span></div>
                        </div>

                        {/* IMAGE SECTION */}
                        <div className="h-64 bg-[#01030A] rounded-2xl overflow-hidden border border-[#A6947D]/10 relative mb-5 cursor-pointer hover:border-[#A6947D]/50 transition-all" onClick={() => router.push(`/trading/${slab.id}`)}>
                          <div className="absolute top-3 left-3 z-20 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 px-2 py-0.5 rounded text-[7px] font-bold text-[#A6947D] uppercase tracking-widest">PUBLIC</div>
                          {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} strokeWidth={1}/></div>}
                        </div>

                        {/* MATERIAL HEADER */}
                        <h4 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-widest mb-6 px-1 truncate">{slab.material}</h4>

                        {/* THE INSTITUTIONAL GRID (4 BOXES) */}
                        <div className="grid grid-cols-2 gap-2 mb-8">
                             <div className="bg-[#01030A] border border-[#A6947D]/5 p-4 rounded-xl shadow-inner group-hover:bg-[#020509] transition-colors">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-tighter">STOCK</p>
                                <p className="text-[11px] font-mono font-bold text-[#F8F5EE]">{slab.quantity || '0'} m²</p>
                             </div>
                             <div className="bg-[#01030A] border border-[#A6947D]/5 p-4 rounded-xl shadow-inner group-hover:bg-[#020509] transition-colors">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-tighter">THICKNESS</p>
                                <p className="text-[11px] font-mono font-bold text-[#F8F5EE]">{slab.thickness || '20'} cm</p>
                             </div>
                             <div className="bg-[#01030A] border border-[#A6947D]/5 p-4 rounded-xl shadow-inner group-hover:bg-[#020509] transition-colors">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-tighter">LOGISTICS</p>
                                <p className="text-[11px] font-mono font-bold text-[#F8F5EE] uppercase">{slab.incoterm || 'FOB'}</p>
                             </div>
                             <div className="bg-[#01030A] border border-[#A6947D]/5 p-4 rounded-xl shadow-inner group-hover:bg-[#020509] transition-colors overflow-hidden">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-tighter">VENDOR</p>
                                <p className="text-[11px] font-bold text-[#A6947D] uppercase truncate">{slab.profiles?.company_name || 'N/A'}</p>
                             </div>
                        </div>

                        {/* VALUATION & INSPECT FOOTER */}
                        <div className="flex flex-col gap-4 border-t border-[#A6947D]/10 pt-6 px-1">
                            <div>
                                <p className="text-[8px] text-[#A6947D]/40 uppercase font-bold tracking-widest mb-1">VALUATION</p>
                                <p className="text-3xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrency(slab.price)}</p>
                            </div>
                            <button onClick={() => router.push(`/trading/${slab.id}`)} className="w-full bg-[#01030A] border border-[#A6947D]/30 hover:bg-[#A6947D] hover:text-[#01030A] py-4 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn">
                                INSPECT <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
            ))}
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Layers3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Comms</span></Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>

    </div>
  );
}