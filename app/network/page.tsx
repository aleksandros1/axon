'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Users, Activity, CheckCircle2, ShieldAlert,
  ChevronRight, Building2, MapPin, User, Loader2
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function GlobalNetwork() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'international' | 'local'>('international');

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data: profilesData } = await supabase.from('profiles').select('*').neq('id', session.user.id);
      
      if (profilesData) {
        const { data: slabsData } = await supabase.from('slabs').select('user_id').eq('is_available', true);
        const vendorsWithStats = profilesData.map(vendor => {
          const vendorSlabs = slabsData?.filter(s => s.user_id === vendor.id) || [];
          return {
            ...vendor,
            active_slabs: vendorSlabs.length,
            trust_score: vendor.status === 'verified' ? 99.9 : 45.5
          };
        });
        setVendors(vendorsWithStats);
      }
      setLoading(false);
    };
    fetchVendors();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const filteredVendors = vendors.filter(vendor => {
    return (vendor.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
           (vendor.vat_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';
  
  // Luxury Monochromatic colors for avatars instead of bright colors
  const getColor = (name: string) => {
    const colors = ['bg-gray-800', 'bg-[#0a0a0a]', 'bg-[#111111]', 'bg-[#050505]'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* SIDEBAR WITH LANGUAGE SWITCHER - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 bg-[#000000] shadow-[0_0_15px_rgba(166,148,125,0.1)]"><Users size={18} className="text-[#A6947D]"/></div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#000000] border border-gray-800 p-1 rounded-sm shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'en' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'el' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-4 px-4 py-3.5 bg-[#050505] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-inner"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[80px] md:pb-0 w-full custom-scrollbar">
        
        {/* BACKGROUND SUBTLE GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
        
        <div className="p-5 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-10 md:mb-16 animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-4xl font-serif text-white uppercase tracking-[0.2em] font-light mb-8 md:mb-10">{t('network.title')}</h2>
            
            {/* SEARCH AREA - BANKING VAULT STYLE */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
              <div className="flex-1 flex items-center bg-[#050505] border border-gray-800 rounded-sm shadow-inner group transition-all focus-within:border-[#A6947D]/50 focus-within:bg-[#080808]">
                <div className="pl-5"><Search size={16} className="text-gray-600 group-focus-within:text-[#A6947D] transition-colors" /></div>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder={language === 'el' ? 'ΑΝΑΖΗΤΗΣΗ ΕΤΑΙΡΕΙΑΣ Ή ΑΦΜ...' : 'SEARCH ENTITY OR TAX ID...'} 
                  className="w-full bg-transparent border-none py-4 md:py-5 px-4 text-xs md:text-sm font-mono outline-none text-white placeholder:text-gray-700 tracking-widest uppercase" 
                />
              </div>
            </div>
          </header>

          {/* TABS - SHARP GEOMETRY */}
          <div className="flex gap-8 border-b border-gray-900 mb-10 animate-in fade-in duration-500 delay-100 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('international')} className={`pb-4 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'international' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}>
              <Globe size={14} /> {language === 'el' ? 'Διεθνες Δικτυο' : 'Global Network'} 
              <span className={`px-2.5 py-1 rounded-sm text-[8px] font-mono ${activeTab === 'international' ? 'bg-[#A6947D]/10 text-[#A6947D]' : 'bg-gray-900 text-gray-500'}`}>
                {filteredVendors.length} {t('network.nodes')}
              </span>
            </button>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-24 text-[#A6947D] animate-pulse">
               <div className="w-10 h-10 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
               <span className="font-mono text-[9px] uppercase tracking-[0.4em]">Querying Ledger</span>
             </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-24 border border-gray-900 rounded-sm bg-[#050505] w-full shadow-2xl">
              <Users size={32} className="mx-auto mb-5 text-gray-800" strokeWidth={1} />
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.3em]">Zero Entities Found</p>
            </div>
          ) : (
            
            /* VENDOR GRID - INSTITUTIONAL LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 animate-in fade-in duration-500 delay-200 w-full pb-10">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} onClick={() => router.push(`/vendor/${vendor.id}`)} className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 hover:border-[#A6947D]/50 transition-all cursor-pointer group shadow-xl flex flex-col w-full overflow-hidden relative">
                  
                  {/* Subtle Hover Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6947D]/5 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  <div className="flex items-start justify-between mb-8 w-full relative z-10">
                    <div className="flex items-center gap-5 overflow-hidden">
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-sm flex items-center justify-center text-lg md:text-xl font-serif text-white shadow-lg flex-none overflow-hidden border border-gray-800 ${vendor.logo_url ? 'bg-[#020202]' : getColor(vendor.company_name || vendor.email)}`}>
                        {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover grayscale-[30%]" /> : getInitials(vendor.company_name || vendor.email)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-sm md:text-base font-serif text-white uppercase tracking-[0.1em] mb-1.5 truncate leading-tight group-hover:text-[#A6947D] transition-colors">{vendor.company_name || vendor.email}</h3>
                        <p className="text-[9px] text-gray-500 font-mono tracking-[0.2em] uppercase truncate flex items-center gap-1.5"><Building2 size={10} className="text-[#A6947D]"/> {vendor.country || 'Global'}</p>
                      </div>
                    </div>
                    {vendor.status === 'verified' ? (
                      <div className="flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-900/50 px-2.5 py-1.5 rounded-sm flex-none shadow-inner"><CheckCircle2 size={12} className="text-emerald-500" strokeWidth={2}/></div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-amber-950/30 border border-amber-900/50 px-2.5 py-1.5 rounded-sm flex-none shadow-inner"><ShieldAlert size={12} className="text-amber-500" strokeWidth={2}/></div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8 mt-auto relative z-10">
                    <div className="bg-[#020202] border border-gray-800 rounded-sm p-4 group-hover:border-gray-700 transition-colors">
                      <p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.2em] mb-2">Network Role</p>
                      <p className="text-[10px] md:text-[11px] font-bold text-gray-300 uppercase tracking-widest">{vendor.role || 'Member'}</p>
                    </div>
                    <div className="bg-[#020202] border border-gray-800 rounded-sm p-4 group-hover:border-gray-700 transition-colors">
                      <p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.2em] mb-2">Trust Score</p>
                      <p className={`text-[11px] md:text-xs font-mono tracking-widest ${vendor.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{vendor.trust_score}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-5 border-t border-gray-900 w-full relative z-10">
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                      <span className="text-white">{vendor.active_slabs}</span> {language === 'el' ? 'ASSET ΔΙΑΘΕΣΙΜΑ' : 'ACTIVE ASSETS'}
                    </p>
                    <div className="bg-transparent border border-gray-800 text-[#A6947D] px-4 py-2 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 group-hover:border-[#A6947D]/50 group-hover:bg-[#A6947D]/5 transition-all">
                      Access Node <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
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
        <Link href="/dashboard" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/network" className="text-[#A6947D] flex flex-col items-center gap-1 flex-1"><Users size={20} strokeWidth={2} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.network').substring(0,3)}</span></Link>
        <Link href="/trading" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.comms').substring(0,5)}</span></Link>
        <Link href="/me" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><User size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}