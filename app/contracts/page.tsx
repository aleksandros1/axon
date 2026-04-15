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

  // Βάρος του κάθε status για να ξέρουμε πού βρισκόμαστε στο Pipeline
  const statusWeight: Record<string, number> = {
    'pending': 0,
    'advance_paid': 1,
    'funded': 2,
    'inspected': 3,
    'shipped': 4,
    'completed': 5
  };

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
          asset_name: assetInfo?.material || c.custom_material || 'Institutional Asset',
          price: c.price,
          role: isVendor ? 'vendor' : 'buyer',
          status: c.status,
          counterparty: counterpartyProfile?.company_name || counterpartyProfile?.email || 'Verified Entity',
          date: c.created_at,
          bol_url: c.bol_url,
          sgs_url: c.sgs_url,
          incoterms: c.incoterms || c.custom_incoterms || 'FOB',
          inspection: c.inspection || 'waived',
          payment_terms: c.payment_terms || '100_escrow'
        };
      });
      setDeals(mappedDeals);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
  };

  // --- DYNAMIC STATUS UPDATER (Mocking Stripe for UX) ---
  const updateDealStatus = async (dealId: string, nextStatus: string) => {
    setIsProcessingAction(dealId);
    try {
      const { error } = await supabase.from('contracts').update({ status: nextStatus }).eq('id', dealId);
      if (error) throw error;
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: nextStatus } : d));
    } catch (err: any) {
      alert("Error updating status.");
    } finally {
      setIsProcessingAction(null);
    }
  };

  // --- UPLOAD DOCUMENTS (SGS OR BOL) ---
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, dealId: string, docType: 'sgs' | 'bol') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAction(`${dealId}_${docType}`);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${docType}_${dealId}_${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('contracts').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('contracts').getPublicUrl(fileName);

      const nextStatus = docType === 'sgs' ? 'inspected' : 'shipped';
      const updatePayload = docType === 'sgs' 
        ? { status: nextStatus, sgs_url: publicUrl } 
        : { status: nextStatus, bol_url: publicUrl };

      const { error: dbError } = await supabase.from('contracts').update(updatePayload).eq('id', dealId);
      if (dbError) throw dbError;

      setDeals(deals.map(d => d.id === dealId ? { ...d, status: nextStatus, [docType === 'sgs' ? 'sgs_url' : 'bol_url']: publicUrl } : d));

    } catch (err: any) {
      alert("Failed to upload document. Please check storage bucket.");
    } finally {
      setIsProcessingAction(null);
    }
  };

  // --- DYNAMIC PIPELINE BUILDER ---
  const buildPipeline = (deal: any) => {
    let pipeline = [];
    const currentW = statusWeight[deal.status] || 0;

    // 1. FUNDING PHASE
    if (deal.payment_terms === '30_70_split') {
      pipeline.push({ id: 'advance', label: '30% Advance', icon: <Landmark size={14}/>, weight: 1 });
      pipeline.push({ id: 'funded', label: '70% Escrow', icon: <Lock size={14}/>, weight: 2 });
    } else {
      pipeline.push({ id: 'funded', label: '100% Escrow', icon: <Wallet size={14}/>, weight: 2 });
    }

    // 2. INSPECTION PHASE
    if (deal.inspection === 'sgs_required') {
      pipeline.push({ id: 'inspected', label: 'SGS Report', icon: <Search size={14}/>, weight: 3 });
    }

    // 3. LOGISTICS
    pipeline.push({ id: 'shipped', label: 'Logistics', icon: <Ship size={14}/>, weight: 4 });

    // 4. SETTLEMENT
    pipeline.push({ id: 'completed', label: 'Settled', icon: <CheckCircle2 size={14}/>, weight: 5 });

    return pipeline.map(step => ({
      ...step,
      isActive: currentW >= step.weight
    }));
  };

  // --- DYNAMIC MESSAGING ---
  const getStatusMessage = (deal: any) => {
    const isBuyer = deal.role === 'buyer';
    const s = deal.status;
    const p = deal.payment_terms;
    const i = deal.inspection;

    if (s === 'pending') {
      return isBuyer ? (p === '30_70_split' ? 'Awaiting Your 30% Advance Deposit' : 'Awaiting Your Escrow Funding') : 'Awaiting Buyer Funding';
    }
    if (s === 'advance_paid') {
      return isBuyer ? 'Awaiting Your 70% Escrow Deposit' : 'Awaiting Buyer 70% Escrow';
    }
    if (s === 'funded') {
      if (i === 'sgs_required') return isBuyer ? 'Awaiting Vendor SGS Report' : 'Awaiting Your SGS Upload';
      return isBuyer ? 'Awaiting Vendor Logistics (BoL)' : 'Awaiting Your BoL Upload';
    }
    if (s === 'inspected') {
      return isBuyer ? 'Awaiting Vendor Logistics (BoL)' : 'Awaiting Your BoL Upload';
    }
    if (s === 'shipped') {
      return isBuyer ? 'Awaiting Your Escrow Release' : 'Awaiting Buyer Final Release';
    }
    return 'Contract Fully Executed & Settled';
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center text-[#A6947D] animate-pulse">
        <Shield size={48} className="mb-6 opacity-50" />
        <p className="font-mono text-[9px] uppercase tracking-[0.4em]">Accessing Dynamic Ledger</p>
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
              <p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Dynamic Escrow Ledger</p>
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
                const isBuyer = deal.role === 'buyer';
                const isVendor = deal.role === 'vendor';
                const pipeline = buildPipeline(deal);
                const statusMsg = getStatusMessage(deal);

                return (
                  <div key={deal.id} className="bg-[#01030A] border border-[#A6947D]/30 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in flex flex-col">
                    
                    {/* DOSSIER HEADER */}
                    <div className="bg-[#A6947D]/5 p-5 md:p-6 border-b border-[#A6947D]/20 flex justify-between items-center flex-none">
                      <div>
                        <h2 className="text-base md:text-xl font-serif uppercase tracking-widest text-[#F8F5EE]">AXON Master Agreement</h2>
                        <div className="flex items-center gap-3 mt-1.5">
                          <p className="text-[8px] md:text-[9px] font-mono text-[#A6947D] uppercase">Contract Ref: AX-CON-{deal.id.substring(0,8)}</p>
                          <span className={`text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${isVendor ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                            {isVendor ? 'You: Vendor' : 'You: Buyer'}
                          </span>
                        </div>
                      </div>
                      <ShieldCheck size={32} className="text-[#A6947D]/30 hidden sm:block" />
                    </div>

                    <div className="p-5 md:p-8 space-y-6 flex-1">
                      {/* ASSET INFO */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-[#A6947D]/10 pb-6 md:pb-8">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-[#A6947D] mb-2 tracking-widest">Target Asset & Terms</p>
                          <h3 className="text-lg md:text-xl font-serif text-[#F8F5EE] uppercase tracking-wider">{deal.asset_name}</h3>
                          <p className="text-[10px] text-[#F8F5EE]/60 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                            <Building2 size={12}/> {deal.counterparty}
                          </p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-[9px] uppercase font-bold text-[#A6947D] mb-2 tracking-widest">Total Escrow Valuation</p>
                          <h3 className="text-3xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrency(deal.price)}</h3>
                          <p className="text-[9px] text-[#A6947D] font-bold uppercase tracking-widest mt-1">Incoterms: {deal.incoterms}</p>
                        </div>
                      </div>

                      {/* DYNAMIC PIPELINE VISUALIZER */}
                      <div className="py-6 w-full">
                        <p className="text-[9px] uppercase font-bold text-[#A6947D] tracking-widest mb-6 text-center">Execution Pipeline</p>
                        <div className="relative max-w-2xl mx-auto w-full">
                          <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#020509] border-t border-[#A6947D]/20 z-0"></div>
                          <div className="flex justify-between relative z-10 w-full">
                            {pipeline.map((step) => (
                              <div className="flex flex-col items-center gap-2 bg-[#01030A] px-2 md:px-4 z-10" key={step.id}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${step.isActive ? 'bg-[#A6947D] text-[#020509] border-[#A6947D] shadow-[0_0_15px_rgba(166,148,125,0.4)]' : 'bg-[#020509] text-[#A6947D]/40 border-[#A6947D]/20'}`}>
                                  {step.icon}
                                </div>
                                <span className={`text-[7px] md:text-[8px] font-bold uppercase tracking-widest text-center ${step.isActive ? 'text-[#A6947D]' : 'text-[#A6947D]/40'}`}>
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC ACTION FOOTER */}
                    <div className="p-5 md:p-6 bg-[#020509] border-t border-[#A6947D]/20 flex flex-col sm:flex-row items-center justify-between gap-4 flex-none shadow-inner">
                      
                      <div className="w-full sm:w-auto">
                        <p className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 ${deal.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {deal.status !== 'completed' && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
                          {statusMsg}
                        </p>
                      </div>

                      <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                        
                        {/* BUYER ACTIONS */}
                        {isBuyer && deal.status === 'pending' && deal.payment_terms === '30_70_split' && (
                          <button onClick={() => updateDealStatus(deal.id, 'advance_paid')} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] flex items-center justify-center gap-2">
                            {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin"/> : <CreditCard size={14}/>} Transfer 30% Advance
                          </button>
                        )}
                        {isBuyer && deal.status === 'advance_paid' && (
                          <button onClick={() => updateDealStatus(deal.id, 'funded')} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] flex items-center justify-center gap-2">
                            {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin"/> : <Lock size={14}/>} Secure 70% Escrow
                          </button>
                        )}
                        {isBuyer && deal.status === 'pending' && deal.payment_terms === '100_escrow' && (
                          <button onClick={() => updateDealStatus(deal.id, 'funded')} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] flex items-center justify-center gap-2">
                            {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin"/> : <Lock size={14}/>} Secure 100% Escrow
                          </button>
                        )}
                        {isBuyer && deal.status === 'shipped' && (
                          <button onClick={() => updateDealStatus(deal.id, 'completed')} disabled={isProcessingAction === deal.id} className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">
                            {isProcessingAction === deal.id ? <Loader2 size={14} className="animate-spin"/> : <ShieldCheck size={14}/>} Release Funds
                          </button>
                        )}

                        {/* VENDOR ACTIONS */}
                        {isVendor && deal.status === 'funded' && deal.inspection === 'sgs_required' && (
                          <>
                            <input type="file" id={`sgs-${deal.id}`} className="hidden" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, deal.id, 'sgs')} />
                            <label htmlFor={`sgs-${deal.id}`} className={`cursor-pointer w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 ${isProcessingAction === deal.id+'_sgs' ? 'opacity-50 pointer-events-none' : ''}`}>
                              {isProcessingAction === deal.id+'_sgs' ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>} Upload SGS Report
                            </label>
                          </>
                        )}
                        {isVendor && ((deal.status === 'funded' && deal.inspection === 'waived') || deal.status === 'inspected') && (
                          <>
                            <input type="file" id={`bol-${deal.id}`} className="hidden" accept=".pdf,image/*" onChange={(e) => handleDocumentUpload(e, deal.id, 'bol')} />
                            <label htmlFor={`bol-${deal.id}`} className={`cursor-pointer w-full sm:w-auto bg-blue-500 hover:bg-blue-400 text-[#020509] px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] flex items-center justify-center gap-2 ${isProcessingAction === deal.id+'_bol' ? 'opacity-50 pointer-events-none' : ''}`}>
                              {isProcessingAction === deal.id+'_bol' ? <Loader2 size={14} className="animate-spin"/> : <UploadCloud size={14}/>} Upload BoL
                            </label>
                          </>
                        )}

                        {/* VIEW DOCUMENTS (BOTH PARTIES) */}
                        {deal.sgs_url && (
                          <a href={deal.sgs_url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 px-4 py-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <Search size={14} /> View SGS
                          </a>
                        )}
                        {deal.bol_url && (
                          <a href={deal.bol_url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto border border-blue-500/30 text-blue-500 hover:bg-blue-500/10 px-4 py-4 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                            <FileText size={14} /> View BoL
                          </a>
                        )}

                        {/* PASSIVE STATES */}
                        {((isVendor && (deal.status === 'pending' || deal.status === 'advance_paid')) || (isBuyer && (deal.status === 'funded' || deal.status === 'inspected'))) && (
                          <div className="px-6 py-4 rounded-xl border border-[#A6947D]/20 bg-[#01030A] text-[#A6947D]/40 text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">
                            Counterparty Action Required
                          </div>
                        )}
                        {deal.status === 'completed' && (
                          <div className="px-6 py-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-500 text-[9px] font-bold uppercase tracking-widest text-center cursor-default flex items-center gap-2">
                            <CheckCircle2 size={14}/> Escrow Settled
                          </div>
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