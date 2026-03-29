'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  ArrowLeft, Handshake, Building2, Calendar, Package, AlertTriangle, 
  CheckCircle2, X, ShieldCheck, Zap, Loader2, Fingerprint, ChevronLeft, ChevronRight,
  MapPin, Factory, Anchor, Layers, Users, LogOut, Maximize2
} from 'lucide-react';
import Link from 'next/link';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51TBwXT1RTGOC3MKLvHSA6uyyLoE1PaPGVb46ogLGueeTPnGEq5F0wZfFLE0c9FqHQRwB5aP8FsRbluepidkYreT700CBUJiDPV');

function StripeCheckoutForm({ amount, onSuccess, onCancel, themeColorBg, themeColorText }: any) {
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
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 bg-[#01040E]">
      <div className="min-h-[200px]">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {errorMessage && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-[9px] text-red-400 uppercase tracking-widest">
          <AlertTriangle size={14} className="flex-none"/> <span>{errorMessage}</span>
        </div>
      )}
      <div className="pt-4 flex gap-3 md:gap-4">
        <button type="button" onClick={onCancel} disabled={isProcessing} className="px-4 md:px-6 py-4 rounded-xl border border-[#A6947D]/30 text-[#A6947D] hover:bg-[#A6947D]/10 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={!stripe || isProcessing} className={`flex-1 ${themeColorBg} hover:opacity-90 text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 shadow-[0_4px_15px_rgba(0,0,0,0.5)]`}>
          {isProcessing ? <><Loader2 size={16} className="animate-spin"/> Processing...</> : <><Lock size={16}/> Authorize</>}
        </button>
      </div>
    </form>
  );
}

