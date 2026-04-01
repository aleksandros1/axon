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

  // Monochromatic Luxury Colors for Pie Chart
  const COLORS = ['#222222', '#333333', '#111111', '#0a0a0a'];
  const pieData = Object.keys(portfolio.reduce((acc: any, s: any) => { acc[s.material || 'Asset'] = (acc[s.material] || 0) + 1; return acc; }, {})).map(key => ({ name: key, value: 1 }));

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased print:bg-white print:text-black">
      
      {/* VERIFICATION OVERLAY */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/30 rounded-full flex items-center justify-center animate-spin-slow shadow-[0_0_30px_rgba(166,148,125,0.1)]">
              <Shield size={32} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border-[0.5px] border-[#A6947D]/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-lg md:text-xl font-serif uppercase tracking-[0.3em] text-white mb-6 font-light">
            {verificationStep === 1 ? 'Encrypting Protocol' : verificationStep === 2 ? 'Synchronizing Ledger' : 'Finalizing Settlement'}
          </h2>
          <div className="w-56 h-px bg-gray-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-[#A6947D] transition-all duration-1000 shadow-[0_0_10px_#A6947D]" style={{ width: `${(verificationStep / 3) * 100}%` }}></div>
          </div>
          <p className="mt-6 text-[9px] font-mono text-[#A6947D]/60 uppercase tracking-widest animate-pulse">Zero-Trust Network Verification</p>
        </div>
      )}

      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden print:hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 bg-[#000000] shadow-[0_0_15px_rgba(166,148,125,0.1)]">
            <Globe size={18} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">{t('dashboard.client_terminal')}</p>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <NavItem icon={LayoutDashboard} label={t('menu.portfolio')} active />
          <Link href="/trading"><NavItem icon={TrendingUp} label={t('menu.floor')} /></Link>
          <Link href="/scanner"><NavItem icon={Crosshair} label={t('menu.scanner')} /></Link>
          <Link href="/inbox"><NavItem icon={MessageSquare} label={t('menu.comms')} /></Link>
        </nav>
        
        <div className="p-6 border-t border-gray-900 relative z-10">
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>

        <div className="p-5 md:p-12 max-w-6xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 md:mb-16 animate-in fade-in duration-500">
            <div>
              <p className="text-[#A6947D] font-mono uppercase tracking-[0.4em] text-[8px] flex items-center gap-2 mb-3"><ShieldCheck size={12} /> Encrypted Session</p>
              <h1 className="text-2xl md:text-4xl font-serif text-white uppercase tracking-[0.2em] font-light">{t('menu.portfolio')}</h1>
            </div>
            <Link href="/trading" className="w-full sm:w-auto px-6 py-4 bg-white text-black text-[9px] font-bold uppercase tracking-[0.3em] rounded-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              {language === 'el' ? 'ΑΠΟΚΤΗΣΗ ΥΛΙΚΩΝ' : 'ACQUIRE ASSETS'} <ChevronRight size={14} />
            </Link>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 mb-12 w-full animate-in fade-in duration-500 delay-100">
            <StatCard label={t('dashboard.active_contracts')} value={stats.activeContracts} icon={Briefcase} />
            <StatCard label={t('dashboard.deployed_capital')} value={`€${stats.deployedCapital.toLocaleString()}`} icon={Lock} highlight />
            
            <div className="relative p-6 md:p-8 rounded-sm bg-[#020202] border border-gray-900 shadow-xl flex flex-col justify-between group overflow-hidden">
               {/* Green Glow */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
               
               <div>
                 <p className="text-emerald-500 text-[8px] font-mono uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                   <Zap size={12} className="text-emerald-500"/> {t('dashboard.saved_fees')}
                 </p>
                 <h3 className="text-2xl md:text-3xl font-mono text-emerald-400">+€{stats.savedFees.toLocaleString()}</h3>
               </div>
               <p className="mt-6 pt-4 border-t border-gray-900 text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em]">{t('dashboard.fees_bypassed')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 w-full animate-in fade-in duration-500 delay-200">
            
            <div className="lg:col-span-8 space-y-6 w-full">
              <h3 className="text-[9px] font-mono tracking-[0.3em] uppercase flex items-center gap-2 text-gray-500 mb-6 border-b border-gray-900 pb-4">
                <Navigation size={14} className="text-[#A6947D]"/> Global Routing Matrix
              </h3>
              
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-[#A6947D] animate-pulse">
                  <div className="w-8 h-8 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-4"></div>
                  <span className="font-mono text-[8px] uppercase tracking-[0.4em]">Syncing Ledger...</span>
                </div>
              ) : portfolio.length === 0 ? (
                <div className="py-16 text-center bg-[#050505] border border-gray-900 rounded-sm w-full shadow-xl flex flex-col items-center">
                  <Package size={24} className="text-gray-800 mb-4" strokeWidth={1} />
                  <p className="text-gray-500 text-[9px] font-mono uppercase tracking-[0.3em]">Zero Active Deployments</p>
                </div>
              ) : (
                portfolio.map((asset) => {
                  const stage = getMockShippingStage(asset.id);
                  return (
                  <div key={asset.id} className="p-5 md:p-8 border border-gray-900 bg-[#030303] rounded-sm w-full shadow-2xl relative overflow-hidden group">
                    
                    <div className="flex flex-col sm:flex-row justify-between gap-5 mb-8 relative z-10">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-sm bg-[#000000] border border-gray-800 flex items-center justify-center overflow-hidden flex-none">
                           {asset.image_url ? <img src={asset.image_url} className="w-full h-full object-cover grayscale-[30%]" /> : <Package size={16} className="text-gray-700" />}
                         </div>
                         <div className="overflow-hidden">
                           <p className="text-sm md:text-base font-serif text-white uppercase tracking-widest truncate mb-1">{asset.material}</p>
                           <p className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.3em]">AX-{asset.id.substring(0,8)}</p>
                         </div>
                      </div>
                      <div className="sm:text-right flex-none">
                         <p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.3em] mb-1">Locked Value</p>
                         <span className="text-sm md:text-base font-mono text-white tracking-widest">€{parseInt(asset.price?.replace(/,/g, '') || '0').toLocaleString()}</span>
                      </div>
                    </div>

                    {/* PRECISION PROGRESS BAR */}
                    <div className="relative pt-6 pb-8 w-full overflow-hidden border-t border-gray-900 relative z-10">
                        {/* Background Line */}
                        <div className="absolute top-[39px] left-[15px] right-[15px] h-px bg-gray-900"></div>
                        {/* Active Line */}
                        <div className="absolute top-[39px] left-[15px] h-px bg-[#A6947D] shadow-[0_0_10px_#A6947D] transition-all duration-1000" style={{ width: `calc(${((stage - 1) / 3) * 100}% - 30px)` }}></div>
                        
                        <div className="relative flex justify-between w-full">
                          {[1,2,3,4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-3">
                              <div className={`w-8 h-8 flex items-center justify-center bg-[#030303] z-10 transition-all duration-500 ${stage >= s ? 'text-[#A6947D]' : 'text-gray-800'}`}>
                                {s === 1 && <MapPin size={14} strokeWidth={stage >= s ? 2 : 1.5}/>} 
                                {s === 2 && <ShieldCheck size={14} strokeWidth={stage >= s ? 2 : 1.5}/>} 
                                {s === 3 && <Ship size={14} strokeWidth={stage >= s ? 2 : 1.5}/>} 
                                {s === 4 && <Anchor size={14} strokeWidth={stage >= s ? 2 : 1.5}/>}
                              </div>
                              <span className={`text-[7px] font-mono uppercase tracking-[0.2em] hidden sm:block ${stage >= s ? 'text-[#A6947D]' : 'text-gray-700'}`}>
                                {s === 1 ? 'Origin' : s === 2 ? 'Escrow' : s === 3 ? 'Transit' : 'Port'}
                              </span>
                            </div>
                          ))}
                        </div>
                    </div>

                    <div className="mt-2 pt-5 border-t border-gray-900 flex justify-between items-center relative z-10">
                      <button onClick={() => setAbortingContract(asset)} className="text-[8px] font-mono uppercase tracking-[0.2em] text-red-500/60 hover:text-red-400 transition-colors">Terminate Protocol</button>
                      <button onClick={() => setActiveContract(asset)} className="text-[8px] font-mono uppercase tracking-[0.2em] text-gray-400 hover:text-[#A6947D] transition-colors flex items-center gap-2 group/btn">
                        View Contract <ChevronRight size={10} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                )})
              )}
            </div>

            {/* CHART - HIDDEN ON MOBILE FOR CLARITY */}
            <div className="hidden lg:block lg:col-span-4 w-full">
               <div className="p-8 bg-[#050505] border border-gray-900 rounded-sm w-full shadow-2xl flex flex-col h-full">
                  <h3 className="text-[9px] font-mono tracking-[0.3em] uppercase flex items-center gap-2 text-gray-500 mb-8 border-b border-gray-900 pb-4">
                    <Activity size={14} className="text-[#A6947D]"/> Asset Allocation
                  </h3>
                  <div className="flex-1 flex items-center justify-center relative w-full min-h-[250px]">
                      {portfolio.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={pieData} innerRadius={70} outerRadius={90} dataKey="value" stroke="none">
                                {pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '2px'}} itemStyle={{color: '#fff', fontSize: '10px', fontFamily: 'monospace'}} />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-serif text-white">{stats.activeContracts}</span>
                            <span className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.3em] mt-1">Assets</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-gray-800">
                           {/* ΕΔΩ ΜΠΗΚΕ ΤΟ dataKey="value" ΠΟΥ ΕΛΥΣΕ ΤΟ ΣΦΑΛΜΑ */}
                           <PieChart width={150} height={150}>
                             <Pie data={[{value: 1}]} innerRadius={60} outerRadius={70} fill="#111" stroke="none" dataKey="value"></Pie>
                           </PieChart>
                           <span className="absolute text-[8px] font-mono uppercase tracking-[0.3em]">Empty</span>
                        </div>
                      )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* CANCELLATION MODAL - VAULT STYLE */}
      {abortingContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeAbortModal}></div>
          <div className="relative w-full max-w-md bg-[#030303] border border-gray-800 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8 md:p-10 animate-in zoom-in-95 duration-300">
            {waiverStatus === 'idle' && (
              <div className="text-center">
                <AlertTriangle size={32} className="mx-auto mb-6 text-red-500" strokeWidth={1.5} />
                <h2 className="text-xl font-serif uppercase tracking-[0.2em] text-white mb-2">Protocol Termination</h2>
                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Irreversible Action</p>
                
                <div className="bg-[#050505] border border-red-900/30 rounded-sm p-6 text-left my-8 shadow-inner">
                  <p className="text-[9px] text-gray-400 uppercase font-mono tracking-[0.2em] mb-4 flex items-center justify-between">
                    <span>Target Asset</span> <span className="text-white truncate max-w-[150px]">{abortingContract.material}</span>
                  </p>
                  <div className="flex justify-between items-center border-t border-gray-900 pt-5">
                    <span className="text-[9px] text-red-500 font-mono uppercase tracking-[0.2em]">Protocol Penalty (5%)</span>
                    <span className="text-sm font-mono text-red-500 tracking-widest">-€{(parseInt(abortingContract.price?.replace(/,/g, '') || '0') * PENALTY_FEE_PERCENTAGE).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button onClick={handleMutualWaiver} className="w-full py-4 bg-white text-black rounded-sm text-[9px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gray-200 transition-colors shadow-lg">
                    <Handshake size={14} /> Request Mutual Waiver
                  </button>
                  <button onClick={handleUnilateralAbort} className="w-full py-4 border border-gray-800 text-red-500 rounded-sm text-[9px] font-mono uppercase tracking-[0.3em] hover:bg-red-950/20 transition-colors">
                    Unilateral Exit (Accept Penalty)
                  </button>
                </div>
              </div>
            )}
            {waiverStatus === 'negotiating' && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 mx-auto border-[0.5px] border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
                <h2 className="text-sm font-mono uppercase tracking-[0.4em] text-[#A6947D] animate-pulse">Negotiating Terms</h2>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOBILE NAV - PRECISION INSTRUMENT STYLE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020202]/95 backdrop-blur-2xl border-t border-gray-900 px-2 py-2 flex justify-between items-center z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-[64px]">
        <Link href="/dashboard" className="text-[#A6947D] flex flex-col items-center gap-1 flex-1 transition-colors"><LayoutDashboard size={20} strokeWidth={2} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/trading" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><TrendingUp size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/scanner" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><Crosshair size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.scanner').substring(0,4)}</span></Link>
        <Link href="/inbox" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.comms').substring(0,5)}</span></Link>
      </nav>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, highlight = false }: { label: string, value: any, icon: LucideIcon, highlight?: boolean }) {
  return (
    <div className={`relative p-6 md:p-8 rounded-sm overflow-hidden group w-full flex flex-col justify-between ${highlight ? 'bg-[#050505] border border-gray-800 shadow-2xl' : 'bg-[#030303] border border-gray-900'}`}>
      
      {/* Glow Effect for Highlight */}
      {highlight && <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-[40px] pointer-events-none"></div>}

      <div className="relative z-10 flex justify-between items-start mb-8 w-full">
        <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${highlight ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
        <div className={`${highlight ? 'text-white' : 'text-gray-700'}`}><Icon size={16} strokeWidth={1.5} /></div>
      </div>
      
      <div>
        <h3 className={`relative z-10 text-2xl md:text-3xl font-mono truncate w-full tracking-wider ${highlight ? 'text-white' : 'text-gray-300'}`}>{value}</h3>
      </div>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: LucideIcon, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-sm cursor-pointer transition-all relative overflow-hidden group w-full ${active ? 'bg-[#050505] border border-gray-800 shadow-inner' : 'text-gray-500 hover:text-white hover:bg-gray-900'}`}>
      {active && <div className="absolute left-0 top-0 w-[2px] h-full bg-[#A6947D] shadow-[0_0_10px_#A6947D]"></div>}
      <Icon size={16} className={active ? 'text-[#A6947D]' : 'text-gray-500'} strokeWidth={active ? 2 : 1.5} />
      <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${active ? 'text-[#A6947D]' : ''}`}>{label}</span>
    </div>
  );
}