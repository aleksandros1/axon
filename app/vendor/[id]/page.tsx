'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, ArrowLeft, MapPin, Building2, ShieldCheck, Gavel, ArrowRight,
  Award, TrendingUp, CheckCircle2, User, Users, Package, Loader2
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
      <div className="h-[100dvh] w-full bg-[#000000] flex flex-col items-center justify-center text-[#A6947D] animate-pulse">
        <div className="w-12 h-12 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-[9px] uppercase tracking-[0.4em]">Accessing Entity Dossier</p>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="h-[100dvh] w-full bg-[#000000] flex flex-col items-center justify-center text-center p-6">
        <Building2 size={40} className="text-red-500 mb-6 stroke-1" />
        <h1 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-4">Entity Not Found</h1>
        <button onClick={() => router.back()} className="bg-transparent border border-gray-800 text-gray-500 hover:text-white px-8 py-4 rounded-sm text-[10px] font-bold uppercase tracking-[0.3em] transition-all mt-4">Return to Network</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 bg-[#000000] shadow-[0_0_15px_rgba(166,148,125,0.1)]"><Globe size={18} className="text-[#A6947D]"/></div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#000000] border border-gray-800 p-1 rounded-sm shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'en' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'el' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-4 px-4 py-3.5 bg-[#050505] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-inner"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
        
        {/* VENDOR HEADER - BANKING STYLE */}
        <div className="relative border-b border-gray-900 bg-[#020202]/90 backdrop-blur-xl z-10 w-full pt-8 pb-6 px-5 md:px-12">
          <div className="max-w-6xl mx-auto w-full">
            <button onClick={() => router.back()} className="flex items-center space-x-2 text-gray-500 hover:text-[#A6947D] transition-colors mb-8 group w-fit">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" strokeWidth={1.5} />
              <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Return to Network</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 animate-in fade-in duration-500 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full overflow-hidden">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-sm bg-[#050505] border border-gray-800 flex items-center justify-center flex-none shadow-xl">
                  <Building2 size={28} className="text-[#A6947D]" strokeWidth={1} />
                </div>
                
                <div className="overflow-hidden w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-[8px] text-gray-400 font-mono uppercase tracking-[0.3em] bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-sm">
                      {vendorData.role === 'buyer' ? 'Buyer Entity' : 'Vendor Entity'}
                    </span>
                    {vendorData.status === 'verified' && (
                      <span className="flex items-center gap-1.5 text-[8px] text-emerald-500 font-mono uppercase tracking-[0.3em] bg-emerald-950/30 px-2.5 py-1 rounded-sm border border-emerald-900/50">
                        <ShieldCheck size={10} /> Verified Node
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-4xl font-serif text-white mb-2 leading-tight truncate w-full tracking-wide">{vendorData.company_name || vendorData.email}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">
                    {vendorData.country && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#A6947D]" /> {vendorData.country}</span>}
                    <span className="flex items-center gap-1.5"><Award size={12} className="text-[#A6947D]" /> Master Node</span>
                  </div>
                </div>
              </div>

              <div className="flex-none w-full lg:w-auto mt-4 lg:mt-0">
                <button 
                  onClick={handleMessageVendor}
                  disabled={currentUser?.id === vendorId}
                  className="w-full lg:w-auto h-14 md:h-16 bg-white text-black font-extrabold uppercase tracking-[0.3em] px-8 rounded-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.05)] disabled:opacity-20"
                >
                  <MessageSquare size={16} strokeWidth={2} />
                  <span className="text-[9px] md:text-[10px]">{currentUser?.id === vendorId ? 'SELF VIEW' : 'SECURE COMMS'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 md:p-12 max-w-6xl mx-auto space-y-8 md:space-y-12 relative z-10 w-full">
          
          {/* INTEL GRID - VAULT STYLE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-8 animate-in fade-in duration-500 delay-100 w-full">
            
            <div className="lg:col-span-2 bg-[#050505] border border-gray-900 p-6 md:p-8 rounded-sm w-full shadow-2xl">
              <h3 className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-6 border-b border-gray-900 pb-4 flex items-center gap-2">
                <Globe size={14} className="text-[#A6947D]"/> Corporate Intel
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full">
                <div><p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em] mb-1.5">Registered Entity</p><p className="text-sm font-serif text-white uppercase tracking-widest truncate">{vendorData.company_name || 'N/A'}</p></div>
                <div><p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em] mb-1.5">Secure Transmissions</p><p className="text-xs font-mono text-gray-300 truncate">{vendorData.email}</p></div>
                <div><p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em] mb-1.5">Jurisdiction</p><p className="text-xs font-mono text-gray-300 truncate uppercase">{vendorData.country || 'Global'}</p></div>
                <div><p className="text-[8px] text-gray-600 font-mono uppercase tracking-[0.2em] mb-1.5">Access Level</p><p className="text-xs font-mono text-gray-300 uppercase">{vendorData.role || 'Member'}</p></div>
              </div>
            </div>
            
            <div className="bg-[#050505] border border-gray-900 p-6 md:p-8 rounded-sm w-full shadow-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-6 border-b border-gray-900 pb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-[#A6947D]"/> System Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#020202] border border-gray-800 p-4 rounded-sm shadow-inner">
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.2em]">Trust Clearance</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${vendorData.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>{vendorData.status === 'verified' ? 'Verified' : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#020202] border border-gray-800 p-4 rounded-sm shadow-inner">
                    <span className="text-[8px] text-gray-500 font-mono uppercase tracking-[0.2em]">Active Assets</span>
                    <span className="text-sm font-mono text-white">{vendorAssets.length}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ASSET CATALOG - SHARP GRID */}
          <div className="animate-in fade-in duration-500 delay-200 w-full overflow-hidden">
            <div className="flex flex-col mb-8 border-b border-gray-900 pb-5">
              <h3 className="text-[9px] text-[#A6947D] font-mono uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                <Package size={14}/> Asset Catalog
              </h3>
              <p className="text-xl md:text-2xl font-serif text-white tracking-wide">Public Inventory</p>
            </div>

            {vendorAssets.length === 0 ? (
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center w-full shadow-2xl">
                <Package size={32} className="text-gray-800 mb-5" strokeWidth={1} />
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">Zero Public Assets Provisioned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full overflow-hidden pb-10">
                {vendorAssets.map((asset) => {
                  const pModel = asset.pricing_model === 'ROQ' ? 'ROQ' : 'PUBLIC';
                  return (
                  <div key={asset.id} className="bg-[#050505] border border-gray-900 hover:border-[#A6947D]/50 rounded-sm overflow-hidden transition-all duration-500 flex flex-col relative w-full shadow-xl group">
                    
                    <Link href={`/trading/${asset.id}`} className="block aspect-[4/3] bg-[#020202] relative overflow-hidden border-b border-gray-900">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10 opacity-90"></div>
                      
                      {/* Badge */}
                      <div className={`absolute top-3 right-3 z-20 border px-2.5 py-1 rounded-sm shadow-lg flex items-center gap-1.5 text-[7px] font-mono uppercase tracking-[0.2em] backdrop-blur-md ${pModel === 'ROQ' ? 'bg-amber-950/50 border-amber-900/50 text-amber-500' : 'bg-white/5 border-gray-700 text-white'}`}>
                        {pModel === 'ROQ' ? <Lock size={10} strokeWidth={2}/> : <Globe size={10} strokeWidth={2}/>} {pModel}
                      </div>

                      {/* Image */}
                      {asset.image_url ? (
                        <img src={asset.image_url} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-5"><Package size={48} strokeWidth={1}/></div>
                      )}
                      
                      {/* Title Overlay */}
                      <div className="absolute bottom-4 left-4 z-20 pr-4 overflow-hidden">
                        <p className="text-[8px] text-[#A6947D] font-mono tracking-[0.3em] uppercase mb-1">AX-{asset.id.substring(0,8)}</p>
                        <h4 className="text-base font-serif uppercase text-white tracking-widest truncate">{asset.material}</h4>
                      </div>
                    </Link>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-end mb-6">
                        {pModel === 'ROQ' ? (
                          <div className="text-amber-500 text-[8px] font-mono uppercase tracking-[0.2em] bg-amber-950/30 px-3 py-1.5 rounded-sm border border-amber-900/50">Quote on Request</div>
                        ) : (
                          <div>
                            <p className="text-[7px] text-gray-600 font-mono uppercase tracking-[0.2em] mb-1">Valuation</p>
                            <p className="text-sm font-mono text-white">{formatCurrency(asset.price)}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[7px] text-gray-600 font-mono uppercase tracking-[0.2em] mb-1">Volume</p>
                          <p className="text-sm font-mono text-white">{asset.quantity} <span className="text-[9px] text-gray-600">m²</span></p>
                        </div>
                      </div>
                      <Link href={`/trading/${asset.id}`} className="mt-auto w-full bg-[#020202] border border-gray-800 hover:border-[#A6947D]/50 text-[#A6947D] text-[9px] font-bold uppercase tracking-[0.2em] py-3.5 rounded-sm transition-all flex items-center justify-between px-4 group/btn">
                        <span>Access Data</span><ArrowRight size={12} className="text-gray-600 group-hover/btn:text-[#A6947D] group-hover/btn:translate-x-1 transition-all"/>
                      </Link>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MOBILE NAV - PRECISION INSTRUMENT STYLE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020202]/95 backdrop-blur-2xl border-t border-gray-900 px-2 py-2 flex justify-between items-center z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-[64px]">
        <Link href="/dashboard" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Port</span></Link>
        <Link href="/network" className="text-[#A6947D] flex flex-col items-center gap-1 flex-1"><Users size={20} strokeWidth={2} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Net</span></Link>
        <Link href="/trading" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Floor</span></Link>
        <Link href="/inbox" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">Comms</span></Link>
      </nav>
    </div>
  );
}