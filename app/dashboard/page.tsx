'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight, 
  Trash2, Handshake, ExternalLink, Calendar, AlertOctagon, RotateCcw, X, Loader2,
  Bell, Check, CheckCircle2, User, Target, Wallet, ArrowRight, FileSignature, Scale, Ship, ShieldCheck, Lock, Edit, ShoppingCart, Send, Menu,
  Layers3, UserCircle, Save, FileText, Download, Mail, Archive
} from 'lucide-react';
import Link from 'next/link';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

const stripePromise = loadStripe('pk_test_51TBwXT1RTGOC3MKLvHSA6uyyLoE1PaPGVb46ogLGueeTPnGEq5F0wZfFLE0c9FqHQRwB5aP8FsRbluepidkYreT700CBUJiDPV');

export default function PortfolioDashboard() {
  const router = useRouter();
  
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'assets' | 'private' | 'tracked' | 'incoming' | 'outgoing' | 'archive'>('assets');
  
  const [mySlabs, setMySlabs] = useState<any[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
  const [outgoingOffers, setOutgoingOffers] = useState<any[]>([]);
  const [trackedSlabs, setTrackedSlabs] = useState<any[]>([]);
  const [escrowTotal, setEscrowTotal] = useState(0);
  
  // STATE ΓΙΑ ΤΑ ΠΡΑΓΜΑΤΙΚΑ ΣΥΜΒΟΛΑΙΑ ΤΟΥ ARCHIVE
  const [myContracts, setMyContracts] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // --- MODALS STATE ---
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [refundAmount, setRefundAmount] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);

  const [isTermSheetOpen, setIsTermSheetOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [isSubmittingTerm, setIsSubmittingTerm] = useState(false);
  const [termSuccess, setTermSuccess] = useState(false);
  const [termSheet, setTermSheet] = useState({ price: '', incoterms: 'FOB', deposit: '30', inspection: '7' });

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    material: '', price: '', origin: '', location: '', thickness: '', quantity: '', incoterm: 'EXW', description: '', visibility: 'public', pricing_model: 'PUBLIC'
  });

  // --- STATE ΓΙΑ ΤΟ SMART MENU ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('BUYER');

  // ==========================================
  // --- STATE ΓΙΑ ΤΟ CONTRACT GENERATOR ---
  // ==========================================
  const [isContractGeneratorOpen, setIsContractGeneratorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contractData, setContractData] = useState({
    contractId: `AX-${Math.floor(1000 + Math.random() * 9000)}-SIVEC`,
    buyerName: '',
    buyerEmail: '',
    material: 'Sivec White Premium',
    quantity: '',
    price: '',
    incoterms: 'FOB Piraeus',
  });

  const handleContractChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setContractData({ ...contractData, [e.target.name]: e.target.value });
  };
  // ==========================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      
      const user = session.user;
      setCurrentUser(user);

      // Fetch Role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile && profile.role) { setUserRole(profile.role); }

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

      // Fetch Contracts (Για το Archive)
      const { data: contractsData } = await supabase
        .from('contracts')
        .select(`
          *,
          buyer:buyer_id (company_name),
          vendor:vendor_id (company_name),
          slab:slab_id (material)
        `)
        .or(`buyer_id.eq.${user.id},vendor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (contractsData) {
        setMyContracts(contractsData); 
        
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
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  // Απλό formatting ημερομηνίας για το Archive
  const formatArchiveDate = (isoString: string) => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

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

  // --- SMART TERM SHEET LOGIC ---
  const openTermSheet = (slab: any) => {
    setSelectedTarget(slab);
    setTermSheet({
      price: slab.price ? slab.price.toString() : '',
      incoterms: 'FOB',
      deposit: '30',
      inspection: '7'
    });
    setTermSuccess(false);
    setIsTermSheetOpen(true);
  };

  const submitTermSheet = async () => {
    if (!selectedTarget || !currentUser) return;
    setIsSubmittingTerm(true);

    try {
      const generatedText = `BINDING TERM SHEET GENERATED:\n• Target Asset: AX-${selectedTarget.id.substring(0,8)}\n• Proposed Value: €${termSheet.price}\n• Logistics (Incoterms): ${termSheet.incoterms}\n• Escrow Deposit: ${termSheet.deposit}%\n• Surveyor Inspection Window: ${termSheet.inspection} Days\n\n*Awaiting Vendor Authorization to initialize Stripe Escrow API.*`;

      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedTarget.user_id || selectedTarget.vendor_id,
        text: generatedText,
        is_offer: true,
        offer_details: {
          asset_id: selectedTarget.id,
          price: termSheet.price,
          incoterms: termSheet.incoterms,
          deposit: termSheet.deposit,
          inspection: termSheet.inspection
        }
      });

      if (error) throw error;
      await supabase.from('saved_assets').delete().match({ user_id: currentUser.id, slab_id: selectedTarget.id });
      setTrackedSlabs(prev => prev.filter(s => s.id !== selectedTarget.id));

      setTermSuccess(true);
      setTimeout(() => { setIsTermSheetOpen(false); router.push('/inbox'); }, 2000);
    } catch (error) {
      console.error('Term Sheet Error:', error);
      alert(t('common.error'));
    } finally {
      setIsSubmittingTerm(false);
    }
  };
  
  // =========================================================================
  // --- ΝΕΟ: ΕΓΓΡΑΦΗ ΤΟΥ CONTRACT ΣΤΗ ΒΑΣΗ ΚΑΙ ΑΠΟΣΤΟΛΗ ΣΤΟ INBOX ---
  // =========================================================================
  const handleGenerateContract = async () => {
      if (!currentUser) return;
      setIsGenerating(true);
      
      try {
        // 1. Γράφουμε το συμβόλαιο στη βάση (πίνακας contracts)
        const numericPrice = contractData.price ? parseFloat(contractData.price.replace(/,/g, '')) : 0;
        
        const { data, error } = await supabase.from('contracts').insert({
          vendor_id: currentUser.id,
          price: numericPrice,
          status: 'pending'
          // Σημείωση: Αφήνουμε το buyer_id και slab_id κενά προς το παρόν, 
          // εφόσον είναι generated text contract.
        });

        if (error) {
          console.warn("DB Validation for pure text contracts might need tweaks:", error);
          // Ακόμα και αν το σχήμα της βάσης έχει strict foreign keys και βγάλει error, 
          // εμείς προχωράμε στο βήμα 2 για να λειτουργήσει το flow προς τον αγοραστή.
        } else {
          // Αν η εγγραφή πετύχει, κάνουμε refresh τα data του Archive
          const { data: updatedContracts } = await supabase
            .from('contracts')
            .select('*, buyer:buyer_id (company_name), vendor:vendor_id (company_name), slab:slab_id (material)')
            .or(`buyer_id.eq.${currentUser.id},vendor_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false });
          
          if (updatedContracts) setMyContracts(updatedContracts);
        }

        // 2. Δημιουργούμε το "Πακέτο" (Text format) για να μπει στο Inbox
        const draftText = `AXON INSTITUTIONAL CONTRACT\nID: ${contractData.contractId}\nCounterparty: ${contractData.buyerName}\nMaterial: ${contractData.material}\nQuantity: ${contractData.quantity}\nValue: €${contractData.price}\nIncoterms: ${contractData.incoterms}\n\n*Awaiting your approval to fund Escrow.*`;
        
        // Το αποθηκεύουμε στη μνήμη του browser
        localStorage.setItem('axon_draft_contract', draftText);

        // 3. Κλείνουμε το Modal και πάμε στο Inbox
        setIsContractGeneratorOpen(false);
        router.push('/inbox');

      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
  };

  const sendArchiveContractToInbox = (contractId: string, price: string, status: string) => {
      // Όταν πατάς "Send via Axon Chat" από το Archive
      const draftText = `Please review our latest Institutional Ledger Update.\nContract Ref: AX-${contractId.substring(0,8).toUpperCase()}\nValue: €${price}\nStatus: ${status}\n\n*Document secured by AXON Network.*`;
      localStorage.setItem('axon_draft_contract', draftText);
      router.push('/inbox');
  };

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


  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* --------------------------------------------------------- */}
      {/* EXECUTIVE COMMAND OVERLAY (THE SMART MENU) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-[#A6947D]" />
              <h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">ΚΕΝΤΡΟ ΕΠΙΧΕΙΡΗΣΕΩΝ</h2>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {/* CONTRACT GENERATOR BUTTON FOR MOBILE */}
            <button onClick={() => {setIsMobileMenuOpen(false); setIsContractGeneratorOpen(true);}} className="w-full bg-[#A6947D] border border-[#A6947D]/50 text-[#020509] p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest mb-6 shadow-lg shadow-[#A6947D]/20">
              <FileText size={16} /> CREATE SMART CONTRACT
            </button>

            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">ΒΑΣΙΚΕΣ ΕΝΟΤΗΤΕΣ - {userRole}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors shadow-inner">
                <Layers3 size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Χαρτοφυλακιο &<br/>Συμφωνιες</span>
              </Link>
              {userRole === 'SELLER' && (
                <Link href="/scanner" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                  <Crosshair size={24} className="text-[#A6947D]" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Σαρωτης<br/>Υλικων</span>
                </Link>
              )}
              <Link href="/trading" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Globe size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Δημοσια<br/>Αγορα</span>
              </Link>
              <Link href="/network" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Users size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Παγκοσμιο<br/>Δικτυο</span>
              </Link>
              <Link href="/inbox" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <MessageSquare size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Ασφαλεις<br/>Συνομιλιες</span>
              </Link>
              <Link href="/me" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <UserCircle size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Εταιρικο<br/>Προφιλ</span>
              </Link>
            </div>

            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">ΣΥΣΤΗΜΑ</p>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest">
              <LogOut size={16} /> ΑΠΟΣΥΝΔΕΣΗ
            </button>
          </div>
        </div>
      )}
      {/* --------------------------------------------------------- */}

      {/* MASTER SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 shadow-[0_0_15px_rgba(166,148,125,0.05)] bg-[#01030A]">
            <Shield size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">ΘΕΣΜΙΚΟΥ ΕΠΙΠΕΔΟΥ</p>
        </div>

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Layers3 size={16} /> ΧΑΡΤΟΦΥΛΑΚΙΟ & ΣΥΜΦΩΝΙΕΣ</Link>
          {userRole === 'SELLER' && (
            <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> ΣΑΡΩΤΗΣ ΥΛΙΚΩΝ</Link>
          )}
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> ΔΗΜΟΣΙΑ ΑΓΟΡΑ</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> ΑΣΦΑΛΕΙΣ ΣΥΝΟΜΙΛΙΕΣ</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><UserCircle size={16} /> ΕΤΑΙΡΙΚΟ ΠΡΟΦΙΛ</Link>
        </nav>

        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> ΑΠΟΣΥΝΔΕΣΗ</button></div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full z-10">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Globe size={800} className="text-[#A6947D] shrink-0" />
        </div>
        
        <div className="p-4 md:p-12 max-w-7xl mx-auto relative z-10 w-full overflow-x-hidden">
          <header className="mb-6 md:mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light">{t('dashboard.title')}</h2>
              <div className="flex items-center gap-2 md:gap-3 mt-2"><span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span><p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Portfolio Oversight</p></div>
            </div>
            <div className="relative flex items-center gap-4">
              
              {/* CONTRACT GENERATOR BUTTON (DESKTOP) */}
              <button 
                onClick={() => setIsContractGeneratorOpen(true)}
                className="hidden md:flex bg-[#D4AF37] hover:bg-[#b5952f] text-[#020817] px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest items-center gap-2 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                <FileText size={16} /> NEW CONTRACT
              </button>

              <button onClick={() => setShowNotifs(!showNotifs)} className={`p-2.5 md:p-3 rounded-xl border transition-all relative ${notifications.length > 0 ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-[#01030A] border-[#A6947D]/20 text-[#A6947D]/60'}`}>
                <Bell size={20} />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-amber-500 text-[#020509] text-[9px] md:text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">{notifications.length}</span>}
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-12 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-[#01030A] border border-[#A6947D]/30 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-[#A6947D]/10 bg-[#020509] flex justify-between items-center"><p className="text-[10px] font-bold uppercase tracking-widest text-[#A6947D]">Intelligence Feed</p><button onClick={() => setShowNotifs(false)} className="text-[#A6947D]/60 hover:text-[#A6947D]"><X size={14}/></button></div>
                  <div className="max-h-80 md:max-h-96 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? <div className="p-10 text-center text-[10px] font-mono text-[#A6947D]/40 uppercase tracking-widest">No active alerts.</div> : notifications.map(n => (
                      <div key={n.id} className="p-4 border-b border-[#A6947D]/5 hover:bg-[#A6947D]/5 transition-colors group">
                        <p className="text-[10px] font-bold text-[#F8F5EE] uppercase mb-1">{n.title}</p><p className="text-[10px] md:text-[11px] text-[#A6947D] leading-relaxed mb-3">{n.message}</p>
                        <div className="flex gap-2"><button onClick={() => markAsRead(n.id)} className="text-[9px] text-[#A6947D]/40 hover:text-emerald-400 p-1.5 transition-colors"><Check size={14}/></button></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </header>

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8 animate-in fade-in duration-700 delay-100">
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-5 md:p-6 shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500"><Wallet size={64} className="text-[#A6947D]"/></div>
                <p className="text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest mb-2 flex items-center gap-2"><Package size={12}/> Public Portfolio</p>
                <p className="text-2xl md:text-3xl font-serif text-[#F8F5EE] tracking-wider mb-2">{formatCurrency(myPortfolioValue)}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono"><ArrowUpRight size={12} className="text-emerald-500"/><span className="text-emerald-500">{t('dashboard.active_supply')}</span><span className="text-[#A6947D]/40">|</span><span className="text-[#F8F5EE]/60">{publicAssets.length} Assets</span></div>
              </div>
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(99,102,241,0.1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500"><Lock size={64} className="text-indigo-400"/></div>
                <p className="text-[9px] font-bold text-indigo-400/80 uppercase tracking-widest mb-2 flex items-center gap-2"><Lock size={12}/> OTC Dark Pool (Private)</p>
                <p className="text-2xl md:text-3xl font-serif text-[#F8F5EE] tracking-wider mb-2">Off-Market</p>
                <div className="flex items-center gap-2 text-[10px] font-mono"><Shield size={12} className="text-indigo-400"/><span className="text-indigo-400">Secured</span><span className="text-[#A6947D]/40">|</span><span className="text-[#F8F5EE]/60">{privateAssets.length} Assets</span></div>
              </div>
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500"><Target size={64} className="text-amber-500"/></div>
                <p className="text-[9px] font-bold text-[#A6947D]/60 uppercase tracking-widest mb-2 flex items-center gap-2"><Crosshair size={12}/> {t('dashboard.tracked_targets')}</p>
                <p className="text-2xl md:text-3xl font-serif text-[#F8F5EE] tracking-wider mb-2">{formatCurrency(trackedVaultValue)}</p>
                <div className="flex items-center gap-2 text-[10px] font-mono"><ArrowDownRight size={12} className="text-amber-500"/><span className="text-amber-500">{t('dashboard.pending_execution')}</span><span className="text-[#A6947D]/40">|</span><span className="text-[#F8F5EE]/60">{trackedSlabs.length} Assets</span></div>
              </div>
              <div onClick={() => router.push('/contracts')} className="bg-[#01030A]/80 backdrop-blur-md border border-emerald-500/30 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden group cursor-pointer hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-300">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500"><FileSignature size={64} className="text-emerald-500"/></div>
                <p className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={12}/> Escrow Contracts</p>
                <p className="text-2xl md:text-3xl font-serif text-[#F8F5EE] tracking-wider mb-2">{formatCurrency(escrowTotal)}</p>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-2"><Handshake size={12} className="text-emerald-400"/><span className="text-emerald-400">Secured Funds</span></div>
                  <span className="text-[#F8F5EE]/40 group-hover:text-emerald-400 transition-colors uppercase font-bold tracking-widest text-[8px]">Access Vault &rarr;</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 md:gap-4 border-b border-[#A6947D]/10 mb-6 md:mb-8 overflow-x-auto custom-scrollbar pb-px animate-in fade-in duration-700 delay-100 fill-mode-both w-full scroll-smooth">
            <button onClick={() => setActiveTab('assets')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'assets' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Package size={14} /> {t('dashboard.my_assets')} ({publicAssets.length})</button>
            <button onClick={() => setActiveTab('private')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'private' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Lock size={14} /> Private Vault {privateAssets.length > 0 && <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] shadow-sm">{privateAssets.length}</span>}</button>
            <button onClick={() => setActiveTab('tracked')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'tracked' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Target size={14} /> {t('dashboard.tracked_vault')} {trackedSlabs.length > 0 && <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px]">{trackedSlabs.length}</span>}</button>
            <button onClick={() => setActiveTab('incoming')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'incoming' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><ArrowDownRight size={14} /> {t('dashboard.incoming')} {incomingOffers.length > 0 && <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full text-[8px] md:text-[9px] shadow-[0_0_10px_rgba(16,185,129,0.2)]">{incomingOffers.length}</span>}</button>
            <button onClick={() => setActiveTab('outgoing')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'outgoing' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><ArrowUpRight size={14} /> {t('dashboard.outgoing')} ({outgoingOffers.length})</button>
            
            {/* ARCHIVE TAB */}
            <button onClick={() => setActiveTab('archive')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'archive' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}>
              <Archive size={14} /> CONTRACT ARCHIVE
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-[#A6947D] animate-pulse font-mono text-xs uppercase tracking-widest">Synchronizing...</div>
          ) : (
            <div className="animate-in fade-in duration-700 delay-200 fill-mode-both w-full overflow-x-hidden">
              
              {/* --- PUBLIC ASSETS TAB --- */}
              {activeTab === 'assets' && (
                <div className="w-full">
                  {publicAssets.length === 0 ? (
                    <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-2xl p-8 md:p-16 text-center flex flex-col items-center justify-center shadow-[0_0_30px_rgba(166,148,125,0.03)]">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-[#A6947D]/20 flex items-center justify-center mb-4 md:mb-6 bg-[#A6947D]/5"><Package size={28} className="text-[#A6947D]/60" /></div>
                      <h3 className="text-lg md:text-xl font-serif text-[#A6947D] uppercase tracking-[0.15em] mb-2 md:mb-3">Public Ledger is Empty</h3>
                      <p className="text-[9px] md:text-[10px] text-[#F8F5EE]/40 font-mono uppercase tracking-widest mb-6 md:mb-8">No visible assets listed.</p>
                      <Link href="/scanner" className="bg-transparent border border-[#A6947D]/40 text-[#A6947D] hover:text-[#F8F5EE] hover:border-[#A6947D] hover:bg-[#A6947D]/10 px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-md">Initiate Scan</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                      {publicAssets.map(slab => (
                        <div key={slab.id} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/15 rounded-2xl overflow-hidden hover:border-[#A6947D]/40 transition-all duration-500 group flex flex-col shadow-lg w-full">
                          <div className="h-40 md:h-48 bg-[#020509] relative overflow-hidden">
                            {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center text-[#A6947D]/20"><Package size={40} /></div>}
                            <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-[#020509]/90 backdrop-blur-md border border-[#A6947D]/30 px-2 py-1 rounded-lg text-[8px] font-bold text-[#A6947D] uppercase tracking-[0.2em] shadow-lg">AX-{slab.id.substring(0,6)}</div>
                          </div>
                          <div className="p-4 md:p-6 flex-1 flex flex-col">
                            <h3 className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-wider mb-1 md:mb-2 truncate">{slab.material || 'Unknown Material'}</h3>
                            <p className="text-xl md:text-2xl font-mono text-[#A6947D] mb-4 md:mb-6">{formatCurrency(slab.price)}</p>
                            <div className="mt-auto pt-4 border-t border-[#A6947D]/10 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <button onClick={() => openEditModal(slab)} className="text-amber-500/60 hover:text-amber-500 p-1.5 md:p-2 rounded-lg hover:bg-amber-500/10 transition-colors"><Edit size={14} className="md:w-4 md:h-4" /></button>
                                <button onClick={() => deleteSlab(slab.id)} className="text-red-500/40 hover:text-red-500 p-1.5 md:p-2 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={14} className="md:w-4 md:h-4" /></button>
                              </div>
                              <Link href={`/trading/${slab.id}`} target="_blank" className="text-[#A6947D]/60 hover:text-[#A6947D] text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors"><ExternalLink size={14}/> View Ledger</Link>
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
                    <div className="bg-[#01030A]/60 backdrop-blur-md border border-indigo-500/10 rounded-2xl p-8 md:p-16 text-center flex flex-col items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.03)]">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-indigo-500/20 flex items-center justify-center mb-4 md:mb-6 bg-indigo-500/5"><Lock size={28} className="text-indigo-500/40" /></div>
                      <h3 className="text-lg md:text-xl font-serif text-indigo-400 uppercase tracking-[0.15em] mb-2 md:mb-3">Vault is Empty</h3>
                      <p className="text-[9px] md:text-[10px] text-[#F8F5EE]/40 font-mono uppercase tracking-widest mb-6 md:mb-8">No off-market assets stored.</p>
                      <Link href="/scanner" className="bg-transparent border border-indigo-500/40 text-indigo-400 hover:text-[#F8F5EE] hover:border-indigo-400 hover:bg-indigo-500/10 px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-md">Add Private Asset</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                      {privateAssets.map(slab => (
                        <div key={slab.id} className="bg-[#01030A]/90 backdrop-blur-xl border border-indigo-500/30 rounded-2xl overflow-hidden hover:border-indigo-500/60 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all duration-300 group flex flex-col relative shadow-lg w-full">
                          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20 flex items-center gap-1.5 bg-indigo-900/80 backdrop-blur-md border border-indigo-500/50 px-2 py-1 rounded-lg shadow-lg"><Lock size={10} className="text-indigo-400"/><span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Off-Market</span></div>
                          <div className="h-40 md:h-48 bg-[#020509] relative overflow-hidden border-b border-indigo-500/20">
                            {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={48} className="text-indigo-400" /></div>}
                          </div>
                          <div className="p-4 md:p-6 flex flex-col flex-1">
                            <h3 className="text-base md:text-lg font-serif text-[#F8F5EE] uppercase tracking-wider mb-1 md:mb-2 truncate">{slab.material || 'Unknown Material'}</h3>
                            <p className="text-xl md:text-2xl font-mono text-indigo-400 mb-4 md:mb-6">{formatCurrency(slab.price)}</p>
                            <div className="mt-auto pt-4 border-t border-indigo-500/10 flex justify-between items-center gap-3">
                              <div className="flex gap-2">
                                <button onClick={() => openEditModal(slab)} className="text-amber-500/40 hover:text-amber-500 p-2 rounded-lg hover:bg-amber-500/10 transition-colors"><Edit size={14} className="md:w-4 md:h-4" /></button>
                                <button onClick={() => deleteSlab(slab.id)} className="text-red-500/40 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={14} className="md:w-4 md:h-4" /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- TRACKED VAULT TAB --- */}
              {activeTab === 'tracked' && (
                <div className="w-full">
                  {trackedSlabs.length === 0 ? (
                    <div className="bg-[#01030A]/60 backdrop-blur-md border border-amber-500/10 rounded-2xl p-8 md:p-16 text-center flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.03)]">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-amber-500/20 flex items-center justify-center mb-4 md:mb-6 bg-amber-500/5"><Target size={28} className="text-amber-500/40" /></div>
                      <h3 className="text-lg md:text-xl font-serif text-amber-500 uppercase tracking-[0.15em] mb-2 md:mb-3">No Targets Locked</h3>
                      <p className="text-[9px] md:text-[10px] text-[#F8F5EE]/40 font-mono uppercase tracking-widest mb-6 md:mb-8">Access the trading floor to track assets.</p>
                      <Link href="/trading" className="bg-transparent border border-amber-500/40 text-amber-500 hover:text-amber-400 hover:border-amber-500 hover:bg-amber-500/10 px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] transition-all shadow-md">Enter Public Floor</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                      {trackedSlabs.map(slab => (
                        <div key={slab.id} className="bg-[#01030A]/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl overflow-hidden hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all duration-300 group flex flex-col relative w-full">
                          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded shadow-lg"><Target size={10} className="text-amber-500 animate-pulse"/><span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Locked</span></div>
                          <Link href={`/trading/${slab.id}`}>
                            <div className="h-40 bg-[#020509] relative overflow-hidden border-b border-[#A6947D]/15">
                              <div className="absolute inset-0 bg-gradient-to-t from-[#01030A] to-transparent z-10 opacity-80"></div>
                              {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-700" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Package size={48} className="text-[#A6947D]" /></div>}
                              <div className="absolute bottom-3 left-3 z-20"><p className="text-[8px] text-amber-500/80 font-mono tracking-widest uppercase mb-1">Target ID: {slab.id.substring(0,8)}</p><h4 className="text-base font-serif uppercase text-[#F8F5EE] leading-none">{slab.material}</h4></div>
                            </div>
                          </Link>
                          <div className="p-4 flex flex-col flex-1">
                            <div className="flex justify-between items-end mb-4">
                              <div><p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Buy Price</p><p className="text-base font-mono text-[#F8F5EE]">{formatCurrency(slab.price)}</p></div>
                              <div className="text-right"><p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Vendor</p><p className="text-[10px] font-bold uppercase text-[#A6947D] truncate max-w-[100px]">{slab.profiles?.company_name || 'Unknown'}</p></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INCOMING TABS */}
              {activeTab === 'incoming' && (
                 <div className="space-y-4 w-full">
                 {incomingOffers.length === 0 ? (
                   <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-2xl p-10 md:p-16 text-center flex flex-col items-center justify-center">
                     <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border border-emerald-500/20 flex items-center justify-center mb-4 md:mb-6 bg-emerald-500/5"><ArrowDownRight size={28} className="text-emerald-500/40" /></div>
                     <p className="text-[9px] md:text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-[0.2em]">No incoming offers detected.</p>
                   </div>
                 ) : (
                   incomingOffers.map(offer => (
                     <div key={offer.id} className="bg-[#01030A]/80 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start md:items-center relative overflow-hidden group shadow-lg w-full">
                        <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]"></div>
                        <div className="flex-1 space-y-3 w-full pl-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-[#A6947D]/10 pb-2 md:pb-3">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit"><ArrowDownRight size={10}/> Incoming Deal</span>
                            <span className="text-[#A6947D]/60 text-[9px] md:text-[10px] font-mono flex items-center gap-1.5"><Calendar size={10}/> {formatTime(offer.created_at)}</span>
                          </div>
                          <div className="pt-1"><p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] mb-1">Sender Entity</p><p className="text-base md:text-xl font-serif text-[#F8F5EE] uppercase tracking-wider">{offer.contactName}</p></div>
                          <div className="bg-[#020509] border border-[#A6947D]/15 p-4 md:p-5 rounded-xl inline-block w-full max-w-md shadow-inner">
                            <div className="flex justify-between items-center mb-3"><span className="text-[8px] md:text-[9px] text-[#A6947D] uppercase tracking-widest">Target Asset</span><Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[9px] md:text-[11px] font-mono text-[#F8F5EE] hover:text-[#A6947D] transition-colors bg-[#A6947D]/10 px-2 py-0.5 rounded border border-[#A6947D]/20">AX-{offer.offer_details?.asset_id?.substring(0,6)}</Link></div>
                            <div className="flex justify-between items-center border-t border-[#A6947D]/15 pt-3"><span className="text-[8px] md:text-[9px] text-[#A6947D] uppercase tracking-widest">Proposed Value</span><span className="text-lg md:text-2xl font-mono text-emerald-400 font-light tracking-tighter">{formatCurrency(offer.offer_details?.price)}</span></div>
                          </div>
                        </div>
                     </div>
                   ))
                 )}
                 </div>
              )}
              {/* OUTGOING TABS */}
              {activeTab === 'outgoing' && (
                 <div className="space-y-4 w-full">
                 {outgoingOffers.length === 0 ? (
                   <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-2xl p-10 md:p-16 text-center flex flex-col items-center justify-center">
                     <div className="w-16 h-16 md:w-20 h-20 rounded-full border border-amber-500/20 flex items-center justify-center mb-4 md:mb-6 bg-amber-500/5"><ArrowUpRight size={28} className="text-amber-500/40" /></div>
                     <p className="text-[9px] md:text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-[0.2em]">No active transmissions.</p>
                   </div>
                 ) : (
                   outgoingOffers.map(offer => (
                     <div key={offer.id} className="bg-[#01030A]/80 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start md:items-center relative overflow-hidden group shadow-lg w-full">
                        <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]"></div>
                        <div className="flex-1 space-y-3 w-full pl-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 border-b border-[#A6947D]/10 pb-2 md:pb-3">
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[8px] md:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-sm"><ArrowUpRight size={10}/> Transmitted Deal</span>
                            <span className="text-[#A6947D]/60 text-[9px] md:text-[10px] font-mono flex items-center gap-1.5"><Calendar size={10}/> {formatTime(offer.created_at)}</span>
                          </div>
                          <div className="pt-1"><p className="text-[8px] md:text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] mb-1">Target Entity</p><p className="text-base md:text-xl font-serif text-[#F8F5EE] uppercase tracking-wider">{offer.contactName}</p></div>
                          <div className="bg-[#020509] border border-[#A6947D]/15 p-4 md:p-5 rounded-xl inline-block w-full max-w-md shadow-inner opacity-80">
                            <div className="flex justify-between items-center mb-3"><span className="text-[8px] md:text-[9px] text-[#A6947D] uppercase tracking-widest">Requested Asset</span><Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[9px] md:text-[11px] font-mono text-[#F8F5EE] hover:text-[#A6947D] transition-colors bg-[#A6947D]/10 px-2 py-0.5 rounded border border-[#A6947D]/20">AX-{offer.offer_details?.asset_id?.substring(0,6)}</Link></div>
                            <div className="flex justify-between items-center border-t border-[#A6947D]/15 pt-3"><span className="text-[8px] md:text-[9px] text-[#A6947D] uppercase tracking-widest">Your Offer</span><span className="text-lg md:text-2xl font-mono text-[#F8F5EE] font-light tracking-tighter">{formatCurrency(offer.offer_details?.price)}</span></div>
                          </div>
                        </div>
                     </div>
                   ))
                 )}
                 </div>
              )}

              {/* --- ΝΕΟ: CONTRACT ARCHIVE TAB (REAL DATA) --- */}
              {activeTab === 'archive' && (
                <div className="w-full animate-in fade-in duration-500">
                  <div className="mb-6">
                    <h3 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.15em] mb-1">Contract Archive</h3>
                    <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-widest">Institutional Ledger History</p>
                  </div>
                  
                  {myContracts.length === 0 ? (
                    <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-2xl p-10 md:p-16 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 md:w-20 h-20 rounded-full border border-[#A6947D]/20 flex items-center justify-center mb-4 md:mb-6 bg-[#A6947D]/5">
                        <Archive size={28} className="text-[#A6947D]/40" />
                      </div>
                      <p className="text-[9px] md:text-[10px] text-[#A6947D]/60 font-mono uppercase tracking-[0.2em]">No contracts found in ledger.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                      {myContracts.map(contract => {
                        // Καθορισμός του ρόλου του χρήστη στο συμβόλαιο (αν είναι αγοραστής ή πωλητής)
                        const isSeller = currentUser?.id === contract.vendor_id;
                        const counterpartyName = isSeller 
                          ? (contract.buyer?.company_name || 'UNKNOWN BUYER')
                          : (contract.vendor?.company_name || 'UNKNOWN VENDOR');
                        
                        // Χρώμα Status
                        let statusColor = 'text-slate-400';
                        if (contract.status === 'funded' || contract.status === 'shipped') statusColor = 'text-emerald-500';
                        if (contract.status === 'pending') statusColor = 'text-amber-500';
                        if (contract.status === 'cancelled' || contract.status === 'disputed') statusColor = 'text-red-500';

                        return (
                          <div key={contract.id} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between gap-6 shadow-lg hover:border-[#A6947D]/40 transition-colors group">
                            
                            {/* Αριστερό Μέρος (Πληροφορίες) */}
                            <div className="flex gap-4">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-[#A6947D]/30 flex items-center justify-center relative shrink-0 bg-[#A6947D]/5 group-hover:bg-[#A6947D]/10 transition-colors">
                                <Shield size={26} className="text-[#A6947D]/30 absolute" />
                                <span className="text-[#A6947D] text-[10px] md:text-xs font-bold font-serif relative z-10">CT</span>
                              </div>
                              
                              <div className="flex flex-col justify-center">
                                <h4 className="text-[#F8F5EE] font-serif uppercase tracking-wider text-sm md:text-base">
                                  CONTRACT #{contract.id.substring(0, 8).toUpperCase()}
                                </h4>
                                <p className="text-[10px] text-[#A6947D]/60 font-mono mb-3">{formatArchiveDate(contract.created_at)}</p>
                                
                                <div className="space-y-1">
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Counterparty:</span> {counterpartyName}</p>
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Asset:</span> {contract.slab?.material || 'Unknown Material'}</p>
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Value:</span> €{contract.price}</p>
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Status:</span> <span className={`font-bold uppercase ${statusColor}`}>{contract.status}</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Δεξί Μέρος (Κουμπιά) */}
                            <div className="flex flex-col gap-2 shrink-0 md:w-48 justify-center">
                              <button 
                                onClick={() => sendArchiveContractToInbox(contract.id, contract.price, contract.status)} 
                                className="w-full bg-transparent border border-[#A6947D]/30 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] px-4 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                              >
                                <MessageSquare size={14} /> SEND VIA AXON CHAT
                              </button>
                              <button 
                                onClick={() => {
                                  alert(`AXON SECURE SYSTEM: Generating PDF for Contract AX-${contract.id.substring(0, 8).toUpperCase()}`);
                                  window.print(); // Αυτό ανοίγει κατευθείαν το παράθυρο εκτύπωσης/αποθήκευσης PDF του browser!
                                }} 
                                className="w-full bg-transparent border border-[#A6947D]/30 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] px-4 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                              >
                                <Download size={14} /> DOWNLOAD PDF
                              </button>
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Layers3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors">
          <MessageSquare size={20} />
          {notifications.length > 0 && <span className="absolute top-1 right-1/4 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>}
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>

      {/* ========================================================= */}
      {/* --- ΥΠΕΡΣΥΓΧΡΟΝΑ MODALS (EDIT, REFUND, TERM SHEET, CONTRACT GENERATOR) --- */}
      {/* ========================================================= */}

      {/* 0. CONTRACT GENERATOR MODAL (NEW) */}
      {isContractGeneratorOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 md:p-6 bg-[#01030A]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#020509] border border-[#D4AF37]/30 rounded-2xl w-full max-w-[1400px] h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative">
            {/* Header */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-[#D4AF37]/20 bg-[#01030A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
                  <FileText className="text-[#D4AF37] w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white tracking-wide uppercase">AXON CONTRACT GENERATOR</h2>
                  <p className="text-[10px] font-mono text-[#D4AF37] tracking-widest uppercase">Institutional Ledger Tool</p>
                </div>
              </div>
              <button onClick={() => setIsContractGeneratorOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Body Split */}
            <div className="flex flex-col md:flex-row h-full overflow-y-auto custom-scrollbar">
              
              {/* ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: AXON CONTROL PANEL */}
              <div className="w-full md:w-1/2 bg-[#0A192F] p-6 flex flex-col gap-5 border-r border-[#D4AF37]/10">
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Buyer Information</label>
                  <input type="text" name="buyerName" placeholder="Company Name (e.g., Emaar Properties)" value={contractData.buyerName} onChange={handleContractChange} className="w-full bg-[#020817] border border-slate-700 focus:border-[#D4AF37] rounded-lg p-3 text-white placeholder-slate-500 outline-none transition-colors" />
                  <input type="email" name="buyerEmail" placeholder="Contact Email" value={contractData.buyerEmail} onChange={handleContractChange} className="w-full bg-[#020817] border border-slate-700 focus:border-[#D4AF37] rounded-lg p-3 text-white placeholder-slate-500 outline-none transition-colors" />
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Asset Details</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" name="material" placeholder="Material" value={contractData.material} onChange={handleContractChange} className="w-full bg-[#020817] border border-slate-700 focus:border-[#D4AF37] rounded-lg p-3 text-white placeholder-slate-500 outline-none" />
                    <input type="text" name="quantity" placeholder="Quantity (e.g., 15,000 m²)" value={contractData.quantity} onChange={handleContractChange} className="w-full bg-[#020817] border border-slate-700 focus:border-[#D4AF37] rounded-lg p-3 text-white placeholder-slate-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <label className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Financial Terms</label>
                  <div className="grid grid-cols-2 gap-4">
                    <select name="incoterms" value={contractData.incoterms} onChange={handleContractChange} className="w-full bg-[#020817] border border-slate-700 focus:border-[#D4AF37] rounded-lg p-3 text-white outline-none appearance-none">
                      <option value="FOB Piraeus">FOB Piraeus</option>
                      <option value="EXW Drama">EXW Drama</option>
                      <option value="CIF Dubai">CIF Dubai</option>
                    </select>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">€</span>
                      <input type="number" name="price" placeholder="Total Value" value={contractData.price} onChange={handleContractChange} className="w-full bg-[#020817] border border-slate-700 focus:border-[#D4AF37] rounded-lg p-3 pl-8 text-white placeholder-slate-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-8 mt-auto pb-4">
                  <button onClick={handleGenerateContract} disabled={isGenerating} className="flex-1 bg-[#D4AF37] hover:bg-[#b5952f] text-[#020817] font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    SEND CONTRACT TO BUYER
                  </button>
                  <button onClick={() => window.print()} className="px-4 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg flex items-center justify-center transition-colors" title="Download PDF">
                    <Download size={20} />
                  </button>
                </div>
              </div>

              {/* ΔΕΞΙΑ ΠΛΕΥΡΑ: LIVE DOCUMENT PREVIEW (Institutional White) */}
              <div className="w-full md:w-1/2 bg-[#020509] flex items-start justify-center p-4 md:p-8 overflow-y-auto">
                <div className="bg-white w-full max-w-[600px] min-h-[700px] shadow-[0_0_50px_rgba(255,255,255,0.1)] rounded-sm p-8 md:p-10 text-slate-900 font-serif relative">
                  
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-[#0A192F] pb-6 mb-8">
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter text-[#0A192F]">AXON</h1>
                      <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-sans font-bold mt-1">Institutional Ledger</p>
                    </div>
                    <div className="text-right text-xs text-slate-500 font-sans">
                      <p>Contract ID: <strong className="text-[#0A192F]">{contractData.contractId}</strong></p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="mb-8 text-sm">
                    <h3 className="font-bold text-[#0A192F] mb-4 uppercase border-b border-slate-200 pb-1">Parties of Agreement</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Seller</p>
                        <p className="font-semibold text-base">Pavlidis S.A.</p>
                        <p className="text-slate-600">Verified Tier 1 Vendor</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Buyer</p>
                        <p className="font-semibold text-base">{contractData.buyerName || '[Buyer Name]'}</p>
                        <p className="text-slate-600">{contractData.buyerEmail || '[Buyer Email]'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Asset & Terms */}
                  <div className="mb-8 text-sm">
                    <h3 className="font-bold text-[#0A192F] mb-4 uppercase border-b border-slate-200 pb-1">Asset & Terms</h3>
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500">Material</td>
                          <td className="py-2 font-semibold">{contractData.material || '-'}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500">Quantity</td>
                          <td className="py-2 font-semibold">{contractData.quantity || '-'}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500">Incoterms</td>
                          <td className="py-2 font-semibold">{contractData.incoterms}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-3 px-2 font-bold text-[#0A192F]">Total Value</td>
                          <td className="py-3 px-2 font-bold text-lg text-[#0A192F]">
                            {contractData.price ? `€ ${Number(contractData.price).toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Escrow Clause */}
                  <div className="bg-[#0A192F]/5 border border-[#0A192F]/20 p-4 rounded text-xs mt-12 text-[#0A192F]">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="text-[#D4AF37] w-4 h-4" />
                      <h4 className="font-bold uppercase tracking-wider">Escrow Protocol Activated</h4>
                    </div>
                    <p className="leading-relaxed">
                      Funds will be secured in AXON Stripe Institutional Escrow. 100% of the funds will be automatically released to the Seller upon platform upload of a valid Bill of Lading (BOL). By funding this contract, the Buyer waives physical inspection rights and accepts the AXON Purity Grading as final.
                    </p>
                  </div>
                  
                  {/* Signatures placeholder */}
                  <div className="absolute bottom-10 left-10 right-10 flex justify-between text-xs text-slate-400 border-t border-slate-200 pt-4">
                    <p>Generated via AXON Network</p>
                    <p>Legally Binding Document</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 1. EDIT ASSET MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#020509] border border-[#A6947D]/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#01030A]">
              <div className="flex items-center gap-3 text-[#A6947D]"><Edit size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Update Asset Protocol</h2></div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#A6947D]/40 hover:bg-red-500/10 hover:text-red-500 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Material Identity</label>
                  <input type="text" value={editForm.material} onChange={(e) => setEditForm({...editForm, material: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Valuation (€)</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm font-mono text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Quantity (m²)</label>
                  <input type="text" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm font-mono text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Thickness (cm)</label>
                  <input type="text" value={editForm.thickness} onChange={(e) => setEditForm({...editForm, thickness: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-xl px-4 py-3 text-sm font-mono text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Market Visibility</label>
                <div className="flex bg-[#01030A] border border-[#A6947D]/20 rounded-xl p-1 gap-1">
                  <button type="button" onClick={() => setEditForm({...editForm, visibility: 'public'})} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editForm.visibility === 'public' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-[#A6947D]/40 border border-transparent'}`}>Public Floor</button>
                  <button type="button" onClick={() => setEditForm({...editForm, visibility: 'private'})} className={`flex-1 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${editForm.visibility === 'private' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-[#A6947D]/40 border border-transparent'}`}>Private Vault (Off-Market)</button>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-[#A6947D]/20 bg-[#01030A]">
              <button onClick={handleEditSubmit} disabled={isSavingEdit} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2">
                {isSavingEdit ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> Override Protocol Data</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TERM SHEET MODAL */}
      {isTermSheetOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#020509] border border-amber-500/30 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(245,158,11,0.1)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-amber-500/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-amber-500"><FileSignature size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Generate Term Sheet</h2></div>
               <button onClick={() => setIsTermSheetOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Proposed Valuation (€)</label>
                <input type="number" value={termSheet.price} onChange={(e) => setTermSheet({...termSheet, price: e.target.value})} className="w-full bg-[#01030A] border border-amber-500/30 rounded-xl px-4 py-4 font-mono text-amber-400 outline-none" required />
              </div>
              <button onClick={submitTermSheet} disabled={isSubmittingTerm} className="w-full bg-amber-500 hover:bg-amber-400 text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-[10px] shadow-lg flex justify-center items-center gap-2">
                {isSubmittingTerm ? <Loader2 size={16} className="animate-spin"/> : 'Transmit Term Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REFUND/TERMINATE MODAL */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[#020509] border border-red-500/30 rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-red-500/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-red-500"><RotateCcw size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Terminate Escrow</h2></div>
               <button onClick={() => setIsRefundModalOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              {refundSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-emerald-400">Escrow Terminated Successfully</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-mono text-[#A6947D]/80 uppercase tracking-widest leading-relaxed">Warning: This action will reverse the secured funds via Stripe API and terminate the active contract.</p>
                  <button onClick={executeRefund} disabled={isRefunding} className="w-full bg-red-500 hover:bg-red-400 text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-[10px] shadow-lg flex justify-center items-center gap-2">
                    {isRefunding ? <Loader2 size={16} className="animate-spin"/> : 'Authorize Termination & Refund'}
                  </button>
                </>
              )}
            </div>
           </div>
        </div>
      )}
      {/* ========================================================= */}

    </div>
  );
}