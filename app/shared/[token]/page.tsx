'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ShieldCheck, Activity, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SharedVaultItem({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [slab, setSlab] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedSlab = async () => {
      const { data, error } = await supabase
        .from('slabs')
        .select(`
          *,
          profiles:user_id (company_name)
        `)
        .eq('share_token', params.token)
        .single();

      if (data) setSlab(data);
      setLoading(false);
    };

    fetchSharedSlab();
  }, [params.token]);

  const handleSecureAcquisition = () => {
    // Στέλνουμε τον VIP πελάτη να κάνει εγγραφή/είσοδο για να κλειδώσει τη συναλλαγή
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#020813] flex items-center justify-center">
        <Activity className="animate-spin text-[#D1C7B3]" />
      </div>
    );
  }

  if (!slab) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#020813] flex flex-col items-center justify-center text-[#D1C7B3] p-6 text-center">
        <Lock size={48} className="mb-4 opacity-50" />
        <h1 className="text-xl font-black uppercase tracking-widest mb-2">Access Denied</h1>
        <p className="text-[10px] uppercase tracking-widest opacity-50">This secure link is invalid or has expired.</p>
      </div>
    );
  }

  return (
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ: w-full και overflow-x-hidden για να μην κουνιέται η οθόνη */
    <div className="min-h-[100dvh] w-full bg-[#020813] text-[#F8F5EE] font-sans flex flex-col md:flex-row selection:bg-[#D1C7B3]/20 overflow-x-hidden">
      
      {/* Αριστερό Πάνελ: Η Εικόνα του Υλικού - STABILIZED */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-screen relative bg-[#050C16] flex-none">
        {slab.image_url ? (
          <img src={slab.image_url} alt="Secure Asset" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Lock size={64} className="text-[#D1C7B3]/20" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent"></div>
        
        {/* VIP BADGE */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase mb-1">AXON<span className="text-[#D1C7B3]">.</span></h1>
          <div className="flex items-center gap-2 text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-yellow-500 bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-yellow-500/20">
            <ShieldCheck size={12} /> Secure VIP Gateway
          </div>
        </div>
      </div>

      {/* Δεξί Πάνελ: Τα Στοιχεία & Το Κλείδωμα - LOCKED */}
      <div className="w-full md:w-1/2 min-h-[55vh] md:h-screen flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-[#020813] relative overflow-hidden">
        {/* GLOW EFFECT - CONTAINED */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#D1C7B3] rounded-full blur-[160px] opacity-[0.03] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg mx-auto md:mx-0">
          <p className="text-[9px] md:text-[10px] text-[#D1C7B3]/50 uppercase tracking-[0.3em] font-black mb-4">Classified Asset Protocol</p>
          <h2 className="text-3xl md:text-5xl font-serif mb-8 text-[#F8F5EE] leading-tight uppercase tracking-tight">{slab.material}</h2>
          
          <div className="space-y-6 mb-12 border-t border-b border-[#D1C7B3]/10 py-8 w-full">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#D1C7B3]/50 font-black">Provided By</span>
              <span className="text-xs md:text-sm font-black uppercase tracking-widest text-[#D1C7B3] truncate">{slab.profiles?.company_name || 'Verified Partner'}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#D1C7B3]/50 font-black">Valuation</span>
              <span className="text-xl md:text-2xl font-mono text-[#F8F5EE]">€{parseInt(slab.price).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleSecureAcquisition}
              className="w-full py-5 bg-gradient-to-r from-[#D1C7B3] to-[#A39985] text-[#020813] rounded-xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(209,199,179,0.3)] transition-all shadow-xl"
            >
              Authenticate to Acquire <ArrowRight size={16} />
            </button>
            <p className="text-[7px] md:text-[8px] text-[#D1C7B3]/40 uppercase tracking-[0.3em] text-center leading-relaxed">
              Institutional encryption active. Funds held in AXON Escrow Ledger until cryptographic delivery confirmation.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}