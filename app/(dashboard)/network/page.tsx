'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Globe, Search, Users, CheckCircle2, ShieldAlert,
  ChevronRight, Building2, Loader2, Fingerprint, Copy, Check
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function GlobalNetwork() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'international' | 'local'>('international');
  
  // State για το Copy to Clipboard
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data: profilesData } = await supabase.from('profiles').select('*').neq('id', session.user.id);
      
      if (profilesData) {
        const { data: slabsData } = await supabase.from('slabs').select('user_id').eq('is_available', true);
        const vendorsWithStats = profilesData.map((vendor: any) => {
          const vendorSlabs = slabsData?.filter((s: any) => s.user_id === vendor.id) || [];
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

  // Λειτουργία Αντιγραφής ID
  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (!id || id === 'PENDING ID') return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredVendors = vendors.filter(vendor => {
    return (vendor.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
           (vendor.axon_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
           (vendor.vat_number?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';
  
  const getColor = (name: string) => {
    const colors = ['bg-[#01030A]', 'bg-[#020509]', 'bg-[#0a0f1a]', 'bg-[#050812]'];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) { hash = name.charCodeAt(i) + ((hash << 5) - hash); }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <main className="flex-1 h-[100dvh] overflow-y-auto overflow-x-hidden relative bg-[#020509] text-[#F8F5EE] pb-[80px] md:pb-0 w-full custom-scrollbar z-10 selection:bg-[#A6947D]/30 antialiased">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
        <Users size={800} className="text-[#A6947D] shrink-0" />
      </div>
      
      <div className="p-4 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
        
        <header className="mb-8 md:mb-12 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4"><span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span><p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Entity Radar</p></div>
          <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-8 md:mb-10">{t('network.title')}</h2>
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
            <div className="flex-1 flex items-center bg-[#01030A] border border-[#A6947D]/20 rounded-xl shadow-inner group transition-all focus-within:border-[#A6947D] focus-within:bg-[#020509]">
              <div className="pl-5"><Search size={18} className="text-[#A6947D]/40 group-focus-within:text-[#A6947D] transition-colors" /></div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={language === 'el' ? 'ΑΝΑΖΗΤΗΣΗ ΕΤΑΙΡΕΙΑΣ, ΑΦΜ Ή ID...' : 'SEARCH ENTITY OR ID...'} 
                className="w-full bg-transparent border-none py-4 md:py-4 px-4 text-xs md:text-sm font-mono outline-none text-[#F8F5EE] placeholder:text-[#F8F5EE]/20 tracking-widest uppercase" 
              />
            </div>
          </div>
        </header>

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-in fade-in duration-500 delay-200 w-full pb-10">
            {filteredVendors.map(vendor => (
              <div key={vendor.id} onClick={() => router.push(`/vendor/${vendor.id}`)} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/15 rounded-2xl p-5 md:p-8 hover:border-[#A6947D]/40 transition-all cursor-pointer group shadow-lg flex flex-col w-full overflow-hidden relative">
                
                <div className="flex items-start justify-between mb-6 w-full relative z-10">
                  <div className="flex items-center gap-4 md:gap-5 overflow-hidden">
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-lg md:text-xl font-serif text-[#F8F5EE] shadow-inner flex-none overflow-hidden border border-[#A6947D]/20 ${vendor.logo_url ? 'bg-[#020509]' : getColor(vendor.company_name || vendor.email)}`}>
                      {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover grayscale-[30%]" /> : getInitials(vendor.company_name || vendor.email)}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-wider mb-1.5 truncate leading-tight group-hover:text-[#A6947D] transition-colors">{vendor.company_name || vendor.email}</h3>
                      
                      {/* THE NEW COPY PROTOCOL */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] text-[#A6947D] font-mono tracking-[0.2em] bg-[#020509] px-2 py-1 rounded border border-[#A6947D]/20">
                          <Fingerprint size={10} /> 
                          {vendor.axon_id || 'PENDING ID'}
                        </div>
                        {vendor.axon_id && (
                          <button 
                            onClick={(e) => handleCopyId(e, vendor.axon_id)}
                            className="p-1.5 rounded-md hover:bg-[#A6947D]/20 text-[#A6947D]/60 hover:text-[#A6947D] transition-colors border border-transparent hover:border-[#A6947D]/30"
                            title="Copy AXON ID"
                          >
                            {copiedId === vendor.axon_id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>

                      <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 font-bold tracking-widest uppercase truncate flex items-center gap-1.5">
                        <Building2 size={10} className="text-[#A6947D]/40"/> {vendor.country || 'Global'}
                      </p>
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
  );
}