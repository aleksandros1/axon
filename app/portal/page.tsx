'use client';

import React, { useState, useEffect } from 'react';
import { 
  Briefcase, ShieldCheck, Activity, Globe, LayoutDashboard, 
  TrendingUp, FileText, Settings, LogOut, ChevronRight, 
  Lock, CheckCircle2, Zap, LucideIcon, Download, Package,
  Ship, MapPin, Truck, Navigation, Anchor, X, Fingerprint, Printer,
  AlertTriangle, XOctagon, Handshake, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';

export default function ClientPortal() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeContracts: 0, deployedCapital: 0, savedFees: 0 });
  const [loading, setLoading] = useState(true);
  
  const [activeContract, setActiveContract] = useState<any | null>(null);
  
  // States για το Σύστημα Ακύρωσης & Penalty
  const [abortingContract, setAbortingContract] = useState<any | null>(null);
  const [waiverStatus, setWaiverStatus] = useState<'idle' | 'negotiating' | 'approved'>('idle');
  
  const PENALTY_FEE_PERCENTAGE = 0.05; // 5% Penalty Fee
  const TRADITIONAL_BROKER_FEE = 0.05;

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('slabs')
      .select('*')
      .eq('status', 'IN_ESCROW')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPortfolio(data);
      const deployed = data.reduce((acc, curr) => acc + parseInt(curr.price?.replace(/,/g, '') || '0'), 0);
      const saved = deployed * TRADITIONAL_BROKER_FEE;
      setStats({ activeContracts: data.length, deployedCapital: deployed, savedFees: saved });
    }
    setLoading(false);
  };

  const COLORS = ['#D1C7B3', '#1A2E4C', '#8C8270', '#0A1428'];

  const materialDistribution = portfolio.reduce((acc: any, slab: any) => {
    const mat = slab.origin || slab.material || 'Unknown';
    acc[mat] = (acc[mat] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = Object.keys(materialDistribution).map(key => ({
    name: key,
    value: materialDistribution[key]
  }));

  const getMockShippingStage = (id: string) => {
    const hash = parseInt(id.substring(0, 8), 16);
    return (hash % 4) + 1;
  };

  const shippingStages = [
    { id: 1, name: 'Origin Extraction', icon: MapPin },
    { id: 2, name: 'Customs Clearance', icon: ShieldCheck },
    { id: 3, name: 'Ocean Transit', icon: Ship },
    { id: 4, name: 'Destination Port', icon: Anchor }
  ];

  const generateHash = (id: string) => {
    return `0x${btoa(id + "AXON").replace(/=/g, '').substring(0, 32).toLowerCase()}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const closeAbortModal = () => {
    setAbortingContract(null);
    setWaiverStatus('idle');
  };

  // Μονομερής Ακύρωση (Εχθρική) - Χρεώνεται το 5%
  const handleUnilateralAbort = async () => {
    if (!abortingContract) return;
    await supabase.from('slabs').update({ status: 'AVAILABLE' }).eq('id', abortingContract.id);
    closeAbortModal();
    fetchClientData();
  };

  // Ομόφωνη Ακύρωση (Διπλωματική) - Ζητάει Waiver και ακυρώνεται με 0%
  const handleMutualWaiver = () => {
    if (!abortingContract) return;
    setWaiverStatus('negotiating');
    
    // Προσομοίωση επικοινωνίας με το AXON Command για έγκριση (3 δευτερόλεπτα)
    setTimeout(async () => {
      setWaiverStatus('approved');
      await supabase.from('slabs').update({ status: 'AVAILABLE' }).eq('id', abortingContract.id);
      
      setTimeout(() => {
        closeAbortModal();
        fetchClientData();
      }, 3000);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#060B14] text-[#F8F5EE] font-sans selection:bg-[#D1C7B3]/20 relative overflow-hidden print:bg-white print:text-black">
      
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D1C7B3] rounded-full blur-[160px] opacity-5 pointer-events-none print:hidden"></div>
      
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#D1C7B3]/10 bg-[#060B14]/90 backdrop-blur-xl p-8 hidden lg:flex flex-col z-40 print:hidden">
        <div className="mb-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#111D36] border border-[#D1C7B3]/30 flex items-center justify-center">
            <Globe size={16} className="text-[#D1C7B3]" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-[#F8F5EE]">AXON<span className="text-[#D1C7B3]">.</span></h2>
        </div>
        
        <nav className="flex-1 space-y-8">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-[#D1C7B3]/50 uppercase tracking-[0.4em] mb-5 ml-2">Client Terminal</p>
            <NavItem icon={LayoutDashboard} label="Portfolio" active />
            <Link href="/trading"><NavItem icon={TrendingUp} label="Exchange Floor" /></Link>
            <NavItem icon={Navigation} label="Global Routing" />
          </div>
        </nav>

        <div className="pt-8 border-t border-[#D1C7B3]/10 space-y-4">
           <div className="flex items-center gap-3 ml-2 mb-4">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
             <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Tier-1 Cleared</span>
           </div>
           <button className="flex items-center gap-4 text-[#D1C7B3]/40 hover:text-red-400 transition-all ml-2 group">
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Disconnect</span>
           </button>
        </div>
      </aside>

      <main className="lg:ml-64 p-8 lg:p-12 relative z-10 print:hidden">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[#D1C7B3] uppercase tracking-[0.5em] text-[9px] font-black flex items-center gap-2">
                <ShieldCheck size={14} /> Encrypted Session
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-[#F8F5EE]">Asset Portfolio</h1>
          </div>
          
          <Link href="/trading" className="px-8 py-4 bg-gradient-to-r from-[#D1C7B3] to-[#A39985] text-[#060B14] text-[10px] font-black tracking-[0.2em] uppercase rounded-xl hover:shadow-[0_0_20px_rgba(209,199,179,0.3)] transition-all flex items-center gap-2">
            Acquire New Assets <ChevronRight size={14} />
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard label="Active Escrow Contracts" value={stats.activeContracts} icon={Briefcase} />
          <StatCard label="Deployed Capital" value={`€${stats.deployedCapital.toLocaleString('en-US')}`} icon={Lock} highlight />
          
          <div className="relative p-8 rounded-2xl backdrop-blur-xl overflow-hidden bg-gradient-to-br from-[#111D36]/60 to-[#0A1428]/60 border border-[#D1C7B3]/10 shadow-lg group">
             <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[40px] opacity-20 bg-green-500 transition-opacity group-hover:opacity-40"></div>
             <div className="relative z-10 flex justify-between items-start mb-6">
               <p className="text-green-400/80 text-[10px] font-black uppercase tracking-[0.2em]">Broker Fees Bypassed</p>
               <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-400">
                 <Activity size={18} />
               </div>
             </div>
             <h3 className="relative z-10 text-4xl font-serif tracking-tight text-green-400 drop-shadow-md">
               +€{stats.savedFees.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
             </h3>
             <p className="relative z-10 mt-2 text-[8px] text-[#D1C7B3]/50 uppercase tracking-widest">Capital retained via AXON direct routing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 p-8 bg-gradient-to-br from-[#111D36]/40 to-[#0A1428]/40 border border-[#D1C7B3]/10 rounded-2xl backdrop-blur-xl shadow-xl">
            <h3 className="text-[11px] font-black tracking-[0.3em] uppercase mb-8 flex items-center gap-3 text-[#D1C7B3]">
              <Navigation size={14} /> Global Routing Matrix
            </h3>
            
            <div className="space-y-6">
              {portfolio.length === 0 ? (
                <div className="py-12 text-center text-[#D1C7B3]/40 text-[10px] uppercase tracking-widest border border-dashed border-[#D1C7B3]/10 rounded-xl">
                  No active capital deployed. Visit the Exchange Floor.
                </div>
              ) : (
                portfolio.map((asset) => {
                  const currentStage = getMockShippingStage(asset.id);
                  const isEarlyStage = currentStage <= 2; 
                  
                  return (
                  <div key={asset.id} className="p-6 border border-[#D1C7B3]/10 bg-[#060B14]/60 rounded-xl hover:border-[#D1C7B3]/30 transition-all duration-300">
                    
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-md bg-[#111D36] border border-[#D1C7B3]/20 flex items-center justify-center overflow-hidden">
                           {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover opacity-70" alt="asset" /> : <BoxIcon />}
                         </div>
                         <div>
                           <p className="text-[11px] font-black tracking-widest text-[#F8F5EE] mb-1">{asset.origin || asset.material}</p>
                           <p className="text-[9px] text-[#D1C7B3]/60 uppercase tracking-widest">ID: {asset.id.substring(0,8)}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] text-[#D1C7B3]/40 uppercase tracking-widest mb-1">Locked Value</p>
                         <span className="text-sm font-bold text-[#F8F5EE]">€{parseInt(asset.price?.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                      </div>
                    </div>

                    <div className="relative pt-4 pb-2">
                      <div className="absolute top-[28px] left-[5%] right-[5%] h-[2px] bg-[#111D36] rounded-full"></div>
                      <div 
                        className="absolute top-[28px] left-[5%] h-[2px] bg-gradient-to-r from-[#D1C7B3] to-[#F8F5EE] shadow-[0_0_10px_#D1C7B3] rounded-full transition-all duration-1000"
                        style={{ width: `${((currentStage - 1) / 3) * 90}%` }}
                      ></div>
                      
                      <div className="relative flex justify-between">
                        {shippingStages.map((stage, index) => {
                          const isCompleted = currentStage >= stage.id;
                          const isCurrent = currentStage === stage.id;
                          const StageIcon = stage.icon;

                          return (
                            <div key={stage.id} className="flex flex-col items-center gap-3 z-10 w-24 text-center">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500
                                ${isCompleted 
                                  ? 'bg-[#060B14] border-[#D1C7B3] text-[#D1C7B3] shadow-[0_0_15px_rgba(209,199,179,0.3)]' 
                                  : 'bg-[#060B14] border-[#111D36] text-[#111D36]'}`}>
                                {isCompleted && !isCurrent ? <CheckCircle2 size={12} /> : <StageIcon size={12} className={isCurrent ? "animate-pulse" : ""} />}
                              </div>
                              <div className="space-y-1">
                                <p className={`text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'text-[#F8F5EE]' : 'text-[#D1C7B3]/30'}`}>{stage.name}</p>
                                {isCurrent && <p className="text-[7px] text-green-400 uppercase tracking-widest animate-pulse">In Progress</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#D1C7B3]/5 flex justify-between items-center">
                      
                      {isEarlyStage ? (
                        <button 
                          onClick={() => setAbortingContract(asset)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <XOctagon size={12} /> Request Termination
                        </button>
                      ) : (
                         <span className="text-[8px] text-[#D1C7B3]/30 uppercase tracking-widest">In Transit - Non-cancellable</span>
                      )}

                      <button 
                        onClick={() => setActiveContract(asset)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111D36] border border-[#D1C7B3]/20 text-[9px] font-black uppercase tracking-widest text-[#D1C7B3] hover:text-[#060B14] hover:bg-[#D1C7B3] transition-all"
                      >
                        <FileText size={12} /> View Smart Contract
                      </button>
                    </div>

                  </div>
                )})
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="p-8 bg-gradient-to-br from-[#111D36]/40 to-[#0A1428]/40 border border-[#D1C7B3]/10 rounded-2xl backdrop-blur-xl shadow-xl">
               <h3 className="text-[11px] font-black tracking-[0.3em] uppercase mb-8 text-center text-[#D1C7B3]">Asset Allocation</h3>
               
               {pieData.length > 0 ? (
                 <div className="h-56 flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#060B14', border: '1px solid #D1C7B3', borderRadius: '8px' }} itemStyle={{ color: '#F8F5EE' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-[#F8F5EE]">{stats.activeContracts}</span>
                      <span className="text-[8px] uppercase tracking-widest text-[#D1C7B3]/50">Total Assets</span>
                    </div>
                 </div>
               ) : (
                 <div className="h-56 flex items-center justify-center text-[10px] text-[#D1C7B3]/40 uppercase tracking-widest">No Data Available</div>
               )}
            </div>

            <div className="p-6 bg-[#111D36]/30 border border-[#D1C7B3]/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={16} className="text-[#D1C7B3]" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Escrow Protection</h4>
              </div>
              <p className="text-[9px] text-[#D1C7B3]/60 leading-relaxed uppercase tracking-wider">
                Capital is fully secured during transit. Release to supplier occurs exclusively upon your cryptographic confirmation of delivery at the destination port.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* --- CANCELLATION PENALTY & MUTUAL WAIVER MODAL --- */}
      {abortingContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#060B14]/95 backdrop-blur-md transition-opacity" onClick={closeAbortModal}></div>
          
          <div className="relative w-full max-w-md bg-gradient-to-br from-[#111D36] to-[#0A1428] border border-[#D1C7B3]/20 rounded-2xl shadow-[0_0_80px_rgba(209,199,179,0.1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              
              {/* STATE 1: IDLE (Επιλογή Χρήστη) */}
              {waiverStatus === 'idle' && (
                <>
                  <AlertTriangle size={48} className="mx-auto mb-6 text-red-500 animate-pulse" />
                  <h2 className="text-2xl font-serif text-[#F8F5EE] mb-2">Contract Termination</h2>
                  <p className="text-[9px] text-red-400/80 uppercase tracking-[0.3em] font-black mb-8">Liquidated Damages Protocol</p>
                  
                  <div className="bg-[#030508]/50 border border-red-500/20 rounded-xl p-6 mb-8 text-left">
                    <p className="text-[9px] text-[#D1C7B3]/50 uppercase tracking-widest mb-1 font-black">Asset Under Contract</p>
                    <p className="text-sm font-bold text-[#F8F5EE] mb-4">{abortingContract.origin || abortingContract.material}</p>
                    
                    <div className="flex justify-between items-center border-t border-red-500/10 pt-4 mb-2">
                      <span className="text-[9px] text-[#D1C7B3]/50 uppercase tracking-widest font-black">Escrow Locked Amount</span>
                      <span className="text-xs font-mono text-[#D1C7B3]">€{parseInt(abortingContract.price?.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-red-500/20 pt-4">
                      <span className="text-[10px] text-red-500 uppercase tracking-widest font-black flex items-center gap-2">
                        Penalty Fee (5%)
                      </span>
                      <span className="text-xl font-black text-red-500">
                        -€{(parseInt(abortingContract.price?.replace(/,/g, '') || '0') * PENALTY_FEE_PERCENTAGE).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>

                  <p className="text-[8px] text-[#D1C7B3]/50 uppercase tracking-widest leading-relaxed mb-8 text-justify">
                    Unilateral cancellation incurs a 5% penalty to cover administrative disruption. Alternatively, you may request a Mutual Consent Waiver from AXON Administration to cancel without penalty.
                  </p>

                  <div className="flex flex-col gap-3">
                    {/* Κουμπί 1: Ομόφωνη Ακύρωση (Χωρίς Penalty) */}
                    <button 
                      onClick={handleMutualWaiver} 
                      className="w-full py-4 bg-gradient-to-r from-[#D1C7B3] to-[#A39985] text-[#060B14] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:shadow-[0_0_20px_rgba(209,199,179,0.3)] transition-all"
                    >
                      <Handshake size={16} /> Request Mutual Waiver (0% Fee)
                    </button>
                    
                    {/* Κουμπί 2: Εχθρική Ακύρωση (Με Penalty) */}
                    <button 
                      onClick={handleUnilateralAbort} 
                      className="w-full py-4 border border-red-500/30 text-red-500/80 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-500/10 transition-all"
                    >
                      <XOctagon size={14} /> Unilateral Exit (Forfeit 5%)
                    </button>
                    
                    <button 
                      onClick={closeAbortModal} 
                      className="mt-4 text-[9px] text-[#D1C7B3]/40 uppercase tracking-widest hover:text-[#D1C7B3] transition-colors"
                    >
                      Keep Contract Active
                    </button>
                  </div>
                </>
              )}

              {/* STATE 2: NEGOTIATING (Φόρτωση) */}
              {waiverStatus === 'negotiating' && (
                <div className="py-12">
                  <Loader2 size={48} className="mx-auto mb-6 text-[#D1C7B3] animate-spin" />
                  <h2 className="text-2xl font-serif text-[#D1C7B3] mb-3">Negotiating Release</h2>
                  <p className="text-[10px] text-[#D1C7B3]/50 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    Contacting AXON Administration for Mutual Waiver authorization. Please hold.
                  </p>
                </div>
              )}

              {/* STATE 3: APPROVED (Επιτυχία) */}
              {waiverStatus === 'approved' && (
                <div className="py-12 animate-in fade-in zoom-in duration-500">
                  <Handshake size={56} className="mx-auto mb-6 text-green-400" />
                  <h2 className="text-3xl font-serif text-green-400 mb-3">Waiver Granted</h2>
                  <p className="text-[10px] text-[#F8F5EE]/70 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    AXON Command has authorized your request. The 5% penalty is waived. Contract dissolved amicably.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- SMART CONTRACT VIEWER MODAL --- */}
      {activeContract && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 print:relative print:p-0 print:block">
          
          <div className="absolute inset-0 bg-[#060B14]/95 backdrop-blur-2xl transition-opacity print:hidden" onClick={() => setActiveContract(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-[#030508] border border-[#D1C7B3]/30 rounded-xl shadow-[0_0_80px_rgba(209,199,179,0.1)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 print:border-none print:shadow-none print:bg-white print:text-black">
            
            <div className="p-8 border-b border-[#D1C7B3]/10 flex justify-between items-start print:border-gray-300">
              <div>
                <h2 className="text-2xl font-serif text-[#F8F5EE] mb-1 print:text-black">AXON Escrow Agreement</h2>
                <p className="text-[9px] font-black text-[#D1C7B3]/60 uppercase tracking-[0.3em] print:text-gray-500">Cryptographically Secured Allocation</p>
              </div>
              <div className="text-right">
                <ShieldCheck size={24} className="text-[#D1C7B3] ml-auto mb-2 print:text-black" />
                <p className="text-[8px] uppercase tracking-widest text-[#D1C7B3]/40 print:text-gray-400">Status: Verified</p>
              </div>
            </div>

            <div className="p-8 space-y-8 print:p-0 print:py-8">
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[8px] text-[#D1C7B3]/50 uppercase tracking-widest mb-1 print:text-gray-500">Contract Hash Identifier</p>
                  <p className="text-xs font-mono text-[#D1C7B3] print:text-black">{generateHash(activeContract.id)}</p>
                </div>
                <div>
                  <p className="text-[8px] text-[#D1C7B3]/50 uppercase tracking-widest mb-1 print:text-gray-500">Timestamp</p>
                  <p className="text-xs font-mono text-[#F8F5EE] print:text-black">{new Date(activeContract.created_at || Date.now()).toUTCString()}</p>
                </div>
              </div>

              <div className="bg-[#060B14]/50 border border-[#D1C7B3]/10 rounded-lg p-6 print:bg-gray-50 print:border-gray-300">
                <div className="flex justify-between items-center border-b border-[#D1C7B3]/10 pb-4 mb-4 print:border-gray-200">
                  <span className="text-[10px] uppercase tracking-widest text-[#D1C7B3]/70 font-black print:text-gray-600">Asset Target</span>
                  <span className="font-bold text-[#F8F5EE] print:text-black">{activeContract.origin || activeContract.material}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#D1C7B3]/10 pb-4 mb-4 print:border-gray-200">
                  <span className="text-[10px] uppercase tracking-widest text-[#D1C7B3]/70 font-black print:text-gray-600">Supplier Ledger ID</span>
                  <span className="font-mono text-[10px] text-[#D1C7B3] print:text-gray-800">AXN-SUP-{activeContract.id.substring(0,6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-green-400/80 font-black print:text-green-700">Funds Locked in Escrow</span>
                  <span className="text-2xl font-black text-green-400 print:text-green-700">€{parseInt(activeContract.price?.replace(/,/g, '') || '0').toLocaleString('en-US')}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-[#D1C7B3] uppercase tracking-[0.2em] mb-3 print:text-black">Protocol Terms & Conditions</p>
                <p className="text-[9px] text-[#D1C7B3]/60 leading-relaxed text-justify print:text-gray-600">
                  1. This cryptographic contract confirms the immediate locking of the designated funds within the AXON Zero-Trust Escrow Ledger.<br/><br/>
                  2. The supplier is mandated to initiate physical logistics upon receipt of this verification block.<br/><br/>
                  3. Funds shall remain inaccessible to all parties, including AXON Administration, until the client provides cryptographic release authorization at the final destination port, confirming asset integrity.<br/><br/>
                  4. Unilateral cancellation of this agreement is subject to a 5% Liquidated Damages penalty fee deducted from the escrow deposit. Mutual waivers are granted strictly at AXON Administration discretion.
                </p>
              </div>

            </div>

            <div className="p-6 bg-[#060B14] border-t border-[#D1C7B3]/10 flex justify-between items-center print:hidden">
              <button onClick={() => setActiveContract(null)} className="text-[10px] font-black uppercase tracking-widest text-[#D1C7B3]/50 hover:text-red-400 transition-colors flex items-center gap-2">
                <X size={14} /> Close Viewer
              </button>
              
              <button onClick={handlePrint} className="px-6 py-3 bg-[#D1C7B3] text-[#030508] rounded-md text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:shadow-[0_0_20px_rgba(209,199,179,0.4)] transition-all">
                <Printer size={14} /> Export Ledger (PDF)
              </button>
            </div>
            
            <div className="hidden print:block p-8 mt-12">
               <div className="w-48 border-t border-black pt-2">
                 <p className="text-[10px] font-bold uppercase">Digital Authorization Seal</p>
                 <p className="text-[8px] text-gray-500 mt-1">AXON Protocol Network</p>
               </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const BoxIcon = () => <Package size={16} className="text-[#D1C7B3]/40" />;

function StatCard({ label, value, icon: Icon, highlight = false }: { label: string, value: any, icon: LucideIcon, highlight?: boolean }) {
  return (
    <div className={`relative p-8 rounded-2xl backdrop-blur-xl overflow-hidden transition-all duration-500 group ${highlight ? 'bg-gradient-to-br from-[#111D36] to-[#0A1428] border border-[#D1C7B3]/30 shadow-[0_0_30px_rgba(209,199,179,0.1)]' : 'bg-gradient-to-br from-[#111D36]/60 to-[#0A1428]/60 border border-[#D1C7B3]/10'}`}>
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${highlight ? 'bg-[#D1C7B3]' : 'bg-[#1A2E4C]'}`}></div>
      <div className="relative z-10 flex justify-between items-start mb-6">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-[#D1C7B3]' : 'text-[#D1C7B3]/70'}`}>{label}</p>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${highlight ? 'bg-[#D1C7B3]/10 text-[#D1C7B3]' : 'bg-[#060B14]/50 text-[#D1C7B3]/40'}`}>
          <Icon size={18} />
        </div>
      </div>
      <h3 className="relative z-10 text-4xl font-serif tracking-tight text-[#F8F5EE] drop-shadow-md">{value}</h3>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: LucideIcon, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${active ? 'bg-gradient-to-r from-[#111D36] to-[#0A1428] border border-[#D1C7B3]/20 text-[#D1C7B3] shadow-[0_0_20px_rgba(209,199,179,0.1)]' : 'text-[#D1C7B3]/50 hover:text-[#F8F5EE] hover:bg-[#D1C7B3]/5'}`}>
      {active && <div className="absolute left-0 top-0 w-1 h-full bg-[#D1C7B3] opacity-80"></div>}
      <Icon size={18} className={active ? 'text-[#D1C7B3]' : 'text-[#D1C7B3]/50 group-hover:text-[#F8F5EE] transition-colors'} />
      <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10">{label}</span>
    </div>
  );
}