export default function PublicAssetDossier() {
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [slab, setSlab] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerText, setOfferText] = useState('I am interested in acquiring this asset. Please review my proposal.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealSent, setDealSent] = useState(false);
  
  const [isInquiring, setIsInquiring] = useState(false);
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
              } else if (typeof rawData === 'string') {
                let cleanString = rawData.replace(/^\{|\}$/g, '');
                try {
                  const parsedJSON = JSON.parse(rawData);
                  if (Array.isArray(parsedJSON)) {
                    parsedImages = parsedJSON.map((item: any) => typeof item === 'string' ? item : (item.url || item.publicUrl || '')).filter(Boolean);
                  } else {
                    parsedImages = [parsedJSON.url || parsedJSON.publicUrl || rawData];
                  }
                } catch (e) {
                  parsedImages = cleanString.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
                }
              }
            } catch (err) {
              console.error("Image parsing failed:", err);
            }
          }

          parsedImages = parsedImages.filter(img => typeof img === 'string' && img.length > 5);
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

  const nextImage = () => setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const prevImage = () => setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const parsePrice = (price: string | number) => {
    if (!price) return 0;
    if (typeof price === 'number') return price;
    const cleanPrice = price.toString().replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleanPrice) || 0;
  };

  const formatCurrency = (amount: string | number) => {
    const val = parsePrice(amount);
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  };

  const getDepositAmount = () => {
    if (!slab || !slab.price) return 0;
    return parsePrice(slab.price) * 0.20; 
  };

  const handleOpenModal = () => {
    if (!currentUser) { alert("ΑΡΝΗΣΗ ΠΡΟΣΒΑΣΗΣ: Πρέπει να συνδεθείτε στο δίκτυο."); router.push('/auth'); return; }
    setIsOfferModalOpen(true);
  };

  const handleDirectInquiry = () => {
    if (!currentUser) { router.push('/auth'); return; }
    if (!slab) return;
    
    setIsInquiring(true);
    const targetVendorId = vendor?.id || slab.user_id || slab.vendor_id;
    router.push(`/inbox?chat=${targetVendorId}&asset=${slab.id}`);
  };

  const initializeStripePayment = async (mode: 'instant' | 'lock') => {
    if (!currentUser) { alert("ΑΡΝΗΣΗ ΠΡΟΣΒΑΣΗΣ: Πρέπει να συνδεθείτε στο δίκτυο."); router.push('/auth'); return; }
    const amount = mode === 'instant' ? parsePrice(slab.price) : getDepositAmount();
    setCheckoutMode(mode);
    setClientSecret('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        alert("Σφάλμα σύνδεσης με AXON Escrow (Stripe).");
        setCheckoutMode(null);
      }
    } catch (err) {
      console.error(err);
      setCheckoutMode(null);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    
    if (slab) {
      const targetVendorId = vendor?.id || slab.user_id || slab.vendor_id;
      
      if (targetVendorId) {
        await supabase.from('notifications').insert([{
          user_id: targetVendorId,
          title: 'Payment Authorized',
          content: `Funds have been secured in AXON Escrow for asset AX-${slab.id.substring(0,6).toUpperCase()}.`,
          type: 'offer',
          link: '/dashboard'
        }]);
      }

      try {
        const { error: updateError } = await supabase
          .from('slabs')
          .update({ is_available: false })
          .eq('id', slab.id);
          
        if (updateError) console.error("Error hiding slab after purchase:", updateError);
      } catch (err) {
        console.error("Failed to update slab availability:", err);
      }
    }
    
    setTimeout(() => { setCheckoutMode(null); setPaymentSuccess(false); router.push('/dashboard'); }, 3000);
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !slab) return;
    
    setIsSubmitting(true);
    
    const targetVendorId = vendor?.id || slab.user_id || slab.vendor_id;
    
    if (!targetVendorId) {
      alert("Error: Vendor ID missing from asset.");
      setIsSubmitting(false);
      return;
    }

    const newMsgObj = {
      sender_id: currentUser.id,
      receiver_id: targetVendorId,
      text: offerText,
      is_offer: true,
      offer_details: { 
        asset_id: slab.id, 
        price: offerPrice || 'Requesting Quote',
        incoterm: slab.incoterm || 'EXW',
        material: slab.material
      }
    };

    const { error: insertError } = await supabase.from('messages').insert([newMsgObj]);
    
    if (!insertError) {
      await supabase.from('notifications').insert([{
        user_id: targetVendorId,
        title: 'New OTC Proposal',
        content: `A verified entity has initiated negotiation for your asset ${slab.material}.`,
        type: 'offer',
        link: '/dashboard/bids' // ΔΙΟΡΘΩΘΗΚΕ ΤΟ LINK ΕΔΩ
      }]);
      setDealSent(true);
      // ΔΙΟΡΘΩΘΗΚΕ ΤΟ REDIRECT ΕΔΩ:
      setTimeout(() => { setIsOfferModalOpen(false); router.push('/dashboard/bids'); }, 2000);
    } else {
      alert(`ΣΦΑΛΜΑ ΑΠΟΣΤΟΛΗΣ: ${insertError.message}`);
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="h-screen bg-[#020612] flex items-center justify-center text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]">Accessing secure asset data...</div>;
  if (!slab) return (
    <div className="h-screen bg-[#020612] flex flex-col items-center justify-center text-center p-6"><AlertTriangle size={48} className="text-red-500 mb-6" /><h1 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.2em] mb-4">Asset Not Found</h1><Link href="/trading" className="bg-transparent border border-[#A6947D]/50 text-[#A6947D] hover:border-[#A6947D] hover:text-[#F8F5EE] px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all mt-4">Return to Floor</Link></div>
  );

  const isOwner = currentUser?.id === (slab.user_id || slab.vendor_id);
  const isROQ = slab.pricing_model === 'ROQ'; 
  
  const checkoutAmount = checkoutMode === 'instant' ? parsePrice(slab.price) : getDepositAmount();
  const themeColorText = checkoutMode === 'instant' ? 'text-emerald-500' : 'text-amber-500';
  const themeColorBg = checkoutMode === 'instant' ? 'bg-emerald-500' : 'bg-amber-500';
  const themeColorBorder = checkoutMode === 'instant' ? 'border-emerald-500/30' : 'border-amber-500/30';
  const themeColorShadow = checkoutMode === 'instant' ? 'shadow-[0_0_50px_rgba(16,185,129,0.1)]' : 'shadow-[0_0_50px_rgba(245,158,11,0.1)]';

  const stripeAppearance = {
    theme: 'night' as const,
    variables: { colorPrimary: '#A6947D', colorBackground: '#01040E', colorText: '#F8F5EE', colorDanger: '#ef4444', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', spacingUnit: '4px', borderRadius: '12px' },
    rules: { '.Input': { border: '1px solid rgba(166, 148, 125, 0.3)', boxShadow: 'none' }, '.Input:focus': { border: '1px solid #A6947D' }, '.Label': { textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '9px', fontWeight: 'bold', color: '#A6947D' } }
  };

  return (
    <div className="min-h-screen bg-[#020612] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 pb-24 md:pb-0 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 fixed"><Shield size={800} className="text-[#A6947D]" /></div>

      {checkoutMode && !isROQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/95 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className={`bg-[#01040E] border ${themeColorBorder} rounded-2xl w-full max-w-lg relative ${themeColorShadow} overflow-hidden my-auto`}>
            {paymentSuccess ? (
              <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 bg-emerald-500/10 relative"><div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping"></div><CheckCircle2 size={32} className="text-emerald-500" /></div>
                <h2 className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE] mb-3">Funds Secured</h2>
                <p className="text-[#A6947D] text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em]">AXON Escrow Protocol Engaged.</p>
                <div className="mt-8 flex items-center gap-2 text-[#A6947D]/40 text-[9px] uppercase tracking-widest"><Loader2 size={12} className="animate-spin" /> Redirecting to Command Center...</div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-5 md:p-6 border-b border-[#A6947D]/20 bg-[#01030A] shadow-md">
                  <div className={`flex items-center gap-2 md:gap-3 ${themeColorText}`}><Lock size={18} /><h2 className="text-base md:text-lg font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">Secure Checkout</h2></div>
                  <button onClick={() => setCheckoutMode(null)} className="text-[#F8F5EE]/40 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"><X size={18} /></button>
                </div>
                <div className="p-6 md:p-8 bg-[#020612] border-b border-[#A6947D]/10 text-center relative overflow-hidden">
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 ${themeColorBg} rounded-full blur-[60px] opacity-[0.1] pointer-events-none`}></div>
                  <p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.3em] mb-2 md:mb-3 relative z-10">{checkoutMode === 'instant' ? 'Total Asset Value' : 'Required Escrow Deposit (20%)'}</p>
                  <p className={`text-4xl md:text-5xl font-mono font-light tracking-tighter ${themeColorText} relative z-10`}>{formatCurrency(checkoutAmount)}</p>
                  <div className="mt-4 md:mt-6 flex items-center justify-center gap-2 bg-[#01030A] border border-[#A6947D]/20 py-1.5 md:py-2 px-3 md:px-4 rounded-full max-w-fit mx-auto relative z-10 shadow-inner">
                    <ShieldCheck size={10} className={themeColorText}/><span className="text-[7px] md:text-[9px] text-[#A6947D]/80 uppercase tracking-widest font-mono">AXON Smart Contract • Stripe Connect</span>
                  </div>
                </div>
                {!clientSecret ? (
                  <div className="p-10 md:p-12 flex flex-col items-center justify-center"><Loader2 size={24} className="text-[#A6947D] animate-spin mb-4 md:w-8 md:h-8" /><p className="text-[9px] md:text-[10px] text-[#A6947D] font-mono uppercase tracking-widest">Establishing Secure Connection...</p></div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                    <StripeCheckoutForm amount={checkoutAmount} onSuccess={handlePaymentSuccess} onCancel={() => setCheckoutMode(null)} themeColorBg={themeColorBg} themeColorText={themeColorText} />
                  </Elements>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isOfferModalOpen && !isOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020612]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#01040E] border border-[#A6947D]/30 rounded-2xl w-full max-w-md relative shadow-[0_0_50px_rgba(197,160,112,0.1)] overflow-hidden">
            {dealSent ? (
              <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-[#A6947D]/30 flex items-center justify-center mb-6 bg-[#A6947D]/10 relative"><div className="absolute inset-0 border border-[#A6947D]/20 rounded-full animate-ping"></div><CheckCircle2 size={32} className="text-[#A6947D] md:w-10 md:h-10" /></div>
                <h2 className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE] mb-3">Message Transmitted</h2>
                <p className="text-[#A6947D] text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em]">The vendor has been notified.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-5 md:p-6 border-b border-[#A6947D]/20 bg-[#01030A] shadow-md">
                  <div className="flex items-center gap-2 md:gap-3 text-[#A6947D]"><MessageSquare size={18} /><h2 className="text-base md:text-lg font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">{isROQ ? 'Request Quote' : 'Initiate Deal'}</h2></div>
                  <button onClick={() => setIsOfferModalOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-500/10"><X size={18} /></button>
                </div>
                <form onSubmit={handleSendOffer} className="p-6 md:p-8 space-y-5 md:space-y-6 bg-[#01040E]">
                  <div className="bg-[#020612] p-4 md:p-5 rounded-xl border border-[#A6947D]/15 mb-2 shadow-inner">
                    <p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] mb-1 md:mb-2">Target Asset</p>
                    <p className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-wider">{slab.material}</p>
                    {isROQ ? (
                      <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[#A6947D]/10">
                        <span className="text-[8px] md:text-[9px] font-mono text-amber-500/60 tracking-widest uppercase flex items-center gap-1"><Lock size={10}/> Pricing</span>
                        <span className="text-[10px] md:text-[11px] font-mono text-amber-500">Upon Request</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[#A6947D]/10">
                        <span className="text-[8px] md:text-[9px] font-mono text-[#A6947D]/60 tracking-widest uppercase">Listed Value</span>
                        <span className="text-[10px] md:text-[11px] font-mono text-[#A6947D]">{formatCurrency(slab.price)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] flex items-center gap-2">{isROQ ? 'Target Budget (€) - Optional' : 'Proposed Value (€)'}</label>
                    <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder={isROQ ? "Leave blank to just request price" : "e.g. 12500"} className="w-full bg-[#020612] border border-[#A6947D]/30 rounded-xl px-4 md:px-5 py-3 md:py-4 text-lg md:text-xl font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" required={!isROQ} />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] flex items-center gap-2">Secure Message</label>
                    <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} rows={3} className="w-full bg-[#020612] border border-[#A6947D]/30 rounded-xl px-4 md:px-5 py-3 md:py-4 text-xs md:text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] resize-none shadow-inner custom-scrollbar" required />
                  </div>
                  <div className="pt-4 md:pt-6">
                    <button type="submit" disabled={isSubmitting || (!isROQ && !String(offerPrice).trim())} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 md:py-5 rounded-xl transition-all text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50 shadow-[0_4px_15px_rgba(166,148,125,0.2)]">
                      {isSubmitting ? <><Loader2 size={14} className="animate-spin md:w-4 md:h-4"/> Transmitting...</> : <><MessageSquare size={14} className="md:w-4 md:h-4"/> {isROQ ? 'Send Request' : 'Lock Proposal'}</>}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="px-4 md:px-12 py-4 md:py-6 border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-xl flex justify-between items-center sticky top-0 z-40 shadow-md">
        <Link href="/trading" className="flex items-center gap-2 md:gap-3 text-[#A6947D]/60 hover:text-[#A6947D] uppercase text-[9px] md:text-[10px] font-bold tracking-[0.2em] transition-colors group">
          <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-1 md:w-4 md:h-4" /> Back
        </Link>
        <div className="flex items-center gap-2 md:gap-3 text-[#A6947D]">
          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] hidden md:block mr-2">Institutional Node</span>
          <div className="w-6 h-6 md:w-8 md:h-8 border border-[#A6947D]/30 rounded-full flex items-center justify-center bg-[#01030A]"><Shield size={12} className="md:w-4 md:h-4"/></div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-12 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-16">
          <div className="lg:col-span-7 space-y-4 md:space-y-6">
            <div className="relative aspect-[4/3] bg-[#01030A] rounded-2xl overflow-hidden border border-[#A6947D]/20 shadow-[0_0_50px_rgba(166,148,125,0.05)] group">
              <img src={images[activeImageIndex]} alt="Asset Visual" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020612]/80 via-transparent to-transparent opacity-60 pointer-events-none"></div>
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.preventDefault(); prevImage(); }} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/30 rounded-full flex items-center justify-center text-[#F8F5EE] hover:bg-[#A6947D] hover:text-[#020509] transition-all z-10"><ChevronLeft size={20} /></button>
                  <button onClick={(e) => { e.preventDefault(); nextImage(); }} className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/30 rounded-full flex items-center justify-center text-[#F8F5EE] hover:bg-[#A6947D] hover:text-[#020509] transition-all z-10"><ChevronRight size={20} /></button>
                </>
              )}
              <div className="absolute top-3 right-3 md:top-5 md:right-5 bg-[#020612]/90 backdrop-blur-md border border-[#A6947D]/30 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-bold text-[#A6947D] uppercase tracking-[0.2em] font-mono shadow-lg z-10 flex items-center gap-2"><Maximize2 size={10} className="md:w-3 md:h-3"/> ID: AX-{slab.id.substring(0,8).toUpperCase()}</div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative w-16 h-12 md:w-24 md:h-16 rounded-lg md:rounded-xl overflow-hidden border-2 transition-all flex-none ${activeImageIndex === idx ? 'border-[#A6947D] scale-100 opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}>
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2">
              <div className="bg-[#01040E] border border-[#A6947D]/15 rounded-xl p-3 md:p-5 text-center shadow-inner group transition-colors hover:border-[#A6947D]/40">
                <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase tracking-[0.2em] mb-1.5 md:mb-2 font-bold">Terms</p>
                <div className="flex items-center justify-center gap-1.5 md:gap-2 text-[#F8F5EE]">
                   {slab.incoterm === 'EXW' ? <Factory size={14} className="text-[#A6947D] md:w-4 md:h-4"/> : <Anchor size={14} className="text-[#A6947D] md:w-4 md:h-4"/>}
                   <p className="text-base md:text-xl font-serif">{slab.incoterm || 'EXW'}</p>
                </div>
              </div>
              <div className="bg-[#01040E] border border-[#A6947D]/15 rounded-xl p-3 md:p-5 text-center shadow-inner">
                <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase tracking-[0.2em] mb-1.5 md:mb-2 font-bold">Thickness</p>
                <div className="flex items-center justify-center gap-1.5 md:gap-2 text-[#F8F5EE]">
                   <Layers size={14} className="text-[#A6947D] md:w-4 md:h-4"/>
                   <p className="text-base md:text-xl font-mono">{slab.thickness || '20'}mm</p>
                </div>
              </div>
              <div className="bg-[#01040E] border border-[#A6947D]/15 rounded-xl p-3 md:p-5 text-center shadow-inner">
                <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase tracking-[0.2em] mb-1.5 md:mb-2 font-bold">Quantity</p>
                <p className="text-base md:text-xl font-mono text-emerald-400">{slab.quantity || '0'} M²</p>
              </div>
            </div>

            <div className="bg-[#01040E] border border-[#A6947D]/10 p-4 md:p-6 rounded-xl md:rounded-2xl flex items-center justify-between shadow-inner">
               <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#020612] border border-[#A6947D]/30 flex items-center justify-center text-[#A6947D]"><MapPin size={14} className="md:w-[18px] md:h-[18px]"/></div>
                  <div><p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-0.5">Asset Location</p><p className="text-xs md:text-sm font-serif uppercase tracking-wider text-[#F8F5EE]">{slab.location || 'Thessaloniki Hub'}</p></div>
               </div>
               <span className="text-[7px] md:text-[9px] font-mono text-[#A6947D]/40 uppercase tracking-widest hidden sm:block">GPS Verified Node</span>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center mt-6 lg:mt-0">
            <div className="mb-8 md:mb-10">
              <p className="text-[9px] md:text-[10px] text-[#A6947D] uppercase font-bold tracking-[0.3em] mb-2 md:mb-3 flex items-center gap-2"><Fingerprint size={10} className="md:w-3 md:h-3" /> Asset Dossier</p>
              <h1 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] mb-6 md:mb-8 leading-tight font-light">{slab.material || 'Unknown Material'}</h1>
              {isROQ ? (
                <div className="bg-[#01040E] border border-amber-500/20 p-5 md:p-6 rounded-2xl shadow-xl">
                  <p className="text-[8px] md:text-[9px] text-amber-500 uppercase font-bold tracking-[0.2em] mb-1.5 md:mb-2 flex items-center gap-2"><Lock size={12}/> Premium Asset ({slab.incoterm || 'EXW'})</p>
                  <p className="text-2xl md:text-3xl font-serif text-[#F8F5EE] font-light tracking-widest uppercase">Request Quote</p>
                </div>
              ) : (
                <div className="bg-[#01040E] border border-emerald-500/20 p-5 md:p-6 rounded-2xl shadow-xl">
                  <p className="text-[8px] md:text-[9px] text-emerald-500 uppercase font-bold tracking-[0.2em] mb-1.5 md:mb-2">Public Valuation ({slab.incoterm || 'EXW'})</p>
                  <p className="text-3xl md:text-4xl font-mono text-[#F8F5EE] font-light tracking-tighter">{formatCurrency(slab.price)}</p>
                </div>
              )}
            </div>

            <div className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-5 md:p-6 mb-8 md:mb-10 shadow-lg">
              <h3 className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] mb-4 md:mb-5 border-b border-[#A6947D]/10 pb-2 md:pb-3">Holding Entity</h3>
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-[#020612] border border-[#A6947D]/30 flex items-center justify-center shadow-inner"><Building2 size={20} className="text-[#A6947D] md:w-6 md:h-6" /></div>
                <div><p className="text-xs md:text-sm font-serif text-[#F8F5EE] uppercase tracking-widest mb-1 truncate max-w-[200px]">{vendor?.company_name || vendor?.email || 'System Vendor'}</p>
                  <div className="flex items-center gap-1.5">{vendor?.status === 'verified' ? <><ShieldCheck size={10} className="text-[#A6947D] md:w-3 md:h-3"/><span className="text-[9px] md:text-[10px] font-mono text-[#A6947D] uppercase tracking-widest">Verified Node</span></> : <span className="text-[9px] md:text-[10px] font-mono text-[#A6947D]/40 uppercase tracking-widest">Pending Verification</span>}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {isOwner ? (
                <div className="bg-[#01040E] border border-[#A6947D]/30 text-[#A6947D] p-5 md:p-6 rounded-2xl text-center text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] shadow-inner"><Shield size={20} className="mx-auto mb-2 md:mb-3 opacity-50 md:w-6 md:h-6" />You are the controlling entity of this asset.</div>
              ) : isROQ ? (
                <>
                  <button onClick={handleOpenModal} className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 font-bold uppercase tracking-[0.2em] py-4 md:py-5 rounded-xl transition-all text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 shadow-lg group">
                    <Lock size={16} className="group-hover:scale-110 transition-transform"/> REQUEST SECURE QUOTE
                  </button>
                  <button onClick={handleDirectInquiry} disabled={isInquiring} className="w-full mt-3 bg-transparent border border-[#A6947D]/20 hover:border-[#A6947D]/60 hover:bg-[#A6947D]/5 text-[#A6947D] font-bold uppercase tracking-[0.1em] py-3 md:py-4 rounded-xl transition-all text-[8px] md:text-[9px] flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50">
                    {isInquiring ? <Loader2 size={12} className="md:w-3.5 md:h-3.5 animate-spin"/> : <MessageSquare size={12} className="md:w-3.5 md:h-3.5"/>} 
                    Direct Inbox (1-Click)
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => initializeStripePayment('instant')} className="w-full bg-[#F8F5EE] hover:bg-white text-[#020612] font-bold uppercase tracking-[0.2em] py-4 md:py-5 rounded-xl transition-all text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 shadow-xl group"><Zap size={14} className="text-[#A6947D] group-hover:scale-110 transition-transform md:w-4 md:h-4"/> Instant Acquisition</button>
                  <button onClick={() => initializeStripePayment('lock')} className="w-full bg-[#01040E] border border-[#A6947D]/40 hover:border-[#A6947D] text-[#A6947D] hover:text-[#F8F5EE] font-bold uppercase tracking-[0.2em] py-4 md:py-5 rounded-xl transition-all text-[9px] md:text-[10px] flex items-center justify-center gap-2 md:gap-3 shadow-lg group"><Lock size={14} className="group-hover:scale-110 transition-transform md:w-4 md:h-4"/> Lock via Escrow</button>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 pt-1 md:pt-2">
                    <button onClick={handleOpenModal} className="w-full bg-transparent border border-[#A6947D]/20 hover:border-[#A6947D]/60 hover:bg-[#A6947D]/5 text-[#A6947D] font-bold uppercase tracking-[0.1em] py-3 md:py-4 rounded-xl transition-all text-[8px] md:text-[9px] flex items-center justify-center gap-1.5 md:gap-2"><Handshake size={12} className="md:w-3.5 md:h-3.5"/> OTC Deal</button>
                    <button onClick={handleDirectInquiry} disabled={isInquiring} className="w-full bg-transparent border border-[#A6947D]/20 hover:border-[#A6947D]/60 hover:bg-[#A6947D]/5 text-[#A6947D] font-bold uppercase tracking-[0.1em] py-3 md:py-4 rounded-xl transition-all text-[8px] md:text-[9px] flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50">
                      {isInquiring ? <Loader2 size={12} className="md:w-3.5 md:h-3.5 animate-spin"/> : <MessageSquare size={12} className="md:w-3.5 md:h-3.5"/>} 
                      Inquiry (1-Click)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/90 backdrop-blur-xl border-t border-[#A6947D]/20 px-4 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Portf</span></Link>
        <Link href="/network" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><Users size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Net</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/dashboard/bids" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Offers</span></Link>
      </nav>
    </div>
  );
}