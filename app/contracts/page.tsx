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

export default function DealsVault() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [deals, setDeals] = useState<any[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);

  // --- STRIPE PAYMENT STATES ---
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchRealDeals();
  }, []);

  // --- O "ΚΑΤΑΣΚΟΠΟΣ" ΤΟΥ URL (Πιάνει την επιστροφή από το Stripe) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        handleSuccessfulReturnFromStripe();
      }
    }
  }, [currentUser]);

  const handleSuccessfulReturnFromStripe = async () => {
    setPaymentSuccess(true);
    
    // Βρίσκουμε το τελευταίο pending συμβόλαιο του αγοραστή και το κάνουμε funded!
    const { data } = await supabase.from('contracts')
      .select('*')
      .eq('buyer_id', currentUser.id)
      .in('status', ['pending', 'advance_paid'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const targetDeal = data[0];
      const nextStatus = (targetDeal.status === 'pending' && targetDeal.payment_terms === '30_70_split') ? 'advance_paid' : 'funded';
      await supabase.from('contracts').update({ status: nextStatus }).eq('id', targetDeal.id);
      fetchRealDeals(); // Κάνουμε refresh τα δεδομένα
    }

    // Καθαρίζουμε το URL και κλείνουμε το Popup μετά από 4 δευτερόλεπτα
    setTimeout(() => {
      setPaymentSuccess(false);
      router.replace('/contracts');
    }, 4000);
  };

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

  const updateDealStatus = async (dealId: string, nextStatus: string) => {
    setIsProcessingAction(dealId);
    const { error } = await supabase.from('contracts').update({ status: nextStatus }).eq('id', dealId);
    if (!error) {
      setDeals(deals.map(d => d.id === dealId ? { ...d, status: nextStatus } : d));
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

  // --- STRIPE HOSTED CHECKOUT LOGIC ---
  const initializeStripePayment = async (deal: any, mode: 'advance' | 'escrow') => {
    setIsVerifying(true);

    let paymentAmount = parseFloat(deal.price);
    if (deal.payment_terms === '30_70_split') {
        paymentAmount = mode === 'advance' ? paymentAmount * 0.30 : paymentAmount * 0.70;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slabId: deal.asset_id || deal.id,
          price: paymentAmount,
          buyerId: currentUser.id,
          vendorId: deal.vendor_id
        }),
      });
      
      const data = await res.json();
      
      // ΑΝΑΚΑΤΕΥΘΥΝΣΗ ΣΤΟ HOSTED CHECKOUT ΤΟΥ STRIPE
      if (data.url) {
        window.location.href = data.url; 
      } else {
        setIsVerifying(false);
        alert("Failed to initialize secure payment portal. Check console.");
      }
    } catch (err) { 
      setIsVerifying(false);
      console.error(err);
      alert("System Error. Please contact AXON support."); 
    }
  };

  const getPipelineSteps = (deal: any) => {
    let steps = [];
    const s = deal.status;
    
    if (deal.payment_terms === '30_70_split') {
      steps.push({ id: 'advance', label: '30% Advance', icon: <Landmark size={14}/>, active: ['advance_paid', 'funded', 'inspected', 'shipped', 'completed'].includes(s) });
      steps.push({ id: 'escrow', label: '70% Escrow', icon: <Lock size={14}/>, active: ['funded', 'inspected', 'shipped', 'completed'].includes(s) });
    } else {
      steps.push({ id: 'escrow', label: '100% Escrow', icon: <Wallet size={14}/>, active: ['funded', 'inspected', 'shipped', 'completed'].includes(s) });
    }

    if (deal.inspection === 'sgs_required') {
      steps.push({ id: 'inspection', label: 'SGS Report', icon: <Search size={14}/>, active: ['inspected', 'shipped', 'completed'].includes(s) });
    }

    steps.push({ id: 'logistics', label: 'Logistics (BoL)', icon: <Ship size={14}/>, active: ['shipped', 'completed'].includes(s) });
    steps.push({ id: 'settled', label: 'Settled', icon: <CheckCircle2 size={14}/>, active: s === 'completed' });

    return steps;
  };

  if (loading) return <div className="h-screen w-full bg-[#020509] flex items-center justify-center text-[#A6947D] animate-pulse font-mono uppercase tracking-[0.4em]">Synchronizing Vault...</div>;

  const displayDeals = deals.filter(d => activeTab === 'active' ? d.status !== 'completed' : d.status === 'completed');

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans antialiased relative">
      
      {/* SUCCESS OVERLAY ΟΤΑΝ ΓΥΡΝΑΕΙ ΑΠΟ ΤΟ STRIPE */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#020509] border border-emerald-500/30 rounded-2xl w-full max-w-lg relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
              <div className="p-12 text-center animate-in zoom-in">
                <CheckCircle2 size={56} className="text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <h2 className="text-2xl font-serif uppercase tracking-widest text-[#F8F5EE]">FUNDS SECURED</h2>
                <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest mt-4">AXON Escrow Protocol Engaged successfully.</p>
                <div className="w-full h-1 bg-[#01030A] mt-8 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 animate-[pulse_4s_ease-in-out]"></div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* VERIFICATION SPINNER (Πριν φύγει για Stripe) */}
      {isVerifying && !paymentSuccess && (
        <div className="fixed inset-0 z-[200] bg-[#01030A]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/20 rounded-full flex items-center justify-center animate-spin-slow bg-[#020509]">
              <Shield size={40} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border border-[#A6947D]/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE] mb-4">Securing Portal</h2>
          <p className="mt-6 text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest animate-pulse">Initializing direct connection to banking layer.</p>
        </div>
      )}

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
            {displayDeals.length === 0 && (
                <div className="text-center py-20 bg-[#01030A] border border-[#A6947D]/10 rounded-2xl">
                    <FileSignature size={48} className="mx-auto text-[#A6947D]/20 mb-4"/>
                    <p className="text-[10px] text-[#A6947D]/60 uppercase tracking-widest">No contracts found in this status.</p>
                </div>
            )}
            {displayDeals.map((deal) => {
              const pipeline = getPipelineSteps(deal);
              return (
                <div key={deal.id} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl overflow-hidden shadow-2xl transition-all hover:border-[#A6947D]/40">
                  
                  {/* CARD HEADER - ΤΩΡΑ ΟΔΗΓΕΙ ΣΤΟ DEAL ROOM */}
                  <div 
                    onClick={() => router.push(`/contracts/${deal.id}`)}
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
                        <button onClick={() => initializeStripePayment(deal, 'advance')} className="bg-[#A6947D] text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"><CreditCard size={14}/> Pay 30% Advance</button>
                      )}
                      {deal.role === 'buyer' && deal.status === 'advance_paid' && (
                        <button onClick={() => initializeStripePayment(deal, 'escrow')} className="bg-[#A6947D] text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"><Lock size={14}/> Secure 70% Escrow</button>
                      )}
                      {deal.role === 'buyer' && deal.status === 'pending' && deal.payment_terms === '100_escrow' && (
                        <button onClick={() => initializeStripePayment(deal, 'escrow')} className="bg-[#A6947D] text-[#020509] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-white transition-all flex items-center gap-2"><Wallet size={14}/> Secure 100% Escrow</button>
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

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 shadow-2xl">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Comms</span></Link>
      </nav>
    </div>
  );
}