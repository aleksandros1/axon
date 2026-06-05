'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// ΔΙΟΡΘΩΣΗ: Χρήση του absolute path alias (@/)
import { supabase } from '@/lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight, 
  Trash2, Handshake, ExternalLink, Calendar, AlertOctagon, RotateCcw, X, Loader2,
  Bell, Check, CheckCircle2, User, Target, Wallet, ArrowRight, FileSignature, Scale, Ship, ShieldCheck, Lock, Edit, ShoppingCart, Send, Menu,
  Layers3, UserCircle, Save, FileText, Download, Mail, Archive, UserPlus, Landmark
} from 'lucide-react';
import Link from 'next/link';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';

// ΔΙΟΡΘΩΣΗ: Χρήση του absolute path alias (@/)
import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  
  // STATE ΓΙΑ ΤΑ ΣΥΜΒΟΛΑΙΑ & ΕΠΑΦΕΣ
  const [myContracts, setMyContracts] = useState<any[]>([]);
  const [platformContacts, setPlatformContacts] = useState<any[]>([]);

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

  // --- CONTACT SELECTOR MODAL STATE ---
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contractToSend, setContractToSend] = useState<any>(null);

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    material: '', price: '', origin: '', location: '', thickness: '', quantity: '', incoterm: 'EXW', description: '', visibility: 'public', pricing_model: 'PUBLIC'
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState('BUYER');

  const [isContractGeneratorOpen, setIsContractGeneratorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- CONTRACT DATA STATE ---
  const [contractData, setContractData] = useState({
    contractId: `AX-${Math.floor(1000 + Math.random() * 9000)}-SIVEC`,
    sellerName: 'Pavlidis S.A.',
    sellerRole: 'Verified Tier 1 Vendor',
    buyerName: '',
    buyerEmail: '',
    material: 'Sivec White Premium',
    quantity: '',
    price: '',
    incoterms: 'FOB',
    paymentTerms: '100_escrow',
    inspection: 'waived',
    customTerms: ''
  });

  const handleContractChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setContractData({ ...contractData, [e.target.name]: e.target.value });
  };
  
  // ==========================================
  // --- ENGINE ΚΑΘΑΡΗΣ ΕΚΤΥΠΩΣΗΣ PDF ---
  // ==========================================
  const triggerPDFDownload = (cId: string, seller: string, sRole: string, buyer: string, material: string, quantity: string, price: string, incoterms: string, dateStr: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AXON_Contract_${cId}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Times New Roman', serif; color: #0A192F; background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
            .header { border-bottom: 2px solid #0A192F; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; }
            .header h1 { font-size: 32px; font-weight: 900; margin: 0; }
            .header p { color: #A6947D; font-family: sans-serif; font-weight: bold; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px; }
            .details { text-align: right; font-family: sans-serif; font-size: 12px; color: #64748B; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 20px; }
            .grid { display: flex; gap: 40px; margin-bottom: 40px; }
            .col { flex: 1; }
            .label { font-family: sans-serif; font-size: 10px; color: #64748B; text-transform: uppercase; margin-bottom: 5px; }
            .value { font-size: 16px; font-weight: bold; margin: 0 0 5px 0; }
            .sub-value { font-size: 12px; color: #475569; margin: 0; }
            table { border-collapse: collapse; margin-bottom: 40px; width: 100%; text-align: left; }
            th, td { padding: 12px 8px; border-bottom: 1px solid #F1F5F9; }
            .total-row { background: #F8FAFC; font-weight: bold; }
            .escrow-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; font-family: sans-serif; font-size: 12px; line-height: 1.6; }
            .escrow-title { color: #A6947D; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
            .footer { position: fixed; bottom: 0; left: 0; width: 100%; border-top: 1px solid #E2E8F0; padding-top: 10px; display: flex; justify-content: space-between; font-family: sans-serif; font-size: 10px; color: #94A3B8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>AXON</h1>
              <p>Institutional Ledger</p>
            </div>
            <div class="details">
              <p>Contract ID: <strong style="color:#0A192F">AX-${cId.replace('AX-', '').substring(0,8).toUpperCase()}</strong></p>
              <p>Date: ${dateStr}</p>
            </div>
          </div>

          <div class="section-title">Parties of Agreement</div>
          <div class="grid">
            <div class="col">
              <div class="label">Seller</div>
              <p class="value">${seller || 'Vendor Entity'}</p>
              <p class="sub-value">${sRole || 'Platform Vendor'}</p>
            </div>
            <div class="col">
              <div class="label">Buyer</div>
              <p class="value">${buyer || 'Verified Entity'}</p>
              <p class="sub-value">Platform Buyer</p>
            </div>
          </div>

          <div class="section-title">Asset & Commercial Terms</div>
          <table>
            <tr><td style="color:#64748B; width:30%">Material</td><td style="font-weight:bold">${material || '-'}</td></tr>
            <tr><td style="color:#64748B">Quantity</td><td style="font-weight:bold">${quantity || '-'}</td></tr>
            <tr><td style="color:#64748B">Incoterms</td><td style="font-weight:bold">${incoterms}</td></tr>
            <tr class="total-row"><td>Total Value</td><td style="font-size:18px">€ ${Number(price).toLocaleString() || '0'}</td></tr>
          </table>

          <div class="escrow-box">
            <div class="escrow-title">Escrow Protocol Activated</div>
            <p>Funds will be secured in AXON Stripe Institutional Escrow. 100% of the funds will be automatically released to the Seller upon platform upload of a valid Bill of Lading (BOL). By funding this contract, the Buyer waives physical inspection rights and accepts the AXON Purity Grading as final.</p>
          </div>

          <div class="footer">
            <span>Generated via AXON Network</span>
            <span>Legally Binding Document</span>
          </div>
        </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      
      const user = session.user;
      setCurrentUser(user);

      const { data: profile } = await supabase.from('profiles').select('role, company_name').eq('id', session.user.id).single();
      if (profile) { 
        setUserRole(profile.role || 'BUYER'); 
        setContractData(prev => ({ ...prev, sellerName: profile.company_name || 'Vendor Entity' }));
      }

      const { data: profilesList } = await supabase.from('profiles').select('id, company_name, email').neq('id', user.id);
      if (profilesList) setPlatformContacts(profilesList);

      const { data: slabsData } = await supabase.from('slabs').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (slabsData) setMySlabs(slabsData);

      const { data: vaultData } = await supabase.from('saved_assets').select(`slab_id, slabs (*, profiles(company_name, status))`).eq('user_id', user.id);
      if (vaultData) setTrackedSlabs(vaultData.map((item: any) => item.slabs).filter(Boolean));

      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs);

      const { data: offersData } = await supabase.from('messages').select('*').eq('is_offer', true).or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`).order('created_at', { ascending: false });

      if (offersData) {
        const inc = offersData.filter((o: any) => o.receiver_id === user.id);
        const out = offersData.filter((o: any) => o.sender_id === user.id);
        const profileIds = [...new Set(offersData.map((o: any) => o.sender_id === user.id ? o.receiver_id : o.sender_id))];
        const { data: profilesData } = await supabase.from('profiles').select('id, company_name, email').in('id', profileIds);

        const getContactName = (id: string) => {
          const p = profilesData?.find((p: any) => p.id === id);
          return p ? (p.company_name || p.email) : 'Unknown Entity';
        };

        setIncomingOffers(inc.map((o: any) => ({ ...o, contactName: getContactName(o.sender_id) })));
        setOutgoingOffers(out.map((o: any) => ({ ...o, contactName: getContactName(o.receiver_id) })));
      }

      // FETCH DB CONTRACTS & LOCAL CONTRACTS
      const localContracts = JSON.parse(localStorage.getItem('axon_custom_contracts') || '[]');
      const { data: contractsData } = await supabase
        .from('contracts')
        .select(`*, buyer:buyer_id (company_name), vendor:vendor_id (company_name), slab:slab_id (material)`)
        .or(`buyer_id.eq.${user.id},vendor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      let combinedContracts = [...localContracts];
      if (contractsData) {
        combinedContracts = [...localContracts, ...contractsData];
      }
      
      // Αφαιρούμε τα διπλότυπα για να μην δείχνει το ίδιο συμβόλαιο 2 φορές
      const uniqueContracts = Array.from(new Map(combinedContracts.map((c: any) => [c.id, c])).values());
      setMyContracts(uniqueContracts);

      setLoading(false);
    };
    fetchDashboardData();
  }, [router]);

  // --- ESCROW TOTAL REAL-TIME SYNCHRONIZER (ΤΟ FIX ΠΟΥ ΕΛΥΣΕ ΤΟ BUG) ---
  useEffect(() => {
    // Όλα τα active statuses που θέλουμε να μετράνε
    const activeStatuses = ['pending', 'advance_paid', 'funded', 'inspected', 'shipped'];
    
    // Ξαναφιλτράρουμε τα μοναδικά (για ασφάλεια)
    const uniqueContracts = Array.from(new Map(myContracts.map((c: any) => [c.id, c])).values());
    
    const total = uniqueContracts
      .filter((c: any) => activeStatuses.includes(c.status))
      .reduce((acc: number, curr: any) => {
        // Αν είναι νούμερο, το παίρνει. Αν είναι string, καθαρίζει τα κόμματα/τελείες.
        const priceVal = typeof curr.price === 'number' 
          ? curr.price 
          : parseFloat((curr.price || '0').toString().replace(/\./g, '').replace(/,/g, '.'));
        return acc + (priceVal || 0);
      }, 0);
      
    setEscrowTotal(total);
  }, [myContracts]);

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.filter((n: any) => n.id !== id));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const deleteSlab = async (id: string) => {
    if (confirm(language === 'el' ? 'ΠΡΟΣΟΧΗ: Θέλετε σίγουρα να διαγράψετε αυτό το Asset;' : 'WARNING: Are you sure you want to delete this Asset?')) {
      setMySlabs(mySlabs.filter((s: any) => s.id !== id)); 
      await supabase.from('slabs').delete().eq('id', id).eq('user_id', currentUser.id);
    }
  };

  const openEditModal = (slab: any) => {
    setEditingSlab(slab);
    setEditForm({
      material: slab.material || '', price: slab.price || '', origin: slab.origin || '', location: slab.location || '',
      thickness: slab.thickness || '', quantity: slab.quantity || '', incoterm: slab.incoterm || 'EXW', description: slab.description || '',
      visibility: slab.visibility || 'public', pricing_model: slab.pricing_model || 'PUBLIC'
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEdit(true);
    try {
      const { error } = await supabase.from('slabs').update({
        material: editForm.material, price: editForm.price, origin: editForm.origin, location: editForm.location,
        thickness: editForm.thickness, quantity: editForm.quantity, incoterm: editForm.incoterm,
        description: editForm.description, visibility: editForm.visibility, pricing_model: editForm.pricing_model,
        is_vault: editForm.visibility === 'private'
      }).eq('id', editingSlab.id);
      if (error) throw error;
      setMySlabs(prev => prev.map((s: any) => s.id === editingSlab.id ? { ...s, ...editForm, is_vault: editForm.visibility === 'private' } : s));
      setIsEditModalOpen(false);
      setEditingSlab(null);
    } catch (error: any) { alert(`Update Error: ${error.message}`); } finally { setIsSavingEdit(false); }
  };

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount.toString().replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  
  const formatArchiveDate = (isoString: string) => {
      if (!isoString) return '';
      return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const openRefundModal = (deal: any) => {
    setSelectedDeal(deal); setRefundType('full'); setRefundAmount(''); setRefundSuccess(false); setIsRefundModalOpen(true);
  };

  const executeRefund = async () => {
    setIsRefunding(true);
    const paymentIntentId = selectedDeal?.stripe_payment_id || 'pi_TEST_DUMMY_ID'; 
    const amountToRefund = refundType === 'partial' ? parseFloat(refundAmount) : null;
    try {
      await fetch('/api/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId, amountToRefund }) });
      if (selectedDeal?.id) {
        await supabase.from('messages').delete().eq('id', selectedDeal.id);
        setIncomingOffers(prev => prev.filter((offer: any) => offer.id !== selectedDeal.id));
        setOutgoingOffers(prev => prev.filter((offer: any) => offer.id !== selectedDeal.id));
      }
      setRefundSuccess(true);
      setTimeout(() => { setIsRefundModalOpen(false); setSelectedDeal(null); }, 2500);
    } catch (error) { console.error(error); } finally { setIsRefunding(false); }
  };

  const openTermSheet = (slab: any) => {
    setSelectedTarget(slab);
    setTermSheet({ price: slab.price ? slab.price.toString() : '', incoterms: 'FOB', deposit: '30', inspection: '7' });
    setTermSuccess(false); setIsTermSheetOpen(true);
  };

  const submitTermSheet = async () => {
    if (!selectedTarget || !currentUser) return;
    setIsSubmittingTerm(true);
    try {
      const generatedText = `BINDING TERM SHEET GENERATED:\n• Target Asset: AX-${selectedTarget.id.substring(0,8)}\n• Proposed Value: €${termSheet.price}\n• Logistics (Incoterms): ${termSheet.incoterms}\n• Escrow Deposit: ${termSheet.deposit}%\n• Surveyor Inspection Window: ${termSheet.inspection} Days\n\n*Awaiting Vendor Authorization to initialize Stripe Escrow API.*`;
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id, receiver_id: selectedTarget.user_id || selectedTarget.vendor_id, text: generatedText, is_offer: true,
        offer_details: { asset_id: selectedTarget.id, price: termSheet.price, incoterms: termSheet.incoterms, deposit: termSheet.deposit, inspection: termSheet.inspection }
      });
      if (error) throw error;
      await supabase.from('saved_assets').delete().match({ user_id: currentUser.id, slab_id: selectedTarget.id });
      setTrackedSlabs(prev => prev.filter((s: any) => s.id !== selectedTarget.id));
      setTermSuccess(true);
      setTimeout(() => { setIsTermSheetOpen(false); router.push('/inbox'); }, 2000);
    } catch (error) { console.error(error); alert(t('common.error')); } finally { setIsSubmittingTerm(false); }
  };
  
  // =========================================================================
  // --- 1. ΑΜΕΣΗ ΑΠΟΘΗΚΕΥΣΗ ΣΤΟ ARCHIVE (LOCALSTORAGE MERGE ΓΙΑ ΣΙΓΟΥΡΙΑ) ---
  // =========================================================================
  const handleGenerateContract = async () => {
      if (!currentUser) return;
      setIsGenerating(true);
      
      try {
        const numericPrice = contractData.price ? parseFloat(contractData.price.replace(/,/g, '')) : 0;
        const shortId = contractData.contractId.replace('AX-', '').substring(0,8);
        
        const newContract = {
          id: shortId,
          created_at: new Date().toISOString(),
          price: numericPrice,
          status: 'pending',
          vendor_id: currentUser.id,
          buyer: { company_name: contractData.buyerName || 'UNKNOWN BUYER' },
          slab: { material: contractData.material || 'Unknown Material' },
          custom_quantity: contractData.quantity,
          custom_incoterms: contractData.incoterms,
          payment_terms: contractData.paymentTerms,
          inspection: contractData.inspection,
          custom_terms: contractData.customTerms,
          is_local: true
        };

        const localContracts = JSON.parse(localStorage.getItem('axon_custom_contracts') || '[]');
        localContracts.unshift(newContract); 
        localStorage.setItem('axon_custom_contracts', JSON.stringify(localContracts));

        setMyContracts(prev => {
          const updated = [newContract, ...prev];
          // Το useEffect θα αναλάβει να ενημερώσει το Escrow Total
          return updated;
        });

        await supabase.from('contracts').insert({ 
          vendor_id: currentUser.id, 
          price: numericPrice, 
          status: 'pending',
          incoterms: contractData.incoterms,
          payment_terms: contractData.paymentTerms,
          inspection: contractData.inspection,
          custom_terms: contractData.customTerms
        });

        setIsContractGeneratorOpen(false);
        setActiveTab('archive');

      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
  };

  // =========================================================================
  // --- 2. ΑΠΟΣΤΟΛΗ ΣΤΟ CHAT ΩΣ ΚΑΝΟΝΙΚΟ ΔΟΜΗΜΕΝΟ "OFFER" ΟΧΙ ΩΣ ΚΕΙΜΕΝΟ ---
  // =========================================================================
  const openContactSelector = (contract: any) => {
      setContractToSend(contract);
      setIsContactModalOpen(true);
  };

  const confirmSendToChat = async (receiverId: string) => {
      if (!currentUser || !contractToSend) return;
      setIsGenerating(true);
      
      try {
          const textMessage = `AXON SECURE CONTRACT INITIATED\nRef: AX-${contractToSend.id.substring(0,8).toUpperCase()}\n\nPlease review the terms and authorize Escrow funding below.`;
          const materialName = contractToSend.slab?.material || contractToSend.custom_material || 'Sivec Premium';
          const incoterms = contractToSend.custom_incoterms || contractToSend.incoterms || 'FOB Piraeus';

          const { error } = await supabase.from('messages').insert({
              sender_id: currentUser.id, receiver_id: receiverId, text: textMessage, is_offer: true,
              offer_details: { 
                asset_id: contractToSend.id.substring(0,8), 
                price: contractToSend.price, 
                incoterms: incoterms, 
                material: materialName, 
                payment_terms: contractToSend.payment_terms,
                inspection: contractToSend.inspection,
                is_contract: true 
              }
          });

          if (error) throw error;
          
          setIsContactModalOpen(false);
          router.push('/inbox'); 

      } catch (err) {
          console.error(err); alert("Υπήρξε πρόβλημα κατά την αποστολή.");
      } finally {
          setIsGenerating(false);
      }
  };

  const publicAssets = mySlabs.filter((slab: any) => slab.visibility !== 'private');
  const privateAssets = mySlabs.filter((slab: any) => slab.visibility === 'private');

  const myPortfolioValue = publicAssets.reduce((acc: number, slab: any) => {
    const val = typeof slab.price === 'string' ? parseFloat(slab.price.replace(/\./g, '').replace(/,/g, '.')) : (slab.price || 0);
    return acc + val;
  }, 0);

  const trackedVaultValue = trackedSlabs.reduce((acc: number, slab: any) => {
    const val = typeof slab.price === 'string' ? parseFloat(slab.price.replace(/\./g, '').replace(/,/g, '.')) : (slab.price || 0);
    return acc + val;
  }, 0);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* --------------------------------------------------------- */}
      {/* CONTACT SELECTOR MODAL (NEW) */}
      {/* --------------------------------------------------------- */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#020509] border border-[#A6947D]/30 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(166,148,125,0.1)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-[#A6947D]"><UserPlus size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Select Counterparty</h2></div>
               <button onClick={() => setIsContactModalOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-widest mb-4">Transmit Contract AX-{contractToSend?.id.substring(0,8).toUpperCase()} to:</p>
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2">
                {platformContacts.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4">No verified contacts found in network.</p>
                ) : (
                  platformContacts.map((contact: any) => (
                    <button 
                      key={contact.id} onClick={() => confirmSendToChat(contact.id)} disabled={isGenerating}
                      className="w-full bg-[#01030A] border border-[#A6947D]/20 hover:border-[#A6947D] hover:bg-[#A6947D]/10 p-4 rounded-xl flex items-center justify-between transition-all group text-left"
                    >
                      <div>
                        <p className="text-sm font-serif text-[#F8F5EE] uppercase tracking-wider">{contact.company_name || contact.email}</p>
                        <p className="text-[9px] text-[#A6947D]/60 font-mono mt-1">{contact.email}</p>
                      </div>
                      <Send size={16} className="text-[#A6947D]/40 group-hover:text-[#A6947D] transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE COMMAND OVERLAY (THE SMART MENU) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#01030A]/95 backdrop-blur-xl flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">ΚΕΝΤΡΟ ΕΠΙΧΕΙΡΗΣΕΩΝ</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <button onClick={() => {setIsMobileMenuOpen(false); setIsContractGeneratorOpen(true);}} className="w-full bg-[#D4AF37] border border-[#D4AF37]/50 text-[#020509] p-4 rounded-xl flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest mb-6 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
              <FileText size={16} /> NEW CONTRACT
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
                className="hidden md:flex bg-transparent border border-[#A6947D]/40 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest items-center gap-2 transition-all shadow-md"
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
                    {notifications.length === 0 ? <div className="p-10 text-center text-[10px] font-mono text-[#A6947D]/40 uppercase tracking-widest">No active alerts.</div> : notifications.map((n: any) => (
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
            <button onClick={() => setActiveTab('archive')} className={`pb-3 md:pb-4 px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'archive' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Archive size={14} /> CONTRACT ARCHIVE</button>
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
                      {publicAssets.map((slab: any) => (
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
                      {privateAssets.map((slab: any) => (
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
                      {trackedSlabs.map((slab: any) => (
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
                   incomingOffers.map((offer: any) => (
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
                   outgoingOffers.map((offer: any) => (
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

              {/* --- CONTRACT ARCHIVE TAB --- */}
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
                      {myContracts.map((contract: any, index: number) => {
                        const isSeller = currentUser?.id === contract.vendor_id;
                        const counterpartyName = contract.buyer?.company_name || contract.buyer?.company_name || 'UNKNOWN ENTITY';
                        const materialName = contract.slab?.material || contract.custom_material || 'Custom Asset';
                        const qty = contract.custom_quantity || 'As agreed';
                        const inc = contract.custom_incoterms || contract.incoterms || 'FOB Piraeus';
                        
                        let statusColor = 'text-slate-400';
                        if (contract.status === 'funded' || contract.status === 'shipped') statusColor = 'text-emerald-500';
                        if (contract.status === 'pending' || contract.status === 'advance_paid' || contract.status === 'inspected') statusColor = 'text-amber-500';
                        if (contract.status === 'cancelled' || contract.status === 'disputed') statusColor = 'text-red-500';

                        const displayId = contract.id || `MOCK-${index}`;

                        return (
                          <div key={displayId} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between gap-6 shadow-lg hover:border-[#A6947D]/40 transition-colors group">
                            
                            {/* Αριστερό Μέρος */}
                            <div className="flex gap-4">
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-[#A6947D]/30 flex items-center justify-center relative shrink-0 bg-[#A6947D]/5 group-hover:bg-[#A6947D]/10 transition-colors">
                                <Shield size={26} className="text-[#A6947D]/30 absolute" />
                                <span className="text-[#A6947D] text-[10px] md:text-xs font-bold font-serif relative z-10">CT</span>
                              </div>
                              
                              <div className="flex flex-col justify-center">
                                <h4 className="text-[#F8F5EE] font-serif uppercase tracking-wider text-sm md:text-base">
                                  CONTRACT #{displayId.substring(0, 8).toUpperCase()}
                                </h4>
                                <p className="text-[10px] text-[#A6947D]/60 font-mono mb-3">{formatArchiveDate(contract.created_at)}</p>
                                
                                <div className="space-y-1">
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Counterparty:</span> {counterpartyName}</p>
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Asset:</span> {materialName}</p>
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Value:</span> €{contract.price}</p>
                                  <p className="text-[9px] md:text-[10px] font-mono text-[#A6947D]"><span className="text-[#A6947D]/50">Status:</span> <span className={`font-bold uppercase ${statusColor}`}>{contract.status}</span></p>
                                </div>
                              </div>
                            </div>

                            {/* Δεξί Μέρος (Κουμπιά) */}
                            <div className="flex flex-col gap-2 shrink-0 md:w-48 justify-center">
                              <button 
                                onClick={() => openContactSelector(contract)} 
                                className="w-full bg-transparent border border-[#A6947D]/30 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] px-4 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                              >
                                <MessageSquare size={14} /> SEND VIA AXON CHAT
                              </button>
                              <button 
                                onClick={() => triggerPDFDownload(displayId, contractData.sellerName, contractData.sellerRole, counterpartyName, materialName, qty, contract.price, inc, formatArchiveDate(contract.created_at))} 
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
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

      {/* 0. CONTRACT GENERATOR MODAL (INSTITUTIONAL GRADE - REDESIGNED) */}
      {isContractGeneratorOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 md:p-6 bg-[#01030A]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#020509] border border-[#A6947D]/20 rounded-2xl w-full max-w-[1400px] h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-[#A6947D]/10 bg-[#01030A] shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#A6947D]/5 rounded-lg border border-[#A6947D]/20">
                  <FileText className="text-[#A6947D] w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-serif text-white tracking-wide uppercase">AXON CONTRACT GENERATOR</h2>
                  <p className="text-[9px] font-mono text-[#A6947D]/60 tracking-widest uppercase">Institutional Ledger Tool</p>
                </div>
              </div>
              <button onClick={() => setIsContractGeneratorOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-full overflow-y-auto custom-scrollbar">
              {/* ΑΡΙΣΤΕΡΗ ΠΛΕΥΡΑ: ΟΡΟΙ & INPUTS */}
              <div className="w-full md:w-1/2 bg-[#01030A] p-6 flex flex-col gap-6 border-r border-[#A6947D]/10">
                
                {/* 1. SELLER / BUYER / ASSET */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Seller Company</label>
                      <input type="text" name="sellerName" value={contractData.sellerName} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Seller Role</label>
                      <input type="text" name="sellerRole" placeholder="e.g., Verified Tier 1 Vendor" value={contractData.sellerRole} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Counterparty (Buyer)</label>
                      <input type="text" name="buyerName" placeholder="Company Name" value={contractData.buyerName} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Buyer Contact</label>
                      <input type="email" name="buyerEmail" placeholder="Email Address" value={contractData.buyerEmail} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none transition-colors" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Asset Material</label>
                      <input type="text" name="material" placeholder="Material Name" value={contractData.material} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Total Quantity</label>
                      <input type="text" name="quantity" placeholder="e.g., 15,000 m²" value={contractData.quantity} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none" />
                    </div>
                  </div>
                </div>

                {/* 2. INCOTERMS & VALUATION */}
                <div className="space-y-4 pt-4 border-t border-[#A6947D]/10">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Commercial Logistics (Incoterms)</label>
                      <div className="flex gap-2">
                        {['EXW', 'FOB', 'CIF'].map((term) => (
                          <button 
                            key={term}
                            onClick={() => setContractData({...contractData, incoterms: term})}
                            className={`flex-1 py-2.5 rounded-lg border font-bold text-[9px] uppercase tracking-widest transition-all ${contractData.incoterms === term ? 'bg-[#A6947D]/10 text-[#A6947D] border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 text-[#A6947D]/40 hover:border-[#A6947D]/40'}`}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Escrow Valuation (€)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-[#A6947D]/60 text-xs">€</span>
                        <input type="number" name="price" placeholder="Total Value" value={contractData.price} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-2.5 pl-7 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ESCROW FUNDING SCHEDULE */}
                <div className="space-y-3 pt-4 border-t border-[#A6947D]/10">
                  <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block">Escrow Funding Schedule</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setContractData({...contractData, paymentTerms: '100_escrow'})}
                      className={`p-3 rounded-lg border flex flex-col items-start gap-1 transition-all ${contractData.paymentTerms === '100_escrow' ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet size={12} className={contractData.paymentTerms === '100_escrow' ? 'text-emerald-400' : 'text-[#A6947D]'} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${contractData.paymentTerms === '100_escrow' ? 'text-emerald-400' : 'text-[#A6947D]'}`}>100% Secured Escrow</span>
                      </div>
                      <span className="text-[8px] text-left text-[#A6947D]/60 font-mono">Full amount locked in vault. Released only upon complete fulfillment of terms.</span>
                    </button>
                    
                    <button 
                      onClick={() => setContractData({...contractData, paymentTerms: '30_70_split'})}
                      className={`p-3 rounded-lg border flex flex-col items-start gap-1 transition-all ${contractData.paymentTerms === '30_70_split' ? 'bg-[#A6947D]/10 border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Landmark size={12} className={contractData.paymentTerms === '30_70_split' ? 'text-[#A6947D]' : 'text-[#A6947D]'} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${contractData.paymentTerms === '30_70_split' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>30 / 70 Institutional Split</span>
                      </div>
                      <span className="text-[8px] text-left text-[#A6947D]/60 font-mono">30% Advance Deposit to Vendor. 70% locked in Escrow against Bill of Lading.</span>
                    </button>
                  </div>
                </div>

                {/* 4. QUALITY ASSURANCE (INSPECTOR) */}
                <div className="space-y-3 pt-4 border-t border-[#A6947D]/10">
                  <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block">Quality Assurance Protocol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setContractData({...contractData, inspection: 'waived'})}
                      className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${contractData.inspection === 'waived' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${contractData.inspection === 'waived' ? 'text-blue-400' : 'text-[#A6947D]'}`}>Inspection Waived</span>
                      {contractData.inspection === 'waived' && <CheckCircle2 size={12} className="text-blue-400" />}
                    </button>
                    
                    <button 
                      onClick={() => setContractData({...contractData, inspection: 'sgs_required'})}
                      className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${contractData.inspection === 'sgs_required' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <span className={`text-[8px] font-bold uppercase tracking-widest ${contractData.inspection === 'sgs_required' ? 'text-amber-400' : 'text-[#A6947D]'}`}>Independent SGS Inspection</span>
                      {contractData.inspection === 'sgs_required' && <CheckCircle2 size={12} className="text-amber-400" />}
                    </button>
                  </div>
                </div>

                {/* 5. CUSTOM COVENANTS */}
                <div className="space-y-2 pt-4 border-t border-[#A6947D]/10">
                  <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block">Additional Covenants</label>
                  <textarea 
                    name="customTerms"
                    value={contractData.customTerms}
                    onChange={handleContractChange}
                    placeholder="Enter custom delivery requirements, packaging specs, or penalty clauses..."
                    className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-lg p-3 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none h-16 resize-none custom-scrollbar"
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-4 mt-auto border-t border-[#A6947D]/10">
                  <button onClick={handleGenerateContract} disabled={isGenerating} className="flex-1 bg-transparent border border-[#A6947D]/40 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-[9px] uppercase tracking-widest shadow-md">
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    GENERATE & SAVE TO ARCHIVE
                  </button>
                  <button onClick={() => triggerPDFDownload(contractData.contractId, contractData.sellerName, contractData.sellerRole, contractData.buyerName, contractData.material, contractData.quantity, contractData.price, contractData.incoterms, new Date().toLocaleDateString())} className="px-4 bg-[#A6947D]/10 border border-[#A6947D]/30 text-[#A6947D] hover:bg-[#A6947D]/20 rounded-lg flex items-center justify-center transition-colors" title="Download PDF">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* ΔΕΞΙΑ ΠΛΕΥΡΑ: LIVE DOCUMENT PREVIEW */}
              <div className="w-full md:w-1/2 bg-[#020509] flex items-start justify-center p-4 md:p-6 overflow-y-auto">
                <div className="bg-white w-full max-w-[600px] shadow-[0_0_40px_rgba(166,148,125,0.1)] rounded-sm p-6 md:p-8 text-slate-900 font-serif relative h-max">
                  
                  <div className="flex justify-between items-start border-b-2 border-[#0A192F] pb-4 mb-6">
                    <div>
                      <h1 className="text-2xl font-black tracking-tighter text-[#0A192F]">AXON</h1>
                      <p className="text-[9px] uppercase tracking-widest text-[#A6947D] font-sans font-bold mt-1">Institutional Ledger</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-500 font-sans">
                      <p>Contract ID: <strong className="text-[#0A192F]">{contractData.contractId}</strong></p>
                      <p>Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-6 text-xs">
                    <h3 className="font-bold text-[#0A192F] mb-3 uppercase border-b border-slate-200 pb-1 text-[11px]">Parties of Agreement</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-sans">Seller</p>
                        <p className="font-bold text-sm text-[#0A192F]">{contractData.sellerName || '[Vendor Entity]'}</p>
                        <p className="text-slate-500 text-[10px] font-sans">{contractData.sellerRole || 'Platform Vendor'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-sans">Buyer</p>
                        <p className="font-bold text-sm text-[#0A192F]">{contractData.buyerName || '[Buyer Entity]'}</p>
                        <p className="text-slate-500 text-[10px] font-sans">{contractData.buyerEmail || 'Platform Buyer'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 text-xs">
                    <h3 className="font-bold text-[#0A192F] mb-3 uppercase border-b border-slate-200 pb-1 text-[11px]">Asset & Commercial Terms</h3>
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500 font-sans text-[10px] w-1/3">Material</td>
                          <td className="py-2 font-bold text-[#0A192F]">{contractData.material || '-'}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500 font-sans text-[10px]">Quantity</td>
                          <td className="py-2 font-bold text-[#0A192F]">{contractData.quantity || '-'}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500 font-sans text-[10px]">Incoterms</td>
                          <td className="py-2 font-bold text-[#0A192F]">{contractData.incoterms}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500 font-sans text-[10px]">Payment Schedule</td>
                          <td className="py-2 font-bold text-[#0A192F]">{contractData.paymentTerms === '100_escrow' ? '100% Secured Escrow' : '30% Advance / 70% Escrow'}</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="py-2 text-slate-500 font-sans text-[10px]">Quality Inspection</td>
                          <td className="py-2 font-bold text-[#0A192F]">{contractData.inspection === 'waived' ? 'Waived by Buyer' : 'Subject to Independent SGS Report'}</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="py-2 px-2 font-bold text-[#0A192F] font-sans text-[10px] uppercase">Total Value</td>
                          <td className="py-2 px-2 font-bold text-base text-[#0A192F]">
                            {contractData.price ? `€ ${Number(contractData.price).toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {contractData.customTerms && (
                    <div className="mb-6 text-xs">
                      <h3 className="font-bold text-[#0A192F] mb-2 uppercase border-b border-slate-200 pb-1 text-[11px]">Additional Covenants</h3>
                      <p className="text-slate-700 italic whitespace-pre-line bg-slate-50 p-3 rounded border border-slate-100 text-[11px]">
                        {contractData.customTerms}
                      </p>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 p-3 rounded mt-8 text-[#0A192F]">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="text-[#A6947D] w-4 h-4" />
                      <h4 className="font-bold uppercase tracking-wider text-[10px] font-sans">Escrow Protocol Activated</h4>
                    </div>
                    <p className="leading-relaxed mb-1.5 text-[10px] font-sans text-slate-600">
                      Funds will be secured in AXON Stripe Institutional Escrow. 
                      {contractData.paymentTerms === '100_escrow' 
                        ? " 100% of the funds will be automatically released to the Seller upon platform upload of a valid Bill of Lading (BOL)." 
                        : " 30% advance deposit released immediately. 70% released upon platform upload of a valid Bill of Lading (BOL)."}
                    </p>
                    <p className="leading-relaxed text-[10px] font-sans text-slate-600">
                      {contractData.inspection === 'waived'
                        ? "By funding this contract, the Buyer waives physical inspection rights and accepts the AXON Purity Grading as final."
                        : "Funds release is strictly contingent upon a satisfactory third-party SGS inspection report uploaded to the AXON network."}
                    </p>
                  </div>
                  
                  <div className="mt-12 pt-4 flex justify-between text-[9px] text-slate-400 border-t border-slate-200 font-sans uppercase tracking-widest">
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