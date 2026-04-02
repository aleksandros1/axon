'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Users, Activity, CheckCircle2, ShieldAlert,
  ChevronRight, Building2, MapPin, User, Loader2, Menu, X, FileSignature, Gavel
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

export default function GlobalNetwork() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'international' | 'local'>('international');

  // --- STATE ΓΙΑ ΤΟ SMART MENU ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  
  // Αυστηρά, dark-navy χρώματα για τα avatars
  const getColor = (name: string) => {
    const colors = ['bg-[#01030A]', 'bg-[#020509]', 'bg-[#0a0f1a]', 'bg-[#050812]'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
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
              <Link href="/network" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/30 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/20 transition-colors shadow-inner">
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

      {/* SIDEBAR WITH LANGUAGE SWITCHER - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 shadow-[0_0_15px_rgba(166,148,125,0.05)] bg-[#01030A]">
            <Users size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 w-full custom-scrollbar z-10">
        
        {/* BACKGROUND SUBTLE WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Users size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-8 md:mb-12 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4"><span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span><p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Entity Radar</p></div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-8 md:mb-10">{t('network.title')}</h2>
            
            {/* SEARCH AREA - BANKING VAULT STYLE */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
              <div className="flex-1 flex items-center bg-[#01030A] border border-[#A6947D]/20 rounded-xl shadow-inner group transition-all focus-within:border-[#A6947D] focus-within:bg-[#020509]">
                <div className="pl-5"><Search size={18} className="text-[#A6947D]/40 group-focus-within:text-[#A6947D] transition-colors" /></div>
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  placeholder={language === 'el' ? 'ΑΝΑΖΗΤΗΣΗ ΕΤΑΙΡΕΙΑΣ Ή ΑΦΜ...' : 'SEARCH ENTITY OR TAX ID...'} 
                  className="w-full bg-transparent border-none py-4 md:py-4 px-4 text-xs md:text-sm font-mono outline-none text-[#F8F5EE] placeholder:text-[#F8F5EE]/20 tracking-widest uppercase" 
                />
              </div>
            </div>
          </header>

          {/* TABS - SHARP GEOMETRY */}
          <div className="flex gap-4 md:gap-8 border-b border-[#A6947D]/10 mb-8 md:mb-10 animate-in fade-in duration-500 delay-100 overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('international')} className={`pb-4 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 md:gap-3 transition-all whitespace-nowrap ${activeTab === 'international' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}>
              <Globe size={14} /> {language === 'el' ? 'Διεθνες Δικτυο' : 'Global Network'} 
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${activeTab === 'international' ? 'bg-[#A6947D]/20 text-[#A6947D]' : 'bg-[#01030A] text-[#F8F5EE]/40 border border-[#A6947D]/10'}`}>
                {filteredVendors.length} {t('network.nodes')}
              </span>
            </button>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse">
               <Loader2 size={32} className="animate-spin mb-4" />
               <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Querying Ledger</span>
             </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-20 border border-[#A6947D]/10 rounded-2xl bg-[#01030A]/50 w-full shadow-lg">
              <Users size={32} className="mx-auto mb-4 text-[#A6947D]/30" strokeWidth={1} />
              <p className="text-[#F8F5EE]/40 text-[10px] font-mono uppercase tracking-[0.3em]">Zero Entities Found</p>
            </div>
          ) : (
            
            /* VENDOR GRID - INSTITUTIONAL LAYOUT */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-500 delay-200 w-full pb-10">
              {filteredVendors.map(vendor => (
                <div key={vendor.id} onClick={() => router.push(`/vendor/${vendor.id}`)} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/15 rounded-2xl p-5 md:p-8 hover:border-[#A6947D]/40 transition-all cursor-pointer group shadow-lg flex flex-col w-full overflow-hidden relative">
                  
                  <div className="flex items-start justify-between mb-6 w-full relative z-10">
                    <div className="flex items-center gap-4 md:gap-5 overflow-hidden">
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-lg md:text-xl font-serif text-[#F8F5EE] shadow-inner flex-none overflow-hidden border border-[#A6947D]/20 ${vendor.logo_url ? 'bg-[#020509]' : getColor(vendor.company_name || vendor.email)}`}>
                        {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover grayscale-[30%]" /> : getInitials(vendor.company_name || vendor.email)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-wider mb-1 md:mb-1.5 truncate leading-tight group-hover:text-[#A6947D] transition-colors">{vendor.company_name || vendor.email}</h3>
                        <p className="text-[8px] md:text-[9px] text-[#A6947D]/80 font-bold tracking-widest uppercase truncate flex items-center gap-1.5"><Building2 size={10} className="text-[#A6947D]/60"/> {vendor.country || 'Global'}</p>
                      </div>
                    </div>
                    {vendor.status === 'verified' ? (
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg flex-none"><CheckCircle2 size={12} className="text-emerald-500" strokeWidth={2}/></div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex-none"><ShieldAlert size={12} className="text-amber-500" strokeWidth={2}/></div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8 mt-auto relative z-10">
                    <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-3 md:p-4 group-hover:border-[#A6947D]/20 transition-colors shadow-inner">
                      <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1.5">Network Role</p>
                      <p className="text-[10px] md:text-[11px] font-sans font-bold text-[#F8F5EE] uppercase tracking-wider">{vendor.role || 'Member'}</p>
                    </div>
                    <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-3 md:p-4 group-hover:border-[#A6947D]/20 transition-colors shadow-inner">
                      <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1.5">Trust Score</p>
                      <p className={`text-[11px] md:text-xs font-mono font-bold tracking-widest ${vendor.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>{vendor.trust_score}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 md:pt-5 border-t border-[#A6947D]/10 w-full relative z-10">
                    <p className="text-[8px] md:text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest">
                      <span className="text-[#F8F5EE] font-mono mr-1">{vendor.active_slabs}</span> {language === 'el' ? 'ASSET ΔΙΑΘΕΣΙΜΑ' : 'ACTIVE ASSETS'}
                    </p>
                    <div className="bg-transparent border border-[#A6947D]/30 text-[#A6947D] px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 group-hover:border-[#A6947D] group-hover:bg-[#A6947D]/10 transition-all shadow-md">
                      Access Node <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
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
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors">
          <MessageSquare size={20} />
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        {/* THE TRIGGER FOR THE COMMAND OVERLAY (ACTIVE BECAUSE WE ARE IN NETWORK) */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}