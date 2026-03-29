'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Εξασφάλιση του Import
import { 
  Briefcase, ShieldCheck, Activity, Globe, LayoutDashboard, 
  TrendingUp, FileText, Settings, LogOut, ChevronRight, 
  Lock, CheckCircle2, Zap, LucideIcon, Download, Package,
  Ship, MapPin, Truck, Navigation, Anchor, X, Fingerprint, Printer,
  AlertTriangle, XOctagon, Handshake, Loader2, Crosshair, MessageSquare // Προστέθηκαν τα εικονίδια
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';

export default function ClientPortal() {
  const router = useRouter(); // ΔΗΛΩΣΗ ΤΟΥ ROUTER - ΕΔΩ ΗΤΑΝ ΤΟ ΣΦΑΛΜΑ
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeContracts: 0, deployedCapital: 0, savedFees: 0 });
  const [loading, setLoading] = useState(true);
  
  const [activeContract, setActiveContract] = useState<any | null>(null);
  
  const [abortingContract, setAbortingContract] = useState<any | null>(null);
  const [waiverStatus, setWaiverStatus] = useState<'idle' | 'negotiating' | 'approved'>('idle');
  
  const PENALTY_FEE_PERCENTAGE = 0.05; 
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

  const handlePrint = () => { window.print(); };

  const closeAbortModal = () => {
    setAbortingContract(null);
    setWaiverStatus('idle');
  };

  const handleUnilateralAbort = async () => {
    if (!abortingContract) return;
    await supabase.from('slabs').update({ status: 'AVAILABLE' }).eq('id', abortingContract.id);
    closeAbortModal();
    fetchClientData();
  };

  const handleMutualWaiver = () => {
    if (!abortingContract) return;
    setWaiverStatus('negotiating');
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
    <div className="min-h-[100dvh] w-full bg-[#060B14] text-[#F8F5EE] font-sans selection:bg-[#D1C7B3]/20 relative overflow-x-hidden print:bg-white print:text-black">
      
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D1C7B3] rounded-full blur-[160px] opacity-5 pointer-events-none print:hidden overflow-hidden"></div>
      
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
           <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))} className="flex items-center gap-4 text-[#D1C7B3]/40 hover:text-red-400 transition-all ml-2 group">
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Disconnect</span>
           </button>
        </div>
      </aside>

      <main className="lg:ml-64 p-4 md:p-8 lg:p-12 relative z-10 print:hidden w-full overflow-x-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 w-full">
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[#D1C7B3] uppercase tracking-[0.5em] text-[9px] font-black flex items-center gap-2">
                <ShieldCheck size={14} /> Encrypted Session
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif tracking-tight text-[#F8F5EE] truncate">Asset Portfolio</h1>
          </div>
          <Link href="/trading" className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#D1C7B3] to-[#A39985] text-[#060B14] text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase rounded-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2">
            Acquire Assets <ChevronRight size={14} />
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10 w-full">
          <StatCard label="Active Escrow" value={stats.activeContracts} icon={Briefcase} />
          <StatCard label="Deployed Capital" value={`€${stats.deployedCapital.toLocaleString()}`} icon={Lock} highlight />
          <div className="relative p-6 md:p-8 rounded-2xl backdrop-blur-xl overflow-hidden bg-gradient-to-br from-[#111D36]/60 to-[#0A1428]/60 border border-[#D1C7B3]/10 shadow-lg group w-full">
             <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[40px] opacity-20 bg-green-500 transition-opacity group-hover:opacity-40"></div>
             <p className="text-green-400/80 text-[9px] font-black uppercase tracking-[0.2em] mb-6">Saved Fees</p>
             <h3 className="text-3xl md:text-4xl font-serif text-green-400">+€{stats.savedFees.toLocaleString('en-US', {maximumFractionDigits: 0})}</h3>
             <p className="mt-2 text-[8px] text-[#D1C7B3]/50 uppercase tracking-widest">Bypassed brokers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          <div className="lg:col-span-8 p-6 md:p-8 bg-gradient-to-br from-[#111D36]/40 to-[#0A1428]/40 border border-[#D1C7B3]/10 rounded-2xl w-full overflow-hidden">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase mb-8 flex items-center gap-3 text-[#D1C7B3]">
              <Navigation size={14} /> Global Routing Matrix
            </h3>
            <div className="space-y-6 w-full">
              {portfolio.length === 0 ? (
                <div className="py-12 text-center text-[#D1C7B3]/40 text-[9px] uppercase tracking-widest border border-dashed border-[#D1C7B3]/10 rounded-xl">No active capital deployed.</div>
              ) : (
                portfolio.map((asset) => {
                  const currentStage = getMockShippingStage(asset.id);
                  const isEarlyStage = currentStage <= 2; 
                  return (
                  <div key={asset.id} className="p-4 md:p-6 border border-[#D1C7B3]/10 bg-[#060B14]/60 rounded-xl w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                      <div className="flex items-center gap-4 overflow-hidden">
                         <div className="w-10 h-10 rounded-md bg-[#111D36] border border-[#D1C7B3]/20 flex items-center justify-center flex-none overflow-hidden">
                           {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover" alt="" /> : <Package size={16} className="text-[#D1C7B3]/30" />}
                         </div>
                         <div className="overflow-hidden">
                           <p className="text-[10px] font-black tracking-widest text-[#F8F5EE] truncate">{asset.origin || asset.material}</p>
                           <p className="text-[8px] text-[#D1C7B3]/60 uppercase truncate">AX-{asset.id.substring(0,8)}</p>
                         </div>
                      </div>
                      <div className="sm:text-right">
                         <p className="text-[8px] text-[#D1C7B3]/40 uppercase mb-1">Locked Value</p>
                         <span className="text-sm font-mono text-[#F8F5EE]">€{parseInt(asset.price?.replace(/,/g, '') || '0').toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="relative pt-4 pb-6 w-full overflow-hidden">
                      <div className="absolute top-[28px] left-[10px] right-[10px] h-[2px] bg-[#111D36] rounded-full"></div>
                      <div className="absolute top-[28px] left-[10px] h-[2px] bg-[#D1C7B3] shadow-[0_0_10px_#D1C7B3] rounded-full transition-all duration-1000" style={{ width: `calc(${((currentStage - 1) / 3) * 100}% - 20px)` }}></div>
                      <div className="relative flex justify-between gap-1 w-full">
                        {shippingStages.map((stage) => {
                          const isCompleted = currentStage >= stage.id;
                          const isCurrent = currentStage === stage.id;
                          const StageIcon = stage.icon;
                          return (
                            <div key={stage.id} className="flex flex-col items-center gap-3 z-10 w-1/4">
                              <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center bg-[#060B14] transition-all duration-500 ${isCompleted ? 'border-[#D1C7B3] text-[#D1C7B3]' : 'border-[#111D36] text-[#111D36]'}`}>
                                <StageIcon size={12} className={isCurrent ? "animate-pulse" : ""} />
                              </div>
                              <p className={`text-[6px] md:text-[8px] font-black uppercase text-center leading-tight ${isCompleted ? 'text-[#F8F5EE]' : 'text-[#D1C7B3]/30'}`}>{stage.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#D1C7B3]/5 flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
                      {isEarlyStage ? (
                        <button onClick={() => setAbortingContract(asset)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-500/20 text-[8px] font-black uppercase text-red-500/60 hover:text-red-400">
                          <XOctagon size={12} /> Terminate
                        </button>
                      ) : ( <span className="text-[8px] text-[#D1C7B3]/30 uppercase font-black">Non-cancellable</span> )}
                      <button onClick={() => setActiveContract(asset)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#111D36] border border-[#D1C7B3]/20 text-[8px] font-black uppercase text-[#D1C7B3]">
                        <FileText size={12} /> Smart Contract
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8 w-full">
            <div className="p-8 bg-gradient-to-br from-[#111D36]/40 to-[#0A1428]/40 border border-[#D1C7B3]/10 rounded-2xl w-full">
               <h3 className="text-[10px] font-black tracking-[0.3em] uppercase mb-8 text-center text-[#D1C7B3]">Allocation</h3>
               {pieData.length > 0 ? (
                 <div className="h-56 flex items-center justify-center relative w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#060B14', border: '1px solid #D1C7B3' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-[#F8F5EE]">{stats.activeContracts}</span>
                      <span className="text-[7px] uppercase tracking-widest text-[#D1C7B3]/50">Assets</span>
                    </div>
                 </div>
               ) : ( <div className="h-56 flex items-center justify-center text-[9px] text-[#D1C7B3]/40 uppercase">No Data</div> )}
            </div>
            <div className="p-6 bg-[#111D36]/30 border border-[#D1C7B3]/10 rounded-2xl w-full">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={16} className="text-[#D1C7B3]" />
                <h4 className="text-[9px] font-black uppercase">Escrow Protection</h4>
              </div>
              <p className="text-[8px] text-[#D1C7B3]/60 leading-relaxed uppercase">Funds are secured. Release occurs upon cryptographic arrival confirmation.</p>
            </div>
          </div>
        </div>
      </main>

      {/* --- CANCELLATION MODAL --- */}
      {abortingContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#060B14]/95 backdrop-blur-md" onClick={closeAbortModal}></div>
          <div className="relative w-full max-w-md bg-[#030508] border border-[#D1C7B3]/20 rounded-2xl shadow-2xl p-6 md:p-10 animate-in zoom-in-95 w-full">
            {waiverStatus === 'idle' && (
              <div className="text-center">
                <AlertTriangle size={40} className="mx-auto mb-6 text-red-500 animate-pulse" />
                <h2 className="text-xl md:text-2xl font-serif text-[#F8F5EE] mb-1">Contract Termination</h2>
                <div className="bg-[#030508] border border-red-500/20 rounded-xl p-5 text-left mb-6 mt-6">
                  <p className="text-[9px] text-[#D1C7B3]/50 uppercase font-black mb-4">Target: {abortingContract.material}</p>
                  <div className="flex justify-between items-center border-t border-red-500/10 pt-4">
                    <span className="text-[9px] text-red-500 font-black uppercase">Penalty Fee (5%)</span>
                    <span className="text-lg font-black text-red-500">-€{(parseInt(abortingContract.price?.replace(/,/g, '') || '0') * PENALTY_FEE_PERCENTAGE).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={handleMutualWaiver} className="w-full py-4 bg-[#D1C7B3] text-[#060B14] rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Handshake size={16} /> Request Mutual Waiver
                  </button>
                  <button onClick={handleUnilateralAbort} className="w-full py-4 border border-red-500/30 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest">Unilateral Exit</button>
                </div>
              </div>
            )}
            {waiverStatus === 'negotiating' && (
              <div className="py-12 text-center">
                <Loader2 size={40} className="mx-auto mb-6 text-[#D1C7B3] animate-spin" />
                <h2 className="text-xl font-serif text-[#D1C7B3]">Negotiating...</h2>
              </div>
            )}
            {waiverStatus === 'approved' && (
              <div className="py-12 text-center animate-in fade-in zoom-in">
                <Handshake size={48} className="mx-auto mb-6 text-green-400" />
                <h2 className="text-2xl font-serif text-green-400">Granted</h2>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SMART CONTRACT VIEWER --- */}
      {activeContract && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 print:relative print:p-0 print:block overflow-hidden">
          <div className="absolute inset-0 bg-[#060B14]/95 backdrop-blur-2xl print:hidden" onClick={() => setActiveContract(null)}></div>
          <div className="relative w-full max-w-2xl bg-[#030508] border border-[#D1C7B3]/30 rounded-xl p-6 md:p-8 flex flex-col animate-in zoom-in-95 print:border-none print:bg-white print:text-black w-full max-h-[95vh] overflow-y-auto">
            <div className="border-b border-[#D1C7B3]/10 pb-6 mb-8 flex justify-between items-start">
              <div><h2 className="text-xl font-serif text-[#F8F5EE] print:text-black">AXON Escrow Agreement</h2><p className="text-[8px] font-black text-[#D1C7B3]/60 uppercase tracking-[0.2em]">Secured Allocation</p></div>
              <ShieldCheck size={20} className="text-[#D1C7B3] print:text-black" />
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div><p className="text-[7px] text-[#D1C7B3]/50 uppercase mb-1">Contract Hash</p><p className="text-[10px] font-mono text-[#D1C7B3] break-all">{generateHash(activeContract.id)}</p></div>
                <div><p className="text-[7px] text-[#D1C7B3]/50 uppercase mb-1">Timestamp</p><p className="text-[10px] font-mono text-[#F8F5EE]">{new Date().toUTCString()}</p></div>
              </div>
              <div className="bg-[#060B14]/50 border border-[#D1C7B3]/10 rounded-lg p-5">
                <div className="flex justify-between items-center mb-4"><span className="text-[9px] uppercase font-black text-[#D1C7B3]/70">Asset Target</span><span className="text-sm font-bold text-[#F8F5EE]">{activeContract.material}</span></div>
                <div className="flex justify-between items-center"><span className="text-[9px] uppercase font-black text-green-400/80">Funds Locked</span><span className="text-xl font-mono text-green-400">€{parseInt(activeContract.price?.replace(/,/g, '') || '0').toLocaleString()}</span></div>
              </div>
              <div className="text-[8px] text-[#D1C7B3]/60 uppercase font-black space-y-3">
                <p>1. Funds locked within the AXON Zero-Trust Escrow Ledger.</p>
                <p>2. Logistics must initiate upon cryptographic verification receipt.</p>
                <p>3. Unilateral cancellation subject to 5% penalty fee.</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-[#D1C7B3]/10 flex justify-between items-center print:hidden">
              <button onClick={() => setActiveContract(null)} className="text-[9px] font-black uppercase text-[#D1C7B3]/50 hover:text-red-400 flex items-center gap-2"><X size={14} /> Close</button>
              <button onClick={handlePrint} className="px-6 py-3 bg-[#D1C7B3] text-[#030508] rounded-md text-[9px] font-black uppercase flex items-center gap-2"><Printer size={14} /> Export</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#D1C7B3]/20 px-4 py-3 flex justify-between items-center z-50 shadow-2xl pb-[calc(0.7rem+env(safe-area-inset-bottom))] w-full">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 flex-1"><LayoutDashboard size={20} className="text-[#D1C7B3]/40" /><span className="text-[8px] font-bold uppercase text-[#D1C7B3]/40">Port</span></Link>
        <Link href="/trading" className="flex flex-col items-center gap-1 flex-1"><TrendingUp size={20} className="text-[#D1C7B3]/40" /><span className="text-[8px] font-bold uppercase text-[#D1C7B3]/40">Floor</span></Link>
        <Link href="/scanner" className="flex flex-col items-center gap-1 flex-1"><Crosshair size={20} className="text-[#D1C7B3]/40" /><span className="text-[8px] font-bold uppercase text-[#D1C7B3]/40">Scan</span></Link>
        <Link href="/inbox" className="flex flex-col items-center gap-1 flex-1"><MessageSquare size={20} className="text-[#D1C7B3]/40" /><span className="text-[8px] font-bold uppercase text-[#D1C7B3]/40">Comms</span></Link>
      </nav>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight = false }: { label: string, value: any, icon: LucideIcon, highlight?: boolean }) {
  return (
    <div className={`relative p-6 md:p-8 rounded-2xl backdrop-blur-xl overflow-hidden group w-full ${highlight ? 'bg-gradient-to-br from-[#111D36] to-[#0A1428] border border-[#D1C7B3]/30 shadow-2xl' : 'bg-gradient-to-br from-[#111D36]/60 to-[#0A1428]/60 border border-[#D1C7B3]/10'}`}>
      <div className="relative z-10 flex justify-between items-start mb-6 w-full">
        <p className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-[#D1C7B3]' : 'text-[#D1C7B3]/70'}`}>{label}</p>
        <div className={`${highlight ? 'text-[#D1C7B3]' : 'text-[#D1C7B3]/40'}`}><Icon size={18} /></div>
      </div>
      <h3 className="relative z-10 text-2xl md:text-3xl font-serif text-[#F8F5EE] truncate w-full">{value}</h3>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: LucideIcon, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all relative overflow-hidden group w-full ${active ? 'bg-[#D1C7B3]/10 text-[#D1C7B3]' : 'text-[#D1C7B3]/50 hover:text-[#F8F5EE]'}`}>
      {active && <div className="absolute left-0 top-0 w-1 h-full bg-[#D1C7B3]"></div>}
      <Icon size={18} className={active ? 'text-[#D1C7B3]' : 'text-[#D1C7B3]/50'} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
}