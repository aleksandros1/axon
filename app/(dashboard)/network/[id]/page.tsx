'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 
import { 
  Shield, ArrowLeft, Building2, Package, MessageSquare, Globe, Mail, MapPin, ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

export default function PublicProfile() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [publicSlabs, setPublicSlabs] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      
      // Τραβάμε τα στοιχεία του χρήστη (Εταιρείας)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileData) setProfile(profileData);

      // Τραβάμε ΜΟΝΟ τα Public Slabs του
      const { data: slabsData } = await supabase
        .from('slabs')
        .select('*')
        .eq('user_id', id);

      if (slabsData) {
        const visibleSlabs = slabsData.filter(s => s.visibility !== 'private' && s.is_vault !== true);
        setPublicSlabs(visibleSlabs);
      }

      setLoading(false);
    };

    if (id) fetchProfileData();
  }, [id]);

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center text-[#A6947D] font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
        Accessing Institutional Records...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#020509] flex flex-col items-center justify-center text-[#A6947D]">
        <Shield size={48} className="mb-4 opacity-50" />
        <h1 className="text-xl font-serif text-[#F8F5EE] uppercase tracking-widest mb-2">Entity Not Found</h1>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-60 mb-6">The requested ledger does not exist or has been redacted.</p>
        <button onClick={() => router.back()} className="px-6 py-3 border border-[#A6947D]/30 hover:bg-[#A6947D]/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Return to Network
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020509] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30">
      {/* HEADER BAR */}
      <header className="p-6 border-b border-[#A6947D]/10 bg-[#01030A]/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-[#A6947D]/60 hover:text-[#A6947D] transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#A6947D]" />
          <span className="text-[10px] font-mono text-[#A6947D] uppercase tracking-widest">Verified AXON Node</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 md:p-12">
        {/* PROFILE HERO SECTION */}
        <div className="bg-[#01030A]/80 border border-[#A6947D]/20 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-2xl mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Building2 size={200} className="text-[#A6947D]" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-[#A6947D]/30 bg-[#020509] flex items-center justify-center shadow-[0_0_30px_rgba(166,148,125,0.1)]">
                <Building2 size={40} className="text-[#A6947D]" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-wide mb-2">{profile.company_name || 'Unnamed Entity'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#A6947D]/80 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-500" /> {profile.role || 'Partner'}</span>
                  <span className="flex items-center gap-1.5"><Mail size={12} /> {profile.email}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => router.push(`/inbox?chat=${id}`)}
              className="w-full md:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] flex items-center justify-center gap-3"
            >
              <MessageSquare size={16} /> Open Secure Channel
            </button>
          </div>
        </div>

        {/* PUBLIC ASSETS GRID */}
        <div className="mb-6 flex items-center justify-between border-b border-[#A6947D]/10 pb-4">
          <h2 className="text-xl font-serif uppercase tracking-[0.15em] text-[#F8F5EE] flex items-center gap-3">
            <Globe size={20} className="text-[#A6947D]" /> Public Ledger
          </h2>
          <span className="text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-widest">{publicSlabs.length} Assets Visible</span>
        </div>

        {publicSlabs.length === 0 ? (
          <div className="bg-[#01030A]/50 border border-[#A6947D]/10 rounded-2xl p-16 text-center flex flex-col items-center justify-center">
            <Package size={48} className="text-[#A6947D]/20 mb-4" />
            <p className="text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-widest">No public assets found for this entity.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicSlabs.map(slab => (
              <Link href={`/trading/${slab.id}`} key={slab.id}>
                <div className="bg-[#01030A]/80 border border-[#A6947D]/15 rounded-2xl overflow-hidden hover:border-[#A6947D]/50 hover:shadow-[0_0_30px_rgba(166,148,125,0.1)] transition-all duration-300 group cursor-pointer h-full flex flex-col">
                  <div className="h-48 relative bg-[#020509] overflow-hidden">
                    {slab.image_url ? (
                      <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={48} className="text-[#A6947D]" /></div>
                    )}
                    <div className="absolute top-3 right-3 bg-[#020509]/90 backdrop-blur-md border border-[#A6947D]/30 px-2 py-1 rounded text-[8px] font-bold text-[#A6947D] uppercase tracking-[0.2em]">
                      AX-{slab.id.substring(0,8)}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-serif text-[#F8F5EE] uppercase tracking-wider mb-2 truncate">{slab.material || 'Unknown Asset'}</h3>
                    <p className="text-2xl font-mono text-[#A6947D] mb-4">{formatCurrency(slab.price)}</p>
                    <div className="mt-auto pt-4 border-t border-[#A6947D]/10">
                      <span className="text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#A6947D] transition-colors">
                        View Asset Ledger <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}