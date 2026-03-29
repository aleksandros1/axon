'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, ShieldCheck, Activity, Globe, LayoutDashboard, 
  TrendingUp, FileText, Settings, LogOut, ChevronRight, 
  Lock, CheckCircle2, Zap, LucideIcon, Download, Package,
  Ship, MapPin, Truck, Navigation, Anchor, X, Fingerprint, Printer,
  AlertTriangle, XOctagon, Handshake, Loader2, Crosshair, MessageSquare, Shield 
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';

// LANGUAGE SYNC
import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function ClientPortal() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage(); 
  
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeContracts: 0, deployedCapital: 0, savedFees: 0 });
  const [loading, setLoading] = useState(true);
  
  const [activeContract, setActiveContract] = useState<any | null>(null);
  const [abortingContract, setAbortingContract] = useState<any | null>(null);
  const [waiverStatus, setWaiverStatus] = useState<'idle' | 'negotiating' | 'approved'>('idle');

  // VERIFICATION LOGIC STATES
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  
  const PENALTY_FEE_PERCENTAGE = 0.05; 
  const TRADITIONAL_BROKER_FEE = 0.05;

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('slabs')
      .select('*')
      .eq('status', 'IN_ESCROW')
      .order('created_at', { ascending: false });
    
    if (data) {
      setPortfolio(data);
      const deployed = data.reduce((acc, curr) => acc + parseInt(curr.price?.replace(/,/g, '') || '0'), 0);
      setStats({ activeContracts: data.length, deployedCapital: deployed, savedFees: deployed * TRADITIONAL_BROKER_FEE });
    }
    setLoading(false);
  };

  // TRUST ENGINE: ΠΡΩΤΟΚΟΛΛΟ ΕΠΑΛΗΘΕΥΣΗΣ
  const runVerificationProtocol = (callback: () => void) => {
    setIsVerifying(true);
    setVerificationStep(1); 
    setTimeout(() => {
      setVerificationStep(2); 
      setTimeout(() => {
        setVerificationStep(3); 
        setTimeout(() => {
          setIsVerifying(false);
          callback();
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleUnilateralAbort = async () => {
    if (!abortingContract) return;
    runVerificationProtocol(async () => {
      await supabase.from('slabs').update({ status: 'AVAILABLE' }).eq('id', abortingContract.id);
      closeAbortModal();
      fetchClientData();
    });
  };

  const handleMutualWaiver = () => {
    if (!abortingContract) return;
    setWaiverStatus('negotiating');
    setTimeout(() => {
      setWaiverStatus('approved');
      runVerificationProtocol(async () => {
        await supabase.from('slabs').update({ status: 'AVAILABLE' }).eq('id', abortingContract.id);
        setTimeout(() => {
          closeAbortModal();
          fetchClientData();
        }, 1000);
      });
    }, 2500);
  };

  const closeAbortModal = () => { setAbortingContract(null); setWaiverStatus('idle'); };
  const generateHash = (id: string) => `0x${btoa(id + "AXON").replace(/=/g, '').substring(0, 32).toLowerCase()}`;
  const getMockShippingStage = (id: string) => (parseInt(id.substring(0, 8), 16) % 4) + 1;

  const COLORS = ['#D1C7B3', '#1A2E4C', '#8C8270', '#0A1428'];
  const pieData = Object.keys(portfolio.reduce((acc: any, s: any) => { acc[s.material || 'Asset'] = (acc[s.material] || 0) + 1; return acc; }, {})).map(key => ({ name: key, value: 1 }));

  return (
    <div className="min-h-[100dvh] w-full bg-[#060B14] text-[#F8F5EE] font-sans selection:bg-[#D1C7B3]/20 relative overflow-x-hidden print:bg-white print:text-black">
      
      {/* VERIFICATION OVERLAY */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] bg-[#060B14]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#D1C7B3]/20 rounded-full flex items-center justify-center animate-spin-slow">
              <Shield size={40} className="text-[#D1C7B3] animate-pulse" />
            </div>
            <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE] mb-4">
            {verificationStep === 1 ? 'Encrypting Protocol' : verificationStep === 2 ? 'Synchronizing Ledger' : 'Finalizing Settlement'}
          </h2>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(verificationStep / 3) * 100}%` }}></div>
          </div>
          <p className="mt-6 text-[9px] font-mono text-[#D1C7B3] uppercase tracking-widest animate-pulse">Zero-Trust Network Verification</p>
        </div>
      )}

      {/* SIDEBAR - STABILIZED */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-[#D1C7B3]/10 bg-[#060B14]/90 backdrop-blur-xl p-8 hidden lg:flex flex-col z-40 print:hidden">
        <div className="mb-14 flex items-center gap-3">
          <Globe size={18} className="text-[#D1C7B3]" /><h2 className="text-2xl font-black tracking-tighter">AXON<span className="text-[#D1C7B3]">.</span></h2>
        </div>
        <nav className="flex-1 space-y-2">
          <p className="text-[9px] font-black text-[#D1C7B3]/50 uppercase tracking-[0.4em] mb-5">{t('dashboard.client_terminal')}</p>
          <NavItem icon={LayoutDashboard} label={t('menu.portfolio')} active />
          <Link href="/trading"><NavItem icon={TrendingUp} label={t('menu.floor')} /></Link>
          <Link href="/scanner"><NavItem icon={Crosshair} label={t('menu.scanner')} /></Link>
          <Link href="/inbox"><NavItem icon={MessageSquare} label={t('menu.comms')} /></Link>
        </nav>
        <div className="pt-8 border-t border-[#D1C7B3]/10">
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))} className="flex items-center gap-4 text-[#D1C7B3]/40 hover:text-red-400 uppercase text-[10px] font-black tracking-widest"><LogOut size={16} /> {t('common.disconnect')}</button>
        </div>
      </aside>

      <main className="lg:ml-64 p-4 md:p-12 relative z-10 w-full overflow-x-hidden">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
          <div>
            <p className="text-[#D1C7B3] uppercase tracking-[0.5em] text-[9px] font-black flex items-center gap-2"><ShieldCheck size={14} /> Encrypted Session</p>
            <h1 className="text-3xl md:text-5xl font-serif mt-2">{t('menu.portfolio')}</h1>
          </div>
          <Link href="/trading" className="w-full sm:w-auto px-8 py-4 bg-[#D1C7B3] text-[#060B14] text-[9px] font-black uppercase rounded-xl flex items-center justify-center gap-2">
            {language === 'el' ? 'ΑΠΟΚΤΗΣΗ ΥΛΙΚΩΝ' : 'ACQUIRE ASSETS'} <ChevronRight size={14} />
          </Link>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10 w-full">
          <StatCard label={t('dashboard.active_contracts')} value={stats.activeContracts} icon={Briefcase} />
          <StatCard label={t('dashboard.deployed_capital')} value={`€${stats.deployedCapital.toLocaleString()}`} icon={Lock} highlight />
          <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#111D36]/60 to-[#0A1428]/60 border border-[#D1C7B3]/10 shadow-lg group">
             <p className="text-green-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6">{t('dashboard.saved_fees')}</p>
             <h3 className="text-3xl font-serif text-green-400">+€{stats.savedFees.toLocaleString()}</h3>
             <p className="mt-2 text-[8px] text-[#D1C7B3]/50 uppercase">{t('dashboard.fees_bypassed')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          <div className="lg:col-span-8 space-y-6 w-full">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3 text-[#D1C7B3] mb-4"><Navigation size={14} /> Global Routing Matrix</h3>
            {portfolio.length === 0 ? (
              <div className="py-12 text-center text-[#D1C7B3]/40 text-[9px] uppercase border border-dashed border-[#D1C7B3]/10 rounded-xl">No active escrow deployments.</div>
            ) : (
              portfolio.map((asset) => {
                const stage = getMockShippingStage(asset.id);
                return (
                <div key={asset.id} className="p-4 md:p-6 border border-[#D1C7B3]/10 bg-[#060B14]/60 rounded-xl w-full">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded bg-[#111D36] border border-[#D1C7B3]/20 flex items-center justify-center overflow-hidden">
                         {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover" /> : <Package size={16} className="text-[#D1C7B3]/20" />}
                       </div>
                       <div className="overflow-hidden">
                         <p className="text-[10px] font-black text-[#F8F5EE] truncate">{asset.material}</p>
                         <p className="text-[8px] text-[#D1C7B3]/60 uppercase">AX-{asset.id.substring(0,8)}</p>
                       </div>
                    </div>
                    <div className="sm:text-right">
                       <p className="text-[8px] text-[#D1C7B3]/40 uppercase">Locked Value</p>
                       <span className="text-sm font-mono text-[#F8F5EE]">€{parseInt(asset.price?.replace(/,/g, '') || '0').toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="relative pt-4 pb-6 w-full overflow-hidden">
                      <div className="absolute top-[28px] left-[10px] right-[10px] h-[2px] bg-white/5 rounded-full"></div>
                      <div className="absolute top-[28px] left-[10px] h-[2px] bg-[#D1C7B3] shadow-[0_0_10px_#D1C7B3] rounded-full transition-all duration-1000" style={{ width: `calc(${((stage - 1) / 3) * 100}% - 20px)` }}></div>
                      <div className="relative flex justify-between w-full">
                        {[1,2,3,4].map((s) => (
                          <div key={s} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#060B14] z-10 transition-all ${stage >= s ? 'border-[#D1C7B3] text-[#D1C7B3]' : 'border-white/10 text-white/10'}`}>
                            {s === 1 && <MapPin size={12}/>} {s === 2 && <ShieldCheck size={12}/>} {s === 3 && <Ship size={12}/>} {s === 4 && <Anchor size={12}/>}
                          </div>
                        ))}
                      </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex justify-between">
                    <button onClick={() => setAbortingContract(asset)} className="text-[8px] font-black uppercase text-red-500/60 hover:text-red-400">Terminate Agreement</button>
                    <button onClick={() => setActiveContract(asset)} className="text-[8px] font-black uppercase text-[#D1C7B3]">View Smart Contract</button>
                  </div>
                </div>
              )})
            )}
          </div>

          <div className="lg:col-span-4 w-full">
             <div className="p-8 bg-gradient-to-br from-[#111D36]/40 to-[#0A1428]/40 border border-[#D1C7B3]/10 rounded-2xl w-full">
                <h3 className="text-[10px] font-black uppercase mb-8 text-center text-[#D1C7B3]">Asset Allocation</h3>
                <div className="h-56 flex items-center justify-center relative w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart><Pie data={pieData} innerRadius={60} outerRadius={80} dataKey="value">{pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black">{stats.activeContracts}</span><span className="text-[7px] uppercase opacity-50">Assets</span>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* CANCELLATION MODAL - STABILIZED */}
      {abortingContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#060B14]/95 backdrop-blur-md" onClick={closeAbortModal}></div>
          <div className="relative w-full max-w-md bg-[#030508] border border-[#D1C7B3]/20 rounded-2xl shadow-2xl p-6 md:p-10 animate-in zoom-in-95">
            {waiverStatus === 'idle' && (
              <div className="text-center">
                <AlertTriangle size={40} className="mx-auto mb-6 text-red-500 animate-pulse" />
                <h2 className="text-xl md:text-2xl font-serif text-[#F8F5EE] mb-1">Contract Termination</h2>
                <div className="bg-[#030508] border border-red-500/20 rounded-xl p-5 text-left my-6">
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
          </div>
        </div>
      )}

      {/* MOBILE NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#D1C7B3]/20 px-6 py-4 flex justify-between items-center z-50 shadow-2xl pb-[calc(1rem+env(safe-area-inset-bottom))] w-full">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 flex-1 text-[#D1C7B3]"><LayoutDashboard size={20}/></Link>
        <Link href="/trading" className="flex flex-col items-center gap-1 flex-1 text-[#D1C7B3]/40"><TrendingUp size={20}/></Link>
        <Link href="/scanner" className="flex flex-col items-center gap-1 flex-1 text-[#D1C7B3]/40"><Crosshair size={20}/></Link>
        <Link href="/inbox" className="flex flex-col items-center gap-1 flex-1 text-[#D1C7B3]/40"><MessageSquare size={20}/></Link>
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