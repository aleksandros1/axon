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
      <div className="min-h-[100dvh] w-full bg-[#000000] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
        <p className="text-[#A6947D] font-mono text-[9px] uppercase tracking-[0.4em] animate-pulse">Decrypting Protocol</p>
      </div>
    );
  }

  if (!slab) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#000000] flex flex-col items-center justify-center p-6 text-center antialiased">
        <Lock size={40} className="mb-6 text-red-500 stroke-1" />
        <h1 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-3">Clearance Denied</h1>
        <p className="text-[9px] md:text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] max-w-sm leading-relaxed">
          This secure transmission link is invalid, expired, or the asset has been acquired by another entity.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#000000] text-gray-200 font-sans flex flex-col md:flex-row selection:bg-[#A6947D]/30 overflow-x-hidden antialiased">
      
      {/* Αριστερό Πάνελ: Η Εικόνα του Υλικού - DRAMATIC LIGHTING */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-screen relative bg-[#020202] flex-none border-b md:border-b-0 md:border-r border-gray-900 overflow-hidden">
        {slab.image_url ? (
          <img src={slab.image_url} alt="Secure Asset" className="w-full h-full object-cover grayscale-[20%]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Lock size={64} className="text-gray-800 stroke-1" /></div>
        )}
        
        {/* Σκοτεινό Overlay για αντίθεση */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#000000] via-black/40 to-transparent opacity-90"></div>
        
        {/* VIP BADGE & BRANDING */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 z-20">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-[#A6947D]" />
            <h1 className="text-xl md:text-2xl font-serif uppercase tracking-[0.3em] text-white">AXON</h1>
          </div>
          <div className="inline-flex items-center gap-2 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.3em] text-amber-500 bg-amber-950/40 backdrop-blur-md px-3 py-1.5 rounded-sm border border-amber-900/50 shadow-lg">
            <ShieldCheck size={12} strokeWidth={2} /> Secure VIP Gateway
          </div>
        </div>
      </div>

      {/* Δεξί Πάνελ: Τα Στοιχεία & Το Κλείδωμα - VAULT AESTHETIC */}
      <div className="w-full md:w-1/2 min-h-[55vh] md:h-screen flex flex-col justify-center p-6 md:p-16 lg:p-24 bg-[#000000] relative overflow-hidden">
        
        {/* BACKGROUND SUBTLE GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>

        {/* GLOW EFFECT */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-[#A6947D] rounded-full blur-[180px] opacity-5 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg mx-auto md:mx-0">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-mono tracking-[0.4em] mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-[#A6947D]/50"></span> Classified Asset
            </p>
            <h2 className="text-3xl md:text-5xl font-serif mb-10 text-white leading-tight uppercase tracking-widest">{slab.material}</h2>
          </div>
          
          <div className="space-y-6 mb-12 border-y border-gray-900 py-8 w-full animate-in fade-in duration-700 delay-100">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Origin Entity</span>
              <span className="text-xs md:text-sm font-serif uppercase tracking-widest text-white truncate text-right">
                {slab.profiles?.company_name || 'Verified Partner'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Valuation</span>
              <span className="text-xl md:text-3xl font-mono text-white tracking-wider">
                €{parseInt(slab.price?.toString().replace(/,/g, '') || '0').toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-6 animate-in fade-in duration-700 delay-200">
            <button 
              onClick={handleSecureAcquisition}
              className="w-full h-16 bg-white text-black rounded-sm text-[10px] md:text-xs font-extrabold font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)] group"
            >
              Authenticate to Acquire <ArrowRight size={16} strokeWidth={2} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[7px] md:text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em] text-center leading-relaxed">
              Institutional encryption active. Funds held securely in <span className="text-gray-400">AXON Escrow Ledger</span> until cryptographic delivery confirmation.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}