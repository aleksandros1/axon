'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, User, Gavel, ArrowDownRight, ArrowUpRight, 
  Clock, CheckCircle2, ChevronRight, Loader2, Building2, Package
} from 'lucide-react';
import Link from 'next/link';

// Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: useLanguage αντί για useTranslation
import { useLanguage } from '../../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../../components/SidebarLanguageSwitcher';

export default function BidsDashboard() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [incomingBids, setIncomingBids] = useState<any[]>([]);
  const [outgoingBids, setOutgoingBids] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      const { data: offersData } = await supabase
        .from('messages')
        .select('*')
        .eq('is_offer', true)
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (offersData && offersData.length > 0) {
        const profileIds = [...new Set(offersData.map(o => o.sender_id === session.user.id ? o.receiver_id : o.sender_id))];
        const { data: profilesData } = await supabase.from('profiles').select('id, company_name, email').in('id', profileIds);

        const assetIds = [...new Set(offersData.map(o => o.offer_details?.asset_id).filter(Boolean))];
        const { data: slabsData } = await supabase.from('slabs').select('id, material, image_url, is_available').in('id', assetIds);

        const enrichedOffers = offersData.map(offer => {
          const counterpartyId = offer.sender_id === session.user.id ? offer.receiver_id : offer.sender_id;
          const counterparty = profilesData?.find(p => p.id === counterpartyId);
          const asset = slabsData?.find(s => s.id === offer.offer_details?.asset_id);
          
          return {
            ...offer,
            counterpartyName: counterparty?.company_name || counterparty?.email || 'Unknown Entity',
            assetMaterial: asset?.material || offer.offer_details?.material || 'Unknown Asset',
            assetImage: asset?.image_url,
            isAssetAvailable: asset?.is_available !== false
          };
        });

        setIncomingBids(enrichedOffers.filter(o => o.receiver_id === session.user.id));
        setOutgoingBids(enrichedOffers.filter(o => o.sender_id === session.user.id));
      }
      setLoading(false);
    };

    fetchBids();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: string | number) => {
    if (!amount || amount === 'Requesting Details' || amount === 'Inquiry') return amount;
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const displayBids = activeTab === 'incoming' ? incomingBids : outgoingBids;

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

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/dashboard/bids" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Gavel size={16} /> Order Book</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT - NO OVERFLOW-X */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar w-full">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Shield size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          {/* HEADER - STABILIZED */}
          <header className="mb-6 md:mb-10 animate-in fade-in duration-700 w-full">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4"><span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span><p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Negotiation Ledger</p></div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-1 md:mb-2 truncate">Order Book</h2>
            <p className="text-[9px] md:text-xs text-[#A6947D]/60 uppercase tracking-widest font-mono">Track active bids and proposals</p>
          </header>

          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8 md:mb-10 animate-in fade-in duration-700 delay-100 w-full">
            <div className="bg-[#01030A]/60 border border-emerald-500/20 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm w-full">
              <p className="text-[8px] md:text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1.5 md:mb-2 flex items-center gap-2"><ArrowDownRight size={14} className="md:w-3 md:h-3"/> {t('dashboard.incoming')}</p>
              <p className="text-2xl md:text-3xl font-mono text-[#F8F5EE] tracking-wider">{incomingBids.length}</p>
            </div>
            <div className="bg-[#01030A]/60 border border-amber-500/20 rounded-2xl p-4 md:p-6 backdrop-blur-sm shadow-sm w-full">
              <p className="text-[8px] md:text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-1.5 md:mb-2 flex items-center gap-2"><ArrowUpRight size={14} className="md:w-3 md:h-3"/> {t('dashboard.outgoing')}</p>
              <p className="text-2xl md:text-3xl font-mono text-[#F8F5EE] tracking-wider">{outgoingBids.length}</p>
            </div>
          </div>

          {/* TAB BUTTONS - FULL WIDTH ON MOBILE */}
          <div className="flex gap-2 md:gap-6 border-b border-[#A6947D]/10 mb-6 md:mb-8 animate-in fade-in duration-700 delay-200 w-full overflow-hidden">
            <button onClick={() => setActiveTab('incoming')} className={`flex-1 md:flex-none pb-4 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2 transition-all ${activeTab === 'incoming' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}>
              <ArrowDownRight size={14} /> {language === 'el' ? 'Ληφθείσες' : 'Received'} <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-[9px]">{incomingBids.length}</span>
            </button>
            <button onClick={() => setActiveTab('outgoing')} className={`flex-1 md:flex-none pb-4 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2 transition-all ${activeTab === 'outgoing' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}>
              <ArrowUpRight size={14} /> {language === 'el' ? 'Απεσταλμένες' : 'Submitted'} <span className="bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md text-[9px]">{outgoingBids.length}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse w-full"><Loader2 size={32} className="animate-spin mb-4" /><p className="font-mono text-[10px] uppercase tracking-[0.3em]">{t('common.syncing')}</p></div>
          ) : (
            <div className="space-y-4 md:space-y-4 animate-in fade-in duration-700 delay-300 w-full overflow-x-hidden">
              
              {displayBids.length === 0 ? (
                <div className="bg-[#01030A]/50 border border-[#A6947D]/10 rounded-2xl p-10 md:p-20 text-center flex flex-col items-center w-full">
                  <Gavel size={32} className="text-[#A6947D]/30 mb-4" />
                  <h3 className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-[0.15em] mb-2">No Active Bids</h3>
                  <p className="text-[9px] text-[#A6947D]/60 font-mono uppercase tracking-widest">You have zero {activeTab} proposals.</p>
                </div>
              ) : (
                displayBids.map((bid) => {
                  const isStatusSold = !bid.isAssetAvailable;
                  const isIncoming = activeTab === 'incoming';
                  
                  return (
                    <div key={bid.id} className="bg-[#01030A]/90 border border-[#A6947D]/15 rounded-2xl p-4 md:p-6 hover:border-[#A6947D]/40 transition-all flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 relative w-full overflow-hidden shadow-lg group">
                      
                      {/* STATUS LINE INDICATOR */}
                      <div className={`absolute left-0 top-0 w-1 h-full ${isStatusSold ? 'bg-[#A6947D]/30' : isIncoming ? 'bg-emerald-500/50' : 'bg-amber-500/50'}`}></div>

                      {/* TOP SECTION (MOBILE) / LEFT SECTION (DESKTOP) */}
                      <div className="flex items-start gap-4 md:gap-6 w-full md:w-auto overflow-hidden">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-[#020509] border border-[#A6947D]/20 flex items-center justify-center flex-none overflow-hidden relative">
                          {bid.assetImage ? (
                            <img src={bid.assetImage} alt="Asset" className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform" />
                          ) : (
                            <Package size={24} className="text-[#A6947D]/40" />
                          )}
                          {isStatusSold && (
                            <div className="absolute inset-0 bg-[#020509]/80 backdrop-blur-[2px] flex items-center justify-center">
                                <span className="text-[9px] font-bold text-[#F8F5EE] uppercase tracking-widest bg-[#A6947D] px-2 py-1 rounded shadow-lg">SOLD</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className="text-[8px] md:text-[9px] text-[#A6947D] font-mono tracking-widest uppercase">AX-{bid.offer_details?.asset_id?.substring(0,8) || 'OFFER'}</p>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest border ${isStatusSold ? 'bg-[#A6947D]/10 border-[#A6947D]/20 text-[#A6947D]/60' : 'bg-[#020509] border-[#A6947D]/30 text-[#F8F5EE]/60'}`}>
                              {isStatusSold ? 'Closed' : <><Clock size={8}/> Active</>}
                            </span>
                          </div>
                          <h3 className="text-sm md:text-lg font-serif uppercase tracking-wider text-[#F8F5EE] leading-tight mb-2 truncate">{bid.assetMaterial}</h3>
                          <p className="text-[9px] text-[#A6947D]/80 flex items-center gap-1.5 uppercase font-bold tracking-widest truncate"><Building2 size={12} className="flex-none"/> {bid.counterpartyName}</p>
                        </div>
                      </div>

                      {/* BOTTOM SECTION (MOBILE) / RIGHT SECTION (DESKTOP) */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 flex-1 w-full md:border-l border-[#A6947D]/10 md:pl-6 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0">
                        
                        <div className="flex gap-2 w-full md:w-auto flex-1">
                          <div className="bg-[#020509] border border-[#A6947D]/15 rounded-xl px-3 py-2 flex-1 md:min-w-[120px] flex flex-col justify-center shadow-inner">
                            <span className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Value</span>
                            <span className={`text-sm md:text-base font-mono font-bold ${isIncoming ? 'text-emerald-400' : 'text-amber-400'}`}>€{bid.offer_details?.price || '0'}</span>
                          </div>
                          <div className="bg-[#020509] border border-[#A6947D]/15 rounded-xl px-3 py-2 flex-none md:min-w-[80px] flex flex-col justify-center shadow-inner">
                            <span className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Terms</span>
                            <span className="text-xs md:text-sm font-sans font-bold text-[#F8F5EE]">{bid.offer_details?.incoterm || 'EXW'}</span>
                          </div>
                        </div>

                        <div className="w-full md:w-auto flex-none mt-1 md:mt-0">
                          <button 
                            onClick={() => router.push(`/inbox?chat=${bid.sender_id === currentUser.id ? bid.receiver_id : bid.sender_id}`)}
                            className={`w-full md:w-auto text-center px-4 py-3 md:px-6 md:py-3.5 rounded-xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest transition-all border flex justify-center items-center gap-2 shadow-lg ${isStatusSold ? 'bg-[#020509] border-[#A6947D]/20 text-[#A6947D]' : isIncoming ? 'bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-600/10 hover:bg-amber-600/20 border-amber-500/30 text-amber-400'}`}
                          >
                            <MessageSquare size={14} /> {isStatusSold ? 'Archive' : 'Engage'}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.7rem+env(safe-area-inset-bottom))] shadow-2xl w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/network" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Users size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.network').substring(0,3)}</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/dashboard/bids" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1"><Gavel size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Offers</span></Link>
        <Link href="/me" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1"><User size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}