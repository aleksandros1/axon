'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, ArrowLeft, MapPin, Building2, ShieldCheck, Gavel, ArrowRight,
  Award, TrendingUp, CheckCircle2, User, Users, Package, Loader2, Menu, X, FileSignature
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../../lib/i18n/LanguageContext';

export default function VendorDossier() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  
  const { t, language, setLanguage } = useLanguage(); 

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [vendorData, setVendorData] = useState<any>(null);
  const [vendorAssets, setVendorAssets] = useState<any[]>([]);

  // --- STATE ΓΙΑ ΤΟ SMART MENU ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);

      if (vendorId) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (profileData) setVendorData(profileData);

        const { data: slabsData } = await supabase
          .from('slabs')
          .select('*')
          .eq('user_id', vendorId)
          .eq('is_available', true) 
          .order('created_at', { ascending: false });

        if (slabsData) setVendorAssets(slabsData);
      }
      setLoading(false);
    };

    fetchVendorData();
  }, [vendorId]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const handleMessageVendor = () => {
    if (!currentUser) { router.push('/auth'); return; }
    router.push(`/inbox?chat=${vendorId}`);
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return 'N/A';
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center text-[#A6947D] animate-pulse">
        <div className="w-12 h-12 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-[9px] uppercase tracking-[0.4em]">Accessing Entity Dossier</p>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center text-center p-6">
        <Building2 size={40} className="text-red-500 mb-6 stroke-1" />
        <h1 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.3em] mb-4">Entity Not Found</h1>
        <button onClick={() => router.back()} className="bg-transparent border border-[#A6947D]/30 text-[#A6947D] hover:text-[#F8F5EE] hover:bg-[#A6947D]/10 px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all mt-4">Return to Network</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* --------------------------------------------------------- */}
      {/* EXECUTIVE COMMAND OVERLAY (THE SMART MENU) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#A6947D]" />
              <h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">Command Center</h2>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">Core Modules</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard/bids" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Gavel size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Offers</span>
              </Link>
              <Link href="/contracts" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <FileSignature size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Deals Vault</span>
              </Link>
              <Link href="/scanner" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Crosshair size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">AI Scanner</span>
              </Link>
              <Link href="/network" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/30 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/20 transition-colors shadow-inner">
                <Users size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Network</span>
              </Link>
              <Link href="/me" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner col-span-2">
                <User size={24} className="text-[#A6947D]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE]">Profile Settings</span>
              </Link>
            </div>

            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">System</p>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest">
              <LogOut size={16} /> Disconnect Session
            </button>
          </div>
        </div>
      )}
      {/* --------------------------------------------------------- */}

      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A] shadow-[0_0_15px_rgba(166,148,125,0.05)]">
            <Globe size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/10 p-1 rounded-lg shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-2 text-[9px] font-bold tracking-widest rounded-md transition-all ${language === 'en' ? 'bg-[#A6947D]/20 text-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-2 text-[9px] font-bold tracking-widest rounded-md transition-all ${language === 'el' ? 'bg-[#A6947D]/20 text-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE WATERMARK */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Building2 size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        {/* VENDOR HEADER - BANKING STYLE */}
        <div className="relative border-b border-[#A6947D]/10 bg-[#01030A]/90 backdrop-blur-xl z-10 w-full pt-8 pb-6 px-5 md:px-12">
          <div className="max-w-6xl mx-auto w-full">
            <button onClick={() => router.back()} className="flex items-center space-x-2 text-[#A6947D]/60 hover:text-[#A6947D] transition-colors mb-8 group w-fit">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Return to Network</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 animate-in fade-in duration-500 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full overflow-hidden">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#020509] border border-[#A6947D]/20 flex items-center justify-center flex-none shadow-inner">
                  <Building2 size={28} className="text-[#A6947D]" strokeWidth={1} />
                </div>
                
                <div className="overflow-hidden w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest bg-[#020509] border border-[#A6947D]/20 px-2.5 py-1 rounded-lg">
                      {vendorData.role === 'buyer' ? 'Buyer Entity' : 'Vendor Entity'}
                    </span>
                    {vendorData.status === 'verified' && (
                      <span className="flex items-center gap-1.5 text-[8px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        <ShieldCheck size={10} /> Verified Node
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-4xl font-serif text-[#F8F5EE] mb-2 leading-tight truncate w-full tracking-wider">{vendorData.company_name || vendorData.email}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest">
                    {vendorData.country && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#A6947D]" /> {vendorData.country}</span>}
                    <span className="flex items-center gap-1.5"><Award size={12} className="text-[#A6947D]" /> Master Node</span>
                  </div>
                </div>
              </div>

              <div className="flex-none w-full lg:w-auto mt-4 lg:mt-0">
                <button 
                  onClick={handleMessageVendor}
                  disabled={currentUser?.id === vendorId}
                  className="w-full lg:w-auto h-14 md:h-16 bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-widest px-8 rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(166,148,125,0.2)] disabled:opacity-50"
                >
                  <MessageSquare size={16} strokeWidth={2.5} />
                  <span className="text-[9px] md:text-[10px]">{currentUser?.id === vendorId ? 'SELF VIEW' : 'SECURE COMMS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-12 max-w-6xl mx-auto space-y-8 md:space-y-12 relative z-10 w-full">
          
          {/* INTEL GRID - VAULT STYLE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 animate-in fade-in duration-500 delay-100 w-full">
            
            <div className="lg:col-span-2 bg-[#01030A] border border-[#A6947D]/20 p-6 md:p-8 rounded-2xl w-full shadow-lg">
              <h3 className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest mb-6 border-b border-[#A6947D]/10 pb-4 flex items-center gap-2">
                <Globe size={14} className="text-[#A6947D]"/> Corporate Intel
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full">
                <div><p className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1.5">Registered Entity</p><p className="text-sm font-serif text-[#F8F5EE] uppercase tracking-widest truncate">{vendorData.company_name || 'N/A'}</p></div>
                <div><p className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1.5">Secure Transmissions</p><p className="text-xs font-mono text-[#F8F5EE]/80 truncate">{vendorData.email}</p></div>
                <div><p className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1.5">Jurisdiction</p><p className="text-xs font-mono text-[#F8F5EE]/80 truncate uppercase">{vendorData.country || 'Global'}</p></div>
                <div><p className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1.5">Access Level</p><p className="text-xs font-mono text-[#F8F5EE]/80 uppercase">{vendorData.role || 'Member'}</p></div>
              </div>
            </div>
            
            <div className="bg-[#01030A] border border-[#A6947D]/20 p-6 md:p-8 rounded-2xl w-full shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="text-[9px] text-[#A6947D]/80 font-bold uppercase tracking-widest mb-6 border-b border-[#A6947D]/10 pb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-[#A6947D]"/> System Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#020509] border border-[#A6947D]/10 p-4 rounded-xl shadow-inner">
                    <span className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest">Trust Clearance</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${vendorData.status === 'verified' ? 'text-emerald-400' : 'text-amber-400'}`}>{vendorData.status === 'verified' ? 'Verified' : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#020509] border border-[#A6947D]/10 p-4 rounded-xl shadow-inner">
                    <span className="text-[8px] text-[#A6947D]/60 font-bold uppercase tracking-widest">Active Assets</span>
                    <span className="text-sm font-mono text-[#F8F5EE]">{vendorAssets.length}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ASSET CATALOG - SHARP GRID */}
          <div className="animate-in fade-in duration-500 delay-200 w-full overflow-hidden">
            <div className="flex flex-col mb-8 border-b border-[#A6947D]/10 pb-5">
              <h3 className="text-[9px] text-[#A6947D] font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Package size={14}/> Asset Catalog
              </h3>
              <p className="text-xl md:text-2xl font-serif text-[#F8F5EE] tracking-wider">Public Inventory</p>
            </div>

            {vendorAssets.length === 0 ? (
              <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-12 md:p-24 text-center flex flex-col items-center w-full shadow-lg">
                <Package size={32} className="text-[#A6947D]/30 mb-5" strokeWidth={1} />
                <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-[0.3em]">Zero Public Assets Provisioned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full overflow-hidden pb-10">
                {vendorAssets.map((asset) => {
                  const pModel = asset.pricing_model === 'ROQ' ? 'ROQ' : 'PUBLIC';
                  return (
                  <div key={asset.id} className="bg-[#01030A] border border-[#A6947D]/20 hover:border-[#A6947D]/50 rounded-2xl overflow-hidden transition-all duration-500 flex flex-col relative w-full shadow-lg group">
                    
                    <Link href={`/trading/${asset.id}`} className="block aspect-[4/3] bg-[#020509] relative overflow-hidden border-b border-[#A6947D]/10">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#01030A] via-transparent to-transparent z-10 opacity-90"></div>
                      
                      {/* Badge */}
                      <div className={`absolute top-3 right-3 z-20 border px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 text-[7px] font-bold uppercase tracking-widest backdrop-blur-md ${pModel === 'ROQ' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#020509]/80 border-[#A6947D]/30 text-[#F8F5EE]'}`}>
                        {pModel === 'ROQ' ? <Lock size={10} strokeWidth={2}/> : <Globe size={10} strokeWidth={2}/>} {pModel}
                      </div>

                      {/* Image */}
                      {asset.image_url ? (
                        <img src={asset.image_url} alt="" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} strokeWidth={1}/></div>
                      )}
                      
                      {/* Title Overlay */}
                      <div className="absolute bottom-4 left-4 z-20 pr-4 overflow-hidden">
                        <p className="text-[8px] text-[#A6947D] font-mono tracking-widest uppercase mb-1">AX-{asset.id.substring(0,8)}</p>
                        <h4 className="text-base font-serif uppercase text-[#F8F5EE] tracking-widest truncate">{asset.material}</h4>
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-end mb-6">
                        {pModel === 'ROQ' ? (
                          <div className="text-amber-400 text-[8px] font-bold uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">Quote on Request</div>
                        ) : (
                          <div>
                            <p className="text-[7px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1">Valuation</p>
                            <p className="text-sm font-mono text-[#F8F5EE]">{formatCurrency(asset.price)}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[7px] text-[#A6947D]/60 font-bold uppercase tracking-widest mb-1">Volume</p>
                          <p className="text-sm font-mono text-[#F8F5EE]">{asset.quantity} <span className="text-[9px] text-[#A6947D]/60">m²</span></p>
                        </div>
                      </div>
                      <Link href={`/trading/${asset.id}`} className="mt-auto w-full bg-[#020509] border border-[#A6947D]/20 hover:border-[#A6947D]/50 text-[#A6947D] text-[9px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-between px-4 group/btn shadow-inner">
                        <span>Access Data</span><ArrowRight size={12} className="text-[#A6947D]/40 group-hover/btn:text-[#A6947D] group-hover/btn:translate-x-1 transition-all"/>
                      </Link>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FIXED BOTTOM NAVIGATION (THE STRICT 4-BUTTON BAR) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors">
          <MessageSquare size={20} />
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        {/* THE TRIGGER FOR THE COMMAND OVERLAY */}
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}