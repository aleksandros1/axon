'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Building2, ShieldCheck, Gavel, FileSignature, Menu, X, User, Users,
  UploadCloud, FileText, CheckCircle2, ArrowRight, Package, Ship, Landmark, Activity, Loader2
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';
import InboxBadge from '../components/InboxBadge'; 

export default function DealsVault() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [deals, setDeals] = useState<any[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchRealDeals();
  }, []);

  const fetchRealDeals = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth'); return; }
    
    setCurrentUser(session.user);
    const userId = session.user.id;

    // ΠΙΟ ΑΠΛΟ QUERY ΓΙΑ ΝΑ ΜΗΝ ΥΠΑΡΧΕΙ ΠΕΡΙΠΤΩΣΗ ΣΦΑΛΜΑΤΟΣ ΣΤΑ JOIN
    const { data: slabsData, error: slabError } = await supabase
      .from('slabs')
      .select('*')
      .not('buyer_id', 'is', null)
      .or(`user_id.eq.${userId},buyer_id.eq.${userId}`);

    if (slabError) {
      console.error("Supabase Error:", slabError);
      setLoading(false);
      return;
    }

    if (slabsData && slabsData.length > 0) {
      // Φέρνουμε όλα τα προφίλ για να αντιστοιχίσουμε τα ονόματα των εταιρειών
      const { data: profiles } = await supabase.from('profiles').select('id, company_name, email');
      
      const mappedDeals = slabsData.map((s: any) => {
        const isVendor = s.user_id === userId;
        const counterpartyProfile = profiles?.find(p => p.id === (isVendor ? s.buyer_id : s.user_id));
        
        return {
          id: s.id,
          asset_name: s.material,
          price: s.price,
          role: isVendor ? 'vendor' : 'buyer',
          status: s.escrow_status || 'funded',
          counterparty: counterpartyProfile?.company_name || counterpartyProfile?.email || 'Global Entity',
          date: s.created_at
        };
      });
      setDeals(mappedDeals);
    } else {
      console.log("No deals found for user:", userId);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleUploadBoL = async (dealId: string) => {
    setIsProcessingAction(dealId);
    const { error } = await supabase.from('slabs').update({ escrow_status: 'shipped' }).eq('id', dealId);
    if (!error) {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'shipped' } : d));
    }
    setIsProcessingAction(null);
  };

  const handleReleaseFunds = async (dealId: string) => {
    setIsProcessingAction(dealId);
    const { error } = await supabase.from('slabs').update({ escrow_status: 'completed' }).eq('id', dealId);
    if (!error) {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'completed' } : d));
    }
    setIsProcessingAction(null);
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center text-[#A6947D] animate-pulse">
        <Shield size={48} className="mb-6 opacity-50" />
        <p className="font-mono text-[9px] uppercase tracking-[0.4em]">Accessing Secure Ledger</p>
      </div>
    );
  }

  const activeDeals = deals.filter(d => d.status !== 'completed');
  const completedDeals = deals.filter(d => d.status === 'completed');
  const displayDeals = activeTab === 'active' ? activeDeals : completedDeals;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* MOBILE MENU TRIGGER */}
      <div className="md:hidden fixed top-4 right-4 z-[60]">
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-[#01030A] border border-[#A6947D]/20 rounded-full text-[#A6947D] shadow-xl">
          <Menu size={20} />
        </button>
      </div>

      {/* EXECUTIVE COMMAND OVERLAY */}
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
              <Link href="/contracts" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/30 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/20 transition-colors shadow-inner">
                <FileSignature size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Deals Vault</span>
              </Link>
              <Link href="/scanner" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Crosshair size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">AI Scanner</span>
              </Link>
              <Link href="/network" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Users size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Network</span>
              </Link>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest mt-4">
              <LogOut size={16} /> Disconnect
            </button>
          </div>
        </div>
      )}

      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A] shadow-[0_0_15px_rgba(166,148,125,0.05)]">
            <FileSignature size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <FileSignature size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-5xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-8 md:mb-12">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span>
              <p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Escrow Execution Ledger</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase truncate font-light tracking-wide mb-6">Deals Vault</h2>
            
            <div className="flex gap-4 md:gap-8 border-b border-[#A6947D]/10">
              <button onClick={() => setActiveTab('active')} className={`pb-4 text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'active' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}>
                <Activity size={14} /> Active Deals <span className="bg-[#A6947D]/20 text-[#A6947D] px-2 py-0.5 rounded-lg ml-1">{activeDeals.length}</span>
              </button>
              <button onClick={() => setActiveTab('completed')} className={`pb-4 text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === 'completed' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}>
                <CheckCircle2 size={14} /> Settled <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-lg ml-1">{completedDeals.length}</span>
              </button>
            </div>
          </header>

          <div className="space-y-6 md:space-y-8 pb-10">
            {displayDeals.length === 0 ? (
              <div className="bg-[#01030A] border border-[#A6947D]/10 rounded-2xl p-12 text-center shadow-lg animate-in fade-in duration-700">
                <FileSignature size={32} className="mx-auto text-[#A6947D]/30 mb-4" />
                <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-widest">No active contracts found in ledger.</p>
              </div>
            ) : (
              displayDeals.map((deal) => (
                <div key={deal.id} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-5 md:p-6 border-b border-[#A6947D]/10 bg-[#020509] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[7px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${deal.role === 'vendor' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                          {deal.role === 'vendor' ? 'You are Vendor' : 'You are Buyer'}
                        </span>
                        <span className="text-[8px] text-[#A6947D]/60 font-mono uppercase tracking-widest">AX-{deal.id.substring(0,8)}</span>
                      </div>
                      <h3 className="text-lg md:text-xl font-serif text-[#F8F5EE] uppercase tracking-widest">{deal.asset_name}</h3>
                      <p className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <Building2 size={12}/> Counterparty: <span className="text-[#F8F5EE]">{deal.counterparty}</span>
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Contract Value</p>
                      <p className="text-2xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrency(deal.price)}</p>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 bg-[#01030A]">
                    <div className="relative">
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#020509] border-t border-[#A6947D]/10 z-0"></div>
                      <div className="flex justify-between relative z-10">
                        {['funded', 'shipped', 'completed'].map((step, idx) => {
                          const icons = [<Lock size={14} key="l"/>, <Ship size={14} key="s"/>, <CheckCircle2 size={14} key="c"/>];
                          const labels = ["Funds Locked", "Logistics (BoL)", "Settled"];
                          const isActive = deal.status === step || (step === 'funded' && (deal.status === 'shipped' || deal.status === 'completed')) || (step === 'shipped' && deal.status === 'completed');
                          
                          return (
                            <div className="flex flex-col items-center gap-3" key={step}>
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${isActive ? 'bg-[#A6947D] text-[#020509] border-[#A6947D] shadow-[0_0_15px_rgba(166,148,125,0.4)]' : 'bg-[#020509] text-[#A6947D]/40 border-[#A6947D]/20'}`}>
                                 {icons[idx]}
                               </div>
                               <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-center text-[#A6947D]">{labels[idx]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 md:p-6 bg-[#020509] border-t border-[#A6947D]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="w-full sm:w-auto">
                      {deal.status === 'funded' && <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Awaiting {deal.role === 'vendor' ? 'Your Shipment' : 'Vendor Shipment'}</p>}
                      {deal.status === 'shipped' && <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Awaiting {deal.role === 'buyer' ? 'Your Verification' : 'Buyer Verification'}</p>}
                      {deal.status === 'completed' && <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={12} /> Transaction Settled</p>}
                    </div>

                    <div className="w-full sm:w-auto">
                      {deal.role === 'vendor' && deal.status === 'funded' && (
                        <button onClick={() => handleUploadBoL(deal.id)} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-3.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                          {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Upload BoL
                        </button>
                      )}
                      
                      {deal.role === 'buyer' && deal.status === 'shipped' && (
                        <button onClick={() => handleReleaseFunds(deal.id)} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-[#020509] px-6 py-3.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                          {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Release Funds
                        </button>
                      )}

                      {deal.status === 'completed' && (
                        <button className="w-full sm:w-auto border border-[#A6947D]/30 text-[#A6947D] px-6 py-3.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                          <FileText size={14} /> View Invoice
                        </button>
                      )}

                      {deal.role === 'buyer' && deal.status === 'funded' && <div className="px-6 py-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500/60 text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">Vendor Action Pending</div>}
                      {deal.role === 'vendor' && deal.status === 'shipped' && <div className="px-6 py-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-500/60 text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">Buyer Action Pending</div>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors"><div className="relative inline-flex"><MessageSquare size={20} /><InboxBadge /></div><span className="text-[8px] uppercase font-bold tracking-widest">Comms</span></Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}