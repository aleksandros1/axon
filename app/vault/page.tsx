'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { ShieldCheck, Activity, Lock, ArrowRight, Shield } from 'lucide-react';
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
      <div className="min-h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
        <p className="text-[#A6947D] font-mono text-[9px] uppercase tracking-[0.4em] animate-pulse">Decrypting Protocol</p>
      </div>
    );
  }

  if (!slab) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center p-6 text-center antialiased">
        <Lock size={40} className="mb-6 text-red-500 stroke-1" />
        <h1 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.3em] mb-3">Clearance Denied</h1>
        <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-[0.3em] max-w-sm leading-relaxed">
          This secure transmission link is invalid, expired, or the asset has been acquired by another entity.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] font-sans flex flex-col md:flex-row selection:bg-[#A6947D]/30 overflow-x-hidden antialiased">
      
      {/* Αριστερό Πάνελ: Η Εικόνα του Υλικού - DRAMATIC LIGHTING */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-screen relative bg-[#01030A] flex-none border-b md:border-b-0 md:border-r border-[#A6947D]/10 overflow-hidden">
        {slab.image_url ? (
          <img src={slab.image_url} alt="Secure Asset" className="w-full h-full object-cover grayscale-[10%]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Lock size={64} className="text-[#A6947D]/20 stroke-1" /></div>
        )}
        
        {/* Σκοτεινό Overlay για αντίθεση */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#020509] via-[#020509]/40 to-transparent opacity-90"></div>
        
        {/* VIP BADGE & BRANDING */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-[#A6947D]" />
            <h1 className="text-xl md:text-2xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">AXON</h1>
          </div>
          <div className="inline-flex items-center gap-2 text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 backdrop-blur-md px-3 py-2 rounded-lg border border-amber-500/30 shadow-lg">
            <ShieldCheck size={14} strokeWidth={2} /> Secure VIP Gateway
          </div>
        </div>
      </div>

      {/* Δεξί Πάνελ: Τα Στοιχεία & Το Κλείδωμα - VAULT AESTHETIC */}
      <div className="w-full md:w-1/2 min-h-[55vh] md:h-screen flex flex-col justify-center p-6 md:p-16 lg:p-24 bg-[#020509] relative overflow-hidden">
        
        {/* GLOW EFFECT */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#A6947D] rounded-full blur-[180px] opacity-[0.03] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg mx-auto md:mx-0">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-[#A6947D]/50"></span> Classified Asset
            </p>
            <h2 className="text-3xl md:text-5xl font-serif mb-10 text-[#F8F5EE] leading-tight uppercase tracking-wider">{slab.material}</h2>
          </div>
          
          <div className="space-y-6 mb-12 border-y border-[#A6947D]/10 py-8 w-full animate-in fade-in duration-700 delay-100">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#A6947D]/60">Origin Entity</span>
              <span className="text-xs md:text-sm font-serif uppercase tracking-widest text-[#F8F5EE] truncate text-right">
                {slab.profiles?.company_name || 'Verified Partner'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-[#A6947D]/60">Valuation</span>
              <span className="text-xl md:text-3xl font-mono text-[#F8F5EE] tracking-tighter">
                €{parseInt(slab.price?.toString().replace(/,/g, '') || '0').toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-6 animate-in fade-in duration-700 delay-200">
            <button 
              onClick={handleSecureAcquisition}
              className="w-full h-16 bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_4px_20px_rgba(166,148,125,0.2)] group"
            >
              Authenticate to Acquire <ArrowRight size={16} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[7px] md:text-[8px] text-[#A6947D]/40 font-bold uppercase tracking-widest text-center leading-relaxed">
              Institutional encryption active. Funds held securely in <span className="text-[#A6947D]/80">AXON Escrow Ledger</span> until cryptographic delivery confirmation.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}