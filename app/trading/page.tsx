'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Users, Activity, User, Target, Package, Loader2, ChevronRight,
  Lock, ShoppingCart, Gem, MapPin, Layers, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function TradingFloor() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [savedSlabIds, setSavedSlabIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [lockingId, setLockingId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    const fetchFloorData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      const { data: slabsData } = await supabase
        .from('slabs')
        .select('*, profiles(company_name, status)')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (slabsData) setSlabs(slabsData);

      const { data: savedData } = await supabase
        .from('saved_assets')
        .select('slab_id')
        .eq('user_id', session.user.id);

      if (savedData) {
        const savedIds = new Set(savedData.map(item => item.slab_id));
        setSavedSlabIds(savedIds);
      }
      setLoading(false);
    };

    fetchFloorData();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return 'N/A';
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const toggleTargetLock = async (e: React.MouseEvent, slabId: string) => {
    e.preventDefault(); 
    if (!currentUser || lockingId) return;

    setLockingId(slabId);
    const isSaved = savedSlabIds.has(slabId);

    try {
      if (isSaved) {
        await supabase.from('saved_assets').delete().match({ user_id: currentUser.id, slab_id: slabId });
        setSavedSlabIds(prev => { const next = new Set(prev); next.delete(slabId); return next; });
      } else {
        await supabase.from('saved_assets').insert({ user_id: currentUser.id, slab_id: slabId });
        setSavedSlabIds(prev => { const next = new Set(prev); next.add(slabId); return next; });
      }
    } catch (error) { console.error('Lock Error:', error); } 
    finally { setLockingId(null); }
  };

  const filteredSlabs = slabs.filter(slab => {
    const matchesSearch = (slab.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (slab.id.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (slab.origin?.toLowerCase() || '').includes(searchQuery.toLowerCase()); 
    const pModel = slab.pricing_model === 'ROQ' ? 'ROQ' : 'PUBLIC';
    const matchesTab = activeTab === 'ALL' || pModel === activeTab;
    return matchesSearch && matchesTab;
  });

  const groupedSlabs = useMemo(() => {
    const grouped: any = {};
    filteredSlabs.forEach(slab => {
      let country = slab.origin || 'Other';
      const upperCountry = country.toUpperCase();
      if (upperCountry === 'GREECE' || upperCountry === 'ΕΛΛΑΔΑ' || upperCountry === 'ΕΛΛΑΣ') { country = 'ΕΛΛΑΔΑ'; }
      const material = slab.material || 'Other Marble';

      if (!grouped[country]) grouped[country] = {};
      if (!grouped[country][material]) grouped[country][material] = [];
      grouped[country][material].push(slab);
    });

    const sortedCountries = Object.keys(grouped).sort((a, b) => {
      if (a === 'ΕΛΛΑΔΑ') return -1;
      if (b === 'ΕΛΛΑΔΑ') return 1;
      return a.localeCompare(b, language === 'el' ? 'el' : 'en');
    });

    return sortedCountries.map(country => ({
      countryName: country,
      materials: Object.keys(grouped[country]).sort().map(material => ({
        materialName: material, assets: grouped[country][material]
      }))
    }));
  }, [filteredSlabs, language]);

  const totalMarketCap = slabs.reduce((acc, slab) => {
    const val = typeof slab.price === 'string' ? parseFloat(slab.price.replace(/\./g, '').replace(/,/g, '.')) : (slab.price || 0);
    return acc + val;
  }, 0);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-16 h-16 border border-[#A6947D]/20 rounded-full flex items-center justify-center relative mb-6 bg-[#01030A]/20 shadow-lg"><Globe size={24} className="text-[#A6947D]"/></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/20 p-1 rounded-lg">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'el' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT - NO OVERFLOW-X */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar w-full">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Globe size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-7xl mx-auto relative z-10 w-full overflow-x-hidden">
          <header className="mb-8 md:mb-12 animate-in fade-in duration-700 w-full">
            <div className="flex items-center justify-between mb-4 w-full">
              <div className="flex items-center gap-2 md:gap-3"><span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span><p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">{t('trading.network_label')}</p></div>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[8px] md:text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-widest">{t('trading.real_time')}</span></div>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-6 md:mb-8">{t('menu.floor')}</h2>
            
            {/* SEARCH & STRATEGY TOGGLES - STABILIZED FOR MOBILE */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-2 md:p-2 shadow-2xl w-full">
              <div className="flex-1 flex items-center gap-3 pl-4">
                <Search size={18} className="text-[#A6947D]/50 flex-none" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('trading.search_placeholder')} className="w-full bg-transparent border-none py-3 md:py-4 text-sm md:text-sm outline-none text-[#F8F5EE] placeholder:text-[#A6947D]/30" />
              </div>
              <div className="flex bg-[#020509] border border-[#A6947D]/20 rounded-xl p-1 shrink-0 overflow-x-auto no-scrollbar w-full lg:w-auto">
                <button onClick={() => setActiveTab('ALL')} className={`flex-1 lg:flex-none px-4 md:px-6 py-3 md:py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'bg-[#A6947D]/10 text-[#A6947D]' : 'text-[#A6947D]/40'}`}>ALL</button>
                <button onClick={() => setActiveTab('ROQ')} className={`flex-1 lg:flex-none px-4 md:px-6 py-3 md:py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-2 ${activeTab === 'ROQ' ? 'bg-amber-500/10 text-amber-400' : 'text-[#A6947D]/40'}`}><Gem size={12}/> PREMIUM</button>
                <button onClick={() => setActiveTab('PUBLIC')} className={`flex-1 lg:flex-none px-4 md:px-6 py-3 md:py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex justify-center items-center gap-2 ${activeTab === 'PUBLIC' ? 'bg-emerald-500/10 text-emerald-400' : 'text-[#A6947D]/40'}`}><ShoppingCart size={12}/> COMMERCIAL</button>
              </div>
            </div>
          </header>

          {/* MARKET STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10 w-full">
            <div className="bg-[#01030A]/60 border border-[#A6947D]/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm w-full">
              <p className="text-[8px] md:text-[10px] font-bold text-[#A6947D]/60 uppercase tracking-widest mb-1.5 md:mb-2 flex items-center gap-2"><Activity size={12}/> {t('trading.market_cap')}</p>
              <p className="text-base md:text-xl font-mono text-[#F8F5EE] tracking-wider truncate">{formatCurrency(totalMarketCap)}</p>
            </div>
            <div className="bg-[#01030A]/60 border border-[#A6947D]/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm w-full">
              <p className="text-[8px] md:text-[10px] font-bold text-[#A6947D]/60 uppercase tracking-widest mb-1.5 md:mb-2 flex items-center gap-2"><Package size={12}/> {t('trading.active_assets')}</p>
              <p className="text-base md:text-xl font-mono text-[#F8F5EE] tracking-wider truncate">{filteredSlabs.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em] w-full"><Loader2 size={32} className="animate-spin mb-4" />{t('common.syncing')}</div>
          ) : (
            <div className="space-y-10 md:space-y-12 animate-in fade-in duration-700 delay-300 w-full overflow-x-hidden">
              {groupedSlabs.map(({ countryName, materials }: any) => (
                <section key={countryName} className="w-full overflow-hidden">
                  <div className="relative py-4 mb-6 md:mb-8 border-b-2 border-[#A6947D] flex items-center gap-3 md:gap-4">
                    <MapPin size={20} className="text-[#A6947D] md:w-6 md:h-6" />
                    <h2 className="text-xl md:text-3xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">{countryName}</h2>
                  </div>
                  
                  <div className="space-y-8 md:space-y-10 pl-1 md:pl-4 w-full">
                    {materials.map(({ materialName, assets }: any) => (
                      <div key={materialName} className="w-full">
                        <div className="flex items-center gap-3 mb-4 md:mb-6 border-l-4 border-[#A6947D]/50 pl-3 md:pl-4 py-1.5">
                          <Layers size={14} className="text-[#A6947D]/80 md:w-4 md:h-4" />
                          <h3 className="text-sm md:text-lg font-sans uppercase tracking-widest text-[#F8F5EE]/90 font-bold">{materialName}</h3>
                        </div>
                        
                        {/* ASSET GRID - MOBILE 1 COL / DESKTOP 2-3 COLS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 w-full">
                          {assets.map((slab: any) => (
                            <div key={slab.id} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl md:rounded-xl overflow-hidden group hover:border-[#A6947D]/60 transition-all duration-500 shadow-2xl flex flex-col relative w-full">
                                
                                {/* TOP BAR */}
                                <div className="flex justify-between items-center px-4 py-2.5 border-b border-[#A6947D]/10 bg-[#020509]">
                                  <span className="text-[9px] font-mono text-[#A6947D]/60 uppercase tracking-widest">AX-{slab.id.substring(0,8)}</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
                                  </div>
                                </div>

                                {/* IMAGE */}
                                <Link href={`/trading/${slab.id}`} className="block h-48 md:h-48 relative overflow-hidden bg-[#020509]">
                                  <div className={`absolute top-3 left-3 md:top-4 md:left-4 z-20 backdrop-blur-md border px-2 py-1 rounded shadow-lg flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-widest ${slab.pricing_model === 'ROQ' ? 'bg-amber-900/40 border-amber-500/50 text-amber-400' : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400'}`}>
                                    {slab.pricing_model === 'ROQ' ? 'ROQ' : 'PUBLIC'}
                                  </div>

                                  {slab.image_url ? (
                                    <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={40} className="text-[#A6947D]" /></div>
                                  )}
                                </Link>

                                {/* ASSET DATA */}
                                <div className="p-4 md:p-5 flex flex-col flex-1">
                                  <h3 className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-widest mb-4 truncate">{slab.material}</h3>
                                  
                                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 border-y border-[#A6947D]/10 py-4">
                                    <div className="bg-[#020509] p-2 rounded-lg border border-[#A6947D]/5"><p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-widest">Stock</p><p className="text-[11px] md:text-xs font-mono text-[#F8F5EE]">{slab.quantity} m²</p></div>
                                    <div className="bg-[#020509] p-2 rounded-lg border border-[#A6947D]/5"><p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-widest">Thickness</p><p className="text-[11px] md:text-xs font-mono text-[#F8F5EE]">{slab.thickness} cm</p></div>
                                    <div className="bg-[#020509] p-2 rounded-lg border border-[#A6947D]/5"><p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-widest">Logistics</p><p className="text-[11px] md:text-xs font-sans text-[#A6947D] font-bold">{slab.incoterm || 'EXW'}</p></div>
                                    <div className="bg-[#020509] p-2 rounded-lg border border-[#A6947D]/5 overflow-hidden"><p className="text-[7px] text-[#A6947D]/50 uppercase font-bold mb-1 tracking-widest">Vendor</p><p className="text-[9px] font-bold text-[#F8F5EE]/70 uppercase truncate">{slab.profiles?.company_name || 'System'}</p></div>
                                  </div>

                                  <div className="mt-auto flex items-center justify-between">
                                    <div className="flex-1 overflow-hidden pr-2">
                                      <p className="text-[8px] text-[#A6947D] uppercase font-bold mb-1 tracking-widest">Valuation</p>
                                      {slab.pricing_model === 'ROQ' ? <p className="text-sm md:text-sm font-mono text-amber-400">ROQ Protocol</p> : <p className="text-lg md:text-lg font-mono text-[#F8F5EE] truncate">{formatCurrency(slab.price)}</p>}
                                    </div>
                                    <Link href={`/trading/${slab.id}`} className="bg-[#A6947D]/10 hover:bg-[#A6947D]/20 border border-[#A6947D]/40 text-[#A6947D] px-4 md:px-4 py-3 md:py-2.5 rounded-xl md:rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 flex-none">
                                      Inspect <ArrowRight size={12} className="md:w-2.5 md:h-2.5"/>
                                    </Link>
                                  </div>
                                </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.7rem+env(safe-area-inset-bottom))] shadow-2xl w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><BarChart3 size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/network" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Users size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.network').substring(0,3)}</span></Link>
        <Link href="/trading" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1"><Globe size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1"><MessageSquare size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.comms').substring(0,5)}</span></Link>
        <Link href="/me" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1"><User size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}