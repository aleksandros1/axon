'use client';

import LanguageSwitcher from './components/LanguageSwitcher';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; 
import { useLanguage } from '../lib/i18n/LanguageContext';
import { 
  Shield, Globe, Lock, ArrowRight, ChevronRight, 
  BarChart3, Building2, CheckCircle2, Hexagon, Activity, Anchor, Maximize2, 
  ShieldCheck, X, Zap, Briefcase, Scale, Smartphone, Laptop
} from 'lucide-react';

export default function LandingPage() {
  const { t, language } = useLanguage();
  
  const [featuredSlab, setFeaturedSlab] = useState<any>(null);
  const [loadingSlab, setLoadingSlab] = useState(true);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  useEffect(() => {
    const fetchRandomSlab = async () => {
      setLoadingSlab(true);
      const { count, error: countError } = await supabase
        .from('slabs')
        .select('*', { count: 'exact', head: true }); 

      if (countError) {
        console.error('Error fetching count:', countError);
        setLoadingSlab(false);
        return;
      }

      if (count && count > 0) {
        const randomOffset = Math.floor(Math.random() * count);
        const { data, error } = await supabase
          .from('slabs')
          .select('*')
          .range(randomOffset, randomOffset)
          .single();

        if (error) {
          console.error('Error fetching random slab:', error);
        } else if (data) {
          setFeaturedSlab(data);
        }
      }
      setLoadingSlab(false);
    };
    fetchRandomSlab();
  }, []); 

  const axonServices = [
    {
      title: "Institutional Escrow",
      desc: language === 'el' 
        ? "Διασφάλιση κεφαλαίων μέσω έξυπνων συμβολαίων Stripe Connect. Τα χρήματα αποδεσμεύονται μόνο με την επιβεβαίωση των όρων." 
        : "Securing funds through Stripe Connect smart contracts. Funds are released only upon verification of terms.",
      icon: <Lock size={20} className="text-emerald-500" />
    },
    {
      title: "Global KYC/AML",
      desc: language === 'el'
        ? "Αυστηρή ταυτοποίηση εταιρικών οντοτήτων. Συναλλαγές μόνο μεταξύ επαληθευμένων και αξιόπιστων επιχειρήσεων."
        : "Strict identification of corporate entities. Transactions only between verified and trusted businesses.",
      icon: <ShieldCheck size={20} className="text-[#A6947D]" />
    },
    {
      title: "Live Trading Floor",
      desc: language === 'el'
        ? "Πρόσβαση σε πραγματικό χρόνο στο παγκόσμιο απόθεμα premium μαρμάρων απευθείας από τα λατομεία."
        : "Real-time access to global premium marble inventory directly from quarries.",
      icon: <Activity size={20} className="text-[#A6947D]" />
    },
    {
      title: "Digital Title Deeds",
      desc: language === 'el'
        ? "Κάθε bundle υλικού συνοδεύεται από ψηφιακό τίτλο ιδιοκτησίας και πιστοποιητικά γνησιότητας."
        : "Each material bundle is accompanied by a digital title deed and authenticity certificates.",
      icon: <Briefcase size={20} className="text-[#A6947D]" />
    },
    {
      title: "Logistics Framework",
      desc: language === 'el'
        ? "Τυποποιημένες διαδικασίες βασισμένες σε Incoterms (EXW, FOB, CIF) για απόλυτη σαφήνεια στις μεταφορές."
        : "Standardized procedures based on Incoterms (EXW, FOB, CIF) for absolute clarity in logistics.",
      icon: <Anchor size={20} className="text-[#A6947D]" />
    },
    {
      title: "Market Intelligence",
      desc: language === 'el'
        ? "Προηγμένα analytics και δεδομένα τιμολόγησης για στρατηγικές αποφάσεις αγοράς και πώλησης."
        : "Advanced analytics and pricing data for strategic buying and selling decisions.",
      icon: <BarChart3 size={20} className="text-[#A6947D]" />
    }
  ];

  const defaultImageUrl = 'https://marble.com/art/wp-content/uploads/img/marble_Calacatta_Oro.jpg';

  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 overflow-x-hidden relative">
      
      {/* --- SERVICES MODAL OVERLAY --- */}
      {isServicesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div 
            className="absolute inset-0 bg-[#020509]/95 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setIsServicesOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-4xl bg-[#01030A] border border-[#A6947D]/30 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_100px_rgba(166,148,125,0.15)] animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] w-full">
            <button 
              onClick={() => setIsServicesOpen(false)}
              className="absolute top-6 right-6 md:top-8 md:right-8 text-[#A6947D] hover:text-[#F8F5EE] transition-colors p-2 bg-[#A6947D]/10 rounded-full"
            >
              <X size={20}/>
            </button>

            <div className="mb-10 md:mb-12">
              <h2 className="text-3xl md:text-5xl font-serif uppercase tracking-widest text-[#F8F5EE] mb-4">{t('landing.ecosystem_title')}</h2>
              <p className="text-[10px] md:text-xs font-mono text-[#A6947D] uppercase tracking-[0.4em]">{t('landing.ecosystem_subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
              {axonServices.map((service, idx) => (
                <div key={idx} className="group p-6 md:p-6 rounded-3xl border border-[#A6947D]/10 bg-[#A6947D]/5 hover:border-[#A6947D]/40 transition-all duration-500">
                  <div className="mb-5 md:mb-5 p-4 md:p-3 bg-[#020509] border border-[#A6947D]/20 w-fit rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <h3 className="text-sm md:text-base font-serif uppercase tracking-widest text-[#F8F5EE] mb-3 md:mb-3">{service.title}</h3>
                  <p className="text-xs md:text-xs text-[#F8F5EE]/60 md:text-[#F8F5EE]/50 leading-relaxed font-sans group-hover:text-[#F8F5EE]/80 transition-colors">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#A6947D]/5 rounded-full blur-[120px] shrink-0"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-900/5 rounded-full blur-[120px] shrink-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598305001402-997f64d0d366?q=80&w=2000&auto=format&fit=crop')] opacity-5 mix-blend-overlay bg-cover bg-center shrink-0"></div>
      </div>

      {/* NAVIGATION */}
      <nav className="relative z-50 border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-md sticky top-0 w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-[#A6947D] md:w-7 md:h-7" />
            <span className="text-2xl md:text-2xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">AXON</span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <LanguageSwitcher />
            <Link href="/auth" className="bg-[#A6947D] text-[#020509] px-5 py-3 md:px-6 md:py-2.5 rounded-lg text-[11px] md:text-[10px] font-bold uppercase tracking-[0.15em] transition-all shadow-xl">
              {t('auth.request_access').substring(0, 10)}...
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-24 md:pt-32 pb-24 md:pb-48 px-4 md:px-6 min-h-[90vh] flex items-center w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-16 items-center w-full overflow-hidden">
          
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
            <div className="inline-flex items-center gap-2 border border-[#A6947D]/30 bg-[#A6947D]/5 px-4 py-2 md:py-1.5 rounded-full mb-8 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-2 h-2 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] md:text-[9px] font-mono text-[#A6947D] uppercase tracking-widest">{t('landing.network_online')}</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif text-[#F8F5EE] uppercase tracking-[0.05em] leading-tight mb-8 md:mb-6 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
              {t('landing.hero_title_1')} <br/> <span className="text-[#A6947D] italic font-light">{t('landing.hero_title_2')}</span> {t('landing.hero_title_3')}
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg text-[#F8F5EE]/70 md:text-[#F8F5EE]/60 font-sans max-w-2xl mb-12 md:mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {t('landing.hero_subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <Link href="/auth" className="w-full sm:w-auto bg-[#F8F5EE] text-[#020612] px-8 py-5 md:py-4 rounded-xl text-xs md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl group">
                {t('landing.hero_btn')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform md:w-3.5 md:h-3.5" />
              </Link>
              
              <button 
                onClick={() => setIsServicesOpen(true)}
                className="w-full sm:w-auto bg-transparent border border-[#A6947D]/30 text-[#A6947D] px-8 py-5 md:py-4 rounded-xl text-xs md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                <Zap size={16} className="md:w-3.5 md:h-3.5" /> {t('landing.services_btn')}
              </button>
            </div>
          </div>

          {/* FEATURED ASSET CARD */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-in fade-in zoom-in duration-1000 delay-400 w-full">
            <div className="bg-[#01030A] border border-[#A6947D]/30 rounded-3xl p-5 md:p-4 w-full max-w-sm relative shadow-2xl transition-all duration-500 hover:border-[#A6947D] overflow-hidden">
                <div className="relative aspect-[4/3] bg-[#020509] rounded-2xl overflow-hidden border border-[#A6947D]/20 shadow-inner">
                    {loadingSlab ? (
                        <div className="w-full h-full bg-[#A6947D]/5 animate-pulse flex items-center justify-center">
                            <Maximize2 size={24} className="text-[#A6947D]/20 animate-spin" />
                        </div>
                    ) : (
                        <img 
                          src={featuredSlab?.image_url || defaultImageUrl} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-700" 
                        />
                    )}
                    <div className="absolute top-4 left-4 md:top-3 md:left-3 bg-[#020509]/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] md:text-[7px] font-mono text-amber-400 uppercase tracking-widest border border-amber-500/20">
                        {t('landing.verified_asset')} AX-{featuredSlab?.id ? featuredSlab.id.slice(0,5) : 'XXXXX'}
                    </div>
                </div>

                <div className="pt-5 px-2 pb-2 md:pt-4 md:px-1 md:pb-1 w-full">
                  <div className="flex justify-between items-start mb-3 md:mb-2">
                      <div className="overflow-hidden">
                        <h4 className="text-sm md:text-xs font-serif uppercase tracking-[0.1em] text-[#F8F5EE] truncate">
                            {featuredSlab?.material || "Premium Selection"}
                        </h4>
                        <p className="text-[10px] md:text-[8px] font-mono text-[#A6947D]/80 uppercase tracking-widest mt-1 md:mt-0.5">{t('landing.slab_bundle')}</p>
                      </div>
                      <Link href="/auth" className="text-[#A6947D] p-2 md:p-1.5 bg-[#020509] rounded-full border border-[#A6947D]/30 transition-colors flex-none"><Maximize2 size={16} className="md:w-3 md:h-3"/></Link>
                  </div>
                  <p className="text-lg md:text-sm font-mono text-emerald-400 tracking-tighter">
                    {featuredSlab?.price 
                      ? `€${featuredSlab.price.toLocaleString(language === 'el' ? 'el-GR' : 'en-US')}` 
                      : '---'} 
                    <span className="text-[10px] md:text-[8px] font-sans text-[#A6947D]/60 uppercase ml-1.5 md:ml-1">{t('landing.per_bundle')}</span>
                  </p>
                </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* METRICS BAR */}
      <section className="relative z-10 border-y border-[#A6947D]/10 bg-[#01030A]/50 backdrop-blur-sm w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-10 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 md:gap-4 divide-y-0 md:divide-y-0 md:divide-x divide-[#A6947D]/10 w-full">
          <div className="flex flex-col items-center text-center w-full">
            <Globe size={24} className="text-[#A6947D] mb-3 md:w-4 md:h-4 md:mb-3" />
            <p className="text-3xl md:text-3xl font-mono text-[#F8F5EE] mb-2 md:mb-1">40+</p>
            <p className="text-[10px] md:text-[9px] uppercase tracking-widest text-[#A6947D]/60 font-bold">{t('landing.countries_connected')}</p>
          </div>
          <div className="flex flex-col items-center text-center w-full">
            <Lock size={24} className="text-emerald-500 mb-3 md:w-4 md:h-4 md:mb-3" />
            <p className="text-3xl md:text-3xl font-mono text-[#F8F5EE] mb-2 md:mb-1">€0</p>
            <p className="text-[10px] md:text-[9px] uppercase tracking-widest text-[#A6947D]/60 font-bold">{t('landing.counterparty_risk')}</p>
          </div>
          <div className="flex flex-col items-center text-center w-full pt-8 md:pt-0 border-t border-[#A6947D]/10 md:border-none">
            <Building2 size={24} className="text-[#A6947D] mb-3 md:w-4 md:h-4 md:mb-3" />
            <p className="text-3xl md:text-3xl font-mono text-[#F8F5EE] mb-2 md:mb-1">KYC</p>
            <p className="text-[10px] md:text-[9px] uppercase tracking-widest text-[#A6947D]/60 font-bold">{t('landing.verified_entities')}</p>
          </div>
          <div className="flex flex-col items-center text-center w-full pt-8 md:pt-0 border-t border-[#A6947D]/10 md:border-none">
            <Anchor size={24} className="text-[#A6947D] mb-3 md:w-4 md:h-4 md:mb-3" />
            <p className="text-3xl md:text-3xl font-mono text-[#F8F5EE] mb-2 md:mb-1">2026</p>
            <p className="text-[10px] md:text-[9px] uppercase tracking-widest text-[#A6947D]/60 font-bold">{t('landing.standard_incoterms')}</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-[#A6947D]/10 bg-[#020509] py-10 md:py-10 text-center w-full">
        <div className="flex items-center justify-center gap-2 mb-5 md:mb-4 text-[#A6947D]">
          <Shield size={18} className="md:w-3.5 md:h-3.5" />
          <span className="text-sm md:text-xs font-serif uppercase tracking-[0.2em]">AXON</span>
        </div>
        <p className="text-[10px] md:text-[8px] font-mono uppercase tracking-widest text-[#F8F5EE]/50 md:text-[#F8F5EE]/40 leading-relaxed px-6">
          &copy; {new Date().getFullYear()} {t('landing.footer_text')} <br className="hidden md:block"/>
          {t('landing.footer_sub')}
        </p>
      </footer>

    </div>
  );
}