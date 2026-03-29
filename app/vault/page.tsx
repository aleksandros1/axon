'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Shield, Lock, Globe, BarChart3, Gavel, MessageSquare, Activity, Crosshair } from 'lucide-react';
import Link from 'next/link';

export default function PrivateVault() {
  const router = useRouter();
  const [slabs, setSlabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVaultAssets();
  }, []);

  const fetchVaultAssets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/auth'); return; }

    const { data } = await supabase.from('slabs').select('*').eq('user_id', session.user.id).eq('is_vault', true);
    if (data) setSlabs(data);
    setLoading(false);
  };

  return (
    <div className="flex h-[100dvh] bg-[#020509] text-[#F8F5EE] overflow-hidden">
      <aside className="w-[280px] border-r border-[#A6947D]/10 p-8 hidden md:flex flex-col">
        <div className="flex items-center gap-3 text-[#A6947D] mb-12"><Shield size={24} /><h1 className="text-3xl font-serif">AXON</h1></div>
        <nav className="flex-1 space-y-4">
          <Link href="/dashboard" className="text-[#F8F5EE]/60 text-xs font-bold uppercase tracking-widest flex items-center gap-3"><BarChart3 size={16} /> Portfolio</Link>
          <Link href="/trading" className="text-[#F8F5EE]/60 text-xs font-bold uppercase tracking-widest flex items-center gap-3"><Globe size={16} /> Public Floor</Link>
          <Link href="/vault" className="text-[#A6947D] text-xs font-bold uppercase tracking-widest flex items-center gap-3"><Lock size={16} /> Private Vault</Link>
          <Link href="/dashboard/bids" className="text-[#F8F5EE]/60 text-xs font-bold uppercase tracking-widest flex items-center gap-3"><Gavel size={16} /> My Offers</Link>
          <Link href="/inbox" className="text-[#F8F5EE]/60 text-xs font-bold uppercase tracking-widest flex items-center gap-3"><MessageSquare size={16} /> Secure Comms</Link>
        </nav>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <Lock className="text-[#A6947D]" size={32} />
            <h2 className="text-5xl font-serif uppercase tracking-widest">Private <span className="text-[#A6947D]">Vault</span></h2>
          </div>
          
          {loading ? <Activity className="animate-spin text-[#A6947D]" /> : slabs.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#A6947D]/20 rounded-3xl">
              <p className="text-[#A6947D]/40 uppercase text-xs font-black tracking-widest">Vault Empty. Use Scanner to lock assets.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {slabs.map(slab => (
                <div key={slab.id} className="bg-[#0A1122] rounded-3xl overflow-hidden border border-[#A6947D]/20 group">
                  <div className="aspect-[4/3] relative"><img src={slab.image_url} className="w-full h-full object-cover" /></div>
                  <div className="p-6"><h3 className="text-xl font-serif uppercase mb-2">{slab.material}</h3><p className="text-xs text-[#A6947D] font-mono">STATUS: SECURED IN VAULT</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}