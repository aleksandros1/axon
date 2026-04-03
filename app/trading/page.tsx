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

  // --- METRICS CALCULATION ---
  const marketCap = useMemo(() => slabs.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0), [slabs]);

  // --- FILTERING & GROUPING ---
  const filteredSlabs = slabs.filter(slab => {
    const matchesSearch = (slab.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (slab.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCategory = filter === 'ALL' ? true : filter === 'PREMIUM' ? parseFloat(slab.price) > 50000 : parseFloat(slab.price) <= 50000;
    return matchesSearch && matchesCategory;
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
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* MOBILE SMART MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">{t('common.command_center')}</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">{t('common.core_modules')}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center gap-3"><Layers3 size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE]">{t('menu.portfolio')}</span></Link>
              <Link href="/trading" className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-xl flex flex-col items-center gap-3"><Globe size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE]">{t('menu.floor')}</span></Link>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px]">{t('common.disconnect')}</button>
          </div>
        </div>
      )}

      {/* MASTER SIDEBAR - DESKTOP */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl fixed h-full">
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <Shield size={24} className="text-[#A6947D] mb-2"/>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.3em]">{t('common.institutional_grade')}</p>
        </div>
        <SidebarLanguageSwitcher />
        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Layers3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><UserCircle size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pl-[280px] custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden">
            <Globe size={1000} className="text-[#A6947D]" />
        </div>

        <div className="p-4 md:p-12 max-w-7xl mx-auto relative z-10 w-full">
          
          <header className="mb-10 animate-in fade-in duration-700">
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

            <h2 className="text-4xl md:text-6xl font-serif text-[#F8F5EE] uppercase tracking-[0.05em] mb-12">PUBLIC FLOOR</h2>

            {/* SEARCH & FILTERS BAR */}
            <div className="flex flex-col lg:flex-row items-center gap-4 bg-[#01030A]/50 backdrop-blur-md border border-[#A6947D]/20 p-2 rounded-2xl shadow-2xl">
              <div className="flex-1 flex items-center bg-[#020509] rounded-xl px-4 w-full">
                <Search size={18} className="text-[#A6947D]/40" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder="Search Material or ID..." 
                  className="w-full bg-transparent border-none py-4 px-4 text-xs md:text-sm font-mono outline-none text-[#F8F5EE] uppercase placeholder:text-[#A6947D]/20" 
                />
              </div>
              <div className="flex bg-[#020509] p-1 rounded-xl border border-[#A6947D]/10 shrink-0">
                {['ALL', 'PREMIUM', 'COMMERCIAL'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-[#A6947D] text-[#020509] shadow-lg' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>{f}</button>
                ))}
              </div>
            </div>
          </header>

          {/* METRICS ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
             <div className="bg-[#01030A]/80 border border-[#A6947D]/10 p-6 rounded-2xl shadow-lg group hover:border-[#A6947D]/30 transition-all">
                <div className="flex items-center gap-3 mb-3 text-[#A6947D]/60"><Activity size={14} /><p className="text-[8px] font-bold uppercase tracking-widest">MARKET CAP</p></div>
                <p className="text-2xl font-mono text-[#F8F5EE] group-hover:text-[#A6947D] transition-colors">{formatCurrency(marketCap)}</p>
             </div>
             <div className="bg-[#01030A]/80 border border-[#A6947D]/10 p-6 rounded-2xl shadow-lg group hover:border-[#A6947D]/30 transition-all">
                <div className="flex items-center gap-3 mb-3 text-[#A6947D]/60"><Package size={14} /><p className="text-[8px] font-bold uppercase tracking-widest">ACTIVE ASSETS</p></div>
                <p className="text-2xl font-mono text-[#F8F5EE] group-hover:text-[#A6947D] transition-colors">{filteredSlabs.length}</p>
             </div>
          </div>

          {/* ASSET LIST GROUPED BY LOCATION */}
          <div className="space-y-20 pb-20">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse"><Loader2 size={32} className="animate-spin mb-4" /><span className="font-mono text-[10px] uppercase">Querying Nodes...</span></div>
            ) : Object.keys(groupedSlabs).length === 0 ? (
                <div className="text-center py-24 border border-[#A6947D]/10 rounded-3xl bg-[#01030A]/50">
                    <Package size={48} className="mx-auto mb-6 text-[#A6947D]/20" strokeWidth={1} />
                    <p className="text-[#A6947D]/40 font-mono text-[10px] uppercase tracking-[0.4em]">{t('trading.no_assets')}</p>
                </div>
            ) : (
              Object.entries(groupedSlabs).map(([location, items]: [string, any]) => (
                <section key={location} className="animate-in fade-in duration-1000">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-full bg-[#A6947D]/10 border border-[#A6947D]/20 flex items-center justify-center"><MapPin size={18} className="text-[#A6947D]" /></div>
                    <h3 className="text-2xl md:text-3xl font-serif text-[#F8F5EE] uppercase tracking-[0.2em]">{location}</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#A6947D]/30 to-transparent"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {items.map((slab: any) => (
                      <div key={slab.id} className="bg-[#01030A] border border-[#A6947D]/15 rounded-2xl overflow-hidden hover:border-[#A6947D]/50 transition-all duration-500 group shadow-2xl flex flex-col">
                        
                        {/* CARD IMAGE */}
                        <div className="h-64 bg-[#020509] relative cursor-pointer group-hover:opacity-90 transition-all" onClick={() => router.push(`/trading/${slab.id}`)}>
                          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                            <span className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/30 px-2 py-1 rounded text-[7px] font-bold text-[#A6947D] uppercase tracking-widest shadow-lg">AX-{slab.id.substring(0,8)}</span>
                          </div>
                          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#01030A]/80 backdrop-blur-md px-2 py-1 rounded border border-emerald-500/30">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">LIVE</span>
                          </div>
                          {slab.image_url ? (
                            <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} strokeWidth={1}/></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#01030A] to-transparent opacity-60"></div>
                        </div>

                        {/* CARD INFO */}
                        <div className="p-6 flex flex-col flex-1">
                          <h4 className="text-xl font-serif text-[#F8F5EE] uppercase tracking-wider mb-6 group-hover:text-[#A6947D] transition-colors">{slab.material}</h4>
                          
                          <div className="grid grid-cols-2 gap-2 mb-8">
                             <div className="bg-[#020509] border border-[#A6947D]/10 p-3 rounded-xl">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1">STOCK</p>
                                <p className="text-[10px] font-mono font-bold">{slab.quantity || '0'} m²</p>
                             </div>
                             <div className="bg-[#020509] border border-[#A6947D]/10 p-3 rounded-xl">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1">THICKNESS</p>
                                <p className="text-[10px] font-mono font-bold">{slab.thickness || '2'} cm</p>
                             </div>
                             <div className="bg-[#020509] border border-[#A6947D]/10 p-3 rounded-xl">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1">LOGISTICS</p>
                                <p className="text-[10px] font-mono font-bold uppercase">{slab.incoterm || 'FOB'}</p>
                             </div>
                             <div className="bg-[#020509] border border-[#A6947D]/10 p-3 rounded-xl overflow-hidden">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1">VENDOR</p>
                                <p className="text-[10px] font-bold uppercase truncate">{slab.profiles?.company_name || 'N/A'}</p>
                             </div>
                          </div>

                          <div className="mt-auto pt-6 border-t border-[#A6947D]/10 flex flex-col gap-4">
                            <div>
                                <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">{slab.pricing_model === 'ROQ' ? 'PREMIUM BASE' : 'VALUATION'}</p>
                                <p className="text-2xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrency(slab.price)}</p>
                            </div>
                            <button onClick={() => router.push(`/trading/${slab.id}`)} className="w-full bg-[#020509] border border-[#A6947D]/20 hover:border-[#A6947D] text-[#A6947D] hover:text-[#020509] hover:bg-[#A6947D] text-[9px] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-inner group/btn">
                                INSPECT <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </section>
              ))
            )}
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