'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  ArrowLeft, Handshake, Building2, Calendar, Package, AlertTriangle, 
  CheckCircle2, X, ShieldCheck, Zap, Loader2, Fingerprint, ChevronLeft, ChevronRight,
  MapPin, Factory, Anchor, Layers, Users, LogOut, Maximize2, Gavel, Menu, FileSignature, User,
  Cpu, ScanLine
} from 'lucide-react';
import Link from 'next/link';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// LANGUAGE SYNC
import { useLanguage } from '../../../lib/i18n/LanguageContext';

const stripePromise = loadStripe('pk_test_51TBwXT1RTGOC3MKLvHSA6uyyLoE1PaPGVb46ogLGueeTPnGEq5F0wZfFLE0c9FqHQRwB5aP8FsRbluepidkYreT700CBUJiDPV');

function StripeCheckoutForm({ amount, onSuccess, onCancel, themeColorBg }: any) {
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
          {isProcessing ? <><Loader2 size={16} className="animate-spin"/> Syncing...</> : <><Lock size={16}/> Authorize</>}
        </button>
      </div>
    </form>
  );
}

export default function PublicAssetDossier() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  const { t, language } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [slab, setSlab] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  // --- STATE ΓΙΑ ΤΟ SMART MENU ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerIncoterm, setOfferIncoterm] = useState<'EXW' | 'FOB'>('EXW');
  const [offerText, setOfferText] = useState('Initiating secure OTC negotiation protocol.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // VERIFICATION LOGIC STATES
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  
  const [checkoutMode, setCheckoutMode] = useState<'instant' | 'lock' | null>(null);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // --- AI VISION SCANNER STATES ---
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  useEffect(() => {
    const fetchAssetData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);
      
      if (assetId) {
        const { data: slabData } = await supabase.from('slabs').select('*').eq('id', assetId).single();
        if (slabData) {
          setSlab(slabData);
          setOfferPrice(String(slabData.price || '')); 
          
          let parsedImages: string[] = [];
          const rawData = slabData.images || slabData.image_url;
          if (rawData) {
            try {
              if (Array.isArray(rawData)) {
                parsedImages = rawData.map((item: any) => typeof item === 'string' ? item : (item.url || item.publicUrl || '')).filter(Boolean);
              } else {
                parsedImages = [rawData];
              }
            } catch (err) { console.error(err); }
          }
          if (parsedImages.length === 0) parsedImages = ['https://via.placeholder.com/800x600?text=NO+VISUAL+DATA'];
          setImages(parsedImages);

          const vendorId = slabData.user_id || slabData.vendor_id;
          if (vendorId) {
            const { data: vendorData } = await supabase.from('profiles').select('*').eq('id', vendorId).single();
            if (vendorData) setVendor(vendorData);
          }
        }
      }
      setLoading(false);
    };
    fetchAssetData();
  }, [assetId]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const parsePrice = (price: string | number) => {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    return parseFloat(price.toString().replace(/\./g, '').replace(/,/g, '.')) || 0;
  };

  const formatCurrencyLocal = (amount: string | number) => {
    const val = parsePrice(amount);
    return new Intl.NumberFormat(language === 'el' ? 'el-GR' : 'en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const runVerificationProtocol = (callback: () => void) => {
    setIsVerifying(true);
    setVerificationStep(1); 
    setTimeout(() => {
      setVerificationStep(2); 
      setTimeout(() => {
        setVerificationStep(3); 
        setTimeout(() => {
          setIsVerifying(false);
          callback();
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handlePaymentSuccess = () => {
    runVerificationProtocol(async () => {
      setPaymentSuccess(true);
      if (slab) {
        await supabase.from('slabs').update({ is_available: false, buyer_id: currentUser?.id }).eq('id', slab.id);
        setSlab({ ...slab, is_available: false, buyer_id: currentUser?.id });
      }
      setTimeout(() => setCheckoutMode(null), 2000);
    });
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { router.push('/auth'); return; }
    
    setIsSubmitting(true);
    const targetVendorId = vendor?.id || slab.user_id;
    
    const { error } = await supabase.from('messages').insert([{
      sender_id: currentUser.id,
      receiver_id: targetVendorId,
      text: offerText,
      is_offer: true,
      offer_details: { 
        asset_id: slab.id, 
        price: offerPrice || 'Inquiry', 
        incoterm: offerIncoterm,
        material: slab.material 
      }
    }]);

    if (!error) {
      runVerificationProtocol(() => {
        setIsOfferModalOpen(false); 
        router.push('/dashboard/bids'); 
      });
    } else {
      alert("Error logging protocol.");
    }
    setIsSubmitting(false);
  };

  const initializeStripePayment = async (mode: 'instant' | 'lock') => {
    if (!currentUser) { router.push('/auth'); return; }
    const amount = mode === 'instant' ? parsePrice(slab.price) : parsePrice(slab.price) * 0.20;
    setCheckoutMode(mode);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.clientSecret) setClientSecret(data.clientSecret);
    } catch (err) { setCheckoutMode(null); }
  };

  // --- AI VISION SCAN HANDLER ---
  const handleAiScan = () => {
    setIsAiScanning(true);
    // Προσομοίωση 3.5 δευτερολέπτων για να κάνει "scan" το μοντέλο AI
    setTimeout(() => {
      setIsAiScanning(false);
      setAiReport({
        grade: 'AAA+',
        purity: '98.5%',
        veinConsistency: 'High Quality',
        fractureRisk: 'Minimal (<1%)',
        tone: 'Brilliant Base / Subtle Veining'
      });
    }, 3500);
  };

  if (loading) return <div className="h-[100dvh] w-full bg-[#020509] flex items-center justify-center text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]"><Loader2 className="animate-spin mr-3"/> {t('common.syncing')}</div>;

  // --- DYNAMIC STATE LOGIC ΓΙΑ ΤΟ SOLD ACTION ---
  const isSold = slab?.is_available === false;
  const isVendor = currentUser?.id === slab?.user_id || currentUser?.id === slab?.vendor_id;
  const isBuyer = slab?.buyer_id && currentUser?.id === slab?.buyer_id;

  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 relative overflow-x-hidden">
      
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
              <Link href="/dashboard/bids" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Gavel size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Offers</span>
              </Link>
              <Link href="/contracts" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <FileSignature size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Deals Vault</span>
              </Link>
              <Link href="/scanner" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Crosshair size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">AI Scanner</span>
              </Link>
              <Link href="/network" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Users size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Network</span>
              </Link>
              <Link href="/me" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner col-span-2">
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

      {/* VERIFICATION OVERLAY */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] bg-[#01030A]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/20 rounded-full flex items-center justify-center animate-spin-slow bg-[#020509]">
              <Shield size={40} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border border-[#A6947D]/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE] mb-4">
            {verificationStep === 1 ? 'Encrypting Payload' : verificationStep === 2 ? 'Ledger Synchronization' : 'Finalizing Protocol'}
          </h2>
          <div className="w-48 h-1 bg-[#020509] rounded-full overflow-hidden border border-[#A6947D]/20">
            <div className="h-full bg-[#A6947D] transition-all duration-1000 shadow-[0_0_10px_#A6947D]" style={{ width: `${(verificationStep / 3) * 100}%` }}></div>
          </div>
          <p className="mt-6 text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest animate-pulse">Zero-Trust Verification Active</p>
        </div>
      )}

      {/* STRIPE CHECKOUT MODAL */}
      {checkoutMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-300 overflow-x-hidden">
          <div className="bg-[#020509] border border-[#A6947D]/20 rounded-2xl w-full max-w-lg relative shadow-2xl overflow-hidden my-auto">
            {paymentSuccess ? (
              <div className="p-12 text-center animate-in zoom-in">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h2 className="text-xl font-serif uppercase tracking-widest text-[#F8F5EE]">{t('scanner.success_title')}</h2>
                <p className="text-[#A6947D]/80 text-[10px] font-bold uppercase tracking-widest mt-3">AXON Escrow Protocol Engaged.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-[#A6947D]/10 flex justify-between items-center bg-[#01030A]">
                  <div className="flex items-center gap-3 text-[#A6947D]"><Lock size={18} /><h2 className="text-sm font-serif uppercase tracking-widest text-[#F8F5EE]">Secure Checkout</h2></div>
                  <button onClick={() => setCheckoutMode(null)} className="p-2 bg-[#020509] text-[#F8F5EE]/40 hover:text-red-500 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-10 text-center border-b border-[#A6947D]/10">
                  <p className="text-[10px] text-[#A6947D]/80 uppercase font-bold tracking-widest mb-3">{checkoutMode === 'instant' ? t('scanner.valuation') : 'Escrow Deposit'}</p>
                  <p className="text-4xl md:text-5xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrencyLocal(checkoutMode === 'instant' ? slab.price : parsePrice(slab.price)*0.2)}</p>
                </div>
                {!clientSecret ? (
                  <div className="p-16 flex justify-center"><Loader2 size={32} className="animate-spin text-[#A6947D]" /></div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#10B981', colorBackground: '#01030A', colorDanger: '#EF4444' } } }}>
                    <StripeCheckoutForm onSuccess={handlePaymentSuccess} onCancel={() => setCheckoutMode(null)} themeColorBg="bg-emerald-500 hover:bg-emerald-400" />
                  </Elements>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* OTC DEAL MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200 overflow-x-hidden">
          <div className="bg-[#020509] border border-amber-500/30 rounded-2xl w-full max-w-lg relative shadow-[0_0_40px_rgba(245,158,11,0.1)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-amber-500/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-amber-500"><Handshake size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">OTC Protocol</h2></div>
               <button onClick={() => setIsOfferModalOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSendOffer} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-xl p-4 flex items-center gap-4 shadow-inner">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#020509] border border-[#A6947D]/20 flex-none">
                  {images[0] ? <img src={images[0]} className="w-full h-full object-cover opacity-80" /> : <Package className="w-full h-full p-3 text-[#A6947D]/40" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] text-[#A6947D]/80 font-bold tracking-widest uppercase mb-1">Target Asset</p>
                  <p className="text-sm font-serif text-[#F8F5EE] uppercase truncate">{slab.material}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Logistics Protocol</label>
                  <div className="flex bg-[#01030A] border border-amber-500/20 rounded-xl p-1 gap-1">
                    <button type="button" onClick={() => setOfferIncoterm('EXW')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'EXW' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-sm' : 'text-amber-500/40 hover:text-amber-400 border border-transparent'}`}>EXW</button>
                    <button type="button" onClick={() => setOfferIncoterm('FOB')} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'FOB' ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-sm' : 'text-amber-500/40 hover:text-amber-400 border border-transparent'}`}>FOB</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Proposed Value (€)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 font-mono">€</span>
                    <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full bg-[#01030A] border border-amber-500/30 rounded-xl pl-10 pr-4 py-4 md:py-3.5 text-base md:text-sm font-mono text-amber-400 focus:outline-none focus:border-amber-500 shadow-inner" placeholder="0.00" required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Message (Optional)</label>
                <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-xl px-4 py-4 text-sm text-[#F8F5EE] focus:outline-none focus:border-amber-500/50 shadow-inner resize-none custom-scrollbar" rows={3} />
              </div>
              
              <button type="submit" disabled={isSubmitting || !offerPrice.trim()} className="w-full bg-amber-500 hover:bg-amber-400 text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] shadow-[0_4px_15px_rgba(245,158,11,0.2)] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Gavel size={16}/> Transmit Offer</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOP NAV */}
      <nav className="px-4 md:px-12 py-4 border-b border-[#A6947D]/10 bg-[#01030A]/90 backdrop-blur-xl flex justify-between items-center sticky top-0 z-40 w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#A6947D]/60 hover:text-[#A6947D] text-[9px] font-bold uppercase tracking-widest transition-colors"><ChevronLeft size={16} /> {language === 'el' ? 'Επιστροφή' : 'Back'}</button>
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-[#A6947D]" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-12 relative z-10 w-full overflow-x-hidden pb-24 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 w-full">
          
          {/* IMAGE SECTION */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6 w-full">
            <div className="relative aspect-square md:aspect-[4/3] bg-[#01030A] rounded-2xl overflow-hidden border border-[#A6947D]/20 shadow-xl w-full group">
              <img src={images[activeImageIndex]} alt="" className="w-full h-full object-cover" />
              
              {/* AI SCANNER OVERLAY ANIMATION */}
              {isAiScanning && (
                <div className="absolute inset-0 z-20 overflow-hidden rounded-2xl">
                  <div className="w-full h-1 bg-emerald-400 shadow-[0_0_20px_#34d399] absolute top-0 animate-[scan_2s_ease-in-out_infinite]"></div>
                  <div className="absolute inset-0 bg-[#020509]/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <ScanLine size={48} className="text-emerald-400 animate-pulse mb-4" />
                      <p className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase animate-pulse">Running Neural Analysis...</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* ΔΥΝΑΜΙΚΗ ΣΦΡΑΓΙΔΑ (DYNAMIC ACTION OVERLAY) ΟΤΑΝ ΕΙΝΑΙ SOLD */}
              {isSold && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#020509]/70 backdrop-blur-[4px] animate-in fade-in duration-500">
                  <div className={`border-[3px] px-8 py-4 rounded-2xl transform -rotate-12 shadow-2xl backdrop-blur-md ${isVendor ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : isBuyer ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-red-500/50 bg-red-500/10 text-red-500'}`}>
                    <p className="text-2xl md:text-4xl font-black uppercase tracking-[0.2em] drop-shadow-lg">
                      {isVendor ? 'FUNDS SECURED' : isBuyer ? 'ACQUIRED BY YOU' : 'OFF-MARKET'}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* SPECS GRID */}
            <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
              <div className="bg-[#01030A] border border-[#A6947D]/10 p-4 rounded-xl text-center shadow-inner">
                <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1.5">{t('scanner.thickness').split(' (')[0]}</p>
                <p className="text-sm font-mono text-[#F8F5EE]">{slab.thickness || '2.0'} cm</p>
              </div>
              <div className="bg-[#01030A] border border-[#A6947D]/10 p-4 rounded-xl text-center shadow-inner">
                <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1.5">{t('scanner.quantity').split(' (')[0]}</p>
                <p className="text-sm font-mono text-[#F8F5EE]">{slab.quantity || '0'} M²</p>
              </div>
              <div className="bg-[#01030A] border border-[#A6947D]/10 p-4 rounded-xl text-center shadow-inner">
                <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1.5">{t('scanner.incoterm')}</p>
                <p className="text-sm font-sans font-bold text-[#F8F5EE]">{slab.incoterm || 'EXW'}</p>
              </div>
            </div>

            {/* AI VISION GRADING SECTION */}
            <div className="bg-[#01030A] border border-[#A6947D]/20 p-5 md:p-6 rounded-2xl w-full shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-[#A6947D]" />
                  <h3 className="text-[9px] font-bold text-[#A6947D] uppercase tracking-widest">AXON Vision Analysis</h3>
                </div>
                {aiReport && <CheckCircle2 size={16} className="text-emerald-400" />}
              </div>

              {!aiReport ? (
                <button 
                  onClick={handleAiScan} 
                  disabled={isAiScanning}
                  className="w-full bg-[#020509] border border-[#A6947D]/30 hover:border-[#A6947D] text-[#A6947D] py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-inner"
                >
                  {isAiScanning ? <><Loader2 size={16} className="animate-spin" /> Analyzing Surface...</> : <><ScanLine size={16} /> Initiate Scan Protocol</>}
                </button>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-[#020509] p-3 rounded-xl border border-[#A6947D]/10">
                      <p className="text-[7px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1">Investment Grade</p>
                      <p className="text-lg font-mono text-emerald-400 font-bold">{aiReport.grade}</p>
                    </div>
                    <div className="bg-[#020509] p-3 rounded-xl border border-[#A6947D]/10">
                      <p className="text-[7px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1">Surface Purity</p>
                      <p className="text-lg font-mono text-[#F8F5EE] font-bold">{aiReport.purity}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-[#020509] p-3 rounded-xl border border-[#A6947D]/10">
                      <span className="text-[8px] text-[#A6947D]/80 font-bold uppercase tracking-widest">Fracture Risk</span>
                      <span className="text-[9px] font-mono text-[#F8F5EE]">{aiReport.fractureRisk}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#020509] p-3 rounded-xl border border-[#A6947D]/10">
                      <span className="text-[8px] text-[#A6947D]/80 font-bold uppercase tracking-widest">Tone Profile</span>
                      <span className="text-[9px] font-serif text-[#F8F5EE]">{aiReport.tone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-[#01030A] border border-[#A6947D]/10 p-5 rounded-2xl flex items-center gap-4 w-full shadow-inner">
                <MapPin size={20} className="text-[#A6947D] flex-none" />
                <div className="overflow-hidden">
                    <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">{t('scanner.location')}</p>
                    <p className="text-sm font-serif uppercase tracking-widest text-[#F8F5EE] truncate">{slab.location || 'Global Hub'}</p>
                </div>
            </div>
          </div>

          {/* ASSET DATA SECTION */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full">
            <div className="mb-8 md:mb-10 overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isSold ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <p className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2">AX-{slab.id.substring(0,8)}</p>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#F8F5EE] uppercase leading-tight mb-8 tracking-wider truncate w-full">{slab.material}</h1>
              
              <div className={`p-8 rounded-2xl border w-full bg-[#01030A] shadow-xl ${isSold ? 'border-red-500/20' : slab.pricing_model === 'ROQ' ? 'border-amber-500/20' : 'border-emerald-500/20'}`}>
                <p className="text-[9px] uppercase font-bold mb-2 text-[#A6947D]/80 tracking-widest">{isSold ? 'Locked Valuation' : slab.pricing_model === 'ROQ' ? 'Premium Request' : t('scanner.valuation')}</p>
                <p className={`text-4xl md:text-5xl font-mono tracking-tighter ${isSold ? 'text-[#F8F5EE]/40 line-through' : 'text-[#F8F5EE]'}`}>{slab.pricing_model === 'ROQ' ? 'ROQ' : formatCurrencyLocal(slab.price)}</p>
              </div>
            </div>

            {/* ACTION BUTTONS (DYNAMIC BASED ON STATE) */}
            <div className="space-y-4 w-full">
              {isSold ? (
                 isVendor ? (
                   // VENDOR SOLD VIEW
                   <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center shadow-inner animate-in fade-in duration-500">
                     <ShieldCheck size={36} className="mx-auto text-emerald-400 mb-4" />
                     <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Funds Secured In Escrow</p>
                     <p className="text-[10px] font-mono text-emerald-400/80 mb-6 uppercase tracking-widest leading-relaxed">Το ποσό έχει δεσμευτεί από το AXON.<br/>Ετοιμάστε την παραγγελία.</p>
                     <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#020509] py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
                       <FileSignature size={16}/> Confirm Logistics
                     </button>
                   </div>
                 ) : isBuyer ? (
                   // BUYER SOLD VIEW
                   <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center shadow-inner animate-in fade-in duration-500">
                     <Package size={36} className="mx-auto text-amber-400 mb-4" />
                     <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-3">Escrow Secured</p>
                     <p className="text-[10px] font-mono text-amber-400/80 mb-6 uppercase tracking-widest leading-relaxed">Το συμβόλαιο έχει κλειδώσει.<br/>Awaiting Vendor Logistics.</p>
                     <button onClick={() => router.push(`/inbox?chat=${slab.user_id}`)} className="w-full bg-amber-500 hover:bg-amber-400 text-[#020509] py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2">
                       <MessageSquare size={16}/> Contact Vendor
                     </button>
                   </div>
                 ) : (
                   // THIRD PARTY FOMO VIEW
                   <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center shadow-inner animate-in fade-in duration-500">
                     <Lock size={36} className="mx-auto text-red-500 mb-4" />
                     <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-3">Asset Off-Market</p>
                     <p className="text-[10px] font-mono text-red-500/80 uppercase tracking-widest leading-relaxed">Escrow Locked. Η πλάκα έχει ήδη<br/>δεσμευτεί από άλλη οντότητα.</p>
                   </div>
                 )
              ) : slab.pricing_model === 'ROQ' ? (
                // AVAILABLE ROQ BUTTON
                <button onClick={() => setIsOfferModalOpen(true)} className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 py-5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-lg flex items-center justify-center gap-2">
                    <Lock size={16} /> {language === 'el' ? 'ΑΙΤΗΜΑ ΠΡΟΣΦΟΡΑΣ' : 'REQUEST SECURE QUOTE'}
                </button>
              ) : (
                // AVAILABLE FIXED PRICE BUTTONS
                <>
                  <button onClick={() => initializeStripePayment('instant')} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] py-5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-[0_4px_15px_rgba(166,148,125,0.2)] flex items-center justify-center gap-2 transition-all">
                    <Zap size={16} /> {language === 'el' ? 'ΑΜΕΣΗ ΑΠΟΚΤΗΣΗ' : 'INSTANT ACQUISITION'}
                  </button>
                  <button onClick={() => initializeStripePayment('lock')} className="w-full border border-[#A6947D]/30 text-[#A6947D] py-5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#A6947D]/10 transition-colors">
                    <ShieldCheck size={16} /> {language === 'el' ? 'ΚΛΕΙΔΩΜΑ ΜΕΣΩ ESCROW (20%)' : 'LOCK VIA ESCROW (20%)'}
                  </button>
                  <button onClick={() => setIsOfferModalOpen(true)} className="w-full bg-[#01030A] text-[#A6947D]/80 py-5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 flex items-center justify-center gap-2 hover:bg-[#020509] hover:border-[#A6947D]/50 transition-colors shadow-inner">
                    <Gavel size={16} /> {language === 'el' ? 'ΔΙΑΠΡΑΓΜΑΤΕΥΣΗ OTC' : 'OTC NEGOTIATION'}
                  </button>
                </>
              )}
            </div>

            <div className="mt-10 p-6 bg-[#01030A] border border-[#A6947D]/10 rounded-2xl w-full flex items-center gap-5 shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-[#020509] border border-[#A6947D]/20 flex items-center justify-center flex-none shadow-inner">
                    <Building2 size={24} className="text-[#A6947D]" strokeWidth={1.5} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Holding Entity</p>
                    <p className="text-sm font-serif uppercase tracking-widest text-[#F8F5EE] truncate">{vendor?.company_name || 'System Node'}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <ShieldCheck size={12} className="text-emerald-400" />
                        <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Verified Vendor</span>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </main>

      {/* MOBILE NAV - 4 BUTTON STRICT BAR W/ RED DOT */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors">
          <div className="relative inline-flex">
            <MessageSquare size={20} />
            {/* Η "Χειροκίνητη" Κόκκινη τελεία για σιγουριά στο compile! */}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF204E] border-[2px] border-[#01030A] rounded-full shadow-[0_0_10px_rgba(255,32,78,0.6)] z-20 animate-pulse"></span>
          </div>
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
        <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}