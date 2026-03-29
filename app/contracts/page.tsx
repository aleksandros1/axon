'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, FileSignature, Handshake, Ship, 
  ShieldCheck, CheckCircle2, Clock, ArrowLeft, 
  History, Activity, FileText, Package, Building2
} from 'lucide-react';
import Link from 'next/link';

export default function ContractsDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // State για τα συμβόλαια
  const [contracts, setContracts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      
      setCurrentUser(session.user);

      // Τραβάμε τα συμβόλαια και τα στοιχεία του αγοραστή, πωλητή και του μαρμάρου
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          slabs ( material, image_url ),
          buyer:profiles!contracts_buyer_id_fkey ( company_name, email ),
          vendor:profiles!contracts_vendor_id_fkey ( company_name, email )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contracts:', error);
      } else if (data) {
        setContracts(data);
      }
      
      setLoading(false);
    };

    fetchContracts();
  }, [router]);

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Φιλτράρισμα Συμβολαίων
  const activeContracts = contracts.filter(c => ['pending', 'funded', 'shipped'].includes(c.status));
  const historyContracts = contracts.filter(c => ['released', 'cancelled', 'disputed'].includes(c.status));

  const displayContracts = activeTab === 'active' ? activeContracts : historyContracts;

  // Υπολογισμός Τζίρου Ενεργών Συμβολαίων
  const totalActiveVolume = activeContracts.reduce((acc, curr) => {
    return acc + (parseFloat(curr.price) || 0);
  }, 0);

  // Οπτική αναπαράσταση των σταδίων
  const getStageProgress = (status: string) => {
    switch (status) {
      case 'pending': return 1; // Term Sheet Accepted
      case 'funded': return 2;  // Escrow Funded
      case 'shipped': return 3; // BL Uploaded
      case 'released': return 4; // Completed
      default: return 0;
    }
  };

  return (
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ: w-full και overflow-x-hidden για να μην κουνιέται η οθόνη */
    <div className="min-h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 relative pb-20 md:pb-0 overflow-x-hidden">
      
      {/* BACKGROUND WATERMARK - LOCKED */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
        <Globe size={800} className="text-[#A6947D] shrink-0" />
      </div>
      
      {/* TOP NAVIGATION - FULL WIDTH ALIGNMENT */}
      <nav className="relative z-20 border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-md sticky top-0 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/dashboard" className="w-8 h-8 md:w-10 md:h-10 border border-[#A6947D]/30 rounded-full flex items-center justify-center text-[#A6947D] hover:bg-[#A6947D]/10 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center gap-2 md:gap-3">
              <Shield size={20} className="text-emerald-500 hidden md:block" />
              <div>
                <h1 className="text-xs md:text-xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE] leading-none">Escrow Contracts</h1>
                <p className="text-[#A6947D]/60 text-[7px] md:text-[10px] font-mono uppercase tracking-widest mt-1">Smart Ledger Protocol</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[7px] md:text-[10px] text-emerald-500/80 uppercase font-bold tracking-widest mb-1">Active Volume</p>
            <p className="text-sm md:text-2xl font-mono text-[#F8F5EE] tracking-tighter">{formatCurrency(totalActiveVolume)}</p>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10 w-full overflow-x-hidden">
        
        {/* TABS - NO-WIGGLE CSS */}
        <div className="flex gap-4 border-b border-[#A6947D]/10 mb-8 md:mb-10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('active')} 
            className={`pb-4 px-2 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'active' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#F8F5EE]/40'}`}
          >
            <Activity size={14} /> Active Deals <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[8px]">{activeContracts.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`pb-4 px-2 text-[9px] md:text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'history' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40'}`}
          >
            <History size={14} /> Settled / History
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-[9px] text-emerald-500/60 uppercase font-mono tracking-widest">Accessing Secure Vault...</p>
          </div>
        ) : displayContracts.length === 0 ? (
          <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-3xl p-10 md:p-20 text-center flex flex-col items-center w-full">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-[#A6947D]/20 flex items-center justify-center mb-6 bg-[#A6947D]/5"><FileSignature size={30} className="text-[#A6947D]/40" /></div>
            <h3 className="text-lg md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.15em] mb-3">No {activeTab === 'active' ? 'Active' : 'Settled'} Contracts</h3>
            <p className="text-[9px] md:text-xs text-[#A6947D]/60 font-mono uppercase tracking-widest max-w-sm">
              {activeTab === 'active' 
                ? "Initiate a deal from the trading floor to start." 
                : "Your historical ledger is empty."}
            </p>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8 w-full">
            {displayContracts.map((contract) => {
              const stage = getStageProgress(contract.status);
              const isBuyer = contract.buyer_id === currentUser?.id;
              const counterparty = isBuyer ? contract.vendor : contract.buyer;

              return (
                <div key={contract.id} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl overflow-hidden shadow-2xl relative w-full">
                  {/* Status Indicator Bar */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#020509]">
                    <div className={`w-full h-full transition-all duration-1000 ${stage === 4 ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  </div>

                  <div className="p-5 md:p-8 pl-8 md:pl-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border ${stage === 4 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                            {stage === 4 ? 'Contract Settled' : 'Active Deal'}
                          </span>
                          <span className="text-[9px] font-mono text-[#A6947D]/60 uppercase flex items-center gap-1.5"><Clock size={10}/> {formatDate(contract.created_at)}</span>
                        </div>
                        <h2 className="text-lg md:text-2xl font-serif uppercase tracking-widest text-[#F8F5EE] truncate max-w-[250px] md:max-w-none">{contract.slabs?.material || 'Premium Asset'}</h2>
                        <p className="text-[8px] text-[#A6947D] font-mono tracking-widest uppercase mt-1">AX-{contract.id.substring(0,8)}</p>
                      </div>

                      <div className="bg-[#020509] border border-[#A6947D]/20 rounded-xl p-4 flex flex-wrap items-center gap-4 md:gap-6 shadow-inner w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none">
                          <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">{isBuyer ? 'Vendor Entity' : 'Buyer Entity'}</p>
                          <p className="text-[10px] md:text-sm font-bold uppercase text-[#F8F5EE] flex items-center gap-2 truncate max-w-[120px] md:max-w-none"><Building2 size={12} className="text-[#A6947D]"/> {counterparty?.company_name || 'Verified Entity'}</p>
                        </div>
                        <div className="hidden md:block h-8 w-px bg-[#A6947D]/20"></div>
                        <div>
                          <p className="text-[7px] md:text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Contract Value</p>
                          <p className="text-sm md:text-lg font-mono text-emerald-400">{formatCurrency(contract.price)}</p>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR - MOBILE OPTIMIZED */}
                    <div className="mb-8 w-full">
                      <div className="relative pt-2">
                        <div className="absolute top-7 left-0 w-full h-0.5 bg-[#A6947D]/10"></div>
                        <div className="absolute top-7 left-0 h-0.5 bg-emerald-500 transition-all duration-1000" style={{ width: `${(stage / 4) * 100}%` }}></div>
                        
                        <div className="relative z-10 flex justify-between gap-1">
                          {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2">
                              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 bg-[#01030A] transition-all ${stage >= s ? 'border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-[#A6947D]/20 text-[#A6947D]/40'}`}>
                                {s === 1 && <FileText size={14} />}
                                {s === 2 && <ShieldCheck size={14} />}
                                {s === 3 && <Ship size={14} />}
                                {s === 4 && <Handshake size={14} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
                      <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                        <div>
                          <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">Logistics</p>
                          <p className="text-[9px] font-mono text-[#F8F5EE] bg-[#A6947D]/10 px-2 py-0.5 rounded border border-[#A6947D]/20">{contract.incoterms}</p>
                        </div>
                        <div>
                          <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">Inspection</p>
                          <p className="text-[9px] font-mono text-[#F8F5EE]">{contract.inspection_days}D</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex-1 md:flex-none border border-[#A6947D]/30 text-[#A6947D] px-4 py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all">Docs</button>
                        {stage < 4 && !isBuyer && (
                          <button className="flex-1 md:flex-none bg-emerald-600 text-[#020509] px-4 py-2.5 rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg">Upload B/L</button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}