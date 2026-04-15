'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Building2, ShieldCheck, Gavel, FileSignature, Menu, X, User, Users,
  UploadCloud, FileText, CheckCircle2, Activity, Loader2, AlertTriangle, Ship, Landmark,
  CreditCard, Search, Wallet, Eye, Download, ChevronRight
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
  
  // MODAL ΓΙΑ ΤΗΝ ΠΡΟΒΟΛΗ ΤΟΥ ΣΥΜΒΟΛΑΙΟΥ
  const [viewingContract, setViewingContract] = useState<any>(null);

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

    if (contractsData) {
      const { data: profiles } = await supabase.from('profiles').select('id, company_name, email');
      
      const mappedDeals = contractsData.map((c: any) => {
        const isVendor = c.vendor_id === userId;
        const counterpartyProfile = profiles?.find(p => p.id === (isVendor ? c.buyer_id : c.vendor_id));
        
        return {
          ...c,
          asset_name: c.custom_material || 'Institutional Asset',
          role: isVendor ? 'vendor' : 'buyer',
          counterparty: counterpartyProfile?.company_name || counterpartyProfile?.email || 'Verified Entity',
          // Defaulting for safety if null
          incoterms: c.incoterms || 'FOB',
          inspection: c.inspection || 'waived',
          payment_terms: c.payment_terms || '100_escrow',
          status: c.status || 'pending'
        };
      });
      setDeals(mappedDeals);
    }
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  // --- ACTIONS ---
  const updateDealStatus = async (dealId: string, nextStatus: string) => {
    setIsProcessingAction(dealId);
    const { error } = await supabase.from('contracts').update({ status: nextStatus }).eq('id', dealId);
    if (!error) {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: nextStatus } : d));
      if (viewingContract?.id === dealId) setViewingContract({...viewingContract, status: nextStatus});
    }
    setIsProcessingAction(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, dealId: string, type: 'sgs' | 'bol') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingAction(`${dealId}_${type}`);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${dealId}_${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('contracts').upload(fileName, file);
    
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('contracts').getPublicUrl(fileName);
      const nextStatus = type === 'sgs' ? 'inspected' : 'shipped';
      const updateData = type === 'sgs' ? { sgs_url: publicUrl, status: nextStatus } : { bol_url: publicUrl, status: nextStatus };
      
      await supabase.from('contracts').update(updateData).eq('id', dealId);
      setDeals(deals.map(d => d.id === dealId ? { ...d, ...updateData } : d));
    }
    setIsProcessingAction(null);
  };

  // --- DYNAMIC PIPELINE BUILDER ---
  const getPipelineSteps = (deal: any) => {
    let steps = [];
    const s = deal.status;
    
    // FUNDING
    if (deal.payment_terms === '30_70_split') {
      steps.push({ id: 'advance', label: '30% Advance', icon: <Landmark size={14}/>, active: ['advance_paid', 'funded', 'inspected', 'shipped', 'completed'].includes(s) });
      steps.push({ id: 'escrow', label: '70% Escrow', icon: <Lock size={14}/>, active: ['funded', 'inspected', 'shipped', 'completed'].includes(s) });
    } else {
      steps.push({ id: 'escrow', label: '100% Escrow', icon: <Wallet size={14}/>, active: ['funded', 'inspected', 'shipped', 'completed'].includes(s) });
    }

    // INSPECTION
    if (deal.inspection === 'sgs_required') {
      steps.push({ id: 'inspection', label: 'SGS Report', icon: <Search size={14}/>, active: ['inspected', 'shipped', 'completed'].includes(s) });
    }

    // LOGISTICS
    steps.push({ id: 'logistics', label: 'Logistics (BoL)', icon: <Ship size={14}/>, active: ['shipped', 'completed'].includes(s) });
    
    // SETTLED
    steps.push({ id: 'settled', label: 'Settled', icon: <CheckCircle2 size={14}/>, active: s === 'completed' });

    return steps;
  };

  if (loading) return <div className="h-screen w-full bg-[#020509] flex items-center justify-center text-[#A6947D] animate-pulse font-mono uppercase tracking-[0.4em]">Synchronizing Vault...</div>;

  const displayDeals = deals.filter(d => activeTab === 'active' ? d.status !== 'completed' : d.status === 'completed');

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans antialiased">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center mb-4 bg-[#01030A] shadow-inner"><FileSignature size={20} className="text-[#A6947D]"/></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">DEALS VAULT</p>
        </div>
        <SidebarLanguageSwitcher />
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> PORTFOLIO</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> TRADING FLOOR</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> COMMS</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><LogOut size={16} /> DISCONNECT</button></div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center"><FileSignature size={800} className="text-[#A6947D]"/></div>
        
        <div className="p-4 md:p-12 max-w-5xl mx-auto relative z-10">
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4"><span className="h-px w-8 bg-[#A6947D]/30"></span><p className="text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Institutional Ledger</p></div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase font-light tracking-wide mb-8">Active Dealflow</h2>
            <div className="flex gap-8 border-b border-[#A6947D]/10">
              <button onClick={() => setActiveTab('active')} className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'active' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40'}`}>Active Contracts</button>
              <button onClick={() => setActiveTab('completed')} className={`pb-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#F8F5EE]/40'}`}>Settled History</button>
            </div>
          </header>

          <div className="space-y-8">
            {displayDeals.map((deal) => {
              const pipeline = getPipelineSteps(deal);
              return (
                <div key={deal.id} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-[#A6947D]/40">
                  
                  {/* CARD HEADER (CLICKABLE) */}
                  <div 
                    onClick={() => setViewingContract(deal)}
                    className="p-6 md:p-8 border-b border-[#A6947D]/10 bg-[#020509]/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 cursor-pointer group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${deal.role === 'vendor' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{deal.role === 'vendor' ? 'You: Vendor' : 'You: Buyer'}</span>
                        <span className="text-[8px] text-[#A6947D]/60 font-mono">REF: AX-CON-{deal.id.substring(0,8)}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-widest group-hover:text-[#A6947D] transition-colors flex items-center gap-3">
                        {deal.asset_name} <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0"/>
                      </h3>
                      <p className="text-[10px] text-[#A6947D] uppercase font-bold mt-1">Counterparty: <span className="text-[#F8F5EE]">{deal.counterparty}</span></p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-[#A6947D]/60 uppercase font-bold mb-1">Contract Valuation</p>
                      <p className="text-3xl font-mono text-white tracking-tighter">{formatCurrency(deal.price)}</p>
                    </div>
                  </div>

                  {/* PIPELINE VISUALIZER */}
                  <div className="p-8 bg-[#01030A]">
                    <div className="relative max-w-3xl mx-auto">
                      <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#020509] border-t border-[#A6947D]/10 z-0"></div>
                      <div className="flex justify-between relative z-10">
                        {pipeline.map((step, idx) => (
                          <div className="flex flex-col items-center gap-3 bg-[#01030A] px-2" key={idx}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${step.active ? 'bg-[#A6947D] text-[#020509] border-[#A6947D] shadow-[0_0_15px_rgba(166,148,125,0.4)]' : 'bg-[#020509] text-[#A6947D]/40 border-[#A6947D]/20'}`}>
                              {step.icon}
                            </div>
                            <span className={`text-[8px] font-bold uppercase tracking-widest text-center ${step.active ? 'text-[#A6947D]' : 'text-[#A6947D]/30'}`}>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BAR */}
                  <div className="p-6 bg-[#020509] border-t border-[#A6947D]/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${deal.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]/80">
                         {deal.status === 'pending' && (deal.role === 'buyer' ? 'Funding Authorization Required' : 'Awaiting Buyer Funding')}
                         {deal.status === 'advance_paid' && (deal.role === 'buyer' ? 'Remaining Escrow Required' : 'Awaiting Buyer Remaining 70%')}
                         {deal.status === 'funded' && (deal.inspection === 'sgs_required' ? (deal.role === 'vendor' ? 'SGS Inspection Required' : 'Awaiting SGS Report') : (deal.role === 'vendor' ? 'Logistics / BoL Upload Required' : 'Awaiting Shipment'))}
                         {deal.status === 'inspected' && (deal.role === 'vendor' ? 'Logistics / BoL Upload Required' : 'Awaiting Shipment')}
                         {deal.status === 'shipped' && (deal.role === 'buyer' ? 'Final Inspection & Release Required' : 'Awaiting Buyer Release')}
                         {deal.status === 'completed' && 'Transaction Successfully Settled'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {/* BUYER BUTTONS */}
                      {deal.role === 'buyer' && deal.status === 'pending' && deal.payment_terms === '30_70_split' && (
                        <button onClick={() => updateDealStatus(deal.id, 'advance_paid')} className="bg-[#A6947D] text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"><CreditCard size={14}/> Pay 30% Advance</button>
                      )}
                      {deal.role === 'buyer' && deal.status === 'advance_paid' && (
                        <button onClick={() => updateDealStatus(deal.id, 'funded')} className="bg-[#A6947D] text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"><Lock size={14}/> Secure 70% Escrow</button>
                      )}
                      {deal.role === 'buyer' && deal.status === 'pending' && deal.payment_terms === '100_escrow' && (
                        <button onClick={() => updateDealStatus(deal.id, 'funded')} className="bg-[#A6947D] text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"><Wallet size={14}/> Secure 100% Escrow</button>
                      )}
                      {deal.role === 'buyer' && deal.status === 'shipped' && (
                        <button onClick={() => updateDealStatus(deal.id, 'completed')} className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-400 transition-all flex items-center gap-2"><ShieldCheck size={14}/> Release Funds</button>
                      )}

                      {/* VENDOR BUTTONS */}
                      {deal.role === 'vendor' && deal.status === 'funded' && deal.inspection === 'sgs_required' && (
                        <>
                          <input type="file" id={`sgs-${deal.id}`} className="hidden" onChange={(e) => handleFileUpload(e, deal.id, 'sgs')} />
                          <label htmlFor={`sgs-${deal.id}`} className="cursor-pointer bg-amber-500 text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-amber-400 transition-all flex items-center gap-2"><Search size={14}/> Upload SGS Report</label>
                        </>
                      )}
                      {deal.role === 'vendor' && ((deal.status === 'funded' && deal.inspection === 'waived') || deal.status === 'inspected') && (
                        <>
                          <input type="file" id={`bol-${deal.id}`} className="hidden" onChange={(e) => handleFileUpload(e, deal.id, 'bol')} />
                          <label htmlFor={`bol-${deal.id}`} className="cursor-pointer bg-blue-500 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-400 transition-all flex items-center gap-2"><Ship size={14}/> Upload Bill of Lading</label>
                        </>
                      )}

                      {/* VIEW DOCS */}
                      {deal.sgs_url && <a href={deal.sgs_url} target="_blank" className="border border-amber-500/30 text-amber-500 px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-amber-500/5"><Search size={14}/> View SGS</a>}
                      {deal.bol_url && <a href={deal.bol_url} target="_blank" className="border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500/5"><FileText size={14}/> View BoL</a>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* --- MASTER CONTRACT MODAL (ΟΤΑΝ ΠΑΤΑΣ ΠΑΝΩ ΣΤΟ ΣΥΜΒΟΛΑΙΟ) --- */}
      {viewingContract && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[800px] h-[90vh] rounded-sm overflow-y-auto shadow-[0_0_100px_rgba(166,148,125,0.2)] text-slate-900 font-serif relative">
            <button onClick={() => setViewingContract(null)} className="fixed top-6 right-6 p-3 bg-black text-white rounded-full hover:scale-110 transition-all z-10"><X size={24}/></button>
            
            <div className="p-8 md:p-16">
              <div className="flex justify-between items-start border-b-2 border-[#0A192F] pb-8 mb-10">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-[#0A192F]">AXON</h1>
                  <p className="text-[12px] uppercase tracking-[0.3em] text-[#A6947D] font-sans font-bold mt-1">Institutional Ledger</p>
                </div>
                <div className="text-right text-xs text-slate-500 font-sans">
                  <p>Contract ID: <strong className="text-[#0A192F]">AX-{viewingContract.id.substring(0,8).toUpperCase()}</strong></p>
                  <p>Status: <span className="uppercase font-bold text-amber-600">{viewingContract.status}</span></p>
                  <p>Date: {new Date(viewingContract.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12 text-sm">
                <div>
                  <h3 className="font-bold uppercase text-[#0A192F] border-b border-slate-200 pb-2 mb-4 font-sans text-[11px]">Vendor</h3>
                  <p className="font-bold text-base">{viewingContract.role === 'vendor' ? 'Your Company' : viewingContract.counterparty}</p>
                  <p className="text-slate-500 font-sans text-xs">Verified Tier 1 Supplier</p>
                </div>
                <div>
                  <h3 className="font-bold uppercase text-[#0A192F] border-b border-slate-200 pb-2 mb-4 font-sans text-[11px]">Acquirer</h3>
                  <p className="font-bold text-base">{viewingContract.role === 'buyer' ? 'Your Company' : viewingContract.counterparty}</p>
                  <p className="text-slate-500 font-sans text-xs">Verified AXON Network Buyer</p>
                </div>
              </div>

              <div className="mb-12">
                <h3 className="font-bold uppercase text-[#0A192F] border-b border-slate-200 pb-2 mb-6 font-sans text-[11px]">Purchase Specifications</h3>
                <table className="w-full text-left text-sm font-sans">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-3 text-slate-500">Material Designation</td><td className="py-3 font-bold text-[#0A192F]">{viewingContract.asset_name}</td></tr>
                    <tr><td className="py-3 text-slate-500">Incoterms (2020)</td><td className="py-3 font-bold text-[#0A192F]">{viewingContract.incoterms}</td></tr>
                    <tr><td className="py-3 text-slate-500">Payment Protocol</td><td className="py-3 font-bold text-[#0A192F]">{viewingContract.payment_terms === '100_escrow' ? '100% Secured Escrow' : '30% Advance / 70% Escrow'}</td></tr>
                    <tr><td className="py-3 text-slate-500">Quality Assurance</td><td className="py-3 font-bold text-[#0A192F]">{viewingContract.inspection === 'waived' ? 'Buyer Waived Inspection' : 'Independent SGS Certified'}</td></tr>
                    <tr className="bg-slate-50 font-bold"><td className="py-4 px-2 text-[#0A192F]">TOTAL CONTRACT VALUE</td><td className="py-4 px-2 text-xl text-[#0A192F] font-mono">{formatCurrency(viewingContract.price)}</td></tr>
                  </tbody>
                </table>
              </div>

              {viewingContract.custom_terms && (
                <div className="mb-12">
                  <h3 className="font-bold uppercase text-[#0A192F] border-b border-slate-200 pb-2 mb-4 font-sans text-[11px]">Special Covenants</h3>
                  <p className="text-slate-700 italic text-sm p-4 bg-slate-50 rounded border border-slate-100 leading-relaxed">{viewingContract.custom_terms}</p>
                </div>
              )}

              <div className="bg-slate-900 text-white p-6 rounded-lg font-sans text-xs">
                <div className="flex items-center gap-2 mb-3"><Shield size={16} className="text-[#A6947D]"/><h4 className="font-bold uppercase tracking-widest">Escrow Protection Active</h4></div>
                <p className="opacity-70 leading-relaxed">This contract is digitally signed and secured via AXON Cryptographic Ledger. Funds are held in a multi-sig escrow account and are only eligible for release upon verified fulfillment of the logistics triggers defined above.</p>
              </div>

              <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-end opacity-40 grayscale">
                <div className="text-[10px] font-sans">
                  <p>© {new Date().getFullYear()} AXON NETWORK</p>
                  <p>GENUINE BLOCKCHAIN TICKET #ID-{viewingContract.id.substring(0,10)}</p>
                </div>
                <Shield size={40}/>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 shadow-2xl">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Comms</span></Link>
      </nav>
    </div>
  );
}