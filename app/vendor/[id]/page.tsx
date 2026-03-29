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
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', vendorId)
          .single();

        if (profileData) {
          setVendorData(profileData);
        }

        // 2. Fetch Vendor's AVAILABLE Slabs
        const { data: slabsData, error: slabsError } = await supabase
          .from('slabs')
          .select('*')
          .eq('user_id', vendorId)
          .eq('is_available', true) // Δείχνουμε μόνο τα διαθέσιμα
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

  // ΓΕΦΥΡΑ ΕΠΙΚΟΙΝΩΝΙΑΣ: Στέλνει τον αγοραστή κατευθείαν στο Inbox, προ-επιλέγοντας αυτή την εταιρεία
  const handleMessageVendor = () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    router.push(`/inbox?chat=${vendorId}`);
  };

  const formatCurrency = (amount: string | number) => {
    if (!amount) return 'N/A';
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (loading) {
    return <div className="h-screen bg-[#020509] flex flex-col items-center justify-center text-[#A6947D] animate-pulse"><Loader2 size={32} className="animate-spin mb-4" /><p className="font-mono text-[10px] uppercase tracking-[0.3em]">Accessing Entity Dossier...</p></div>;
  }

  if (!vendorData) {
    return <div className="h-screen bg-[#020509] flex flex-col items-center justify-center text-center p-6"><Building2 size={48} className="text-red-500 mb-6" /><h1 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.2em] mb-4">Entity Not Found</h1><button onClick={() => router.back()} className="bg-transparent border border-[#A6947D]/50 text-[#A6947D] hover:border-[#A6947D] hover:text-[#F8F5EE] px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all mt-4">Return to Network</button></div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans">
      
      {/* MASTER SIDEBAR */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-16 h-16 border border-[#A6947D]/20 rounded-full flex items-center justify-center relative mb-6 bg-[#01030A]/20 shadow-[0_0_25px_rgba(166,148,125,0.08)]"><Globe size={24} className="text-[#A6947D]"/></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1 text-[#F8F5EE]">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        {/* LANGUAGE SWITCHER IN SIDEBAR */}
        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/20 p-1 rounded-lg shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'el' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EL</button>
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
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 fixed"><Globe size={800} className="text-[#A6947D]" /></div>
        
        {/* VENDOR HEADER (Banner Area) */}
        <div className="relative border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-md z-10">
          <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto">
            <button onClick={() => router.back()} className="flex items-center space-x-2 text-[#A6947D] hover:text-[#F8F5EE] transition-colors mb-8 group w-fit">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Back to Network</span>
            </button>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 animate-in fade-in duration-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Company Logo Placeholder */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[#020509] border border-[#A6947D]/30 flex items-center justify-center flex-none shadow-[0_0_30px_rgba(166,148,125,0.1)]">
                  <Building2 size={32} className="text-[#A6947D] md:w-10 md:h-10" />
                </div>
                
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2 md:mb-3">
                    <span className="text-[9px] md:text-[10px] text-[#A6947D] uppercase font-bold tracking-widest bg-[#A6947D]/10 border border-[#A6947D]/20 px-2 py-0.5 rounded shadow-sm">
                      {vendorData.role === 'buyer' ? 'Buyer Entity' : 'Vendor Entity'}
                    </span>
                    {vendorData.status === 'verified' && (
                      <span className="flex items-center gap-1 text-[9px] md:text-[10px] text-emerald-500 font-bold uppercase tracking-[0.15em] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck size={12} /> Verified Node
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] mb-3 leading-none truncate max-w-2xl">{vendorData.company_name || vendorData.email}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-[#F8F5EE]/60 font-mono">
                    {vendorData.country && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#A6947D]" /> {vendorData.country}</span>}
                    <span className="flex items-center gap-1.5"><Award size={14} className="text-[#A6947D]" /> AXON Member</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTON */}
              <div className="flex-none w-full lg:w-auto mt-4 lg:mt-0">
                <button 
                  onClick={handleMessageVendor}
                  disabled={currentUser?.id === vendorId}
                  className="w-full lg:w-auto bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-widest px-6 md:px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(166,148,125,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare size={16} />
                  <span>{currentUser?.id === vendorId ? 'Your Profile' : 'Initiate Secure Comms'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-12 max-w-7xl mx-auto space-y-12 relative z-10">
          
          {/* INTEL & METRICS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in duration-700 delay-100">
            <div className="lg:col-span-2 bg-[#01030A]/60 backdrop-blur-sm border border-[#A6947D]/10 p-6 md:p-8 rounded-2xl">
              <h3 className="text-[10px] md:text-[11px] text-[#A6947D] font-bold uppercase tracking-[0.2em] mb-4 md:mb-5 border-b border-[#A6947D]/10 pb-3 flex items-center gap-2"><Globe size={14}/> Entity Intel</h3>
              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Company Name</p>
                      <p className="text-sm font-serif text-[#F8F5EE] uppercase">{vendorData.company_name || 'Not Provided'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Contact Email</p>
                      <p className="text-xs md:text-sm font-mono text-[#F8F5EE]/80">{vendorData.email}</p>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Country / HQ</p>
                      <p className="text-sm font-sans text-[#F8F5EE]/80">{vendorData.country || 'International'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Network Role</p>
                      <p className="text-sm font-sans text-[#F8F5EE]/80 capitalize">{vendorData.role || 'Member'}</p>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="bg-[#01030A]/60 backdrop-blur-sm border border-[#A6947D]/10 p-6 md:p-8 rounded-2xl">
              <h3 className="text-[10px] md:text-[11px] text-[#A6947D] font-bold uppercase tracking-[0.2em] mb-4 md:mb-5 border-b border-[#A6947D]/10 pb-3 flex items-center gap-2"><BarChart3 size={14}/> Platform Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#020509] border border-[#A6947D]/10 p-4 rounded-xl shadow-inner">
                  <span className="text-[9px] md:text-xs text-[#A6947D]/80 font-bold uppercase tracking-widest">Network Status</span>
                  <span className={`text-xs md:text-sm font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 ${vendorData.status === 'verified' ? 'text-emerald-400' : 'text-amber-500'}`}>{vendorData.status === 'verified' ? <><CheckCircle2 size={14} /> Verified</> : 'Pending'}</span>
                </div>
                <div className="flex justify-between items-center bg-[#020509] border border-[#A6947D]/10 p-4 rounded-xl shadow-inner">
                  <span className="text-[9px] md:text-xs text-[#A6947D]/80 font-bold uppercase tracking-widest">Active Listings</span>
                  <span className="text-lg md:text-xl font-mono text-[#F8F5EE]">{vendorAssets.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ASSET CATALOG (To Οπλοστάσιο) */}
          <div className="animate-in fade-in duration-700 delay-200">
            <div className="flex justify-between items-end mb-6 md:mb-8 border-b border-[#A6947D]/20 pb-4">
              <div>
                <h3 className="text-[10px] md:text-[11px] text-[#A6947D] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2"><Package size={14}/> Asset Catalog</h3>
                <p className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-widest">Active Floor Inventory</p>
              </div>
            </div>

            {vendorAssets.length === 0 ? (
              <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-2xl p-12 md:p-20 text-center flex flex-col items-center shadow-sm">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-[#A6947D]/20 flex items-center justify-center mb-6 bg-[#A6947D]/5"><Package size={32} className="text-[#A6947D]/40 md:w-10 md:h-10" /></div>
                <h3 className="text-lg md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.15em] mb-3">No Active Inventory</h3>
                <p className="text-[9px] md:text-xs text-[#A6947D]/60 font-mono uppercase tracking-widest max-w-md">This entity currently has no available assets listed on the public floor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {vendorAssets.map((asset) => {
                  const pModel = asset.pricing_model === 'ROQ' ? 'ROQ' : 'PUBLIC';
                  
                  return (
                  <div key={asset.id} className="bg-[#01030A]/90 backdrop-blur-xl border border-[#A6947D]/15 rounded-2xl overflow-hidden hover:border-[#A6947D]/50 hover:shadow-[0_0_30px_rgba(166,148,125,0.1)] transition-all duration-500 group flex flex-col relative shadow-lg">
                    
                    <Link href={`/trading/${asset.id}`} className="block h-48 md:h-56 bg-[#020509] relative overflow-hidden border-b border-[#A6947D]/15">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#01030A] to-transparent z-10 opacity-80"></div>
                      
                      {/* ROQ / PUBLIC BADGE */}
                      <div className={`absolute bottom-3 right-3 z-20 backdrop-blur-md border px-2 py-1 rounded shadow-lg flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest ${pModel === 'ROQ' ? 'bg-amber-900/40 border-amber-500/50 text-amber-400' : 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400'}`}>
                        {pModel === 'ROQ' ? <Lock size={10}/> : <ShoppingCart size={10}/>}
                        {pModel === 'ROQ' ? 'ROQ' : 'PUBLIC'}
                      </div>

                      {asset.image_url ? (
                        <img src={asset.image_url} alt={asset.material} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={48} className="text-[#A6947D]" /></div>
                      )}
                      
                      <div className="absolute bottom-3 left-3 z-20 pr-20">
                        <p className="text-[8px] md:text-[9px] text-[#A6947D] font-mono tracking-widest uppercase mb-1">AX-{asset.id.substring(0,8)}</p>
                        <h4 className="text-lg md:text-xl font-serif uppercase text-[#F8F5EE] leading-none truncate">{asset.material}</h4>
                      </div>
                    </Link>

                    <div className="p-4 md:p-5 flex flex-col flex-1 bg-[#01030A]/60">
                      <div className="flex justify-between items-end mb-4">
                        {pModel === 'ROQ' ? (
                          <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                            <Lock size={12}/>
                            <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Request Quote</span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">{t('scanner.valuation').split(' (')[0]}</p>
                            <p className="text-base md:text-lg font-mono text-[#F8F5EE]">{formatCurrency(asset.price)}</p>
                          </div>
                        )}
                        <div className="text-right">
                          <p className="text-[8px] md:text-[9px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">{t('scanner.quantity').split(' (')[0]}</p>
                          <p className="text-base md:text-lg font-mono text-[#F8F5EE]">{asset.quantity} <span className="text-[10px] text-[#A6947D]">m²</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-[#020509] border border-[#A6947D]/10 rounded p-2 shadow-inner"><p className="text-[7px] text-[#A6947D]/50 uppercase tracking-widest">{t('scanner.thickness').split(' (')[0]}</p><p className="text-[10px] font-mono text-[#F8F5EE]/80 mt-0.5">{asset.thickness} cm</p></div>
                        <div className="bg-[#020509] border border-[#A6947D]/10 rounded p-2 shadow-inner"><p className="text-[7px] text-[#A6947D]/50 uppercase tracking-widest">{t('scanner.origin').split(' /')[0]}</p><p className="text-[10px] font-mono text-[#F8F5EE]/80 mt-0.5 truncate">{asset.origin || 'N/A'}</p></div>
                      </div>

                      <Link href={`/trading/${asset.id}`} className="mt-auto w-full border border-[#A6947D]/20 hover:bg-[#A6947D]/10 text-[#A6947D] hover:text-[#F8F5EE] text-[9px] md:text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all flex items-center justify-between px-4 group">
                        <span>Access Dossier</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
          
        </div>
      </main>

      {/* MOBILE NAV WITH TRANSLATIONS */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/90 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><BarChart3 size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/network" className="text-[#A6947D] p-2 flex flex-col items-center gap-1"><Users size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.network').substring(0,3)}</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><Globe size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative"><MessageSquare size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.comms').substring(0,5)}</span></Link>
        <Link href="/me" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative"><User size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}