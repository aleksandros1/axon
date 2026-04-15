'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Building2, ShieldCheck, Gavel, FileSignature, Menu, X, User, Users,
  UploadCloud, FileText, CheckCircle2, Activity, Loader2, AlertTriangle, Ship, Landmark,
  CreditCard, Save, Search, Wallet
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
  
  // State για την επεξεργασία των όρων ανά συμβόλαιο (ΠΡΟΣΤΕΘΗΚΑΝ INSPECTION & PAYMENT)
  const [editedTerms, setEditedTerms] = useState<Record<string, { incoterm: string, customTerms: string, inspection: string, paymentTerms: string }>>({});

  useEffect(() => {
    fetchRealDeals();
  }, []);

  const fetchRealDeals = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth'); return; }
    
    setCurrentUser(session.user);
    const userId = session.user.id;

    const { data: contractsData, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .or(`buyer_id.eq.${userId},vendor_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (contractError) {
      console.error("Supabase Error:", contractError);
      setLoading(false);
      return;
    }

    if (contractsData && contractsData.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, company_name, email');
      const { data: slabs } = await supabase.from('slabs').select('id, material');
      
      const mappedDeals = contractsData.map((c: any) => {
        const isVendor = c.vendor_id === userId;
        const counterpartyProfile = profiles?.find(p => p.id === (isVendor ? c.buyer_id : c.vendor_id));
        const assetInfo = slabs?.find(s => s.id === c.asset_id);
        
        return {
          id: c.id,
          asset_id: c.asset_id,
          vendor_id: c.vendor_id,
          buyer_id: c.buyer_id,
          asset_name: assetInfo?.material || 'Institutional Asset',
          price: c.price,
          role: isVendor ? 'vendor' : 'buyer',
          status: c.status,
          counterparty: counterpartyProfile?.company_name || counterpartyProfile?.email || 'Verified Entity',
          date: c.created_at,
          bol_url: c.bol_url,
          incoterms: c.incoterms || 'EXW',
          custom_terms: c.custom_terms || '',
          inspection: c.inspection || 'waived', // ΝΕΟ
          payment_terms: c.payment_terms || '100_escrow' // ΝΕΟ
        };
      });
      setDeals(mappedDeals);
      
      // Αρχικοποίηση local state για τα edits
      const termsState: Record<string, { incoterm: string, customTerms: string, inspection: string, paymentTerms: string }> = {};
      mappedDeals.forEach(d => {
        termsState[d.id] = { 
          incoterm: d.incoterms, 
          customTerms: d.custom_terms,
          inspection: d.inspection,
          paymentTerms: d.payment_terms
        };
      });
      setEditedTerms(termsState);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  // --- STRIPE CHECKOUT ---
  const handleFundEscrow = async (dealId: string, price: number, vendorId: string) => {
    setIsProcessingAction(dealId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slabId: dealId, 
          price: price,
          buyerId: currentUser.id,
          vendorId: vendorId
        }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Failed to initialize secure payment portal.");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert("System Error. Please contact support.");
    }
    setIsProcessingAction(null);
  };

  // --- UPLOAD BOL ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, dealId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAction(dealId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `bol_${dealId}_${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('contracts').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('contracts').getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('contracts').update({
        status: 'shipped',
        bol_url: publicUrl
      }).eq('id', dealId);

      if (dbError) throw dbError;

      setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'shipped', bol_url: publicUrl } : d));

    } catch (err: any) {
      alert("Failed to upload document. Please ensure you created the 'contracts' storage bucket.");
    } finally {
      setIsProcessingAction(null);
    }
  };

  // --- RELEASE FUNDS ---
  const handleReleaseFunds = async (dealId: string) => {
    setIsProcessingAction(dealId);
    const { error } = await supabase.from('contracts').update({ status: 'completed' }).eq('id', dealId);
    if (!error) {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'completed' } : d));
    }
    setIsProcessingAction(null);
  };

  // --- UPDATE TERMS ---
  const handleTermChange = (dealId: string, key: 'incoterm' | 'customTerms' | 'inspection' | 'paymentTerms', value: string) => {
    setEditedTerms(prev => ({
      ...prev,
      [dealId]: { ...prev[dealId], [key]: value }
    }));
  };

  const saveTermsToDB = async (dealId: string) => {
    setIsProcessingAction(dealId + '_save');
    const terms = editedTerms[dealId];
    try {
      const { error } = await supabase.from('contracts').update({
        incoterms: terms.incoterm,
        custom_terms: terms.customTerms,
        inspection: terms.inspection,
        payment_terms: terms.paymentTerms
      }).eq('id', dealId);
      
      if (error) throw error;
      
      setDeals(deals.map(d => d.id === dealId ? { 
        ...d, 
        incoterms: terms.incoterm, 
        custom_terms: terms.customTerms,
        inspection: terms.inspection,
        payment_terms: terms.paymentTerms
      } : d));
    } catch (err) {
      console.error(err);
      alert("Error saving terms. Ensure 'custom_terms', 'inspection', and 'payment_terms' columns exist in contracts table.");
    }
    setIsProcessingAction(null);
  };

  const getEscrowTrigger = (term: string) => {
    switch(term) {
      case 'EXW': return "Upon Warehouse Pickup Confirmation (Ex Works)";
      case 'FOB': return "Upon Presentation of Bill of Lading (Free On Board)";
      case 'CIF': return "Upon Port of Destination Arrival Notification (Cost, Insurance, Freight)";
      default: return "Manual Institutional Release";
    }
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
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A] shadow-[0_0_15px_rgba(166,148,125,0.05)]"><FileSignature size={20} className="text-[#A6947D]"/></div>
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden"><FileSignature size={800} className="text-[#A6947D] shrink-0" /></div>
        
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

          <div className="space-y-8 md:space-y-12 pb-10">
            {displayDeals.length === 0 ? (
              <div className="bg-[#01030A] border border-[#A6947D]/10 rounded-2xl p-12 text-center shadow-lg mb-8">
                <FileSignature size={32} className="mx-auto text-[#A6947D]/30 mb-4" />
                <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-widest">No active contracts found in ledger.</p>
              </div>
            ) : (
              displayDeals.map((deal) => {
                const terms = editedTerms[deal.id] || { incoterm: deal.incoterms, customTerms: deal.custom_terms, inspection: deal.inspection, paymentTerms: deal.payment_terms };
                const isPending = deal.status === 'pending';
                const hasUnsavedChanges = terms.incoterm !== deal.incoterms || terms.customTerms !== deal.custom_terms || terms.inspection !== deal.inspection || terms.paymentTerms !== deal.payment_terms;

                return (
                  <div key={deal.id} className="bg-[#01030A] border border-[#A6947D]/30 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in flex flex-col">
                    
                    {/* DOSSIER HEADER */}
                    <div className="bg-[#A6947D]/5 p-5 md:p-6 border-b border-[#A6947D]/20 flex justify-between items-center flex-none">
                      <div>
                        <h2 className="text-base md:text-xl font-serif uppercase tracking-widest text-[#F8F5EE]">Master Purchase Agreement</h2>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[8px] md:text-[9px] font-mono text-[#A6947D] uppercase">Contract ID: AX-CON-{deal.id.substring(0,8)}</p>
                          <span className={`text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${deal.role === 'vendor' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                            {deal.role === 'vendor' ? 'You: Vendor' : 'You: Buyer'}
                          </span>
                        </div>
                      </div>
                      <ShieldCheck size={32} className="text-emerald-500/50 hidden sm:block" />
                    </div>

                    <div className="p-5 md:p-8 space-y-8 flex-1">
                      {/* SECTION 1: PARTIES & ASSET */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#A6947D]/10 pb-6 md:pb-8">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-[#A6947D] mb-2 md:mb-4 tracking-widest">Target Asset & Counterparty</p>
                          <h3 className="text-lg md:text-xl font-serif text-[#F8F5EE] uppercase tracking-wider">{deal.asset_name}</h3>
                          <p className="text-[10px] text-[#F8F5EE]/60 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                            <Building2 size={12}/> {deal.counterparty}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-[9px] uppercase font-bold text-[#A6947D] mb-2 md:mb-4 tracking-widest">Escrow Valuation</p>
                          <h3 className="text-3xl font-mono text-emerald-400 tracking-tighter">{formatCurrency(deal.price)}</h3>
                        </div>
                      </div>

                      {/* SECTION 2.1: INCOTERMS */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                           <p className="text-[9px] uppercase font-bold text-[#A6947D] tracking-widest">1. Commercial Terms (Incoterms 2020)</p>
                           {isPending && hasUnsavedChanges && (
                              <button onClick={() => saveTermsToDB(deal.id)} disabled={isProcessingAction === deal.id + '_save'} className="flex items-center gap-1.5 text-[8px] bg-amber-500 hover:bg-amber-400 text-[#020509] px-3 py-1.5 rounded uppercase font-bold tracking-widest transition-colors">
                                {isProcessingAction === deal.id + '_save' ? <Loader2 size={10} className="animate-spin"/> : <Save size={10}/>} Save Terms
                              </button>
                           )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:gap-4">
                          {['EXW', 'FOB', 'CIF'].map((term) => (
                            <button 
                              key={term}
                              onClick={() => isPending && handleTermChange(deal.id, 'incoterm', term)}
                              disabled={!isPending}
                              className={`py-3 md:py-4 rounded-xl border font-bold text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${terms.incoterm === term ? 'bg-[#A6947D] text-[#020509] border-[#A6947D] shadow-[0_0_15px_rgba(166,148,125,0.3)]' : 'bg-[#020509] border-[#A6947D]/20 text-[#A6947D]/40 hover:border-[#A6947D]/40'} ${!isPending && terms.incoterm !== term ? 'opacity-30' : ''} ${!isPending ? 'cursor-default' : ''}`}
                            >
                              {term} Protocol
                            </button>
                          ))}
                        </div>
                        <div className="bg-[#020509] p-4 rounded-xl border border-[#A6947D]/10 flex items-start gap-3 shadow-inner">
                          <Lock size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[8px] text-[#A6947D] uppercase font-bold tracking-widest mb-1">Logistics Liability Trigger:</p>
                            <p className="text-[10px] md:text-xs font-mono text-[#F8F5EE]">{getEscrowTrigger(terms.incoterm)}</p>
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2.2: ESCROW FUNDING SCHEDULE (NEW) */}
                      <div className="space-y-4">
                        <p className="text-[9px] uppercase font-bold text-[#A6947D] tracking-widest">2. Escrow Funding Schedule</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <button 
                            onClick={() => isPending && handleTermChange(deal.id, 'paymentTerms', '100_escrow')}
                            disabled={!isPending}
                            className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${terms.paymentTerms === '100_escrow' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-50'} ${!isPending ? 'cursor-default' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <Wallet size={16} className={terms.paymentTerms === '100_escrow' ? 'text-emerald-400' : 'text-[#A6947D]'} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${terms.paymentTerms === '100_escrow' ? 'text-emerald-400' : 'text-[#A6947D]'}`}>100% Secured Escrow</span>
                            </div>
                            <span className="text-[9px] text-left text-[#F8F5EE]/60 leading-relaxed font-mono">Full amount locked in vault. Released only upon complete fulfillment of terms. (Maximum Security)</span>
                          </button>
                          
                          <button 
                            onClick={() => isPending && handleTermChange(deal.id, 'paymentTerms', '30_70_split')}
                            disabled={!isPending}
                            className={`p-4 rounded-xl border flex flex-col items-start gap-2 transition-all ${terms.paymentTerms === '30_70_split' ? 'bg-[#A6947D]/10 border-[#A6947D]' : 'bg-[#020509] border-[#A6947D]/20 opacity-50'} ${!isPending ? 'cursor-default' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <Landmark size={16} className={terms.paymentTerms === '30_70_split' ? 'text-[#A6947D]' : 'text-[#A6947D]'} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${terms.paymentTerms === '30_70_split' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>30 / 70 Institutional Split</span>
                            </div>
                            <span className="text-[9px] text-left text-[#F8F5EE]/60 leading-relaxed font-mono">30% Advance Deposit to Vendor. 70% locked in Escrow against Bill of Lading. (Industry Standard)</span>
                          </button>
                        </div>
                      </div>

                      {/* SECTION 2.3: QUALITY ASSURANCE & INSPECTION (NEW) */}
                      <div className="space-y-4">
                        <p className="text-[9px] uppercase font-bold text-[#A6947D] tracking-widest">3. Quality Assurance Protocol</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                          <button 
                            onClick={() => isPending && handleTermChange(deal.id, 'inspection', 'waived')}
                            disabled={!isPending}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${terms.inspection === 'waived' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-50'} ${!isPending ? 'cursor-default' : ''}`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${terms.inspection === 'waived' ? 'text-blue-400' : 'text-[#A6947D]'}`}>Inspection Waived</span>
                            {terms.inspection === 'waived' && <CheckCircle2 size={16} className="text-blue-400" />}
                          </button>
                          
                          <button 
                            onClick={() => isPending && handleTermChange(deal.id, 'inspection', 'sgs_required')}
                            disabled={!isPending}
                            className={`p-4 rounded-xl border flex items-center justify-between transition-all ${terms.inspection === 'sgs_required' ? 'bg-amber-500/10 border-amber-500/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-50'} ${!isPending ? 'cursor-default' : ''}`}
                          >
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${terms.inspection === 'sgs_required' ? 'text-amber-400' : 'text-[#A6947D]'}`}>Independent SGS Inspection</span>
                            {terms.inspection === 'sgs_required' && <CheckCircle2 size={16} className="text-amber-400" />}
                          </button>
                        </div>
                        {terms.inspection === 'sgs_required' && (
                           <p className="text-[8px] text-amber-500/80 font-mono tracking-widest uppercase ml-1">* Funds will not be released until a certified 3rd-party inspection report is uploaded.</p>
                        )}
                      </div>

                      {/* SECTION 3: CUSTOM TERMS */}
                      <div className="space-y-4">
                        <p className="text-[9px] uppercase font-bold text-[#A6947D] tracking-widest">4. Additional Covenants</p>
                        <textarea 
                          value={terms.customTerms}
                          onChange={(e) => handleTermChange(deal.id, 'customTerms', e.target.value)}
                          disabled={!isPending}
                          placeholder={isPending ? "Enter custom delivery requirements, packaging specs, or payment milestones..." : "No additional covenants specified."}
                          className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl p-4 text-xs md:text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60 h-24 md:h-32 resize-none custom-scrollbar disabled:opacity-70 disabled:bg-[#01030A]"
                        />
                      </div>

                      {/* SECTION 4: INSTITUTIONAL BOILERPLATE */}
                      <div className="bg-[#020509]/50 p-5 md:p-6 rounded-xl border border-[#A6947D]/10 space-y-4">
                        <p className="text-[9px] uppercase font-bold text-[#A6947D] tracking-widest mb-2">Fixed Institutional Clauses</p>
                        <ul className="space-y-3">
                          <li className="flex gap-3 text-[9px] md:text-[10px] text-[#F8F5EE]/50 leading-relaxed italic">
                            <CheckCircle2 size={12} className="shrink-0 text-[#A6947D] mt-0.5" />
                            <span><b>Material Variation:</b> Natural stone exhibits geological inconsistency. Agreement covers visual grade as per AXON Neural Scan.</span>
                          </li>
                          <li className="flex gap-3 text-[9px] md:text-[10px] text-[#F8F5EE]/50 leading-relaxed italic">
                            <CheckCircle2 size={12} className="shrink-0 text-[#A6947D] mt-0.5" />
                            <span><b>Weight Tolerance:</b> Final valuation is subject to certified net weight and dimensions at loading port.</span>
                          </li>
                          <li className="flex gap-3 text-[9px] md:text-[10px] text-[#F8F5EE]/50 leading-relaxed italic">
                            <CheckCircle2 size={12} className="shrink-0 text-[#A6947D] mt-0.5" />
                            <span><b>Dispute Resolution:</b> Escrow funds remain locked under neutral custody until third-party inspection in case of breach.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* STATUS TRACKER */}
                    <div className="px-5 md:px-8 py-4 bg-[#01030A] border-t border-[#A6947D]/10">
                      <div className="relative max-w-lg mx-auto">
                        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#020509] border-t border-[#A6947D]/10 z-0 -translate-y-1/2"></div>
                        <div className="flex justify-between relative z-10">
                          {['funded', 'shipped', 'completed'].map((step, idx) => {
                            const icons = [<Lock size={12} key="l"/>, <Ship size={12} key="s"/>, <CheckCircle2 size={12} key="c"/>];
                            const labels = ["Funds Secured", "Logistics", "Settled"];
                            const isFunded = deal.status === 'funded' || deal.status === 'shipped' || deal.status === 'completed';
                            const isShipped = deal.status === 'shipped' || deal.status === 'completed';
                            const isCompleted = deal.status === 'completed';
                            const isActive = (step === 'funded' && isFunded) || (step === 'shipped' && isShipped) || (step === 'completed' && isCompleted);
                            
                            return (
                              <div className="flex flex-col items-center gap-2 bg-[#01030A] px-2" key={step}>
                                 <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-700 ${isActive ? 'bg-[#A6947D] text-[#020509] border-[#A6947D] shadow-[0_0_10px_rgba(166,148,125,0.4)]' : 'bg-[#020509] text-[#A6947D]/40 border-[#A6947D]/20'}`}>
                                   {icons[idx]}
                                 </div>
                                 <span className="text-[6px] md:text-[7px] font-bold uppercase tracking-widest text-center text-[#A6947D]">{labels[idx]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* ACTION FOOTER */}
                    <div className="p-5 md:p-6 bg-[#020509] border-t border-[#A6947D]/10 flex flex-col sm:flex-row items-center justify-between gap-4 flex-none">
                      <div className="w-full sm:w-auto">
                        {deal.status === 'pending' && <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={12}/> Awaiting Institutional Funding</p>}
                        {deal.status === 'funded' && <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Awaiting {deal.role === 'vendor' ? 'Your Shipment (BoL)' : 'Vendor Logistics'}</p>}
                        {deal.status === 'shipped' && <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Awaiting {deal.role === 'buyer' ? 'Your Verification' : 'Buyer Escrow Release'}</p>}
                        {deal.status === 'completed' && <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={12} /> Contract Fully Executed</p>}
                      </div>

                      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        
                        {deal.status === 'pending' && deal.role === 'buyer' && (
                          <button onClick={() => handleFundEscrow(deal.id, deal.price, deal.vendor_id)} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-[#A6947D] hover:bg-white text-[#020509] px-8 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] flex items-center justify-center gap-2 disabled:opacity-50">
                            {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />} Execute & Secure Funds
                          </button>
                        )}
                        
                        {deal.status === 'pending' && deal.role === 'vendor' && (
                          <div className="px-6 py-3.5 rounded-xl border border-[#A6947D]/20 bg-[#01030A] text-[#A6947D]/40 text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">
                            Awaiting Buyer Execution
                          </div>
                        )}

                        {deal.role === 'vendor' && deal.status === 'funded' && (
                          <>
                            <input type="file" id={`file-${deal.id}`} className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, deal.id)} disabled={isProcessingAction === deal.id} />
                            <label htmlFor={`file-${deal.id}`} className={`cursor-pointer w-full sm:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] flex items-center justify-center gap-2 ${isProcessingAction === deal.id ? 'opacity-50 pointer-events-none' : ''}`}>
                              {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Upload BoL (Logistics)
                            </label>
                          </>
                        )}
                        
                        {deal.role === 'buyer' && deal.status === 'funded' && (
                          <div className="px-6 py-3.5 rounded-xl border border-[#A6947D]/20 bg-[#01030A] text-[#A6947D]/40 text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">
                            Vendor Action Required
                          </div>
                        )}

                        {deal.role === 'buyer' && (deal.status === 'shipped' || deal.status === 'completed') && deal.bol_url && (
                          <a href={deal.bol_url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 px-6 py-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <FileText size={14} /> Inspect Documents
                          </a>
                        )}

                        {deal.role === 'buyer' && deal.status === 'shipped' && (
                          <button onClick={() => handleReleaseFunds(deal.id)} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50">
                            {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Release Escrow
                          </button>
                        )}

                        {deal.role === 'vendor' && deal.status === 'shipped' && (
                          <div className="px-6 py-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-500/60 text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">
                            Awaiting Escrow Release
                          </div>
                        )}

                        {deal.status === 'completed' && deal.role === 'vendor' && (
                          <button className="w-full sm:w-auto border border-emerald-500/30 text-emerald-500 px-6 py-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-emerald-500/5 cursor-default">
                            <CheckCircle2 size={14} /> Funds Settled
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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