'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  ArrowLeft, Handshake, Building2, Calendar, Package, AlertTriangle, 
  CheckCircle2, X, ShieldCheck, Zap, Loader2, Fingerprint, ChevronLeft, ChevronRight,
  MapPin, Factory, Anchor, Layers, Users, LogOut, Maximize2, Gavel
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
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 bg-[#01040E] w-full">
      <div className="min-h-[200px] w-full">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {errorMessage && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-[9px] text-red-400 uppercase tracking-widest">
          <AlertTriangle size={14} className="flex-none"/> <span>{errorMessage}</span>
        </div>
      )}
      <div className="pt-4 flex gap-3 md:gap-4 w-full">
        <button type="button" onClick={onCancel} disabled={isProcessing} className="px-4 md:px-6 py-5 md:py-4 rounded-xl border border-[#A6947D]/30 text-[#A6947D] text-[10px] md:text-[9px] font-bold uppercase tracking-widest transition-all flex-1">Cancel</button>
        <button type="submit" disabled={!stripe || isProcessing} className={`flex-[2] ${themeColorBg} text-[#020509] font-bold uppercase tracking-widest py-5 md:py-4 rounded-xl transition-all text-[10px] md:text-[9px] flex items-center justify-center gap-2 shadow-xl`}>
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
        await supabase.from('slabs').update({ is_available: false }).eq('id', slab.id);
      }
      setTimeout(() => router.push('/dashboard'), 2000);
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

  if (loading) return <div className="h-[100dvh] w-full bg-[#020612] flex items-center justify-center text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]">{t('common.syncing')}</div>;

  return (
    <div className="min-h-[100dvh] w-full bg-[#020612] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 relative overflow-x-hidden">
      
      {/* VERIFICATION OVERLAY */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] bg-[#020612]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/20 rounded-full flex items-center justify-center animate-spin-slow">
              <Shield size={40} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE] mb-4">
            {verificationStep === 1 ? 'Encrypting Payload' : verificationStep === 2 ? 'ledger synchronization' : 'Finalizing Protocol'}
          </h2>
          <div className="w-48 h-1 bg-[#01040E] rounded-full overflow-hidden border border-[#A6947D]/10">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(verificationStep / 3) * 100}%` }}></div>
          </div>
          <p className="mt-6 text-[9px] font-mono text-[#A6947D] uppercase tracking-widest animate-pulse">Zero-Trust Verification Active</p>
        </div>
      )}

      {/* STRIPE CHECKOUT MODAL */}
      {checkoutMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/95 backdrop-blur-md animate-in fade-in duration-300 overflow-x-hidden">
          <div className="bg-[#01040E] border border-[#A6947D]/20 rounded-[2rem] w-full max-w-lg relative shadow-2xl overflow-hidden my-auto">
            {paymentSuccess ? (
              <div className="p-10 text-center animate-in zoom-in">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-serif uppercase tracking-widest">{t('scanner.success_title')}</h2>
                <p className="text-[#A6947D] text-[9px] font-mono mt-2">AXON Escrow Protocol Engaged.</p>
              </div>
            ) : (
              <>
                <div className="p-5 md:p-6 border-b border-[#A6947D]/10 flex justify-between items-center bg-[#01030A]">
                  <div className="flex items-center gap-2 text-[#A6947D]"><Lock size={16} /><h2 className="text-xs font-serif uppercase tracking-widest">Secure Checkout</h2></div>
                  <button onClick={() => setCheckoutMode(null)} className="p-2 bg-[#020612] rounded-full"><X size={18} /></button>
                </div>
                <div className="p-8 text-center border-b border-[#A6947D]/10">
                  <p className="text-[9px] text-[#A6947D] uppercase font-bold mb-2">{checkoutMode === 'instant' ? t('scanner.valuation') : 'Escrow Deposit'}</p>
                  <p className="text-4xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrencyLocal(checkoutMode === 'instant' ? slab.price : parsePrice(slab.price)*0.2)}</p>
                </div>
                {!clientSecret ? (
                  <div className="p-12 flex justify-center"><Loader2 size={24} className="animate-spin text-[#A6947D]" /></div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                    <StripeCheckoutForm onSuccess={handlePaymentSuccess} onCancel={() => setCheckoutMode(null)} themeColorBg="bg-emerald-500" />
                  </Elements>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* OTC DEAL MODAL - THE MISSING PIECE */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/95 backdrop-blur-md animate-in fade-in duration-200 overflow-x-hidden">
          <div className="bg-[#01030A] border border-amber-500/30 rounded-[2rem] w-full max-w-lg relative shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-amber-500/20">
               <div className="flex items-center gap-3 text-amber-500"><Handshake size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">OTC Protocol</h2></div>
               <button onClick={() => setIsOfferModalOpen(false)} className="text-[#A6947D] p-2 bg-[#020509] rounded-full hover:text-white transition-colors"><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSendOffer} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="bg-[#020509] border border-[#A6947D]/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#01030A] border border-[#A6947D]/20 flex-none">
                  {images[0] ? <img src={images[0]} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 text-[#A6947D]/40" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-[#A6947D] font-mono tracking-widest uppercase">Target Asset</p>
                  <p className="text-sm font-serif uppercase truncate">{slab.material}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Logistics Protocol</label>
                  <div className="flex bg-[#020509] border border-amber-500/20 rounded-xl p-1 gap-1">
                    <button type="button" onClick={() => setOfferIncoterm('EXW')} className={`flex-1 py-3.5 md:py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'EXW' ? 'bg-amber-500 text-[#020509] shadow-lg' : 'text-amber-500/40 hover:text-amber-500'}`}>EXW</button>
                    <button type="button" onClick={() => setOfferIncoterm('FOB')} className={`flex-1 py-3.5 md:py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'FOB' ? 'bg-amber-500 text-[#020509] shadow-lg' : 'text-amber-500/40 hover:text-amber-500'}`}>FOB</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Proposed Value (€)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 font-mono">€</span>
                    <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full bg-[#020509] border border-amber-500/30 rounded-xl pl-10 pr-4 py-4 md:py-3.5 text-base md:text-sm font-mono text-amber-500 focus:outline-none focus:border-amber-500 shadow-inner" placeholder="0.00" required />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Message (Optional)</label>
                <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-amber-500/50 shadow-inner resize-none" rows={2} />
              </div>
              
              <button type="submit" disabled={isSubmitting || !offerPrice.trim()} className="w-full bg-amber-500 text-[#020509] font-black uppercase tracking-[0.2em] py-5 md:py-4 rounded-2xl transition-all text-[11px] md:text-[10px] shadow-2xl disabled:opacity-30 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Gavel size={16}/> Transmit Offer</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOP NAV & CONTENT */}
      <nav className="px-4 md:px-12 py-4 border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-xl flex justify-between items-center sticky top-0 z-40 w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#A6947D]/60 hover:text-[#A6947D] text-[10px] font-bold uppercase tracking-widest transition-colors"><ChevronLeft size={16} /> {language === 'el' ? 'Επιστροφή' : 'Back'}</button>
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-[#A6947D]/30" />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-12 relative z-10 w-full overflow-x-hidden pb-24 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 w-full">
          
          {/* IMAGE SECTION */}
          <div className="lg:col-span-7 space-y-4 md:space-y-6 w-full">
            <div className="relative aspect-square md:aspect-[4/3] bg-[#01030A] rounded-3xl overflow-hidden border border-[#A6947D]/20 shadow-xl w-full group">
              <img src={images[activeImageIndex]} alt="" className="w-full h-full object-cover" />
            </div>

            {/* SPECS GRID */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 w-full">
              <div className="bg-[#01040E] border border-[#A6947D]/10 p-3 md:p-4 rounded-xl text-center shadow-inner">
                <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">{t('scanner.thickness').split(' (')[0]}</p>
                <p className="text-xs md:text-sm font-mono">{slab.thickness || '2.0'} cm</p>
              </div>
              <div className="bg-[#01040E] border border-[#A6947D]/10 p-3 md:p-4 rounded-xl text-center shadow-inner">
                <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">{t('scanner.quantity').split(' (')[0]}</p>
                <p className="text-xs md:text-sm font-mono text-emerald-400">{slab.quantity || '0'} M²</p>
              </div>
              <div className="bg-[#01040E] border border-[#A6947D]/10 p-3 md:p-4 rounded-xl text-center shadow-inner">
                <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">{t('scanner.incoterm')}</p>
                <p className="text-xs md:text-sm font-serif">{slab.incoterm || 'EXW'}</p>
              </div>
            </div>
            
            <div className="bg-[#01040E] border border-[#A6947D]/10 p-4 md:p-5 rounded-2xl flex items-center gap-4 w-full shadow-inner">
                <MapPin size={18} className="text-[#A6947D] flex-none" />
                <div className="overflow-hidden">
                    <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest">{t('scanner.location')}</p>
                    <p className="text-xs md:text-sm font-serif uppercase tracking-widest text-[#F8F5EE] truncate">{slab.location || 'Global Hub'}</p>
                </div>
            </div>
          </div>

          {/* ASSET DATA SECTION */}
          <div className="lg:col-span-5 flex flex-col justify-center w-full">
            <div className="mb-8 md:mb-10 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.3em] flex items-center gap-2">AX-{slab.id.substring(0,8)}</p>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#F8F5EE] uppercase leading-tight mb-6 md:mb-8 tracking-tighter truncate w-full">{slab.material}</h1>
              
              <div className={`p-6 md:p-8 rounded-[2rem] border w-full bg-[#01030A] shadow-2xl ${slab.pricing_model === 'ROQ' ? 'border-amber-500/20' : 'border-emerald-500/20'}`}>
                <p className="text-[8px] md:text-[9px] uppercase font-bold mb-1.5 md:mb-2 text-[#A6947D] tracking-widest">{slab.pricing_model === 'ROQ' ? 'Premium Request' : t('scanner.valuation')}</p>
                <p className="text-3xl md:text-4xl font-mono tracking-tighter">{slab.pricing_model === 'ROQ' ? 'ROQ' : formatCurrencyLocal(slab.price)}</p>
              </div>
            </div>

            {/* ACTION BUTTONS - MOBILE SCALED */}
            <div className="space-y-3 md:space-y-4 w-full">
              {slab.pricing_model === 'ROQ' ? (
                <button onClick={() => setIsOfferModalOpen(true)} className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-500 py-5 md:py-5 rounded-2xl text-[10px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-lg flex items-center justify-center gap-3">
                    <Lock size={16} /> {language === 'el' ? 'ΑΙΤΗΜΑ ΠΡΟΣΦΟΡΑΣ' : 'REQUEST SECURE QUOTE'}
                </button>
              ) : (
                <>
                  <button onClick={() => initializeStripePayment('instant')} className="w-full bg-[#F8F5EE] text-[#020612] py-5 md:py-5 rounded-2xl text-[10px] md:text-[10px] font-bold uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all">
                    <Zap size={16} /> {language === 'el' ? 'ΑΜΕΣΗ ΑΠΟΚΤΗΣΗ' : 'INSTANT ACQUISITION'}
                  </button>
                  <button onClick={() => initializeStripePayment('lock')} className="w-full border border-[#A6947D]/40 text-[#A6947D] py-5 md:py-5 rounded-2xl text-[10px] md:text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#A6947D]/5 transition-all">
                    <ShieldCheck size={16} /> {language === 'el' ? 'ΚΛΕΙΔΩΜΑ ΜΕΣΩ ESCROW' : 'LOCK VIA ESCROW'}
                  </button>
                  <button onClick={() => setIsOfferModalOpen(true)} className="w-full bg-[#A6947D]/5 text-[#A6947D] py-5 md:py-4 rounded-2xl text-[10px] md:text-[9px] font-bold uppercase tracking-widest border border-[#A6947D]/10 flex items-center justify-center gap-3 hover:bg-[#A6947D]/10 transition-colors">
                    <Gavel size={16} /> {language === 'el' ? 'ΔΙΑΠΡΑΓΜΑΤΕΥΣΗ OTC' : 'OTC NEGOTIATION'}
                  </button>
                </>
              )}
            </div>

            <div className="mt-8 md:mt-12 p-5 md:p-6 bg-[#01030A] border border-[#A6947D]/10 rounded-2xl w-full flex items-center gap-4 md:gap-5 shadow-inner">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#020612] border border-[#A6947D]/20 flex items-center justify-center flex-none">
                    <Building2 size={20} className="text-[#A6947D]" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-0.5 md:mb-1">Holding Entity</p>
                    <p className="text-xs font-serif uppercase tracking-widest text-[#F8F5EE] truncate">{vendor?.company_name || 'System Node'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                        <ShieldCheck size={10} className="text-emerald-500" />
                        <span className="text-[7px] md:text-[8px] font-mono text-emerald-500 uppercase tracking-widest">Verified Vendor</span>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </main>

      {/* MOBILE NAV (FIXED) - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-4 py-3 flex justify-between items-center z-50 pb-[calc(0.7rem+env(safe-area-inset-bottom))] shadow-2xl w-full">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 flex-1"><BarChart3 size={20} className="text-[#A6947D]/40" /><span className="text-[8px] uppercase font-bold text-[#A6947D]/40">Port</span></Link>
        <Link href="/trading" className="flex flex-col items-center gap-1 flex-1"><Globe size={20} className="text-[#A6947D]" /><span className="text-[8px] uppercase font-bold text-[#A6947D]">Floor</span></Link>
        <Link href="/inbox" className="flex flex-col items-center gap-1 flex-1"><MessageSquare size={20} className="text-[#A6947D]/40" /><span className="text-[8px] uppercase font-bold text-[#A6947D]/40">Comms</span></Link>
      </nav>
    </div>
  );
}