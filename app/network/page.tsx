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

// Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: useLanguage αντί για useTranslation
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function GlobalNetwork() {
  const router = useRouter();
  
  // Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: language & setLanguage αντί για locale & switchLanguage
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
        // Παίρνουμε μόνο τα ΔΙΑΘΕΣΙΜΑ slabs για να μετρήσουμε το ενεργό απόθεμα
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
  const getColor = (name: string) => {
    const colors = ['bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ: w-full και overflow-x-hidden για να μην κουνιέται η οθόνη */
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* SIDEBAR WITH LANGUAGE SWITCHER - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]"><Users size={20} className="text-[#A6947D]"/></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/20 p-1 rounded-lg shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'el' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT - NO OVERFLOW-X */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-24 md:pb-0 w-full">
        {/* BACKGROUND ICON - LOCKED */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Globe size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          <header className="mb-8 md:mb-12 animate-in fade-in duration-700">
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-8">{t('network.title')}</h2>
            
            {/* SEARCH AREA - STABILIZED */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-2 shadow-xl w-full">
              <div className="flex-1 flex items-center gap-3 pl-4">
                <Search size={18} className="text-[#A6947D]/50" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('trading.search_placeholder')} className="w-full bg-transparent border-none py-3 md:py-4 text-sm outline-none text-[#F8F5EE] placeholder:text-[#A6947D]/30" />
              </div>
            </div>
          </header>

          {/* TABS - STABILIZED */}
          <div className="flex gap-6 border-b border-[#A6947D]/10 mb-8 animate-in fade-in duration-700 delay-100 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('international')} className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'international' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40'}`}>
              <Globe size={14} /> {language === 'el' ? 'Διεθνές Δίκτυο' : 'International Network'} <span className="bg-[#A6947D]/10 px-2 py-0.5 rounded-full text-[8px]">{filteredVendors.length} {t('network.nodes')}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]">{t('common.syncing')}</div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-16 border border-[#A6947D]/10 rounded-2xl bg-[#01030A]/50 w-full">
              <Users size={30} className="mx-auto mb-4 text-[#A6947D]/30" />
              <p className="text-[#A6947D]/60 text-[10px] font-mono uppercase">No Entities Found</p>
            </div>
          ) : (
            /* VENDOR GRID - NO OVERFLOW */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-700 delay-200 w-full">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} onClick={() => router.push(`/vendor/${vendor.id}`)} className="bg-[#01030A]/90 border border-[#A6947D]/15 rounded-2xl p-6 hover:border-[#A6947D]/50 transition-all cursor-pointer group shadow-lg flex flex-col w-full overflow-hidden">
                  
                  <div className="flex items-start justify-between mb-6 w-full">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg flex-none overflow-hidden ${vendor.logo_url ? 'bg-[#020509] border border-[#A6947D]/20' : getColor(vendor.company_name || vendor.email)}`}>
                        {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover" /> : getInitials(vendor.company_name || vendor.email)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-base font-serif text-[#F8F5EE] uppercase tracking-wider mb-1 truncate">{vendor.company_name || vendor.email}</h3>
                        <p className="text-[9px] text-[#A6947D]/60 font-mono tracking-widest uppercase truncate flex items-center gap-1.5"><Building2 size={10}/> {vendor.country || 'Global'}</p>
                      </div>
                    </div>
                    {vendor.status === 'verified' ? (
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-lg flex-none"><CheckCircle2 size={12} className="text-emerald-500"/></div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 rounded-lg flex-none"><ShieldAlert size={12} className="text-amber-500"/></div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 mt-auto">
                    <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-4">
                      <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold mb-1">Network Role</p>
                      <p className="text-[9px] font-mono text-[#F8F5EE] uppercase">{vendor.role || 'Member'}</p>
                    </div>
                    <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-4">
                      <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold mb-1">Trust Score</p>
                      <p className="text-base font-mono text-emerald-400">{vendor.trust_score}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#A6947D]/10 w-full">
                    <p className="text-[9px] font-mono text-[#A6947D] uppercase">{vendor.active_slabs} {language === 'el' ? 'Asset' : 'Assets'}</p>
                    <div className="bg-transparent border border-[#A6947D]/30 text-[#A6947D] px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2">
                      Dossier <ChevronRight size={10} />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/network" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1"><Users size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.network').substring(0,3)}</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.comms').substring(0,5)}</span></Link>
        <Link href="/me" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1"><User size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}