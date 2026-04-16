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

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';
import InboxBadge from '../components/InboxBadge'; 

const stripePromise = loadStripe('pk_test_51TBwXT1RTGOC3MKLvHSA6uyyLoE1PaPGVb46ogLGueeTPnGEq5F0wZfFLE0c9FqHQRwB5aP8FsRbluepidkYreT700CBUJiDPV');

// --- STRIPE CHECKOUT FORM COMPONENT ---
function StripeCheckoutForm({ onSuccess, onCancel, themeColorBg }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setErrorMessage('');
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (error) {
      setErrorMessage(error.message || 'Payment processing failed.');
      setIsProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 bg-[#01030A] w-full">
      <div className="min-h-[200px] w-full">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-[10px] text-red-400 uppercase font-bold tracking-widest shadow-inner">
          <AlertTriangle size={16} className="flex-none text-red-500"/> <span>{errorMessage}</span>
        </div>
      )}
      <div className="pt-4 flex gap-3 md:gap-4 w-full">
        <button type="button" onClick={onCancel} disabled={isProcessing} className="px-4 md:px-6 py-4 rounded-xl border border-[#A6947D]/30 text-[#A6947D] hover:bg-[#A6947D]/10 text-[10px] font-bold uppercase tracking-widest transition-all flex-1">Cancel</button>
        <button type="submit" disabled={!stripe || isProcessing} className={`flex-[2] ${themeColorBg} text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.2)]`}>
          {isProcessing ? <><Loader2 size={16} className="animate-spin"/> Syncing...</> : <><Lock size={16}/> Authorize Funds</>}
        </button>
      </div>
    </form>
  );
}

export default function DealsVault() {
  const router = useRouter();
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [deals, setDeals] = useState<any[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  
  const [viewingContract, setViewingContract] = useState<any>(null);

  // --- STRIPE PAYMENT STATES ---
  const [checkoutMode, setCheckoutMode] = useState<'advance' | 'escrow' | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [activeDealForPayment, setActiveDealForPayment] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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

  // --- STRIPE LOGIC ---
  const initializeStripePayment = async (deal: any, mode: 'advance' | 'escrow') => {
    setIsVerifying(true);
    setActiveDealForPayment(deal);
    setCheckoutMode(mode);

    // Υπολογισμός ποσού (Αν είναι advance 30%, αν είναι escrow το υπόλοιπο ή 100%)
    let paymentAmount = parseFloat(deal.price);
    if (deal.payment_terms === '30_70_split') {
        paymentAmount = mode === 'advance' ? paymentAmount * 0.30 : paymentAmount * 0.70;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slabId: deal.asset_id || deal.id, // Fallback
          price: paymentAmount,
          buyerId: currentUser.id,
          vendorId: deal.vendor_id
        }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        setIsVerifying(false);
        setCheckoutMode(null);
        alert("Failed to initialize secure payment portal. Check console.");
      }
    } catch (err) { 
      setIsVerifying(false);
      setCheckoutMode(null);
      console.error(err);
      alert("System Error. Please contact AXON support."); 
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    const nextStatus = checkoutMode === 'advance' ? 'advance_paid' : 'funded';
    
    if (activeDealForPayment) {
        await supabase.from('contracts').update({ status: nextStatus }).eq('id', activeDealForPayment.id);
        setDeals(deals.map(d => d.id === activeDealForPayment.id ? { ...d, status: nextStatus } : d));
    }
    
    setTimeout(() => {
        setCheckoutMode(null);
        setPaymentSuccess(false);
        setActiveDealForPayment(null);
    }, 2000);
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
      
      {/* STRIPE CHECKOUT MODAL */}
      {checkoutMode && clientSecret && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-300 overflow-x-hidden">
          <div className="bg-[#020509] border border-[#A6947D]/20 rounded-2xl w-full max-w-lg relative shadow-2xl overflow-hidden my-auto">
            {paymentSuccess ? (
              <div className="p-12 text-center animate-in zoom-in">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-serif uppercase tracking-widest text-[#F8F5EE]">FUNDS SECURED</h2>
                <p className="text-[#A6947D]/80 text-[10px] font-bold uppercase tracking-widest mt-3">AXON Escrow Protocol Engaged.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-[#A6947D]/10 flex justify-between items-center bg-[#01030A]">
                  <div className="flex items-center gap-3 text-[#A6947D]"><Lock size={18} /><h2 className="text-sm font-serif uppercase tracking-widest text-[#F8F5EE]">Secure Escrow Funding</h2></div>
                  <button onClick={() => {setCheckoutMode(null); setIsVerifying(false);}} className="p-2 bg-[#020509] text-[#F8F5EE]/40 hover:text-red-500 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-10 text-center border-b border-[#A6947D]/10">
                  <p className="text-[10px] text-[#A6947D]/80 uppercase font-bold tracking-widest mb-3">Amount to Lock</p>
                  <p className="text-4xl md:text-5xl font-mono text-[#F8F5EE] tracking-tighter">
                    {formatCurrency(checkoutMode === 'advance' ? activeDealForPayment.price * 0.3 : (activeDealForPayment.payment_terms === '30_70_split' ? activeDealForPayment.price * 0.7 : activeDealForPayment.price))}
                  </p>
                </div>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#10B981', colorBackground: '#01030A', colorDanger: '#EF4444' } } }}>
                  <StripeCheckoutForm onSuccess={handlePaymentSuccess} onCancel={() => {setCheckoutMode(null); setIsVerifying(false);}} themeColorBg="bg-emerald-500 hover:bg-emerald-400" />
                </Elements>
              </>
            )}
          </div>
        </div>
      )}

      {/* VERIFICATION SPINNER */}
      {isVerifying && !clientSecret && (
        <div className="fixed inset-0 z-[200] bg-[#01030A]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/20 rounded-full flex items-center justify-center animate-spin-slow bg-[#020509]">
              <Shield size={40} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border border-[#A6947D]/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE] mb-4">Securing Portal</h2>
          <p className="mt-6 text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest animate-pulse">Please wait while we initialize the secure connection.</p>
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
                  
                  {/* CARD HEADER */}
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
                      {/* BUYER BUTTONS (TΩΡΑ ΣΥΝΔΕΔΕΜΕΝΑ ΜΕ STRIPE) */}
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

      {/* --- MASTER CONTRACT MODAL --- */}
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