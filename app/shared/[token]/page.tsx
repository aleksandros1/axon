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

  if (loading) return <div className="min-h-screen bg-[#020813] flex items-center justify-center"><Activity className="animate-spin text-[#D1C7B3]" /></div>;

  if (!slab) return (
    <div className="min-h-screen bg-[#020813] flex flex-col items-center justify-center text-[#D1C7B3]">
      <Lock size={48} className="mb-4 opacity-50" />
      <h1 className="text-xl font-black uppercase tracking-widest mb-2">Access Denied</h1>
      <p className="text-xs uppercase tracking-widest opacity-50">This secure link is invalid or has expired.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020813] text-[#F8F5EE] font-sans flex flex-col md:flex-row selection:bg-[#D1C7B3]/20">
      
      {/* Αριστερό Πάνελ: Η Εικόνα του Υλικού */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-screen relative bg-[#050C16]">
        {slab.image_url ? (
          <img src={slab.image_url} alt="Secure Asset" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Lock size={64} className="text-[#D1C7B3]/20" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="absolute top-8 left-8">
          <h1 className="text-2xl font-black tracking-tighter uppercase mb-1">AXON<span className="text-[#D1C7B3]">.</span></h1>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-yellow-500">
            <ShieldCheck size={12} /> Secure VIP Gateway
          </div>
        </div>
      </div>

      {/* Δεξί Πάνελ: Τα Στοιχεία & Το Κλείδωμα */}
      <div className="w-full md:w-1/2 h-screen flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-[#020813] relative">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#D1C7B3] rounded-full blur-[160px] opacity-[0.03] pointer-events-none"></div>

        <div className="relative z-10">
          <p className="text-[10px] text-[#D1C7B3]/50 uppercase tracking-[0.3em] font-black mb-4">Classified Asset</p>
          <h2 className="text-4xl md:text-5xl font-serif mb-8 text-[#F8F5EE] leading-tight">{slab.material}</h2>
          
          <div className="space-y-6 mb-12 border-t border-b border-[#D1C7B3]/10 py-8">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-[#D1C7B3]/50 font-black">Provided By</span>
              <span className="text-sm font-black uppercase tracking-widest text-[#D1C7B3]">{slab.profiles?.company_name || 'Verified Partner'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest text-[#D1C7B3]/50 font-black">Asset Value</span>
              <span className="text-2xl font-mono text-[#F8F5EE]">€{parseInt(slab.price).toLocaleString()}</span>
            </div>
          </div>

          <button 
            onClick={handleSecureAcquisition}
            className="w-full py-5 bg-gradient-to-r from-[#D1C7B3] to-[#A39985] text-[#020813] rounded-xl text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:shadow-[0_0_30px_rgba(209,199,179,0.3)] transition-all"
          >
            Authenticate to Acquire <ArrowRight size={16} />
          </button>
          <p className="text-[8px] text-[#D1C7B3]/40 uppercase tracking-widest text-center mt-4">
            End-to-end encryption. Funds held in AXON Escrow until delivery verification.
          </p>
        </div>
      </div>

    </div>
  );
}