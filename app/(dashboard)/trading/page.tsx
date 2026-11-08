'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Shield, Globe, Loader2, X, Package, Layers3
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/i18n/LanguageContext';

export default function TradingFloor() {
  const router = useRouter();
  const { t } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'SLAB' | 'BLOCK' | 'GRANITE'>('SLAB');

  useEffect(() => {
    const fetchSlabs = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data, error } = await supabase
        .from('slabs')
        .select('*, profiles(company_name, status, country)')
        .eq('is_available', true)
        .neq('visibility', 'private')
        .order('created_at', { ascending: false });

      if (!error && data) setSlabs(data);
      setLoading(false);
    };
    fetchSlabs();
  }, [router]);

  const formatCurrency = (val: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

  const filteredSlabs = slabs.filter(slab => {
    const type = slab.asset_type || 'SLAB'; 
    const matchesTab = type === activeTab;
    const matchesSearch = (slab.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                          (slab.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch && matchesTab;
  });

  const groupedSlabs = useMemo(() => {
    return filteredSlabs.reduce((acc: any, slab) => {
      const groupName = slab.material ? slab.material.toUpperCase() : 'UNCLASSIFIED ASSETS';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(slab);
      return acc;
    }, {});
  }, [filteredSlabs]);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans relative antialiased">
      
      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">COMMAND</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-sm flex flex-col items-center justify-center gap-3"><Layers3 size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">PORTFOLIO</span></Link>
              <Link href="/trading" className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-sm flex flex-col items-center justify-center gap-3"><Globe size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase text-[#F8F5EE] text-center">FLOOR</span></Link>
            </div>
          </div>
        </div>
      )}

      {/* MAIN GALLERY */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 custom-scrollbar w-full">
        <div className="p-4 md:p-12 max-w-[1600px] mx-auto relative z-10 w-full">
          
          {/* HEADER MINIMAL */}
          <header className="mb-24 mt-12 text-center">
            <h2 className="text-4xl md:text-6xl font-serif text-[#F8F5EE] uppercase tracking-[0.05em] mb-12 font-light">
              {activeTab === 'SLAB' ? 'Premium Slabs' : activeTab === 'BLOCK' ? 'Raw Blocks' : 'Granite'}
            </h2>
            
            <div className="flex items-center justify-center gap-8 md:gap-16 border-b border-[#A6947D]/10 pb-6 overflow-x-auto">
              {(['SLAB', 'BLOCK', 'GRANITE'] as const).map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)} 
                  className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-300 ${activeTab === tab ? 'text-[#A6947D]' : 'text-[#F8F5EE]/30 hover:text-[#F8F5EE]/60'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </header>

          {loading ? (
             <div className="flex justify-center py-32 text-[#A6947D]"><Loader2 size={32} className="animate-spin" /></div>
          ) : (
            <div className="space-y-32">
              {Object.entries(groupedSlabs).map(([groupName, items]: [string, any]) => (
                <section key={groupName}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-24">
                    {items.map((slab: any) => (
                      <div 
                        key={slab.id} 
                        className="group flex flex-col relative cursor-pointer h-full"
                        onClick={() => router.push(`/trading/${slab.id}`)}
                      >
                        
                        {/* Premium Portrait Image (Strict Aspect Ratio) */}
                        <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#01030A] rounded-sm mb-6 border border-[#A6947D]/10 group-hover:border-[#A6947D]/40 transition-colors duration-500">
                          
                          {/* Top Tags - Show on hover */}
                          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                             <span className="bg-[#01030A]/80 backdrop-blur-md px-2.5 py-1 rounded-sm text-[8px] font-mono text-[#A6947D] uppercase tracking-widest border border-[#A6947D]/20">AX-{slab.id.substring(0,8)}</span>
                             <div className="flex items-center gap-1.5 bg-[#01030A]/80 backdrop-blur-md px-2.5 py-1 rounded-sm border border-emerald-500/20">
                               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                               <span className="text-[7px] font-bold text-emerald-500 uppercase tracking-widest">LIVE</span>
                             </div>
                          </div>

                          {slab.image_url ? (
                            <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105 grayscale-[10%] group-hover:grayscale-0" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} /></div>
                          )}
                        </div>

                        {/* Strict Institutional Data Container (Left-Aligned) */}
                        <div className="flex flex-col flex-1 px-1 w-full text-left">
                          
                          {/* Title */}
                          <h4 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] mb-5 group-hover:text-[#A6947D] transition-colors truncate">
                            {slab.material}
                          </h4>

                          {/* Data Grid 2x2 */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-5 w-full border-t border-[#A6947D]/10 pt-5 mt-auto">
                            <div className="flex flex-col">
                              <span className="text-[7px] text-[#A6947D]/50 uppercase font-bold tracking-[0.2em] mb-1.5">Stock</span>
                              <span className="text-xs font-mono text-[#F8F5EE]">{slab.quantity} m²</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] text-[#A6947D]/50 uppercase font-bold tracking-[0.2em] mb-1.5">Thickness</span>
                              <span className="text-xs font-mono text-[#F8F5EE]">{slab.thickness} cm</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] text-[#A6947D]/50 uppercase font-bold tracking-[0.2em] mb-1.5">Origin</span>
                              <span className="text-[9px] font-bold text-[#F8F5EE] uppercase tracking-widest truncate">{slab.profiles?.country || 'GREECE'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[7px] text-[#A6947D]/50 uppercase font-bold tracking-[0.2em] mb-1.5">Valuation</span>
                              <span className="text-sm font-mono text-[#F8F5EE] tracking-tight">{formatCurrency(slab.price)}</span>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}