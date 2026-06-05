'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Building2, ShieldCheck, Users, 
  Loader2, X, Package, ArrowRight, Layers3, UserCircle, Menu,
  MapPin, Layers, Activity, Zap
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../../lib/i18n/LanguageContext';

export default function TradingFloor() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('BUYER'); 
  
  // -- NEW: ASSET TYPE TAB STATE --
  const [activeTab, setActiveTab] = useState<'SLAB' | 'BLOCK' | 'GRANITE'>('SLAB');

  useEffect(() => {
    const fetchSlabs = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (profile && profile.role) {
        setUserRole(profile.role);
      }

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

  // -- DYNAMIC FILTERING & METRICS --
  const filteredSlabs = slabs.filter(slab => {
    // Default to SLAB if old asset doesn't have a type
    const type = slab.asset_type || 'SLAB'; 
    const matchesTab = type === activeTab;
    const matchesSearch = (slab.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (slab.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch && matchesTab;
  });

  const marketCap = useMemo(() => filteredSlabs.reduce((acc, s) => acc + (parseFloat(s.price) || 0), 0), [filteredSlabs]);

  const groupedSlabs = useMemo(() => {
    return filteredSlabs.reduce((acc: any, slab) => {
      const groupName = slab.material ? slab.material.toUpperCase() : 'UNCLASSIFIED ASSETS';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(slab);
      return acc;
    }, {});
  }, [filteredSlabs]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans relative antialiased">
      
      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">{t('common.command_center')}</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">{t('common.core_modules')} - {userRole}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Layers3 size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">{t('menu.portfolio')}</span></Link>
              
              {userRole === 'SELLER' && (
                <Link href="/scanner" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Crosshair size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">{t('menu.scanner')}</span></Link>
              )}
              
              <Link href="/trading" className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Globe size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">{t('menu.floor')}</span></Link>
              <Link href="/network" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Users size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">{t('menu.network')}</span></Link>
              <Link href="/inbox" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><MessageSquare size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">{t('menu.comms')}</span></Link>
              <Link href="/me" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><UserCircle size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">{t('menu.profile')}</span></Link>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px]">{t('common.disconnect')}</button>
          </div>
        </div>
      )}

      {/* PUBLIC FLOOR MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 custom-scrollbar w-full">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden"><Globe size={1000} className="text-[#A6947D]" /></div>

        <div className="p-4 md:p-12 max-w-7xl mx-auto relative z-10 w-full">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="h-px w-8 bg-[#A6947D]/30"></span>
                    <p className="text-[9px] text-[#A6947D] uppercase tracking-[0.3em] font-mono">GLOBAL EXECUTION FLOOR</p>
                </div>
            </div>
            <h2 className="text-4xl md:text-7xl font-serif text-[#F8F5EE] uppercase tracking-[0.05em] mb-12">{t('trading.title')}</h2>

            {/* -- ASSET CLASSIFICATION TABS -- */}
            <div className="flex bg-[#01030A]/50 backdrop-blur-md border border-[#A6947D]/20 rounded-xl p-1 mb-8 overflow-x-auto custom-scrollbar flex-nowrap w-full">
              <button onClick={() => setActiveTab('SLAB')} className={`flex-1 py-4 px-6 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap min-w-[120px] ${activeTab === 'SLAB' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Premium Slabs</button>
              <button onClick={() => setActiveTab('BLOCK')} className={`flex-1 py-4 px-6 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap min-w-[120px] ${activeTab === 'BLOCK' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Raw Blocks</button>
              <button onClick={() => setActiveTab('GRANITE')} className={`flex-1 py-4 px-6 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap min-w-[120px] ${activeTab === 'GRANITE' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Granite</button>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 bg-[#01030A]/50 backdrop-blur-md border border-[#A6947D]/20 p-2 rounded-2xl">
              <div className="flex-1 flex items-center bg-[#020509] rounded-xl px-4 w-full">
                <Search size={18} className="text-[#A6947D]/40" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Material or ID..." className="w-full bg-transparent border-none py-4 px-4 text-xs md:text-sm font-mono outline-none text-[#F8F5EE] uppercase" />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="bg-[#01030A]/80 border border-[#A6947D]/10 p-6 rounded-2xl shadow-lg group hover:border-[#A6947D]/30 transition-all">
                <div className="flex items-center gap-3 mb-3 text-[#A6947D]/60"><Activity size={14} /><p className="text-[8px] font-bold uppercase tracking-widest">MARKET CAP</p></div>
                <p className="text-2xl font-mono text-[#F8F5EE] group-hover:text-[#A6947D] transition-colors">{formatCurrency(marketCap)}</p>
             </div>
             <div className="bg-[#01030A]/80 border border-[#A6947D]/10 p-6 rounded-2xl shadow-lg group hover:border-[#A6947D]/30 transition-all">
                <div className="flex items-center gap-3 mb-3 text-[#A6947D]/60"><Package size={14} /><p className="text-[8px] font-bold uppercase tracking-widest">ACTIVE ASSETS</p></div>
                <p className="text-2xl font-mono text-[#F8F5EE] group-hover:text-[#A6947D] transition-colors">{filteredSlabs.length}</p>
             </div>
          </div>

          <div className="space-y-32 pb-20">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]"><Loader2 size={32} className="animate-spin mb-4" /> {t('common.syncing')}</div>
            ) : Object.keys(groupedSlabs).length === 0 ? (
                <div className="text-center py-24 border border-[#A6947D]/10 rounded-3xl bg-[#01030A]/50">
                    <Package size={48} className="mx-auto mb-6 text-[#A6947D]/20" strokeWidth={1} />
                    <p className="text-[#A6947D]/40 font-mono text-[10px] uppercase tracking-[0.4em]">{t('trading.no_assets')}</p>
                </div>
            ) : (
              Object.entries(groupedSlabs).map(([groupName, items]: [string, any]) => (
                <section key={groupName} className="animate-in fade-in duration-1000">
                  <div className="flex items-center gap-4 mb-8">
                    <Layers size={20} className="text-[#A6947D]" />
                    <h3 className="text-xl md:text-2xl font-bold tracking-[0.2em] text-[#F8F5EE] uppercase">{groupName}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((slab: any) => (
                      <div key={slab.id} className="bg-[#01030A]/60 backdrop-blur-sm border border-[#A6947D]/15 rounded-2xl p-5 flex flex-col hover:border-[#A6947D]/40 transition-all duration-500 group shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[9px] font-mono font-bold text-[#A6947D]/60 uppercase tracking-widest">AX-{slab.id.substring(0,8)}</span>
                            <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">LIVE</span></div>
                        </div>
                        <div className="relative h-56 rounded-xl bg-[#020509] overflow-hidden mb-6 cursor-pointer group-hover:opacity-90 transition-all" onClick={() => router.push(`/trading/${slab.id}`)}>
                          <div className="absolute top-3 left-3 z-10 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md px-2.5 py-1 rounded text-[7px] font-bold text-emerald-400 uppercase tracking-widest">PUBLIC</div>
                          {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} strokeWidth={1}/></div>}
                        </div>
                        <h4 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-wider mb-6 truncate cursor-pointer hover:text-[#A6947D] transition-colors" onClick={() => router.push(`/trading/${slab.id}`)}>{slab.material}</h4>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                             {/* -- DYNAMIC CARD FIELDS -- */}
                             {activeTab === 'BLOCK' ? (
                                <>
                                  <div className="bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                                      <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1.5 tracking-widest">WEIGHT</p>
                                      <p className="text-xs font-mono font-bold text-[#F8F5EE]">{slab.weight || '---'} T</p>
                                  </div>
                                  <div className="bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                                      <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1.5 tracking-widest">DIMENSIONS</p>
                                      <p className="text-[10px] font-mono font-bold text-[#F8F5EE]">{slab.length || '-'}x{slab.width || '-'}x{slab.height || '-'}</p>
                                  </div>
                                </>
                             ) : (
                                <>
                                  <div className="bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                                      <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1.5 tracking-widest">STOCK</p>
                                      <p className="text-xs font-mono font-bold text-[#F8F5EE]">{slab.quantity || '---'} m²</p>
                                  </div>
                                  <div className="bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                                      <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1.5 tracking-widest">THICKNESS</p>
                                      <p className="text-xs font-mono font-bold text-[#F8F5EE]">{slab.thickness || '---'} cm</p>
                                  </div>
                                </>
                             )}
                             
                             <div className="bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1.5 tracking-widest">LOGISTICS</p>
                                <p className="text-xs font-bold text-[#F8F5EE] uppercase">{slab.incoterm || 'EXW'}</p>
                             </div>
                             <div className="bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner overflow-hidden">
                                <p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1.5 tracking-widest">VENDOR</p>
                                <p className="text-xs font-bold text-[#A6947D] uppercase truncate">{slab.profiles?.company_name || 'SYSTEM'}</p>
                             </div>
                        </div>

                        <div className="mt-auto flex justify-between items-end">
                            <div>
                                <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1.5">VALUATION</p>
                                <p className="text-xl md:text-2xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrency(slab.price)}</p>
                            </div>
                            <button onClick={() => router.push(`/trading/${slab.id}`)} className="border border-[#A6947D]/30 hover:bg-[#A6947D]/10 text-[#A6947D] px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 group/btn">
                                INSPECT <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Layers3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Comms</span></Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}