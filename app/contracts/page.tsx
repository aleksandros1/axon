'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, FileSignature, Handshake, Ship, 
  ShieldCheck, CheckCircle2, Clock, ArrowLeft, 
  History, Activity, FileText, Package, Building2,
  Lock, Eye, ChevronRight, UploadCloud, AlertOctagon 
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
    return new Date(isoString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Φιλτράρισμα Συμβολαίων
  const activeContracts = contracts.filter(c => ['pending', 'funded', 'shipped'].includes(c.status));
  const historyContracts = contracts.filter(c => ['released', 'cancelled', 'disputed'].includes(c.status));

  const displayContracts = activeTab === 'active' ? activeContracts : historyContracts;

  // Υπολογισμός Τζίρου Ενεργών Συμβολαίων
  const totalActiveVolume = activeContracts.reduce((acc, curr) => {
    const priceString = curr.price?.toString() || '0';
    const cleanPrice = parseFloat(priceString.replace(/\./g, '').replace(/,/g, '.'));
    return acc + (cleanPrice || 0);
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
    <div className="min-h-[100dvh] w-full bg-[#000000] text-gray-200 font-sans selection:bg-[#A6947D]/30 relative pb-20 md:pb-0 overflow-x-hidden antialiased">
      
      {/* BACKGROUND GRID & WATERMARK */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0 overflow-hidden">
        <FileSignature size={800} className="text-[#A6947D] shrink-0" strokeWidth={1} />
      </div>
      
      {/* TOP NAVIGATION - INSTITUTIONAL LAYOUT */}
      <nav className="relative z-20 border-b border-gray-900 bg-[#020202]/90 backdrop-blur-xl sticky top-0 w-full pt-8 pb-6">
        <div className="max-w-6xl mx-auto px-5 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-5 md:gap-8">
            <Link href="/dashboard" className="w-10 h-10 border border-gray-800 rounded-sm flex items-center justify-center text-gray-500 hover:text-white transition-colors bg-[#050505] shadow-inner group">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
            </Link>
            <div className="flex items-center gap-4">
              <Lock size={20} className="text-[#A6947D] hidden sm:block" strokeWidth={1.5} />
              <div>
                <h1 className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-white leading-none mb-1.5">Escrow Contracts</h1>
                <p className="text-gray-500 text-[8px] md:text-[9px] font-mono uppercase tracking-[0.4em]">Smart Ledger Protocol</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[7px] md:text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-1.5">Active Volume</p>
            <p className="text-lg md:text-2xl font-mono text-[#A6947D] tracking-widest">{formatCurrency(totalActiveVolume)}</p>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-5 md:px-12 py-10 md:py-16 relative z-10 w-full overflow-x-hidden">
        
        {/* TABS - SHARP GEOMETRY */}
        <div className="flex gap-8 border-b border-gray-900 mb-10 overflow-x-auto no-scrollbar pb-px">
          <button 
            onClick={() => setActiveTab('active')} 
            className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'active' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <Activity size={14} strokeWidth={1.5}/> Active Deals 
            <span className={`px-2.5 py-1 rounded-sm text-[8px] font-mono border ${activeTab === 'active' ? 'bg-[#A6947D]/10 border-[#A6947D]/30 text-[#A6947D]' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
              {activeContracts.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'history' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}
          >
            <History size={14} strokeWidth={1.5}/> Settled / History
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-[#A6947D] animate-pulse">
            <div className="w-12 h-12 border-[0.5px] border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
            <p className="text-[9px] uppercase font-mono tracking-[0.4em]">Querying Secure Ledger</p>
          </div>
        ) : displayContracts.length === 0 ? (
          <div className="bg-[#050505] border border-gray-900 rounded-sm p-16 md:p-32 text-center flex flex-col items-center w-full shadow-2xl">
            <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-8 bg-[#020202] shadow-inner"><FileSignature size={32} className="text-gray-700 stroke-1" /></div>
            <h3 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-4">No {activeTab === 'active' ? 'Active' : 'Settled'} Contracts</h3>
            <p className="text-[10px] md:text-[11px] text-gray-500 font-mono uppercase tracking-[0.3em] max-w-md">
              {activeTab === 'active' 
                ? "Initiate a deal from the trading floor to establish a contract." 
                : "Your historical ledger is empty."}
            </p>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-12 w-full animate-in fade-in duration-500 delay-100">
            {displayContracts.map((contract) => {
              const stage = getStageProgress(contract.status);
              const isBuyer = contract.buyer_id === currentUser?.id;
              const counterparty = isBuyer ? contract.vendor : contract.buyer;

              return (
                <div key={contract.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden shadow-2xl relative w-full group hover:border-[#A6947D]/50 transition-colors">
                  
                  {/* Status Indicator Bar */}
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#020509]">
                    <div className={`w-full h-full transition-all duration-1000 ${stage === 4 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]'}`}></div>
                  </div>

                  <div className="p-6 md:p-10 pl-8 md:pl-12 w-full">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 border-b border-gray-900 pb-8">
                      <div className="flex-1 w-full overflow-hidden">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <span className={`px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] border shadow-inner ${stage === 4 ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-amber-950/30 border-amber-900/50 text-amber-500'}`}>
                            {stage === 4 ? 'Contract Settled' : 'Active Deal'}
                          </span>
                          <span className="text-[9px] font-mono text-gray-500 uppercase flex items-center gap-2 tracking-[0.2em]"><Clock size={12} className="text-[#A6947D]"/> {formatDate(contract.created_at)}</span>
                        </div>
                        <h2 className="text-xl md:text-3xl font-serif uppercase tracking-widest text-white truncate max-w-[280px] md:max-w-none mb-2">{contract.slabs?.material || 'Premium Asset'}</h2>
                        <p className="text-[9px] text-[#A6947D] font-mono tracking-[0.3em] uppercase">AX-{contract.id.substring(0,8)}</p>
                      </div>

                      <div className="bg-[#020202] border border-gray-800 rounded-sm p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-8 shadow-inner w-full xl:w-auto flex-none">
                        <div className="flex-1 min-w-[120px]">
                          <p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">{isBuyer ? 'Vendor Entity' : 'Buyer Entity'}</p>
                          <p className="text-xs md:text-sm font-serif uppercase text-white flex items-center gap-2 truncate tracking-widest"><Building2 size={12} className="text-gray-600"/> {counterparty?.company_name || 'Verified Entity'}</p>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-gray-800 mx-2"></div>
                        <div className="mt-4 sm:mt-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-800 pt-4 sm:pt-0">
                          <p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Contract Value</p>
                          <p className="text-xl md:text-2xl font-mono text-white tracking-widest">{formatCurrency(contract.price)}</p>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS BAR - HIGH TECH */}
                    <div className="mb-10 w-full">
                      <p className="text-[9px] text-[#A6947D] font-mono uppercase tracking-[0.4em] mb-8 border-l-2 border-[#A6947D] pl-3">Execution Status</p>
                      
                      <div className="relative mt-8 md:mt-12 px-2 md:px-8 w-full max-w-4xl mx-auto">
                        {/* Base Line */}
                        <div className="absolute top-[19px] left-[5%] right-[5%] h-px bg-gray-900"></div>
                        {/* Active Line */}
                        <div className="absolute top-[19px] left-[5%] h-px bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000" style={{ width: `calc(${(stage / 4) * 90}%)` }}></div>
                        
                        <div className="relative z-10 flex justify-between w-full">
                          
                          {/* Point 1: Term Sheet */}
                          <div className="flex flex-col items-center gap-4 relative">
                            <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 1 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                              <FileText size={16} strokeWidth={stage >= 1 ? 2 : 1.5} />
                            </div>
                            <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2 hidden sm:block">
                              <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 1 ? 'text-white' : 'text-gray-600'}`}>Term Sheet</p>
                              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Accepted</p>
                            </div>
                          </div>

                          {/* Point 2: Escrow */}
                          <div className="flex flex-col items-center gap-4 relative">
                            <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 2 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                              <ShieldCheck size={16} strokeWidth={stage >= 2 ? 2 : 1.5} />
                            </div>
                            <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2 hidden sm:block">
                              <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 2 ? 'text-white' : 'text-gray-600'}`}>Escrow</p>
                              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{contract.deposit_percentage}% Funded</p>
                            </div>
                          </div>

                          {/* Point 3: Logistics */}
                          <div className="flex flex-col items-center gap-4 relative">
                            <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 3 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                              <Ship size={16} strokeWidth={stage >= 3 ? 2 : 1.5} />
                            </div>
                            <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2 hidden sm:block">
                              <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 3 ? 'text-white' : 'text-gray-600'}`}>Logistics</p>
                              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{contract.incoterms} Terms</p>
                            </div>
                          </div>

                          {/* Point 4: Settlement */}
                          <div className="flex flex-col items-center gap-4 relative">
                            <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 4 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                              <Handshake size={16} strokeWidth={stage >= 4 ? 2 : 1.5} />
                            </div>
                            <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2 hidden sm:block">
                              <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 4 ? 'text-emerald-400' : 'text-gray-600'}`}>Released</p>
                              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Settlement</p>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                    
                    <div className="h-8 sm:h-12 w-full"></div> {/* Spacing for absolute text */}

                    {/* CONTRACT DETAILS FOOTER */}
                    <div className="bg-[#020202] border border-gray-900 rounded-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6 w-full shadow-inner mt-4">
                      <div className="flex flex-wrap items-center gap-6 md:gap-10 w-full md:w-auto">
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Logistics</p>
                          <p className="text-[11px] font-mono text-white bg-[#050505] px-3 py-1.5 rounded-sm border border-gray-800 tracking-widest">{contract.incoterms}</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Inspection</p>
                          <p className="text-[11px] font-mono text-white tracking-widest bg-[#050505] px-3 py-1.5 rounded-sm border border-gray-800">{contract.inspection_days} Days</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 w-full md:w-auto">
                        <button className="flex-1 md:flex-none h-12 bg-[#050505] border border-gray-800 text-white hover:border-[#A6947D]/50 hover:bg-[#A6947D]/5 px-6 rounded-sm text-[9px] font-mono uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                          <Eye size={14} strokeWidth={1.5} className="text-[#A6947D]"/> Docs
                        </button>
                        {stage < 4 && !isBuyer && (
                          <button className="flex-1 md:flex-none h-12 bg-white text-black hover:bg-gray-200 px-6 rounded-sm text-[9px] font-extrabold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            <UploadCloud size={14} strokeWidth={2}/> Upload B/L
                          </button>
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