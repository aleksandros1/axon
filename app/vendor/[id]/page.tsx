'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, ArrowLeft, MapPin, Building2, ShieldCheck, Gavel, ArrowRight,
  Award, TrendingUp, CheckCircle2, User, Users, Package, ShoppingCart, Loader2
} from 'lucide-react';
import Link from 'next/link';

// Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: useLanguage αντί για useTranslation
import { useLanguage } from '../../../lib/i18n/LanguageContext';

export default function VendorDossier() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  
  // Η ΑΛΛΑΓΗ ΕΓΙΝΕ ΕΔΩ: language & setLanguage αντί για locale & switchLanguage
  const { t, language, setLanguage } = useLanguage(); 

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Real Data States
  const [vendorData, setVendorData] = useState<any>(null);
  const [vendorAssets, setVendorAssets] = useState<any[]>([]);

  useEffect(() => {
    const fetchVendorData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);

      if (vendorId) {
        // 1. Fetch Vendor Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (profileData) {
          setVendorData(profileData);
        }

        // 2. Fetch Vendor's AVAILABLE Slabs
        const { data: slabsData } = await supabase
          .from('slabs')
          .select('*')
          .eq('user_id', vendorId)
          .eq('is_available', true) 
          .order('created_at', { ascending: false });

        if (slabsData) {
          setVendorAssets(slabsData);
        }
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
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Accessing Entity Dossier...</p>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div className="h-[100dvh] w-full bg-[#020509] flex flex-col items-center justify-center text-center p-6">
        <Building2 size={48} className="text-red-500 mb-6" />
        <h1 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.2em] mb-4">Entity Not Found</h1>
        <button onClick={() => router.back()} className="bg-transparent border border-[#A6947D]/50 text-[#A6947D] px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all mt-4">Return</button>
      </div>
    );
  }

  return (
    /* ΣΤΑΘΕΡΟΠΟΙΗΣΗ: w-full και overflow-hidden για να μην κουνιέται η οθόνη */
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-16 h-16 border border-[#A6947D]/20 rounded-full flex items-center justify-center relative mb-6 bg-[#01030A]/20 shadow-lg"><Globe size={24} className="text-[#A6947D]"/></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/20 p-1 rounded-lg">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'el' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT - NO OVERFLOW-X */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar w-full">
        {/* BACKGROUND ICON - LOCKED */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Globe size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        {/* VENDOR HEADER - STABILIZED */}
        <div className="relative border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-md z-10 w-full">
          <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto w-full">
            <button onClick={() => router.back()} className="flex items-center space-x-2 text-[#A6947D] hover:text-[#F8F5EE] transition-colors mb-6 group w-fit">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Back to Network</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 md:gap-8 animate-in fade-in duration-700 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full overflow-hidden">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#020509] border border-[#A6947D]/30 flex items-center justify-center flex-none shadow-lg">
                  <Building2 size={28} className="text-[#A6947D]" />
                </div>
                
                <div className="overflow-hidden w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-widest bg-[#A6947D]/10 border border-[#A6947D]/20 px-2 py-0.5 rounded">
                      {vendorData.role === 'buyer' ? 'Buyer Entity' : 'Vendor Entity'}
                    </span>
                    {vendorData.status === 'verified' && (
                      <span className="flex items-center gap-1 text-[8px] md:text-[9px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck size={10} /> Verified
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-4xl font-serif text-[#F8F5EE] mb-2 leading-tight truncate w-full">{vendorData.company_name || vendorData.email}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#F8F5EE]/60 font-mono uppercase tracking-widest">
                    {vendorData.country && <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#A6947D]" /> {vendorData.country}</span>}
                    <span className="flex items-center gap-1.5"><Award size={12} className="text-[#A6947D]" /> Master Node</span>
                  </div>
                </div>
              </div>

              <div className="flex-none w-full lg:w-auto mt-4 lg:mt-0">
                <button 
                  onClick={handleMessageVendor}
                  disabled={currentUser?.id === vendorId}
                  className="w-full lg:w-auto bg-[#A6947D] text-[#020509] font-bold uppercase tracking-widest px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-xl disabled:opacity-50"
                >
                  <MessageSquare size={16} />
                  <span className="text-[10px] md:text-xs">{currentUser?.id === vendorId ? 'Self View' : 'Initiate Secure Comms'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-12 relative z-10 w-full">
          
          {/* INTEL GRID - STABILIZED */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 animate-in fade-in duration-700 delay-100 w-full">
            <div className="lg:col-span-2 bg-[#01030A]/60 backdrop-blur-sm border border-[#A6947D]/10 p-5 md:p-8 rounded-2xl w-full">
              <h3 className="text-[9px] md:text-[10px] text-[#A6947D] font-bold uppercase tracking-[0.2em] mb-4 border-b border-[#A6947D]/10 pb-3 flex items-center gap-2"><Globe size={14}/> Entity Intel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
                <div><p className="text-[8px] text-[#A6947D]/60 uppercase font-bold mb-1">Entity Name</p><p className="text-xs md:text-sm font-serif text-[#F8F5EE] uppercase truncate">{vendorData.company_name || 'N/A'}</p></div>
                <div><p className="text-[8px] text-[#A6947D]/60 uppercase font-bold mb-1">Email</p><p className="text-xs font-mono text-[#F8F5EE]/80 truncate">{vendorData.email}</p></div>
                <div><p className="text-[8px] text-[#A6947D]/60 uppercase font-bold mb-1">Origin</p><p className="text-xs text-[#F8F5EE]/80 truncate">{vendorData.country || 'Global'}</p></div>
                <div><p className="text-[8px] text-[#A6947D]/60 uppercase font-bold mb-1">Role</p><p className="text-xs text-[#F8F5EE]/80 capitalize">{vendorData.role || 'Member'}</p></div>
              </div>
            </div>
            
            <div className="bg-[#01030A]/60 border border-[#A6947D]/10 p-5 md:p-8 rounded-2xl w-full">
              <h3 className="text-[9px] md:text-[10px] text-[#A6947D] font-bold uppercase tracking-[0.2em] mb-4 border-b border-[#A6947D]/10 pb-3 flex items-center gap-2"><BarChart3 size={14}/> Node Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                  <span className="text-[8px] text-[#A6947D]/80 font-bold uppercase tracking-widest">Network Status</span>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${vendorData.status === 'verified' ? 'text-emerald-400' : 'text-amber-500'}`}>{vendorData.status === 'verified' ? 'Verified' : 'Pending'}</span>
                </div>
                <div className="flex justify-between items-center bg-[#020509] border border-[#A6947D]/10 p-3.5 rounded-xl shadow-inner">
                  <span className="text-[8px] text-[#A6947D]/80 font-bold uppercase tracking-widest">Active Listings</span>
                  <span className="text-lg font-mono text-[#F8F5EE]">{vendorAssets.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASSET CATALOG - STABILIZED GRID */}
          <div className="animate-in fade-in duration-700 delay-200 w-full overflow-hidden">
            <div className="flex flex-col mb-6 md:mb-8 border-b border-[#A6947D]/20 pb-4">
              <h3 className="text-[9px] text-[#A6947D] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2"><Package size={14}/> Asset Catalog</h3>
              <p className="text-lg md:text-xl font-serif text-[#F8F5EE] uppercase tracking-widest">Floor Inventory</p>
            </div>

            {vendorAssets.length === 0 ? (
              <div className="bg-[#01030A]/60 border border-[#A6947D]/10 rounded-2xl p-10 md:p-20 text-center flex flex-col items-center w-full">
                <Package size={30} className="text-[#A6947D]/30 mb-4" />
                <p className="text-[9px] text-[#A6947D]/60 font-mono uppercase tracking-widest">Zero Public Assets Detected.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 w-full overflow-hidden">
                {vendorAssets.map((asset) => {
                  const pModel = asset.pricing_model === 'ROQ' ? 'ROQ' : 'PUBLIC';
                  return (
                  <div key={asset.id} className="bg-[#01030A]/90 border border-[#A6947D]/15 rounded-2xl overflow-hidden hover:border-[#A6947D]/40 transition-all duration-300 flex flex-col relative w-full shadow-lg group">
                    
                    <Link href={`/trading/${asset.id}`} className="block h-44 md:h-52 bg-[#020509] relative overflow-hidden border-b border-[#A6947D]/10">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#01030A] to-transparent z-10 opacity-70"></div>
                      <div className={`absolute bottom-3 right-3 z-20 backdrop-blur-md border px-2 py-1 rounded shadow-lg flex items-center gap-1 text-[7px] font-bold uppercase tracking-widest ${pModel === 'ROQ' ? 'bg-amber-900/40 border-amber-500/50 text-amber-400' : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400'}`}>
                        {pModel === 'ROQ' ? <Lock size={10}/> : <ShoppingCart size={10}/>} {pModel}
                      </div>
                      {asset.image_url ? <img src={asset.image_url} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all" /> : <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={40}/></div>}
                      <div className="absolute bottom-3 left-3 z-20 pr-16 overflow-hidden">
                        <p className="text-[7px] text-[#A6947D] font-mono tracking-widest uppercase mb-0.5">AX-{asset.id.substring(0,8)}</p>
                        <h4 className="text-base font-serif uppercase text-[#F8F5EE] truncate">{asset.material}</h4>
                      </div>
                    </Link>

                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-end mb-4">
                        {pModel === 'ROQ' ? (
                          <div className="text-amber-400 text-[8px] font-bold uppercase bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">Quote Req.</div>
                        ) : (
                          <div><p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">Value</p><p className="text-sm md:text-base font-mono text-[#F8F5EE]">{formatCurrency(asset.price)}</p></div>
                        )}
                        <div className="text-right"><p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">Quantity</p><p className="text-sm md:text-base font-mono text-[#F8F5EE]">{asset.quantity} <span className="text-[8px] text-[#A6947D]">m²</span></p></div>
                      </div>
                      <Link href={`/trading/${asset.id}`} className="mt-auto w-full border border-[#A6947D]/20 text-[#A6947D] text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-xl transition-all flex items-center justify-between px-3">
                        <span>Details</span><ArrowRight size={12}/>
                      </Link>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* MOBILE NAV - STABILIZED */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-4 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold">Port</span></Link>
        <Link href="/network" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1"><Users size={20} /><span className="text-[8px] uppercase font-bold">Net</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Globe size={20} /><span className="text-[8px] uppercase font-bold">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative flex-1"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold">Comms</span></Link>
      </nav>
    </div>
  );
}