'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight, 
  Trash2, Handshake, ExternalLink, Calendar, AlertOctagon, RotateCcw, X, Loader2,
  Bell, Check, User, Target, Wallet, ArrowRight, FileSignature, Scale, Ship, ShieldCheck, Lock, Edit, ShoppingCart, Send, Menu, Search
} from 'lucide-react';
import Link from 'next/link';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

const stripePromise = loadStripe('pk_test_51TBwXT1RTGOC3MKLvHSA6uyyLoE1PaPGVb46ogLGueeTPnGEq5F0wZfFLE0c9FqHQRwB5aP8FsRbluepidkYreT700CBUJiDPV');

export default function PortfolioDashboard() {
  const router = useRouter();
  
  // FIXED: Destructure all needed language variables
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Fix: Initial active tab for My Assets
  const [activeTab, setActiveTab] = useState<'assets' | 'private' | 'tracked' | 'incoming' | 'outgoing'>('assets');
  
  const [mySlabs, setMySlabs] = useState<any[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
  const [outgoingOffers, setOutgoingOffers] = useState<any[]>([]);
  const [trackedSlabs, setTrackedSlabs] = useState<any[]>([]);
  const [escrowTotal, setEscrowTotal] = useState(0);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // --- PREMIUM MOBILE MENU STATE ---
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- MODALS STATE ---
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    material: '', price: '', origin: '', location: '', thickness: '', quantity: '', incoterm: 'EXW', description: '', visibility: 'public', pricing_model: 'PUBLIC'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      
      const user = session.user;
      setCurrentUser(user);

      // Fetch My Assets
      const { data: slabsData } = await supabase.from('slabs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (slabsData) setMySlabs(slabsData);

      // Fetch Tracked Assets
      const { data: vaultData } = await supabase
        .from('saved_assets')
        .select(`
          slab_id,
          slabs (*, profiles(company_name, status))
        `)
        .eq('user_id', user.id);

      if (vaultData) {
        const cleanTracked = vaultData.map((item: any) => item.slabs).filter(Boolean);
        setTrackedSlabs(cleanTracked);
      }

      // Fetch Notifications
      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs);

      // Fetch Offers
      const { data: offersData } = await supabase.from('messages').select('*').eq('is_offer', true).or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`).order('created_at', { ascending: false });

      if (offersData) {
        const inc = offersData.filter(o => o.receiver_id === user.id);
        const out = offersData.filter(o => o.sender_id === user.id);

        const profileIds = [...new Set(offersData.map(o => o.sender_id === user.id ? o.receiver_id : o.sender_id))];
        const { data: profilesData } = await supabase.from('profiles').select('id, company_name, email').in('id', profileIds);

        const getContactName = (id: string) => {
          const p = profilesData?.find(p => p.id === id);
          return p ? (p.company_name || p.email) : 'Unknown Entity';
        };

        setIncomingOffers(inc.map(o => ({ ...o, contactName: getContactName(o.sender_id) })));
        setOutgoingOffers(out.map(o => ({ ...o, contactName: getContactName(o.receiver_id) })));
      }

      // Fetch Contracts for Escrow Total
      const { data: contractsData } = await supabase
        .from('contracts')
        .select('price, status')
        .or(`buyer_id.eq.${user.id},vendor_id.eq.${user.id}`);

      if (contractsData) {
        const activeStatuses = ['pending', 'funded', 'shipped'];
        const total = contractsData
          .filter(c => activeStatuses.includes(c.status))
          .reduce((acc, curr) => {
            const priceString = curr.price?.toString() || '0';
            const cleanPrice = parseFloat(priceString.replace(/\./g, '').replace(/,/g, '.'));
            return acc + (cleanPrice || 0);
          }, 0);
        setEscrowTotal(total);
      }

      setLoading(false);
    };
    fetchDashboardData();
  }, [router]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const deleteSlab = async (id: string) => {
    if (confirm(language === 'el' ? 'ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το Asset;' : 'WARNING: Are you sure you want to delete this Asset?')) {
      setMySlabs(mySlabs.filter(s => s.id !== id)); 
      await supabase.from('slabs').delete().eq('id', id).eq('user_id', currentUser.id);
    }
  };

  // --- EDIT ASSET LOGIC ---
  const openEditModal = (slab: any) => {
    setEditingSlab(slab);
    setEditForm({
      material: slab.material || '',
      price: slab.price || '',
      origin: slab.origin || '',
      location: slab.location || '',
      thickness: slab.thickness || '',
      quantity: slab.quantity || '',
      incoterm: slab.incoterm || 'EXW',
      description: slab.description || '',
      visibility: slab.visibility || 'public',
      pricing_model: slab.pricing_model || 'PUBLIC'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('slabs')
        .update({
          material: editForm.material,
          price: editForm.price,
          origin: editForm.origin,
          location: editForm.location,
          thickness: editForm.thickness,
          quantity: editForm.quantity,
          incoterm: editForm.incoterm,
          description: editForm.description,
          visibility: editForm.visibility,
          pricing_model: editForm.pricing_model,
          is_vault: editForm.visibility === 'private'
        })
        .eq('id', editingSlab.id);

      if (error) throw error;

      setMySlabs(prev => prev.map(s => s.id === editingSlab.id ? { ...s, ...editForm, is_vault: editForm.visibility === 'private' } : s));
      setIsEditModalOpen(false);
      setEditingSlab(null);
    } catch (error: any) {
      alert(`Update Error: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- ESCROW TERMINATION (REFUND) LOGIC ---
  const openRefundModal = (deal: any) => {
    setSelectedDeal(deal);
    setRefundType('full');
    setRefundAmount('');
    setRefundSuccess(false);
    setIsRefundModalOpen(true);
  };

  const executeRefund = async () => {
    setIsRefunding(true);
    const paymentIntentId = selectedDeal?.stripe_payment_id || 'pi_TEST_DUMMY_ID'; 
    const amountToRefund = refundType === 'partial' ? parseFloat(refundAmount) : null;

    try {
      await fetch('/api/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId, amountToRefund }) });
      if (selectedDeal?.id) {
        await supabase.from('messages').delete().eq('id', selectedDeal.id);
        setIncomingOffers(prev => prev.filter(offer => offer.id !== selectedDeal.id));
        setOutgoingOffers(prev => prev.filter(offer => offer.id !== selectedDeal.id));
      }
      setRefundSuccess(true);
      setTimeout(() => { setIsRefundModalOpen(false); setSelectedDeal(null); }, 2500);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRefunding(false);
    }
  };

  // --- MATH FIX ---
  const publicAssets = mySlabs.filter(slab => slab.visibility !== 'private');
  const privateAssets = mySlabs.filter(slab => slab.visibility === 'private');

  const myPortfolioValue = publicAssets.reduce((acc, slab) => {
    const val = typeof slab.price === 'string' ? parseFloat(slab.price.replace(/\./g, '').replace(/,/g, '.')) : (slab.price || 0);
    return acc + val;
  }, 0);

  const trackedVaultValue = trackedSlabs.reduce((acc, slab) => {
    const val = typeof slab.price === 'string' ? parseFloat(slab.price.replace(/\./g, '').replace(/,/g, '.')) : (slab.price || 0);
    return acc + val;
  }, 0);

  // Helper function to render menu links
  const NavLinks = ({ onClick = () => {} }) => (
    <nav className="space-y-2 relative z-10 px-1">
      <Link href="/dashboard" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 bg-gradient-to-r from-[#0a0a0a] to-[#010101] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
      <Link href="/scanner" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
      <Link href="/trading" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
      <Link href="/network" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Users size={16} /> {t('menu.network')}</Link>
      <Link href="/contracts" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><FileSignature size={16} /> deals</Link>
      <Link href="/inbox" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
      <Link href="/me" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><User size={16} /> {t('menu.profile')}</Link>
    </nav>
  );

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* BACKGROUND DEPTH GRADIENT */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(10,10,10,1)_0%,rgba(0,0,0,1)_100%)] pointer-events-none z-0"></div>

      {/* --- PREMIUM MOBILE MENU OVERLAY --- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl p-6 flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-gray-900 pb-5 mb-10 bg-[#020202] px-4 py-3 -mx-6 -mt-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-[#A6947D]/50 rounded-sm flex items-center justify-center bg-[#000000] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"><Shield size={16} className="text-[#A6947D]"/></div>
              <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] leading-none">AXON</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-red-500 p-2.5 rounded-sm hover:bg-gray-900"><X size={22}/></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            <NavLinks onClick={() => setMobileMenuOpen(false)} />
          </div>
          <div className="p-6 -mx-6 -mb-6 border-t border-gray-900 bg-[#020202] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors w-full justify-center py-3.5 border border-red-900/50 bg-red-950/20 rounded-sm"><LogOut size={16} /> {t('common.disconnect')}</button></div>
        </div>
      )}

      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#020202] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.03] pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-8 bg-[#000000]">
          <div className="w-11 h-11 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 shadow-[0_0_20px_rgba(166,148,125,0.15),inset_0_1px_1px_rgba(255,255,255,0.05)] bg-[#000000]">
            <Shield size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2.5">AXON</h1>
          <p className="text-[#A6947D]/80 text-[7px] font-mono uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <NavLinks />

        <div className="p-6 border-t border-gray-900 relative z-10 mt-auto bg-[#000000]"><button onClick={handleLogout} className="text-gray-600 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors w-full justify-center py-3 border border-gray-800 hover:border-red-900/50 hover:bg-red-950/10 rounded-sm"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar w-full z-10">
        {/* BACKGROUND ICON - CONTAINED */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-[0.15] z-0"></div>
        
        <div className="p-5 md:p-12 lg:p-14 max-w-7xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          {/* MOBILE HEADER (PREMIUM) */}
          <header className="md:hidden flex justify-between items-center border-b border-gray-900 pb-5 mb-10 -mx-5 px-5 bg-[#010101] shadow-xl sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-[#A6947D]/50 rounded-sm flex items-center justify-center bg-[#000000] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"><Shield size={16} className="text-[#A6947D]"/></div>
              <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] leading-none">AXON</h1>
            </div>
            <div className="flex items-center gap-3.5">
               <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 rounded-sm border transition-all relative shadow-inner ${notifications.length > 0 ? 'bg-amber-950/30 border-amber-900/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-[#000000] border-gray-800 text-gray-500'}`}>
                <Bell size={18} strokeWidth={1.5} />
                {notifications.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-black text-[9px] font-bold rounded-sm flex items-center justify-center animate-bounce shadow-lg">{notifications.length}</span>}
              </button>
              <button onClick={() => setMobileMenuOpen(true)} className="text-gray-500 hover:text-white p-2.5 rounded-sm hover:bg-gray-900 transition-colors border border-gray-800 shadow-inner"><Menu size={22}/></button>
            </div>
          </header>

          {/* DESKTOP HEADER */}
          <header className="hidden md:flex mb-14 justify-between items-center animate-in fade-in duration-500 border-b border-gray-900 pb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-[0.2em] font-light">{t('dashboard.title')}</h2>
              <div className="flex items-center gap-3 mt-4"><span className="h-px w-8 bg-[#A6947D]/60"></span><p className="text-[9px] text-[#A6947D] uppercase tracking-[0.4em] font-mono">Portfolio Oversight</p></div>
            </div>
            <div className="relative flex items-center gap-6">
              <button className="text-gray-600 hover:text-white transition-colors"><Search size={20}/></button>
              <button onClick={() => setShowNotifs(!showNotifs)} className={`p-4 rounded-sm border transition-all relative shadow-inner ${notifications.length > 0 ? 'bg-amber-950/30 border-amber-900/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-[#000000] border-gray-800 text-gray-500'}`}>
                <Bell size={20} strokeWidth={1.5} />
                {notifications.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-black text-[9px] font-bold rounded-sm flex items-center justify-center animate-bounce shadow-lg">{notifications.length}</span>}
              </button>
            </div>
          </header>
          
          {/* NOTIFICATION PANEL */}
           {showNotifs && (
                <div className="fixed md:absolute top-[80px] md:top-[120px] right-5 md:right-12 lg:right-14 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm bg-[#050505] border border-gray-800 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-5 border-b border-gray-900 bg-[#020202] flex justify-between items-center shadow-lg"><p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#A6947D]">Intelligence Feed</p><button onClick={() => setShowNotifs(false)} className="text-gray-600 hover:text-[#A6947D]"><X size={16}/></button></div>
                  <div className="max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar bg-[#010101]">
                    {notifications.length === 0 ? <div className="p-14 text-center text-[9px] font-mono text-gray-700 uppercase tracking-[0.3em]">No active alerts.</div> : notifications.map(n => (
                      <div key={n.id} className="p-6 border-b border-gray-900 hover:bg-gray-900/20 transition-colors group">
                        <p className="text-[10px] font-serif text-white uppercase tracking-widest mb-2 leading-snug">{n.title}</p><p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-5">{n.message}</p>
                        <div className="flex gap-2"><button onClick={() => markAsRead(n.id)} className="text-[8px] font-mono tracking-[0.2em] uppercase text-emerald-600 hover:text-emerald-400 transition-colors flex items-center gap-1.5 border border-emerald-900 px-3 py-1.5 rounded-sm bg-emerald-950/10"><Check size={12}/> Mark Read</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12 md:mb-16 animate-in fade-in duration-500 delay-100 fill-mode-both">
              
              {/* --- VALUATION CARD (PREMIUM) --- */}
              <div className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm p-7 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-[#A6947D]/40 transition-all duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700"><Wallet size={80} className="text-[#A6947D]" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2.5"><Wallet size={13} className="text-[#A6947D]"/> Total Portfolio Value</p>
                <p className="text-3xl md:text-4xl font-mono text-white tracking-widest mb-5 font-light leading-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">{formatCurrency(myPortfolioValue)}</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-5 border-t border-gray-900 bg-black/30 -mx-8 px-8 -mb-8 pb-5 mt-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center gap-2"><ArrowUpRight size={13} className="text-emerald-500"/><span className="text-emerald-500/90">{t('dashboard.active_supply')}</span></div>
                  <span className="text-gray-400 font-bold">{publicAssets.length} <span className="text-[8px] text-gray-600 font-normal">ASSETS</span></span>
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm p-7 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-indigo-900 transition-all duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><Lock size={80} className="text-indigo-500" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2.5"><Lock size={13} className="text-indigo-500"/> OTC Dark Pool Value</p>
                <p className="text-3xl md:text-4xl font-serif text-white tracking-widest mb-5 font-light leading-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">OFF-MARKET</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-5 border-t border-gray-900 bg-black/30 -mx-8 px-8 -mb-8 pb-5 mt-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center gap-2"><Shield size={13} className="text-indigo-400"/><span className="text-indigo-400/90">Institutional Secured</span></div>
                  <span className="text-gray-400 font-bold">{privateAssets.length} <span className="text-[8px] text-gray-600 font-normal">ASSETS</span></span>
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm p-7 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group hover:border-amber-900 transition-all duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><Target size={80} className="text-amber-500" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2.5"><Crosshair size={13} className="text-amber-500"/> {t('dashboard.tracked_targets')}</p>
                <p className="text-3xl md:text-4xl font-mono text-white tracking-widest mb-5 font-light leading-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">{formatCurrency(trackedVaultValue)}</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-5 border-t border-gray-900 bg-black/30 -mx-8 px-8 -mb-8 pb-5 mt-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex items-center gap-2"><ArrowDownRight size={13} className="text-amber-500"/><span className="text-amber-500/90">{t('dashboard.pending_execution')}</span></div>
                  <span className="text-gray-400 font-bold">{trackedSlabs.length} <span className="text-[8px] text-gray-600 font-normal">ASSETS</span></span>
                </div>
              </div>
              
              <div onClick={() => router.push('/contracts')} className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm p-7 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden group cursor-pointer hover:border-emerald-900 transition-all duration-500">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><FileSignature size={80} className="text-emerald-500" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-2.5"><ShieldCheck size={13} className="text-emerald-500"/> Escrow Capital</p>
                <p className="text-3xl md:text-4xl font-mono text-white tracking-widest mb-5 font-light leading-none shadow-[0_0_15px_rgba(255,255,255,0.1)]">{formatCurrency(escrowTotal)}</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-5 border-t border-gray-900 bg-black/30 -mx-8 px-8 -mb-8 pb-5 mt-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] group-hover:bg-emerald-950/20 transition-colors">
                  <div className="flex items-center gap-2"><Handshake size={13} className="text-emerald-400"/><span className="text-emerald-400/90">Secured Funds</span></div>
                  <span className="text-gray-600 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 uppercase font-bold">ACCESS <ArrowRight size={11}/></span>
                </div>
              </div>
            </div>
          )}
          
          {/* --- PREMIUM TAB SWITCHER (NEUMORPHIC) --- */}
          <div className="bg-[#020202] border border-gray-900 rounded-sm p-1.5 mb-10 md:mb-12 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5),0_5px_15px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-px">
              {[
                { id: 'assets', label: 'My assets', icon: Package, count: publicAssets.length },
                { id: 'private', label: 'Private Vault', icon: Lock, count: privateAssets.length },
                { id: 'tracked', label: 'Tracked Targets', icon: Target, count: trackedSlabs.length },
                { id: 'incoming', label: t('dashboard.incoming'), icon: ArrowDownRight, count: incomingOffers.length },
                { id: 'outgoing', label: t('dashboard.outgoing'), icon: ArrowUpRight, count: outgoingOffers.length },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)} 
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-sm text-[10px] md:text-[11px] font-mono uppercase tracking-[0.3em] whitespace-nowrap transition-all duration-300 flex-none ${activeTab === tab.id ? 'bg-[#000000] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_5px_rgba(0,0,0,0.3)] border border-gray-800' : 'text-gray-600 hover:text-gray-300'}`}
                >
                  <tab.icon size={15} strokeWidth={activeTab === tab.id ? 2 : 1.5} className={activeTab === tab.id ? 'text-[#A6947D]' : ''}/>
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold ${activeTab === tab.id ? 'bg-[#A6947D] text-black shadow-lg' : 'bg-gray-800 text-gray-500'}`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center py-24 text-[#A6947D] animate-pulse font-mono text-[9px] uppercase tracking-[0.4em] items-center gap-5 z-10 relative">
              <div className="w-10 h-10 border-[0.5px] border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin"></div>
              Querying Ledger
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 delay-200 fill-mode-both w-full overflow-x-hidden pb-10 z-10 relative">
              
              {/* --- PUBLIC ASSETS TAB --- */}
              {activeTab === 'assets' && (
                <div className="w-full">
                  {publicAssets.length === 0 ? (
                    <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                      <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><Package size={32} className="text-gray-700 stroke-1" /></div>
                      <h3 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-3">Public Ledger is Empty</h3>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-8">No visible assets listed.</p>
                      <Link href="/scanner" className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-sm text-[9px] font-extrabold font-mono uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">Initiate Scan</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                      {publicAssets.map(slab => (
                        <div key={slab.id} className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm overflow-hidden hover:border-[#A6947D]/50 transition-all duration-500 group flex flex-col shadow-xl w-full relative group">
                          <div className="h-48 md:h-56 bg-[#000000] relative overflow-hidden border-b border-gray-900 shadow-[inset_0_-10px_30px_rgba(0,0,0,0.5)]">
                            {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-gray-800 opacity-40"><Package size={56} strokeWidth={1}/></div>}
                            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-gray-800 px-3 py-1.5 rounded-sm text-[8px] font-mono text-[#A6947D] tracking-[0.3em] shadow-lg group-hover:border-[#A6947D]/50 transition-colors">AX-{slab.id.substring(0,6)}</div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity"></div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col bg-[#010101] group-hover:bg-[#030303] transition-colors relative z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                            <h3 className="text-sm md:text-base font-serif text-white uppercase tracking-widest mb-2.5 truncate leading-snug">{slab.material || 'Unknown Material'}</h3>
                            <p className="text-2xl font-mono text-[#A6947D] mb-7 tracking-widest font-light leading-none">{formatCurrency(slab.price)}</p>
                            <div className="mt-auto pt-5 border-t border-gray-900 flex justify-between items-center gap-4">
                              <div className="flex items-center gap-3">
                                <button onClick={() => openEditModal(slab)} className="text-gray-600 hover:text-[#A6947D] p-2.5 rounded-sm hover:bg-[#A6947D]/10 transition-all border border-transparent hover:border-gray-800"><Edit size={15} strokeWidth={1.5}/></button>
                                <button onClick={() => deleteSlab(slab.id)} className="text-gray-600 hover:text-red-500 p-2.5 rounded-sm hover:bg-red-950/20 transition-all border border-transparent hover:border-gray-800"><Trash2 size={15} strokeWidth={1.5}/></button>
                              </div>
                              <Link href={`/trading/${slab.id}`} target="_blank" className="text-gray-500 hover:text-white text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-2.5 transition-colors border border-gray-800 px-4 py-2 rounded-sm bg-[#000000] hover:bg-gray-900 shadow-md">Ledger <ExternalLink size={13}/></Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- PRIVATE VAULT TAB --- */}
              {activeTab === 'private' && (
                <div className="w-full">
                  {privateAssets.length === 0 ? (
                    <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                      <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><Lock size={32} className="text-gray-700 stroke-1" /></div>
                      <h3 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-3">Vault is Empty</h3>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-8">No off-market assets stored.</p>
                      <Link href="/scanner" className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-sm text-[9px] font-extrabold font-mono uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">Add Private Asset</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                      {privateAssets.map(slab => (
                        <div key={slab.id} className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm overflow-hidden hover:border-indigo-900 transition-all duration-500 group flex flex-col shadow-xl w-full relative group hover:shadow-[0_10px_40px_rgba(79,70,229,0.15)]">
                          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-indigo-950/60 backdrop-blur-md border border-indigo-900/70 px-3 py-1.5 rounded-sm shadow-lg group-hover:bg-indigo-900 transition-colors"><Lock size={11} className="text-indigo-400 group-hover:scale-110 transition-transform"/><span className="text-[8px] font-mono text-indigo-300 uppercase tracking-[0.2em]">Off-Market</span></div>
                          <div className="h-48 md:h-56 bg-[#000000] relative overflow-hidden border-b border-gray-900 shadow-[inset_0_-10px_30px_rgba(0,0,0,0.5)] opacity-80 group-hover:opacity-100 transition-opacity">
                            {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale transition-all duration-700 transform group-hover:scale-105 group-hover:grayscale-0" /> : <div className="w-full h-full flex items-center justify-center opacity-30"><Package size={56} className="text-indigo-400 stroke-1" /></div>}
                          </div>
                          <div className="p-6 md:p-7 flex flex-col flex-1 bg-[#010101] group-hover:bg-[#030303] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                            <h3 className="text-sm md:text-base font-serif text-white uppercase tracking-widest mb-2 truncate leading-snug">{slab.material || 'Unknown Material'}</h3>
                            <p className="text-2xl font-mono text-indigo-500 mb-7 tracking-widest font-light leading-none shadow-[0_0_15px_rgba(79,70,229,0.2)]">{formatCurrency(slab.price)}</p>
                            <div className="mt-auto pt-5 border-t border-gray-900 flex justify-between items-center gap-3">
                              <div className="flex gap-3">
                                <button onClick={() => openEditModal(slab)} className="text-gray-600 hover:text-[#A6947D] p-2.5 rounded-sm hover:bg-[#A6947D]/10 transition-all border border-transparent hover:border-gray-800"><Edit size={15} strokeWidth={1.5}/></button>
                                <button onClick={() => deleteSlab(slab.id)} className="text-gray-600 hover:text-red-500 p-2.5 rounded-sm hover:bg-red-950/20 transition-all border border-transparent hover:border-gray-800"><Trash2 size={15} strokeWidth={1.5}/></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- TRACKED targets TAB --- */}
              {activeTab === 'tracked' && (
                <div className="w-full">
                  {trackedSlabs.length === 0 ? (
                    <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                      <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><Target size={32} className="text-gray-700 stroke-1" /></div>
                      <h3 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-3">No Targets Locked</h3>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em] mb-8">Access the trading floor to track assets.</p>
                      <Link href="/trading" className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-sm text-[9px] font-extrabold font-mono uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">Enter Public Floor</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                      {trackedSlabs.map(slab => (
                        <div key={slab.id} className="bg-gradient-to-b from-[#080808] to-[#010101] border border-gray-900 rounded-sm overflow-hidden hover:border-amber-900 transition-all duration-300 group flex flex-col shadow-xl w-full relative group hover:shadow-[0_10px_40px_rgba(245,158,11,0.15)]">
                          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-amber-950/60 backdrop-blur-md border border-amber-900/70 px-3 py-1.5 rounded-sm shadow-lg group-hover:bg-amber-900 transition-colors"><Target size={11} className="text-amber-500 animate-pulse"/><span className="text-[8px] font-mono text-amber-300 uppercase tracking-[0.2em]">Locked</span></div>
                          <Link href={`/trading/${slab.id}`}>
                            <div className="h-48 md:h-56 bg-[#000000] relative overflow-hidden border-b border-gray-900 shadow-[inset_0_-10px_30px_rgba(0,0,0,0.5)]">
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 group-hover:opacity-70 transition-opacity z-10"></div>
                              {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-30"><Package size={56} className="text-gray-700 stroke-1" /></div>}
                              <div className="absolute bottom-5 left-5 z-20"><p className="text-[8px] text-amber-500/90 font-mono tracking-[0.3em] uppercase mb-2">Target: AX-{slab.id.substring(0,8)}</p><h4 className="text-base font-serif uppercase text-white tracking-widest leading-snug shadow-text-lg">{slab.material}</h4></div>
                            </div>
                          </Link>
                          <div className="p-6 md:p-7 flex flex-col flex-1 bg-[#010101] group-hover:bg-[#030303] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                            <div className="flex justify-between items-end mb-6">
                              <div><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2">Buy Price</p><p className="text-xl font-mono text-white tracking-widest font-lightLEADING-NONE shadow-[0_0_15px_rgba(255,255,255,0.1)]">{formatCurrency(slab.price)}</p></div>
                              <div className="text-right"><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2">Vendor Entity</p><p className="text-[10px] font-serif uppercase text-gray-400 truncate max-w-[130px] leading-snug">{slab.profiles?.company_name || 'Unknown'}</p></div>
                            </div>
                             <button className="w-full bg-[#000000] border border-gray-800 text-gray-500 group-hover:text-amber-400 group-hover:border-amber-900 hover:bg-amber-950/20 font-bold uppercase tracking-[0.2em] py-4 rounded-sm transition-all text-[9px] flex items-center justify-center gap-2.5 mt-auto shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                              Initiate Buy Offer <ArrowRight size={13}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INCOMING & OUTGOING TABS */}
              {activeTab === 'incoming' && (
                 <div className="space-y-6 w-full z-10 relative">
                 {incomingOffers.length === 0 ? (
                   <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                     <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><ArrowDownRight size={32} className="text-gray-700 stroke-1" /></div>
                     <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">No incoming offers detected.</p>
                   </div>
                 ) : (
                   incomingOffers.map(offer => (
                     <div key={offer.id} className="bg-gradient-to-r from-[#0a0a0a] to-[#010101] border border-gray-900 rounded-sm p-7 md:p-8 flex flex-col md:flex-row gap-7 md:gap-9 justify-between items-start md:items-center relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] w-full hover:border-emerald-900 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"></div>
                        <div className="flex-1 space-y-5 w-full pl-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-900 pb-5">
                            <span className="bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 px-3.5 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 w-fit shadow-inner"><ArrowDownRight size={12}/> Incoming Offer Deal</span>
                            <span className="text-gray-600 text-[9px] font-mono flex items-center gap-2 tracking-[0.2em]"><Calendar size={12}/> {formatTime(offer.created_at)}</span>
                          </div>
                          <div className="pt-2"><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2.5">Originator Entity</p><p className="text-lg font-serif text-white uppercase tracking-widest leading-snug shadow-text">{offer.contactName}</p></div>
                          <div className="bg-[#000000] border border-gray-800 p-6 rounded-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 w-full max-w-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                            <div><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2.5">Target Asset ID</p><Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[10px] font-mono text-white hover:text-[#A6947D] transition-colors bg-[#030303] px-3.5 py-1.5 rounded-sm border border-gray-800 tracking-widest shadow-md">AX-{offer.offer_details?.asset_id.substring(0,6)}</Link></div>
                            <div className="sm:text-right"><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2.5">Proposed Valuation</p><p className="text-2xl font-mono text-emerald-500 tracking-widest font-lightLEADING-NONE shadow-[0_0_15px_rgba(16,185,129,0.2)]">{formatCurrency(offer.offer_details?.price)}</p></div>
                          </div>
                        </div>
                         <button onClick={() => router.push('/inbox')} className="md:flex-none h-14 bg-white text-black font-extrabold uppercase tracking-[0.3em] px-8 rounded-sm hover:bg-gray-200 transition-all text-[10px] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] whitespace-nowrap mt-7 md:mt-0 w-full md:w-auto">
                           Open Comms <ArrowRight size={15}/>
                        </button>
                     </div>
                   ))
                 )}
                 </div>
              )}
              
              {activeTab === 'outgoing' && (
                 <div className="space-y-6 w-full z-10 relative">
                 {outgoingOffers.length === 0 ? (
                   <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                     <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><ArrowUpRight size={32} className="text-gray-700 stroke-1" /></div>
                     <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">No active transmissions.</p>
                   </div>
                 ) : (
                   outgoingOffers.map(offer => (
                     <div key={offer.id} className="bg-gradient-to-r from-[#0a0a0a] to-[#010101] border border-gray-900 rounded-sm p-7 md:p-8 flex flex-col md:flex-row gap-7 md:gap-9 justify-between items-start md:items-center relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] w-full hover:border-amber-900 transition-colors relative">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]"></div>
                        <div className="flex-1 space-y-5 w-full pl-5">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-900 pb-5">
                            <span className="bg-amber-950/30 text-amber-500 border border-amber-900/50 px-3.5 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 w-fit shadow-inner"><ArrowUpRight size={12}/> Transmitted Deal Package</span>
                            <span className="text-gray-600 text-[9px] font-mono flex items-center gap-2 tracking-[0.2em]"><Calendar size={12}/> {formatTime(offer.created_at)}</span>
                          </div>
                          <div className="pt-2"><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2.5">Counterparty Entity</p><p className="text-lg font-serif text-white uppercase tracking-widest leading-snug shadow-text">{offer.contactName}</p></div>
                          <div className="bg-[#000000] border border-gray-800 p-6 rounded-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 w-full max-w-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                            <div><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2.5">Target Asset ID</p><Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[10px] font-mono text-white hover:text-[#A6947D] transition-colors bg-[#030303] px-3.5 py-1.5 rounded-sm border border-gray-800 tracking-widest shadow-md">AX-{offer.offer_details?.asset_id.substring(0,6)}</Link></div>
                            <div className="sm:text-right"><p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2.5">Your Final Offer</p><p className="text-2xl font-mono text-white tracking-widest font-lightLEADING-NONE shadow-[0_0_15px_rgba(255,255,255,0.1)]">{formatCurrency(offer.offer_details?.price)}</p></div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row md:flex-col gap-3.5 w-full md:w-auto mt-7 md:mt-0 relative z-10">
                            <button onClick={() => router.push('/inbox')} className="h-12 border border-gray-800 text-gray-500 hover:text-white hover:bg-gray-900 font-bold uppercase tracking-[0.2em] px-6 rounded-sm transition-all text-[9px] flex items-center justify-center gap-2.5 shadow-md">Comms Hub</button>
                            <button onClick={() => openRefundModal(offer)} className="h-12 border border-red-900 text-red-600 hover:text-red-500 hover:bg-red-950/20 font-bold uppercase tracking-[0.2em] px-6 rounded-sm transition-all text-[9px] flex items-center justify-center gap-2.5 shadow-md">Abort Deal</button>
                        </div>
                     </div>
                   ))
                 )}
                 </div>
              )}

            </div>
          )}
        </div>
      </main>

    </div>
  );
}