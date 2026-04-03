'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Building2, ShieldCheck, Users, 
  Loader2, X, Package, ArrowRight, Layers3, UserCircle, Menu,
  MapPin, Layers
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

const ASSET_CATEGORIES = ['All', 'Marble', 'Granite', 'Quartzite', 'Onyx', 'Dolomite', 'Travertine', 'Limestone'];
const ASSET_COUNTRIES = ['All', 'Greece', 'Italy', 'Brazil', 'Turkey', 'Spain', 'India', 'Portugal'];

export default function TradingFloor() {
  const router = useRouter();
  const { language, t } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSlabs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('slabs')
        .select('*, profiles(company_name, status, country)')
        .eq('is_available', true)
        .neq('visibility', 'private')
        .order('created_at', { ascending: false });

      if (!error && data) setSlabs(data);
      setLoading(false);
    };
    fetchSlabs();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };
  const formatCurrencyLocal = (val: any) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

  const filteredSlabs = slabs.filter(slab => {
    const matchesSearch = (slab.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (slab.profiles?.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (slab.material || '').toLowerCase().includes(selectedCategory.toLowerCase());
    const slabCountry = slab.origin || slab.location || slab.profiles?.country || '';
    const matchesCountry = selectedCountry === 'All' || slabCountry.toLowerCase().includes(selectedCountry.toLowerCase());
    return matchesSearch && matchesCategory && matchesCountry;
  });

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans relative antialiased">
      
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">ΚΕΝТΡΟ ΕΠΙΧΕΙΡΗΣΕΩΝ</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Layers3 size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE]">Χαρτοφυλακιο</span></Link>
              <Link href="/trading" className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-xl flex flex-col items-center justify-center gap-3"><Globe size={24} className="text-[#A6947D]" /><span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE]">Δημοσια Αγορα</span></Link>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px]">ΑΠΟΣΥΝΔΕΣΗ</button>
          </div>
        </div>
      )}

      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl fixed h-full">
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <Shield size={24} className="text-[#A6947D] mb-2"/>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase">ΘΕΣΜΙΚΟΥ ΕΠΙΠΕΔΟΥ</p>
        </div>
        <SidebarLanguageSwitcher />
        <nav className="flex-1 px-4 space-y-2 relative z-10 text-[10px] font-bold uppercase tracking-widest">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><Layers3 size={16} /> ΧΑΡΤΟΦΥΛΑΚΙΟ & ΣΥΜΦΩΝΙΕΣ</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><Crosshair size={16} /> ΣΑΡΩΤΗΣ ΥΛΙΚΩΝ</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl border border-[#A6947D]/20"><Globe size={16} /> ΔΗΜΟΣΙΑ ΑΓΟΡΑ</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><Users size={16} /> ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><MessageSquare size={16} /> ΑΣΦΑΛΕΙΣ ΣΥΝΟΜΙΛΙΕΣ</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] transition-all"><UserCircle size={16} /> ΕΤΑΙΡΙΚΟ ΠΡΟΦΙΛ</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2"><LogOut size={16} /> ΑΠΟΣΥΝΔΕΣΗ</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pl-[280px] custom-scrollbar w-full">
        <div className="p-4 md:p-12 max-w-7xl mx-auto w-full">
          <header className="mb-10">
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] mb-8">{language === 'el' ? 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ' : language === 'ru' ? 'ОТКРЫТЫЙ РЫНОК' : 'GLOBAL MARKET'}</h2>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full">
              <div className="flex-1 flex items-center bg-[#01030A] border border-[#A6947D]/20 rounded-xl shadow-inner group focus-within:border-[#A6947D]">
                <div className="pl-5"><Search size={18} className="text-[#A6947D]/40" /></div>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="SEARCH ASSET OR VENDOR..." className="w-full bg-transparent border-none py-4 px-4 text-xs md:text-sm font-mono outline-none text-[#F8F5EE] uppercase" />
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-4 mb-10">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
              <Layers size={14} className="text-[#A6947D] flex-none" />
              {ASSET_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#A6947D] text-[#020509]' : 'bg-[#01030A] border border-[#A6947D]/20 text-[#A6947D]/60'}`}>{cat}</button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 text-[#A6947D] animate-pulse"><Loader2 size={32} className="animate-spin mb-4" /><span className="font-mono text-[10px] uppercase">Querying Ledger</span></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full pb-10">
              {filteredSlabs.map(slab => (
                <div key={slab.id} className="bg-[#01030A] border border-[#A6947D]/15 rounded-2xl overflow-hidden hover:border-[#A6947D]/40 transition-all duration-500 group shadow-lg">
                  <div className="h-48 bg-[#020509] relative cursor-pointer" onClick={() => router.push(`/trading/${slab.id}`)}>
                    {slab.image_url ? <img src={slab.image_url} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" /> : <div className="w-full h-full flex items-center justify-center"><Package size={40} className="opacity-10"/></div>}
                    <div className="absolute top-3 left-3 bg-[#01030A]/80 border border-[#A6947D]/30 px-2 py-1 rounded text-[7px] font-bold text-[#A6947D]">AX-{slab.id.substring(0,8)}</div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-base font-serif text-[#F8F5EE] uppercase truncate mb-4">{slab.material}</h3>
                    <div className="flex justify-between items-end mb-6">
                        <div><p className="text-[7px] text-[#A6947D]/60 uppercase font-bold mb-1">Valuation</p><p className="text-xl font-mono text-[#A6947D]">{formatCurrencyLocal(slab.price)}</p></div>
                    </div>
                    <Link href={`/trading/${slab.id}`} className="w-full bg-[#020509] border border-[#A6947D]/20 hover:border-[#A6947D]/50 text-[#A6947D] text-[9px] font-bold uppercase tracking-widest py-3.5 rounded-xl transition-all flex items-center justify-between px-4 group/btn shadow-inner mt-2"><span>Access Dossier</span><ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-all"/></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 shadow-2xl">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Layers3 size={20} /><span className="text-[8px] uppercase font-bold">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1"><Globe size={20} /><span className="text-[8px] uppercase font-bold">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold">Comms</span></Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 flex-1"><Menu size={20} /><span className="text-[8px] uppercase font-bold">Menu</span></button>
      </nav>
    </div>
  );
}