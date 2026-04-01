'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight, 
  Trash2, Handshake, ExternalLink, Calendar, AlertOctagon, RotateCcw, X, Loader2,
  Bell, Check, User, Target, Wallet, ArrowRight, FileSignature, Scale, Ship, ShieldCheck, Lock, Edit, ShoppingCart, Send, Menu
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
    <nav className="space-y-1.5 relative z-10">
      <Link href="/dashboard" onClick={onClick} className="flex items-center gap-4 px-4 py-3.5 bg-[#050505] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-inner"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
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
      
      {/* --- MODAL: EDIT ASSET --- */}
      {isEditModalOpen && editingSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#030303] border border-gray-800 rounded-sm w-full max-w-2xl relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-900 bg-[#020202] flex-none">
              <div className="flex items-center gap-3 text-white"><Edit size={16} className="text-[#A6947D]" strokeWidth={1.5} /><h2 className="text-sm md:text-base font-serif uppercase tracking-[0.2em]">Modify Asset Parameters</h2></div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-sm hover:bg-gray-900"><X size={18} strokeWidth={1.5} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="overflow-y-auto custom-scrollbar flex-1 p-6 md:p-8 space-y-6">
              
              <div className="bg-[#050505] p-5 rounded-sm border border-gray-900 shadow-inner flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.2em] mb-3 flex items-center gap-2"><ShieldCheck size={12} className="text-[#A6947D]"/> Placement Strategy</label>
                  <div className="flex bg-[#020202] border border-gray-800 rounded-sm p-1">
                    <button type="button" onClick={() => setEditForm({...editForm, visibility: 'public'})} className={`flex-1 py-2.5 rounded-sm text-[9px] font-mono uppercase tracking-widest transition-all ${editForm.visibility === 'public' ? 'bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Public Floor</button>
                    <button type="button" onClick={() => setEditForm({...editForm, visibility: 'private'})} className={`flex-1 py-2.5 rounded-sm text-[9px] font-mono uppercase tracking-widest transition-all ${editForm.visibility === 'private' ? 'bg-indigo-950/30 text-indigo-400 border border-indigo-900/50 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Private Vault</button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.2em] mb-3 flex items-center gap-2"><ShoppingCart size={12} className="text-[#A6947D]"/> Pricing Model</label>
                  <div className="flex bg-[#020202] border border-gray-800 rounded-sm p-1">
                    <button type="button" onClick={() => setEditForm({...editForm, pricing_model: 'PUBLIC'})} className={`flex-1 py-2.5 rounded-sm text-[9px] font-mono uppercase tracking-widest transition-all ${editForm.pricing_model === 'PUBLIC' ? 'bg-white/10 text-white border border-gray-700 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Fixed Price</button>
                    <button type="button" onClick={() => setEditForm({...editForm, pricing_model: 'ROQ'})} className={`flex-1 py-2.5 rounded-sm text-[9px] font-mono uppercase tracking-widest transition-all ${editForm.pricing_model === 'ROQ' ? 'bg-amber-950/30 text-amber-500 border border-amber-900/50 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Request Quote</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Material</label>
                  <input type="text" required value={editForm.material} onChange={(e) => setEditForm({...editForm, material: e.target.value})} className="w-full h-12 bg-[#020202] border border-gray-800 hover:border-gray-700 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors uppercase shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em] flex justify-between items-center">
                    <span>Valuation (€)</span>
                    {editForm.pricing_model === 'ROQ' && <Lock size={10} className="text-amber-500" />}
                  </label>
                  <input type="text" required value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} className={`w-full h-12 bg-[#020202] border rounded-sm px-4 font-mono text-sm text-white focus:outline-none transition-colors shadow-inner ${editForm.pricing_model === 'ROQ' ? 'border-amber-900/50 focus:border-amber-500' : 'border-gray-800 focus:border-[#A6947D]/50'}`} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Origin</label>
                  <input type="text" value={editForm.origin} onChange={(e) => setEditForm({...editForm, origin: e.target.value})} className="w-full h-12 bg-[#020202] border border-gray-800 hover:border-gray-700 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors uppercase shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Location</label>
                  <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full h-12 bg-[#020202] border border-gray-800 hover:border-gray-700 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors uppercase shadow-inner" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Thickness</label>
                    <input type="text" value={editForm.thickness} onChange={(e) => setEditForm({...editForm, thickness: e.target.value})} className="w-full h-12 bg-[#020202] border border-gray-800 hover:border-gray-700 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Quantity</label>
                    <input type="text" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} className="w-full h-12 bg-[#020202] border border-gray-800 hover:border-gray-700 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors shadow-inner" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Incoterm</label>
                  <select value={editForm.incoterm} onChange={(e) => setEditForm({...editForm, incoterm: e.target.value})} className="w-full h-12 bg-[#020202] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors appearance-none shadow-inner uppercase">
                    <option value="EXW">EXW (Ex Works)</option>
                    <option value="FOB">FOB (Free on Board)</option>
                    <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">Description</label>
                <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} rows={4} className="w-full bg-[#020202] border border-gray-800 hover:border-gray-700 rounded-sm px-5 py-4 font-mono text-xs text-white focus:outline-none focus:border-[#A6947D]/50 transition-colors resize-none shadow-inner custom-scrollbar uppercase tracking-widest leading-relaxed" />
              </div>

              <div className="pt-6 flex gap-4 border-t border-gray-900">
                <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSavingEdit} className="px-8 py-4 rounded-sm border border-gray-800 text-gray-500 hover:text-white hover:bg-gray-900 text-[10px] font-mono uppercase tracking-[0.3em] transition-all">Cancel</button>
                <button type="submit" disabled={isSavingEdit} className="flex-1 bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-[0.3em] py-4 rounded-sm transition-all text-[10px] flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg">
                  {isSavingEdit ? <><Loader2 size={16} className="animate-spin"/> Syncing...</> : <><ShieldCheck size={16} strokeWidth={2}/> Update Parameters</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: REFUND --- */}
      {isRefundModalOpen && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#030303] border border-red-900/50 rounded-sm w-full max-w-lg relative shadow-[0_0_50px_rgba(239,68,68,0.1)] overflow-hidden">
            {refundSuccess ? (
              <div className="p-12 md:p-16 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full border border-emerald-500/30 flex items-center justify-center mb-8 bg-emerald-950/20 relative"><div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-50"></div><RotateCcw size={32} className="text-emerald-500" strokeWidth={1.5} /></div>
                <h2 className="text-xl md:text-2xl font-serif uppercase tracking-[0.3em] text-white mb-3">Contract Terminated</h2>
                <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.3em]">Escrow Funds Released & Deal Purged.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-6 border-b border-red-900/50 bg-[#020202]">
                  <div className="flex items-center gap-3 text-red-500"><AlertOctagon size={18} strokeWidth={1.5} /><h2 className="text-sm md:text-base font-serif uppercase tracking-[0.3em] text-white">Terminate Contract</h2></div>
                  <button onClick={() => setIsRefundModalOpen(false)} className="text-gray-600 hover:text-red-500 transition-colors p-2 rounded-sm hover:bg-gray-900"><X size={18} strokeWidth={1.5}/></button>
                </div>
                <div className="p-8 md:p-10 bg-[#050505] text-center relative border-b border-gray-900 shadow-inner">
                  <p className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.4em] mb-4">Asset Value Locked</p>
                  <p className="text-3xl md:text-4xl font-mono text-white tracking-widest">{formatCurrency(selectedDeal.offer_details?.price)}</p>
                </div>
                <div className="p-6 md:p-10 space-y-8 bg-[#030303] max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                    <p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.4em] border-b border-gray-900 pb-3 mb-5">Resolution Strategy</p>
                    <label className={`flex items-start gap-4 p-5 rounded-sm border cursor-pointer transition-all ${refundType === 'full' ? 'bg-red-950/20 border-red-900/50 shadow-inner' : 'bg-[#050505] border-gray-800 hover:border-gray-600'}`}>
                      <input type="radio" name="refundType" checked={refundType === 'full'} onChange={() => setRefundType('full')} className="mt-1" />
                      <div><p className="text-xs font-mono uppercase tracking-widest text-white mb-1">Mutual Agreement</p><p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Return 100% of the escrow funds to the buyer.</p></div>
                    </label>
                    <label className={`flex items-start gap-4 p-5 rounded-sm border cursor-pointer transition-all ${refundType === 'partial' ? 'bg-red-950/20 border-red-900/50 shadow-inner' : 'bg-[#050505] border-gray-800 hover:border-gray-600'}`}>
                      <input type="radio" name="refundType" checked={refundType === 'partial'} onChange={() => setRefundType('partial')} className="mt-1" />
                      <div className="w-full"><p className="text-xs font-mono uppercase tracking-widest text-white mb-1">Breach of Contract</p><p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-4">Hold a penalty fee. Return the remaining balance.</p>
                        {refundType === 'partial' && (
                          <div className="relative mt-2"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">€</span>
                            <input type="number" placeholder="Amount to refund..." value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full h-12 bg-[#020202] border border-red-900/50 rounded-sm pl-10 pr-4 text-sm font-mono text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner" />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                  <div className="pt-6 flex gap-4 border-t border-gray-900">
                    <button type="button" onClick={() => setIsRefundModalOpen(false)} disabled={isRefunding} className="px-6 md:px-8 py-4 rounded-sm border border-gray-800 text-gray-500 hover:text-white hover:bg-gray-900 text-[9px] font-mono uppercase tracking-[0.3em] transition-all disabled:opacity-50">Abort</button>
                    <button onClick={executeRefund} disabled={isRefunding || (refundType === 'partial' && !refundAmount)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-[0.3em] py-4 rounded-sm transition-all text-[9px] flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg">
                      {isRefunding ? <><Loader2 size={16} className="animate-spin"/> Releasing...</> : <><RotateCcw size={16} strokeWidth={2}/> Execute Refund</>}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- MOBILE OVERLAY MENU (PREMIUM) --- */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-6 flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-gray-900 pb-5 mb-10 bg-[#020202] px-3 py-2 -mx-6 -mt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-[#A6947D]/50 rounded-sm flex items-center justify-center bg-[#000000]"><Shield size={16} className="text-[#A6947D]"/></div>
              <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] leading-none">AXON</h1>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-red-500 p-2.5 rounded-sm hover:bg-gray-900"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            <NavLinks onClick={() => setMobileMenuOpen(false)} />
          </div>
          <div className="p-6 -mx-6 -mb-6 border-t border-gray-900 bg-[#020202]"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
        </div>
      )}

      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 shadow-[0_0_15px_rgba(166,148,125,0.1)] bg-[#000000]">
            <Shield size={18} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <NavLinks />

        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[40px] md:pb-0 custom-scrollbar w-full">
        {/* BACKGROUND ICON - CONTAINED */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
        
        <div className="p-5 md:p-12 max-w-7xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          {/* MOBILE HEADER (PREMIUM) */}
          <header className="md:hidden flex justify-between items-center border-b border-gray-900 pb-5 mb-10 -mx-5 px-5 bg-[#020202]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-[#A6947D]/50 rounded-sm flex items-center justify-center bg-[#000000]"><Shield size={16} className="text-[#A6947D]"/></div>
              <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] leading-none">AXON</h1>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 md:p-4 rounded-sm border transition-all relative shadow-inner ${notifications.length > 0 ? 'bg-amber-950/30 border-amber-900/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-[#020202] border-gray-800 text-gray-500'}`}>
                <Bell size={18} strokeWidth={1.5} />
                {notifications.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-black text-[9px] font-bold rounded-sm flex items-center justify-center animate-bounce">{notifications.length}</span>}
              </button>
              <button onClick={() => setMobileMenuOpen(true)} className="text-gray-500 hover:text-white p-2.5 rounded-sm hover:bg-gray-900 transition-colors border border-gray-800 shadow-inner"><Menu size={20}/></button>
            </div>
             {showNotifs && (
                <div className="absolute top-[80px] right-5 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm bg-[#050505] border border-gray-800 rounded-sm shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-5 border-b border-gray-900 bg-[#020202] flex justify-between items-center"><p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#A6947D]">Intelligence Feed</p><button onClick={() => setShowNotifs(false)} className="text-gray-600 hover:text-[#A6947D]"><X size={16}/></button></div>
                  <div className="max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? <div className="p-12 text-center text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em]">No active alerts.</div> : notifications.map(n => (
                      <div key={n.id} className="p-5 border-b border-gray-900 hover:bg-gray-900/30 transition-colors group">
                        <p className="text-[10px] font-serif text-white uppercase tracking-widest mb-1.5">{n.title}</p><p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-4">{n.message}</p>
                        <div className="flex gap-2"><button onClick={() => markAsRead(n.id)} className="text-[8px] font-mono tracking-[0.2em] uppercase text-gray-600 hover:text-emerald-500 transition-colors flex items-center gap-1.5"><Check size={12}/> Mark Read</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </header>

          {/* DESKTOP/GENERAL HEADER */}
          <header className="hidden md:flex mb-10 md:mb-16 justify-between items-start animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl md:text-4xl font-serif text-white uppercase tracking-[0.2em] font-light">{t('dashboard.title')}</h2>
              <div className="flex items-center gap-3 mt-3"><span className="h-px w-8 bg-[#A6947D]/50"></span><p className="text-[9px] text-[#A6947D] uppercase tracking-[0.4em] font-mono">Portfolio Oversight</p></div>
            </div>
            <div className="relative">
              <button onClick={() => setShowNotifs(!showNotifs)} className={`p-3 md:p-4 rounded-sm border transition-all relative shadow-inner ${notifications.length > 0 ? 'bg-amber-950/30 border-amber-900/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-[#020202] border-gray-800 text-gray-500'}`}>
                <Bell size={18} strokeWidth={1.5} />
                {notifications.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-black text-[9px] font-bold rounded-sm flex items-center justify-center animate-bounce">{notifications.length}</span>}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-3 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm bg-[#050505] border border-gray-800 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-5 border-b border-gray-900 bg-[#020202] flex justify-between items-center"><p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#A6947D]">Intelligence Feed</p><button onClick={() => setShowNotifs(false)} className="text-gray-600 hover:text-[#A6947D]"><X size={16}/></button></div>
                  <div className="max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? <div className="p-12 text-center text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em]">No active alerts.</div> : notifications.map(n => (
                      <div key={n.id} className="p-5 border-b border-gray-900 hover:bg-gray-900/30 transition-colors group">
                        <p className="text-[10px] font-serif text-white uppercase tracking-widest mb-1.5">{n.title}</p><p className="text-[10px] font-mono text-gray-400 leading-relaxed mb-4">{n.message}</p>
                        <div className="flex gap-2"><button onClick={() => markAsRead(n.id)} className="text-[8px] font-mono tracking-[0.2em] uppercase text-gray-600 hover:text-emerald-500 transition-colors flex items-center gap-1.5"><Check size={12}/> Mark Read</button></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6 mb-12 animate-in fade-in duration-500 delay-100 fill-mode-both">
              
              {/* CARDS */}
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><Wallet size={80} className="text-[#A6947D]" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Package size={12} className="text-[#A6947D]"/> Public Portfolio</p>
                <p className="text-2xl md:text-3xl font-mono text-white tracking-widest mb-4">{formatCurrency(myPortfolioValue)}</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-4 border-t border-gray-900">
                  <div className="flex items-center gap-2"><ArrowUpRight size={12} className="text-emerald-500"/><span className="text-emerald-500">{t('dashboard.active_supply')}</span></div>
                  <span className="text-gray-400">{publicAssets.length} <span className="text-[8px]">ASSETS</span></span>
                </div>
              </div>
              
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-indigo-900/50 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><Lock size={80} className="text-indigo-400" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-indigo-500/80 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Lock size={12}/> OTC Dark Pool</p>
                <p className="text-2xl md:text-3xl font-serif text-white tracking-widest mb-4">OFF-MARKET</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-4 border-t border-gray-900">
                  <div className="flex items-center gap-2"><Shield size={12} className="text-indigo-400"/><span className="text-indigo-400">Secured</span></div>
                  <span className="text-gray-400">{privateAssets.length} <span className="text-[8px]">ASSETS</span></span>
                </div>
              </div>
              
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-amber-900/50 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><Target size={80} className="text-amber-500" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Crosshair size={12} className="text-amber-500"/> {t('dashboard.tracked_targets')}</p>
                <p className="text-2xl md:text-3xl font-mono text-white tracking-widest mb-4">{formatCurrency(trackedVaultValue)}</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-4 border-t border-gray-900">
                  <div className="flex items-center gap-2"><ArrowDownRight size={12} className="text-amber-500"/><span className="text-amber-500">{t('dashboard.pending_execution')}</span></div>
                  <span className="text-gray-400">{trackedSlabs.length} <span className="text-[8px]">ASSETS</span></span>
                </div>
              </div>
              
              <div onClick={() => router.push('/contracts')} className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 shadow-2xl relative overflow-hidden group cursor-pointer hover:border-emerald-900/50 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><FileSignature size={80} className="text-emerald-500" strokeWidth={1}/></div>
                <p className="text-[8px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500"/> Escrow Contracts</p>
                <p className="text-2xl md:text-3xl font-mono text-white tracking-widest mb-4">{formatCurrency(escrowTotal)}</p>
                <div className="flex items-center justify-between text-[9px] font-mono tracking-widest pt-4 border-t border-gray-900">
                  <div className="flex items-center gap-2"><Handshake size={12} className="text-emerald-400"/><span className="text-emerald-400">Secured Funds</span></div>
                  <span className="text-gray-600 group-hover:text-emerald-400 transition-colors flex items-center gap-1">ACCESS <ArrowRight size={10}/></span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-6 md:gap-8 border-b border-gray-900 mb-8 md:mb-10 overflow-x-auto custom-scrollbar pb-px animate-in fade-in duration-500 delay-100 fill-mode-both w-full scroll-smooth">
            <button onClick={() => setActiveTab('assets')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'assets' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}>
              <Package size={14} strokeWidth={1.5}/> My assets <span className={`px-2 py-0.5 rounded-sm text-[8px] ${activeTab === 'assets' ? 'bg-[#A6947D]/10 text-[#A6947D]' : 'bg-gray-900 text-gray-500'}`}>{publicAssets.length}</span>
            </button>
            <button onClick={() => setActiveTab('private')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'private' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}>
              <Lock size={14} strokeWidth={1.5}/> Private Vault {privateAssets.length > 0 && <span className="bg-indigo-950/30 text-indigo-500 border border-indigo-900/50 px-2 py-0.5 rounded-sm text-[8px] shadow-sm">{privateAssets.length}</span>}
            </button>
            <button onClick={() => setActiveTab('tracked')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'tracked' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-600 hover:text-gray-400'}`}>
              <Target size={14} strokeWidth={1.5}/> Tracked Targets {trackedSlabs.length > 0 && <span className="bg-amber-950/30 text-amber-500 border border-amber-900/50 px-2 py-0.5 rounded-sm text-[8px] shadow-sm">{trackedSlabs.length}</span>}
            </button>
            <button onClick={() => setActiveTab('incoming')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'incoming' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-600 hover:text-gray-400'}`}>
              <ArrowDownRight size={14} strokeWidth={1.5}/> {t('dashboard.incoming')} {incomingOffers.length > 0 && <span className="bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 px-2 py-0.5 rounded-sm text-[8px] shadow-sm">{incomingOffers.length}</span>}
            </button>
            <button onClick={() => setActiveTab('outgoing')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-3 transition-all whitespace-nowrap ${activeTab === 'outgoing' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-600 hover:text-gray-400'}`}>
              <ArrowUpRight size={14} strokeWidth={1.5}/> {t('dashboard.outgoing')} <span className={`px-2 py-0.5 rounded-sm text-[8px] ${activeTab === 'outgoing' ? 'bg-amber-950/30 text-amber-500 border border-amber-900/50' : 'bg-gray-900 text-gray-500'}`}>{outgoingOffers.length}</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center py-24 text-[#A6947D] animate-pulse font-mono text-[9px] uppercase tracking-[0.4em] items-center gap-5">
              <div className="w-10 h-10 border-[0.5px] border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin"></div>
              Querying Ledger
            </div>
          ) : (
            <div className="animate-in fade-in duration-500 delay-200 fill-mode-both w-full overflow-x-hidden pb-10">
              
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full">
                      {publicAssets.map(slab => (
                        <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden hover:border-[#A6947D]/50 transition-colors duration-500 group flex flex-col shadow-xl w-full relative">
                          <div className="h-44 md:h-52 bg-[#020202] relative overflow-hidden border-b border-gray-900">
                            {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-transform duration-700 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-gray-800"><Package size={48} strokeWidth={1}/></div>}
                            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-gray-800 px-2.5 py-1 rounded-sm text-[8px] font-mono text-[#A6947D] tracking-[0.3em] shadow-lg">AX-{slab.id.substring(0,6)}</div>
                          </div>
                          <div className="p-5 md:p-6 flex-1 flex flex-col">
                            <h3 className="text-sm md:text-base font-serif text-white uppercase tracking-widest mb-2 truncate">{slab.material || 'Unknown Material'}</h3>
                            <p className="text-xl md:text-2xl font-mono text-[#A6947D] mb-6">{formatCurrency(slab.price)}</p>
                            <div className="mt-auto pt-5 border-t border-gray-900 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <button onClick={() => openEditModal(slab)} className="text-gray-500 hover:text-[#A6947D] p-2 rounded-sm hover:bg-[#A6947D]/10 transition-colors border border-transparent hover:border-[#A6947D]/30"><Edit size={14} /></button>
                                <button onClick={() => deleteSlab(slab.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-sm hover:bg-red-950/20 transition-colors border border-transparent hover:border-red-900/50"><Trash2 size={14} /></button>
                              </div>
                              <Link href={`/trading/${slab.id}`} target="_blank" className="text-gray-500 hover:text-white text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 transition-colors">Ledger <ExternalLink size={12}/></Link>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full">
                      {privateAssets.map(slab => (
                        <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden hover:border-indigo-900/50 transition-all duration-500 group flex flex-col relative shadow-xl w-full relative group">
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-indigo-950/50 backdrop-blur-md border border-indigo-900/50 px-2.5 py-1.5 rounded-sm shadow-lg group-hover:bg-indigo-900 transition-colors"><Lock size={10} className="text-indigo-500"/><span className="text-[7px] font-mono text-indigo-400 uppercase tracking-[0.2em]">Off-Market</span></div>
                          <div className="h-44 md:h-52 bg-[#020202] relative overflow-hidden border-b border-gray-900">
                            {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale transition-all duration-700 transform group-hover:scale-105 group-hover:grayscale-0" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={48} className="text-indigo-400 stroke-1" /></div>}
                          </div>
                          <div className="p-5 md:p-6 flex flex-col flex-1">
                            <h3 className="text-sm md:text-base font-serif text-white uppercase tracking-widest mb-2 truncate">{slab.material || 'Unknown Material'}</h3>
                            <p className="text-xl md:text-2xl font-mono text-indigo-500 mb-6">{formatCurrency(slab.price)}</p>
                            <div className="mt-auto pt-5 border-t border-gray-900 flex justify-between items-center gap-3">
                              <div className="flex gap-3">
                                <button onClick={() => openEditModal(slab)} className="text-gray-500 hover:text-[#A6947D] p-2 rounded-sm hover:bg-[#A6947D]/10 transition-colors border border-transparent hover:border-[#A6947D]/30"><Edit size={14} /></button>
                                <button onClick={() => deleteSlab(slab.id)} className="text-gray-500 hover:text-red-500 p-2 rounded-sm hover:bg-red-950/20 transition-colors border border-transparent hover:border-red-900/50"><Trash2 size={14} /></button>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 w-full">
                      {trackedSlabs.map(slab => (
                        <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden hover:border-amber-900/50 transition-all duration-300 group flex flex-col relative w-full shadow-xl relative group">
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-amber-950/50 border border-amber-900/50 px-2.5 py-1.5 rounded-sm shadow-lg group-hover:bg-amber-900 transition-colors"><Target size={10} className="text-amber-500 animate-pulse"/><span className="text-[7px] font-mono text-amber-500 uppercase tracking-[0.2em]">Locked</span></div>
                          <Link href={`/trading/${slab.id}`}>
                            <div className="h-44 md:h-52 bg-[#020202] relative overflow-hidden border-b border-gray-900">
                              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                              {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={48} className="text-gray-700 stroke-1" /></div>}
                              <div className="absolute bottom-4 left-4 z-20"><p className="text-[8px] text-amber-500/80 font-mono tracking-[0.3em] uppercase mb-1.5">Target: AX-{slab.id.substring(0,8)}</p><h4 className="text-base font-serif uppercase text-white tracking-widest leading-snug">{slab.material}</h4></div>
                            </div>
                          </Link>
                          <div className="p-5 md:p-6 flex flex-col flex-1">
                            <div className="flex justify-between items-end mb-4">
                              <div><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-1.5">Buy Price</p><p className="text-xl font-mono text-white tracking-widest">{formatCurrency(slab.price)}</p></div>
                              <div className="text-right"><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-1.5">Vendor</p><p className="text-[10px] font-serif uppercase text-gray-300 truncate max-w-[120px]">{slab.profiles?.company_name || 'Unknown'}</p></div>
                            </div>
                             <button className="w-full bg-[#020202] border border-gray-800 text-gray-600 group-hover:text-amber-500 group-hover:border-amber-900 hover:bg-amber-950/30 font-bold uppercase tracking-[0.2em] py-3.5 rounded-sm transition-all text-[9px] flex items-center justify-center gap-2 mt-auto">
                              Initiate Offer <ArrowRight size={12}/>
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
                 <div className="space-y-5 w-full">
                 {incomingOffers.length === 0 ? (
                   <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                     <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><ArrowDownRight size={32} className="text-gray-700 stroke-1" /></div>
                     <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">No incoming offers detected.</p>
                   </div>
                 ) : (
                   incomingOffers.map(offer => (
                     <div key={offer.id} className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 justify-between items-start md:items-center relative overflow-hidden group shadow-xl w-full hover:border-emerald-900/50 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"></div>
                        <div className="flex-1 space-y-4 w-full pl-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-900 pb-4">
                            <span className="bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 w-fit shadow-inner"><ArrowDownRight size={12}/> Incoming Deal</span>
                            <span className="text-gray-500 text-[9px] font-mono flex items-center gap-2 tracking-[0.2em]"><Calendar size={12}/> {formatTime(offer.created_at)}</span>
                          </div>
                          <div className="pt-2"><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Sender Entity</p><p className="text-lg font-serif text-white uppercase tracking-widest leading-snug">{offer.contactName}</p></div>
                          <div className="bg-[#020202] border border-gray-800 p-5 rounded-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full max-w-xl shadow-inner">
                            <div><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Target Asset</p><Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[10px] font-mono text-white hover:text-[#A6947D] transition-colors bg-[#050505] px-3 py-1.5 rounded-sm border border-gray-800 tracking-widest">AX-{offer.offer_details?.asset_id.substring(0,6)}</Link></div>
                            <div className="sm:text-right"><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Proposed Value</p><p className="text-2xl font-mono text-emerald-500 tracking-widest">{formatCurrency(offer.offer_details?.price)}</p></div>
                          </div>
                        </div>
                         <button onClick={() => router.push('/inbox')} className="md:flex-none h-14 bg-white text-black font-extrabold uppercase tracking-[0.3em] px-8 rounded-sm hover:bg-gray-200 transition-all text-[10px] flex items-center justify-center gap-3 shadow-lg whitespace-nowrap mt-6 md:mt-0 w-full md:w-auto">
                           Open Comms <ArrowRight size={14}/>
                        </button>
                     </div>
                   ))
                 )}
                 </div>
              )}
              
              {activeTab === 'outgoing' && (
                 <div className="space-y-5 w-full">
                 {outgoingOffers.length === 0 ? (
                   <div className="bg-[#050505] border border-gray-900 rounded-sm p-12 md:p-24 text-center flex flex-col items-center justify-center shadow-2xl">
                     <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-6 bg-[#020202] shadow-inner"><ArrowUpRight size={32} className="text-gray-700 stroke-1" /></div>
                     <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">No active transmissions.</p>
                   </div>
                 ) : (
                   outgoingOffers.map(offer => (
                     <div key={offer.id} className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 justify-between items-start md:items-center relative overflow-hidden group shadow-xl w-full hover:border-amber-900/50 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]"></div>
                        <div className="flex-1 space-y-4 w-full pl-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-900 pb-4">
                            <span className="bg-amber-950/30 text-amber-500 border border-amber-900/50 px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 w-fit shadow-inner"><ArrowUpRight size={12}/> Transmitted Deal</span>
                            <span className="text-gray-500 text-[9px] font-mono flex items-center gap-2 tracking-[0.2em]"><Calendar size={12}/> {formatTime(offer.created_at)}</span>
                          </div>
                          <div className="pt-2"><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Target Entity</p><p className="text-lg font-serif text-white uppercase tracking-widest leading-snug">{offer.contactName}</p></div>
                          <div className="bg-[#020202] border border-gray-800 p-5 rounded-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 w-full max-w-xl shadow-inner">
                            <div><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Requested Asset</p><Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[10px] font-mono text-white hover:text-[#A6947D] transition-colors bg-[#050505] px-3 py-1.5 rounded-sm border border-gray-800 tracking-widest">AX-{offer.offer_details?.asset_id.substring(0,6)}</Link></div>
                            <div className="sm:text-right"><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Your Offer</p><p className="text-2xl font-mono text-white tracking-widest">{formatCurrency(offer.offer_details?.price)}</p></div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto mt-6 md:mt-0">
                            <button onClick={() => router.push('/inbox')} className="h-12 border border-gray-800 text-gray-600 hover:text-white hover:bg-gray-900 font-bold uppercase tracking-[0.2em] px-6 rounded-sm transition-all text-[9px] flex items-center justify-center gap-2">Comms</button>
                            <button onClick={() => openRefundModal(offer)} className="h-12 border border-red-900 text-red-600 hover:text-red-500 hover:bg-red-950/20 font-bold uppercase tracking-[0.2em] px-6 rounded-sm transition-all text-[9px] flex items-center justify-center gap-2">Abort Deal</button>
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