'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, Package, ArrowDownRight, ArrowUpRight, 
  Trash2, Handshake, ExternalLink, Calendar, AlertOctagon, RotateCcw, X, Loader2,
  Check, CheckCircle2, User, Target, Wallet, ArrowRight, FileSignature, Scale, Ship, ShieldCheck, Lock, Edit, ShoppingCart, Send, Menu,
  Layers3, UserCircle, Save, FileText, Download, Mail, Archive, UserPlus, Landmark
} from 'lucide-react';
import Link from 'next/link';

// STRIPE IMPORTS
import { loadStripe } from '@stripe/stripe-js';

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

  // --- TEAM PASSES STATE (NEW) ---
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [agentPasses, setAgentPasses] = useState<string[]>([]);

  // --- ROLE ISOLATION & ASSIGNMENT STATE (NEW) ---
  const [isAgent, setIsAgent] = useState(false);
  const [parentCompanyId, setParentCompanyId] = useState<string | null>(null);
  const [parentCompanyName, setParentCompanyName] = useState<string>('');
  const [myAgents, setMyAgents] = useState<any[]>([]);
  
  // --- CONTRACT DATA STATE ---
  const [isResolvingBuyer, setIsResolvingBuyer] = useState(false);
  const [contractData, setContractData] = useState({
    contractId: `AX-${Math.floor(1000 + Math.random() * 9000)}-SIVEC`,
    sellerName: 'Vendor Entity',
    sellerRole: 'Verified Tier 1 Vendor',
    buyerAxonId: '',
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

  // --- GENERATE AGENT PASS (ΣΩΖΕΙ ΣΤΗ ΒΑΣΗ) ---
  const handleGeneratePass = async () => {
    if (!currentUser) return;
    
    // Φτιάχνει τον κωδικό
    const newPass = 'AX-PASS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Τον σώζει στη Supabase
    const { error } = await supabase.from('agent_passes').insert({
      pass_code: newPass,
      created_by: currentUser.id
    });

    if (!error) {
      // Τον εμφανίζει στην οθόνη
      setAgentPasses([newPass, ...agentPasses]);
    } else {
      console.error("Error generating pass:", error);
      alert("Υπήρξε πρόβλημα στη δημιουργία του Pass.");
    }
  };

  // --- ASSIGN DEAL TO AGENT FUNCTION (NEW) ---
  const assignContractToAgent = async (contractId: string, agentId: string) => {
    try {
      const val = agentId === 'unassigned' ? null : agentId;
      const { error } = await supabase.from('contracts').update({ assigned_agent_id: val }).eq('id', contractId);
      if (error) throw error;
      setMyContracts(prev => prev.map(c => c.id === contractId ? { ...c, assigned_agent_id: val } : c));
    } catch (error: any) {
      console.error("Assignment error:", error);
      alert("Υπήρξε πρόβλημα κατά την ανάθεση του συμβολαίου.");
    }
  };

  // --- ZERO-TRUST COUNTERPARTY RESOLUTION ---
  useEffect(() => {
    const resolveCounterparty = async () => {
      const id = contractData.buyerAxonId?.trim().toUpperCase();
      
      if (id && id.startsWith('AX-') && id.length >= 6) {
        setIsResolvingBuyer(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('company_name, email')
          .eq('axon_id', id)
          .single();

        if (data) {
          setContractData(prev => ({
            ...prev,
            buyerName: data.company_name || 'Verified Entity',
            buyerEmail: data.email || ''
          }));
        } else {
          setContractData(prev => ({
            ...prev,
            buyerName: 'Unknown/Invalid ID',
            buyerEmail: ''
          }));
        }
        setIsResolvingBuyer(false);
      } else if (!id) {
          setContractData(prev => ({
            ...prev,
            buyerName: '',
            buyerEmail: ''
          }));
      }
    };

    const timeoutId = setTimeout(resolveCounterparty, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [contractData.buyerAxonId]);
  
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

      // ROLE ISOLATION: Fetch Profile
      const { data: profile } = await supabase.from('profiles').select('role, company_name, is_agent, parent_company_id').eq('id', session.user.id).single();
      if (profile) { 
        setUserRole(profile.role || 'BUYER'); 
        setIsAgent(profile.is_agent || false);
        setParentCompanyId(profile.parent_company_id || null);
        setContractData(prev => ({ ...prev, sellerName: profile.company_name || 'Vendor Entity' }));

        // Αν είναι Agent τραβάμε το όνομα της Μαμάς εταιρείας
        if (profile.is_agent && profile.parent_company_id) {
          const { data: parentData } = await supabase.from('profiles').select('company_name').eq('id', profile.parent_company_id).single();
          if (parentData) setParentCompanyName(parentData.company_name || 'Verified Institution');
        }
        // Αν είναι Admin (Μαμά), τραβάμε τους Agents της για το Assignment
        else if (!profile.is_agent) {
          const { data: agentsData } = await supabase.from('profiles').select('id, email, company_name').eq('parent_company_id', user.id).eq('is_agent', true);
          if (agentsData) setMyAgents(agentsData);
        }
      }

      // Τραβάει τα Passes που έχει φτιάξει αυτός ο χρήστης (Μόνο αν ΔΕΝ είναι Agent)
      if (profile && !profile.is_agent) {
        const { data: passesData } = await supabase.from('agent_passes').select('pass_code').eq('created_by', user.id).order('created_at', { ascending: false });
        if (passesData) setAgentPasses(passesData.map(p => p.pass_code));
      }

      const { data: profilesList } = await supabase.from('profiles').select('id, company_name, email').neq('id', user.id);
      if (profilesList) setPlatformContacts(profilesList);

      // FETCH SLABS (Αν είναι agent, βλέπει τα slabs της μητρικής εταιρείας)
      const targetVendorId = profile?.is_agent ? profile.parent_company_id : user.id;
      const { data: slabsData } = await supabase.from('slabs').select('*').eq('user_id', targetVendorId).order('created_at', { ascending: false });
      if (slabsData) setMySlabs(slabsData);

      const { data: vaultData } = await supabase.from('saved_assets').select(`slab_id, slabs (*, profiles(company_name, status))`).eq('user_id', user.id);
      if (vaultData) setTrackedSlabs(vaultData.map((item: any) => item.slabs).filter(Boolean));

      const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false });
      if (notifs) setNotifications(notifs);

      // FETCH MESSAGES/OFFERS WITH ROLE ISOLATION
      let offersQuery = supabase.from('messages').select('*').eq('is_offer', true);
      if (profile?.is_agent) {
        offersQuery = offersQuery.eq('assigned_agent_id', user.id);
      } else {
        offersQuery = offersQuery.or(`receiver_id.eq.${user.id},sender_id.eq.${user.id}`);
      }
      const { data: offersData } = await offersQuery.order('created_at', { ascending: false });

      if (offersData) {
        const inc = offersData.filter((o: any) => o.receiver_id === user.id || (profile?.is_agent && o.receiver_id === profile.parent_company_id));
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

      // FETCH DB CONTRACTS & LOCAL CONTRACTS WITH ROLE ISOLATION
      const localContracts = JSON.parse(localStorage.getItem('axon_custom_contracts') || '[]');
      let contractsQuery = supabase.from('contracts').select(`*, buyer:buyer_id (company_name), vendor:vendor_id (company_name), slab:slab_id (material)`);
      if (profile?.is_agent) {
        contractsQuery = contractsQuery.eq('assigned_agent_id', user.id);
      } else {
        contractsQuery = contractsQuery.or(`buyer_id.eq.${user.id},vendor_id.eq.${user.id}`);
      }
      const { data: contractsData } = await contractsQuery.order('created_at', { ascending: false });

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

  // --- ΘΕΣΜΙΚΗ ΜΟΡΦΟΠΟΙΗΣΗ ΝΟΜΙΣΜΑΤΟΣ ---
  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount.toString().replace(/\./g, '').replace(/,/g, '.')) : amount;
    if (val >= 1000000) {
      return `€${(val / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
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
          <div className="bg-[#020509] border border-[#A6947D]/30 rounded-sm w-full max-w-md shadow-[0_0_50px_rgba(166,148,125,0.1)] flex flex-col">
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
                      className="w-full bg-[#01030A] border border-[#A6947D]/20 hover:border-[#A6947D] hover:bg-[#A6947D]/10 p-4 rounded-sm flex items-center justify-between transition-all group text-left"
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
            <div className="flex items-center gap-3"><Shield size={20} className="text-[#A6947D]" /><h2 className="text-lg font-serif uppercase tracking-[0.3em] text-[#F8F5EE]">COMMAND</h2></div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#F8F5EE]/40 hover:text-red-500 p-2"><X size={24} /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {!isAgent && (
              <button onClick={() => {setIsMobileMenuOpen(false); setIsContractGeneratorOpen(true);}} className="w-full bg-[#A6947D] border border-[#A6947D]/50 text-[#020509] p-4 rounded-sm flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest mb-6 shadow-lg">
                <FileText size={16} /> NEW CONTRACT
              </button>
            )}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-sm flex flex-col items-center justify-center gap-3 transition-colors shadow-inner">
                <Layers3 size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Portfolio</span>
              </Link>
              <Link href="/trading" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-sm flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Globe size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Floor</span>
              </Link>
              <Link href="/inbox" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-sm flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <MessageSquare size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Comms</span>
              </Link>
              <Link href="/me" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-sm flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <UserCircle size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Profile</span>
              </Link>
            </div>
            <button onClick={handleLogout} className="w-full bg-[#020509] border border-red-900/30 text-red-500 p-4 rounded-sm flex items-center justify-center gap-3 uppercase font-bold text-[10px] tracking-widest">
              <LogOut size={16} /> DISCONNECT
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
          <header className="mb-12 flex justify-between items-start">
            <div>
              <h2 className="text-4xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.05em] font-light">
                {isAgent ? 'Agent Desk' : t('dashboard.title')}
              </h2>
              <div className="flex items-center gap-3 mt-4">
                <span className="h-px w-8 bg-[#A6947D]/30"></span>
                <p className="text-[10px] text-[#A6947D] uppercase tracking-[0.3em] font-mono">
                  {isAgent ? (parentCompanyName ? `OPERATING FOR: ${parentCompanyName}` : 'Assigned Pipeline Control') : `AXON ID: AX-${currentUser?.id?.substring(0,8).toUpperCase() || 'VERIFIED'}`}
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-4">
              
              {/* TEAM PASSES BUTTON (NEW) */}
              {!isAgent && (
                <button 
                  onClick={() => setIsTeamModalOpen(true)}
                  className="hidden md:flex bg-transparent border border-[#A6947D]/40 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] px-4 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest items-center gap-2 transition-all"
                >
                  <Users size={16} /> TEAM PASSES
                </button>
              )}

              {/* CONTRACT GENERATOR BUTTON (DESKTOP) */}
              {!isAgent && (
                <button 
                  onClick={() => setIsContractGeneratorOpen(true)}
                  className="hidden md:flex bg-[#A6947D]/10 border border-[#A6947D]/50 hover:bg-[#A6947D]/20 text-[#A6947D] px-6 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest items-center gap-2 transition-all"
                >
                  <FileText size={16} /> NEW CONTRACT
                </button>
              )}

            </div>
          </header>

          {!loading && (
            <div className="flex flex-col md:flex-row justify-between items-center border-y border-[#A6947D]/20 py-8 mb-12 animate-in fade-in duration-700 delay-100 bg-[#01030A]/30">
              
              <div className="flex-1 flex flex-col w-full md:border-r border-[#A6947D]/20 md:px-8 py-4 md:py-0 text-center md:text-left">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A6947D]/60 mb-2">
                  {isAgent ? "Company Catalog" : "Public Portfolio"}
                </span>
                <span className="text-3xl md:text-4xl font-mono text-[#F8F5EE] tracking-tight">{isAgent ? "Enterprise" : formatCurrency(myPortfolioValue)}</span>
                <span className="text-[10px] font-mono text-[#A6947D] mt-2">{mySlabs.length} Assets</span>
              </div>
              
              <div className="flex-1 flex flex-col w-full md:border-r border-[#A6947D]/20 border-t md:border-t-0 md:px-8 py-4 md:py-0 text-center md:text-left">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A6947D]/60 mb-2">
                  {isAgent ? "Security Clearance" : "Private Vault"}
                </span>
                <span className={`text-3xl md:text-4xl font-serif tracking-wide ${isAgent ? "text-emerald-400 font-mono tracking-tight" : "text-[#F8F5EE]"}`}>
                  {isAgent ? "AGENT" : "Off-Market"}
                </span>
                <span className="text-[10px] font-mono text-[#A6947D] mt-2">
                  {isAgent ? "Isolated Environment" : `${privateAssets.length} Secured Assets`}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col w-full md:border-r border-[#A6947D]/20 border-t md:border-t-0 md:px-8 py-4 md:py-0 text-center md:text-left">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A6947D]/60 mb-2">
                  {isAgent ? "Managed Live Deals" : "Tracked Targets"}
                </span>
                <span className="text-3xl md:text-4xl font-mono text-[#F8F5EE] tracking-tight">
                  {isAgent ? (incomingOffers.length + outgoingOffers.length) : formatCurrency(trackedVaultValue)}
                </span>
                <span className="text-[10px] font-mono text-[#A6947D] mt-2">
                  {isAgent ? "Active Communications" : `${trackedSlabs.length} Pending Execution`}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col w-full border-t md:border-t-0 md:px-8 py-4 md:py-0 text-center md:text-left cursor-pointer hover:bg-[#A6947D]/5 transition-colors" onClick={() => router.push('/contracts')}>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A6947D]/60 mb-2">
                  {isAgent ? "My Managed Escrow" : "Escrow Contracts"}
                </span>
                <span className="text-3xl md:text-4xl font-mono text-[#F8F5EE] tracking-tight">{formatCurrency(escrowTotal)}</span>
                <span className="text-[10px] font-mono text-[#A6947D] mt-2 hover:text-white transition-colors">Access Vault &rarr;</span>
              </div>
              
            </div>
          )}

          <div className="flex gap-6 md:gap-10 border-b border-[#A6947D]/10 mb-12 overflow-x-auto custom-scrollbar pb-1 animate-in fade-in duration-700 delay-100 fill-mode-both w-full scroll-smooth">
            <button onClick={() => setActiveTab('assets')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'assets' ? 'text-[#F8F5EE] border-b border-[#F8F5EE]' : 'text-[#A6947D]/40 hover:text-[#F8F5EE]/80'}`}>
              {isAgent ? "Company Catalog" : "Public Assets"} ({isAgent ? mySlabs.length : publicAssets.length})
            </button>
            {!isAgent && (
              <button onClick={() => setActiveTab('private')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'private' ? 'text-[#F8F5EE] border-b border-[#F8F5EE]' : 'text-[#A6947D]/40 hover:text-[#F8F5EE]/80'}`}>Private Vault ({privateAssets.length})</button>
            )}
            {!isAgent && (
              <button onClick={() => setActiveTab('tracked')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'tracked' ? 'text-[#F8F5EE] border-b border-[#F8F5EE]' : 'text-[#A6947D]/40 hover:text-[#F8F5EE]/80'}`}>Tracked Targets ({trackedSlabs.length})</button>
            )}
            <button onClick={() => setActiveTab('incoming')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'incoming' ? 'text-[#F8F5EE] border-b border-[#F8F5EE]' : 'text-[#A6947D]/40 hover:text-[#F8F5EE]/80'}`}>
              {isAgent ? "My Assigned Incoming" : "Incoming"} ({incomingOffers.length})
            </button>
            <button onClick={() => setActiveTab('outgoing')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'outgoing' ? 'text-[#F8F5EE] border-b border-[#F8F5EE]' : 'text-[#A6947D]/40 hover:text-[#F8F5EE]/80'}`}>
              {isAgent ? "My Outgoing" : "Outgoing"} ({outgoingOffers.length})
            </button>
            <button onClick={() => setActiveTab('archive')} className={`pb-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'archive' ? 'text-[#F8F5EE] border-b border-[#F8F5EE]' : 'text-[#A6947D]/40 hover:text-[#F8F5EE]/80'}`}>
              {isAgent ? "My Managed Archive" : "Contract Archive"}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-[#A6947D] animate-pulse font-mono text-xs uppercase tracking-widest">Synchronizing...</div>
          ) : (
            <div className="animate-in fade-in duration-700 delay-200 fill-mode-both w-full overflow-x-hidden">
              
              {/* --- PUBLIC ASSETS TAB --- */}
              {activeTab === 'assets' && (
                <div className="w-full">
                  {(isAgent ? mySlabs : publicAssets).length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"><Package size={32} className="text-[#A6947D]/30" /></div>
                      <h3 className="text-xl font-serif text-[#A6947D] uppercase tracking-[0.15em] mb-2">{isAgent ? "Catalog is Empty" : "Public Ledger is Empty"}</h3>
                      {!isAgent && <Link href="/scanner" className="text-[#F8F5EE]/60 text-[10px] uppercase font-bold tracking-widest hover:text-white underline mt-4">Initiate Scan</Link>}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 w-full">
                      {(isAgent ? mySlabs : publicAssets).map((slab: any) => (
                        <div key={slab.id} className="group flex flex-col relative">
                          <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#01030A] mb-6 border border-[#A6947D]/10 group-hover:border-[#A6947D]/30 transition-colors duration-500 rounded-sm">
                            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <span className="bg-[#01030A]/80 backdrop-blur-md px-2 py-1 text-[8px] font-mono text-[#A6947D] uppercase tracking-widest border border-[#A6947D]/20">AX-{slab.id.substring(0,8)}</span>
                               <span className="bg-[#01030A]/80 backdrop-blur-md px-2 py-1 text-[8px] font-mono text-emerald-500 uppercase tracking-widest border border-emerald-500/20">LIVE</span>
                            </div>
                            {slab.image_url ? (
                              <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} /></div>
                            )}
                          </div>

                          <div className="flex flex-col flex-1 px-1 text-center">
                            <h4 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] mb-4">{slab.material || 'Unknown Material'}</h4>
                            
                            {/* Data Grid */}
                            <div className="w-full grid grid-cols-3 border-y border-[#A6947D]/20 py-3 mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                              <div className="flex flex-col items-center justify-center border-r border-[#A6947D]/20 px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Valuation</span>
                                <span className="text-xs font-mono text-[#F8F5EE] tracking-tight">{formatCurrency(slab.price)}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center border-r border-[#A6947D]/20 px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Stock</span>
                                <span className="text-[10px] font-mono text-[#F8F5EE]">{slab.quantity}m²</span>
                              </div>
                              <div className="flex flex-col items-center justify-center px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Origin</span>
                                <span className="text-[9px] font-bold text-[#F8F5EE] uppercase tracking-widest truncate w-full">{slab.profiles?.country || 'GREECE'}</span>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-between items-center mt-2">
                              {!isAgent ? (
                                <div className="flex gap-3">
                                  <button onClick={() => openEditModal(slab)} className="text-[#A6947D]/40 hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold">Edit</button>
                                  <span className="text-[#A6947D]/20">|</span>
                                  <button onClick={() => deleteSlab(slab.id)} className="text-[#A6947D]/40 hover:text-red-400 transition-colors text-[9px] uppercase tracking-widest font-bold">Delete</button>
                                </div>
                              ) : (
                                <div></div> /* Empty div to push 'View' to the right */
                              )}
                              <Link href={`/trading/${slab.id}`} target="_blank" className="text-[#A6947D] hover:text-white text-[9px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1">View <ArrowRight size={10}/></Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- PRIVATE VAULT TAB (NOT FOR AGENTS) --- */}
              {activeTab === 'private' && !isAgent && (
                <div className="w-full">
                  {privateAssets.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"><Lock size={32} className="text-[#A6947D]/30" /></div>
                      <h3 className="text-xl font-serif text-[#A6947D] uppercase tracking-[0.15em] mb-2">Vault is Empty</h3>
                      <Link href="/scanner" className="text-[#F8F5EE]/60 text-[10px] uppercase font-bold tracking-widest hover:text-white underline mt-4">Add Private Asset</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 w-full">
                      {privateAssets.map((slab: any) => (
                        <div key={slab.id} className="group flex flex-col relative opacity-80 hover:opacity-100 transition-opacity">
                          <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#01030A] mb-6 border border-[#A6947D]/10 group-hover:border-[#A6947D]/30 transition-colors duration-500 rounded-sm">
                            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <span className="bg-[#01030A]/80 backdrop-blur-md px-2 py-1 text-[8px] font-mono text-[#A6947D] uppercase tracking-widest border border-[#A6947D]/20">AX-{slab.id.substring(0,8)}</span>
                               <span className="bg-[#01030A]/80 backdrop-blur-md px-2 py-1 text-[8px] font-mono text-indigo-400 uppercase tracking-widest border border-indigo-400/20">PRIVATE</span>
                            </div>
                            {slab.image_url ? (
                              <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale transition-transform duration-[2000ms] ease-out group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} /></div>
                            )}
                          </div>

                          <div className="flex flex-col flex-1 px-1 text-center">
                            <h4 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] mb-4">{slab.material || 'Unknown Material'}</h4>
                            <div className="w-full grid grid-cols-3 border-y border-[#A6947D]/20 py-3 mb-4">
                              <div className="flex flex-col items-center justify-center border-r border-[#A6947D]/20 px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Valuation</span>
                                <span className="text-xs font-mono text-[#F8F5EE] tracking-tight">{formatCurrency(slab.price)}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center border-r border-[#A6947D]/20 px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Stock</span>
                                <span className="text-[10px] font-mono text-[#F8F5EE]">{slab.quantity}m²</span>
                              </div>
                              <div className="flex flex-col items-center justify-center px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Origin</span>
                                <span className="text-[9px] font-bold text-[#F8F5EE] uppercase tracking-widest truncate w-full">{slab.profiles?.country || 'GREECE'}</span>
                              </div>
                            </div>
                            <div className="flex justify-center items-center mt-2">
                              <div className="flex gap-3">
                                <button onClick={() => openEditModal(slab)} className="text-[#A6947D]/40 hover:text-white transition-colors text-[9px] uppercase tracking-widest font-bold">Edit</button>
                                <span className="text-[#A6947D]/20">|</span>
                                <button onClick={() => deleteSlab(slab.id)} className="text-[#A6947D]/40 hover:text-red-400 transition-colors text-[9px] uppercase tracking-widest font-bold">Delete</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- TRACKED VAULT TAB (NOT FOR AGENTS) --- */}
              {activeTab === 'tracked' && !isAgent && (
                <div className="w-full">
                  {trackedSlabs.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6"><Target size={32} className="text-[#A6947D]/30" /></div>
                      <h3 className="text-xl font-serif text-[#A6947D] uppercase tracking-[0.15em] mb-2">No Targets Locked</h3>
                      <Link href="/trading" className="text-[#F8F5EE]/60 text-[10px] uppercase font-bold tracking-widest hover:text-white underline mt-4">Enter Public Floor</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 w-full">
                      {trackedSlabs.map((slab: any) => (
                        <div key={slab.id} className="group flex flex-col relative">
                          <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#01030A] mb-6 border border-[#A6947D]/10 group-hover:border-[#A6947D]/30 transition-colors duration-500 rounded-sm">
                            <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                               <span className="bg-[#01030A]/80 backdrop-blur-md px-2 py-1 text-[8px] font-mono text-[#A6947D] uppercase tracking-widest border border-[#A6947D]/20">AX-{slab.id.substring(0,8)}</span>
                               <span className="bg-[#01030A]/80 backdrop-blur-md px-2 py-1 text-[8px] font-mono text-amber-500 uppercase tracking-widest border border-amber-500/20">TARGET</span>
                            </div>
                            <Link href={`/trading/${slab.id}`}>
                              {slab.image_url ? (
                                <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-[2000ms] ease-out group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-10"><Package size={48} /></div>
                              )}
                            </Link>
                          </div>

                          <div className="flex flex-col flex-1 px-1 text-center">
                            <h4 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] mb-4">{slab.material || 'Unknown Material'}</h4>
                            <div className="w-full grid grid-cols-3 border-y border-[#A6947D]/20 py-3 mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                              <div className="flex flex-col items-center justify-center border-r border-[#A6947D]/20 px-1 col-span-2">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Buy Price</span>
                                <span className="text-xs font-mono text-[#F8F5EE] tracking-tight">{formatCurrency(slab.price)}</span>
                              </div>
                              <div className="flex flex-col items-center justify-center px-1">
                                <span className="text-[7px] font-bold text-[#A6947D]/50 uppercase tracking-[0.2em] mb-1">Vendor</span>
                                <span className="text-[9px] font-bold text-[#F8F5EE] uppercase tracking-widest truncate w-full">{slab.profiles?.company_name || 'SYSTEM'}</span>
                              </div>
                            </div>
                            <div className="flex justify-center items-center mt-2">
                              <Link href={`/trading/${slab.id}`} className="text-[#A6947D] hover:text-white text-[9px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1">Execute Trade <ArrowRight size={10}/></Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* INCOMING TABS (Ledger Style) */}
              {activeTab === 'incoming' && (
                 <div className="space-y-2 w-full">
                 {incomingOffers.length === 0 ? (
                   <div className="py-20 text-center text-[10px] text-[#A6947D]/40 font-mono uppercase tracking-[0.2em]">{isAgent ? "No assigned incoming deals." : "No incoming offers detected."}</div>
                 ) : (
                   incomingOffers.map((offer: any) => (
                     <div key={offer.id} className="flex flex-col md:flex-row justify-between items-center py-5 border-b border-[#A6947D]/10 hover:bg-[#A6947D]/5 transition-colors px-4 group">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <span className="text-[9px] font-mono text-[#A6947D]/60 w-24">{formatArchiveDate(offer.created_at)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE] w-48 truncate">{offer.contactName}</span>
                          <Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[10px] font-mono text-[#A6947D] hover:text-white">AX-{offer.offer_details?.asset_id?.substring(0,6)}</Link>
                        </div>
                        <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-end">
                           <span className="text-[9px] uppercase tracking-widest text-[#A6947D]/60 hidden md:block">Proposed Value:</span>
                           <span className="text-lg font-mono text-[#F8F5EE]">{formatCurrency(offer.offer_details?.price)}</span>
                           <button onClick={() => router.push('/inbox')} className="text-[9px] font-bold uppercase tracking-widest text-[#A6947D] hover:text-white border border-[#A6947D]/30 px-4 py-2 rounded-sm ml-4">{isAgent ? "Open Comms" : "Review"}</button>
                        </div>
                     </div>
                   ))
                 )}
                 </div>
              )}
              
              {/* OUTGOING TABS (Ledger Style) */}
              {activeTab === 'outgoing' && (
                 <div className="space-y-2 w-full">
                 {outgoingOffers.length === 0 ? (
                   <div className="py-20 text-center text-[10px] text-[#A6947D]/40 font-mono uppercase tracking-[0.2em]">No active transmissions.</div>
                 ) : (
                   outgoingOffers.map((offer: any) => (
                     <div key={offer.id} className="flex flex-col md:flex-row justify-between items-center py-5 border-b border-[#A6947D]/10 hover:bg-[#A6947D]/5 transition-colors px-4 group">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <span className="text-[9px] font-mono text-[#A6947D]/60 w-24">{formatArchiveDate(offer.created_at)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE] w-48 truncate">{offer.contactName}</span>
                          <Link href={`/trading/${offer.offer_details?.asset_id}`} target="_blank" className="text-[10px] font-mono text-[#A6947D] hover:text-white">AX-{offer.offer_details?.asset_id?.substring(0,6)}</Link>
                        </div>
                        <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-end">
                           <span className="text-[9px] uppercase tracking-widest text-[#A6947D]/60 hidden md:block">Your Offer:</span>
                           <span className="text-lg font-mono text-[#F8F5EE]">{formatCurrency(offer.offer_details?.price)}</span>
                           <span className="text-[9px] font-bold uppercase tracking-widest text-[#A6947D]/40 ml-4">Transmitted</span>
                        </div>
                     </div>
                   ))
                 )}
                 </div>
              )}

              {/* --- CONTRACT ARCHIVE TAB (Ledger Style) --- */}
              {activeTab === 'archive' && (
                <div className="w-full animate-in fade-in duration-500">
                  
                  {myContracts.length === 0 ? (
                    <div className="py-20 text-center text-[10px] text-[#A6947D]/40 font-mono uppercase tracking-[0.2em]">{isAgent ? "No private records found." : "No contracts found in ledger."}</div>
                  ) : (
                    <div className="flex flex-col border-t border-[#A6947D]/20">
                      {/* Header Row */}
                      <div className="hidden md:flex justify-between py-4 border-b border-[#A6947D]/20 px-4 text-[8px] font-bold uppercase tracking-widest text-[#A6947D]/60">
                         <div className="w-1/6">Date</div>
                         <div className="w-1/6">Contract ID</div>
                         <div className="w-1/4">Counterparty</div>
                         <div className="w-1/6">Value</div>
                         <div className="w-1/6">Status</div>
                         <div className="w-1/6 text-right">Actions</div>
                      </div>
                      
                      {/* Data Rows */}
                      {myContracts.map((contract: any, index: number) => {
                        const isSeller = currentUser?.id === contract.vendor_id;
                        const counterpartyName = contract.buyer?.company_name || contract.buyer?.company_name || 'UNKNOWN ENTITY';
                        const materialName = contract.slab?.material || contract.custom_material || 'Custom Asset';
                        const qty = contract.custom_quantity || 'As agreed';
                        const inc = contract.custom_incoterms || contract.incoterms || 'FOB Piraeus';
                        
                        let statusColor = 'text-[#F8F5EE]/60';
                        if (contract.status === 'funded' || contract.status === 'shipped') statusColor = 'text-emerald-400';
                        if (contract.status === 'pending' || contract.status === 'advance_paid' || contract.status === 'inspected') statusColor = 'text-amber-400';
                        if (contract.status === 'cancelled' || contract.status === 'disputed') statusColor = 'text-red-400';

                        const displayId = contract.id || `MOCK-${index}`;

                        return (
                          <div key={displayId} className="flex flex-col md:flex-row justify-between md:items-center py-5 border-b border-[#A6947D]/10 hover:bg-[#A6947D]/5 transition-colors px-4 group">
                             <div className="w-full md:w-1/6 mb-2 md:mb-0 text-[10px] font-mono text-[#A6947D]/60">{formatArchiveDate(contract.created_at)}</div>
                             <div className="w-full md:w-1/6 mb-2 md:mb-0 text-[10px] font-mono text-[#F8F5EE]">AX-{displayId.substring(0, 8).toUpperCase()}</div>
                             <div className="w-full md:w-1/4 mb-2 md:mb-0 text-[10px] font-bold uppercase tracking-widest text-[#F8F5EE] truncate pr-4">{counterpartyName}</div>
                             <div className="w-full md:w-1/6 mb-2 md:mb-0 text-[12px] font-mono text-[#F8F5EE]">{formatCurrency(contract.price)}</div>
                             <div className={`w-full md:w-1/6 mb-4 md:mb-0 text-[9px] font-bold uppercase tracking-widest ${statusColor}`}>{contract.status}</div>
                             
                             <div className="w-full md:w-auto flex justify-start md:justify-end items-center gap-4 mt-4 md:mt-0">
                               {/* DROP-DOWN ΑΝΑΘΕΣΗΣ ΜΟΝΟ ΓΙΑ ADMIN (Αν υπάρχουν διαθέσιμοι Agents) */}
                               {!isAgent && myAgents.length > 0 && !contract.is_local && (
                                 <select
                                   value={contract.assigned_agent_id || 'unassigned'}
                                   onChange={(e) => assignContractToAgent(displayId, e.target.value)}
                                   className="bg-transparent border border-[#A6947D]/30 text-[#A6947D] text-[8px] font-bold uppercase tracking-widest rounded-sm outline-none px-2 py-1 cursor-pointer hover:border-[#A6947D] transition-colors"
                                   title="Assign to Agent"
                                 >
                                   <option value="unassigned">UNASSIGNED</option>
                                   {myAgents.map(agent => (
                                     <option key={agent.id} value={agent.id}>{agent.company_name || agent.email.split('@')[0]}</option>
                                   ))}
                                 </select>
                               )}
                               
                               <button onClick={() => openContactSelector(contract)} className="text-[#A6947D]/40 hover:text-white transition-colors" title="Send via Chat">
                                 <Send size={14} />
                               </button>
                               <button onClick={() => triggerPDFDownload(displayId, contractData.sellerName, contractData.sellerRole, counterpartyName, materialName, qty, contract.price, inc, formatArchiveDate(contract.created_at))} className="text-[#A6947D]/40 hover:text-white transition-colors" title="Download PDF">
                                 <Download size={14} />
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
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>

      {/* ========================================================= */}
      {/* --- ΥΠΕΡΣΥΓΧΡΟΝΑ MODALS --- */}
      {/* ========================================================= */}

      {/* NEW: TEAM PASSES MODAL (WITH COPY LINK LOGIC) */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#020509] border border-[#A6947D]/30 rounded-sm w-full max-w-lg shadow-[0_0_40px_rgba(166,148,125,0.1)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-[#A6947D]"><ShieldCheck size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Team Access Control</h2></div>
               <button onClick={() => setIsTeamModalOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-[10px] font-mono text-[#A6947D]/80 uppercase tracking-widest leading-relaxed">
                Generate single-use or permanent access passes for your sales executives. Passes restrict access to the master escrow ledger and isolate communication pipelines.
              </p>

              <button onClick={handleGeneratePass} className="w-full bg-[#A6947D]/10 border border-[#A6947D]/50 hover:bg-[#A6947D]/20 text-[#A6947D] font-bold uppercase tracking-widest py-4 rounded-sm transition-all text-[10px] flex justify-center items-center gap-2">
                <UserPlus size={16} /> Generate New Agent Pass
              </button>

              {agentPasses.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] border-b border-[#A6947D]/20 pb-2">Active Passes</h3>
                  {agentPasses.map((pass, i) => (
                    <div key={i} className="flex justify-between items-center bg-[#01030A] border border-[#A6947D]/20 p-3 rounded-sm group">
                      <div className="flex items-center gap-3">
                        <Lock size={12} className="text-emerald-500" />
                        <span className="text-xs font-mono text-[#F8F5EE]">{pass}</span>
                      </div>
                      
                      {/* COPY LINK LOGIC */}
                      <button 
                        onClick={() => {
                          const inviteLink = `${window.location.origin}/auth?invite=${pass}`;
                          navigator.clipboard.writeText(inviteLink);
                          // Μικρό visual feedback ότι έγινε το copy
                          const btn = document.getElementById(`copy-btn-${i}`);
                          if(btn) {
                            btn.innerText = "COPIED!";
                            btn.classList.add("bg-[#A6947D]", "text-[#020509]");
                            setTimeout(() => {
                              btn.innerText = "Copy Link";
                              btn.classList.remove("bg-[#A6947D]", "text-[#020509]");
                            }, 2000);
                          }
                        }}
                        id={`copy-btn-${i}`}
                        className="text-[8px] font-bold text-[#A6947D] uppercase tracking-widest border border-[#A6947D]/30 px-3 py-1.5 hover:bg-[#A6947D]/10 transition-all duration-300 rounded-sm"
                      >
                        Copy Link
                      </button>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 0. CONTRACT GENERATOR MODAL (INSTITUTIONAL GRADE - REDESIGNED) */}
      {isContractGeneratorOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 md:p-6 bg-[#01030A]/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#020509] border border-[#A6947D]/20 rounded-sm w-full max-w-[1400px] h-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative">
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
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Lock size={10} className="text-[#A6947D]/50"/> Seller Company</label>
                      <input type="text" name="sellerName" value={contractData.sellerName} readOnly className="w-full bg-[#020509]/50 border border-[#A6947D]/10 rounded-sm p-2.5 text-xs text-[#F8F5EE]/50 outline-none cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Lock size={10} className="text-[#A6947D]/50"/> Seller Role</label>
                      <input type="text" name="sellerRole" value={contractData.sellerRole} readOnly className="w-full bg-[#020509]/50 border border-[#A6947D]/10 rounded-sm p-2.5 text-xs text-[#F8F5EE]/50 outline-none cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Counterparty AXON ID</label>
                      <div className="relative">
                        <input type="text" name="buyerAxonId" placeholder="e.g. AX-NORD9A2F" value={contractData.buyerAxonId} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-sm p-2.5 pr-8 text-xs text-[#A6947D] font-mono tracking-widest placeholder-[#A6947D]/30 outline-none transition-colors uppercase" />
                        {isResolvingBuyer && <Loader2 size={12} className="absolute right-3 top-3 animate-spin text-[#A6947D]" />}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest flex items-center gap-1.5 mb-1.5"><Lock size={10} className="text-[#A6947D]/50"/> Verified Entity Name</label>
                      <input type="text" name="buyerName" placeholder="Auto-resolved via Protocol" value={contractData.buyerName} readOnly className={`w-full bg-[#020509]/50 border border-[#A6947D]/10 rounded-sm p-2.5 text-xs outline-none cursor-not-allowed font-bold ${contractData.buyerName === 'Unknown/Invalid ID' ? 'text-red-400' : 'text-emerald-400'}`} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Asset Material</label>
                      <input type="text" name="material" placeholder="Material Name" value={contractData.material} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-sm p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block mb-1.5">Total Quantity</label>
                      <input type="text" name="quantity" placeholder="e.g., 15,000 m²" value={contractData.quantity} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-sm p-2.5 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none" />
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
                            className={`flex-1 py-2.5 rounded-sm border font-bold text-[9px] uppercase tracking-widest transition-all ${contractData.incoterms === term ? 'bg-[#A6947D]/10 text-[#A6947D] border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 text-[#A6947D]/40 hover:border-[#A6947D]/40'}`}
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
                        <input type="number" name="price" placeholder="Total Value" value={contractData.price} onChange={handleContractChange} className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-sm p-2.5 pl-7 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none" />
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
                      className={`p-3 rounded-sm border flex flex-col items-start gap-1 transition-all ${contractData.paymentTerms === '100_escrow' ? 'bg-[#A6947D]/10 border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Wallet size={12} className={contractData.paymentTerms === '100_escrow' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${contractData.paymentTerms === '100_escrow' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>100% Secured Escrow</span>
                      </div>
                      <span className="text-[8px] text-left text-[#A6947D]/60 font-mono">Full amount locked in vault. Released only upon complete fulfillment of terms.</span>
                    </button>
                    
                    <button 
                      onClick={() => setContractData({...contractData, paymentTerms: '30_70_split'})}
                      className={`p-3 rounded-sm border flex flex-col items-start gap-1 transition-all ${contractData.paymentTerms === '30_70_split' ? 'bg-[#A6947D]/10 border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Landmark size={12} className={contractData.paymentTerms === '30_70_split' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${contractData.paymentTerms === '30_70_split' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>30 / 70 Institutional Split</span>
                      </div>
                      <span className="text-[8px] text-left text-[#A6947D]/60 font-mono">30% Advance Deposit to Vendor. 70% locked in Escrow against Bill of Lading.</span>
                    </button>
                  </div>
                </div>

                {/* 4. QUALITY ASSURANCE (INSPECTOR) - DIORTHOMENO */}
                <div className="space-y-3 pt-4 border-t border-[#A6947D]/10">
                  <label className="text-[9px] font-bold text-[#A6947D]/80 uppercase tracking-widest block">Quality Assurance Protocol</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setContractData({...contractData, inspection: 'ai_audit'})}
                      className={`p-2.5 rounded-sm border flex items-center justify-between transition-all ${contractData.inspection === 'ai_audit' ? 'bg-[#A6947D]/10 border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <span className={`text-[7px] font-bold uppercase tracking-widest ${contractData.inspection === 'ai_audit' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>AXON AI AUDIT</span>
                      {contractData.inspection === 'ai_audit' && <CheckCircle2 size={10} className="text-[#F8F5EE]" />}
                    </button>

                    <button 
                      onClick={() => setContractData({...contractData, inspection: 'sgs_required'})}
                      className={`p-2.5 rounded-sm border flex items-center justify-between transition-all ${contractData.inspection === 'sgs_required' ? 'bg-[#A6947D]/10 border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <span className={`text-[7px] font-bold uppercase tracking-widest ${contractData.inspection === 'sgs_required' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>INDEPENDENT SGS</span>
                      {contractData.inspection === 'sgs_required' && <CheckCircle2 size={10} className="text-[#F8F5EE]" />}
                    </button>

                    <button 
                      onClick={() => setContractData({...contractData, inspection: 'waived'})}
                      className={`p-2.5 rounded-sm border flex items-center justify-between transition-all ${contractData.inspection === 'waived' ? 'bg-[#A6947D]/10 border-[#A6947D]/50' : 'bg-[#020509] border-[#A6947D]/20 opacity-60 hover:opacity-100'}`}
                    >
                      <span className={`text-[7px] font-bold uppercase tracking-widest ${contractData.inspection === 'waived' ? 'text-[#F8F5EE]' : 'text-[#A6947D]'}`}>MUTUAL WAIVER</span>
                      {contractData.inspection === 'waived' && <CheckCircle2 size={10} className="text-[#F8F5EE]" />}
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
                    className="w-full bg-[#020509] border border-[#A6947D]/20 focus:border-[#A6947D] rounded-sm p-3 text-xs text-[#F8F5EE] placeholder-[#A6947D]/30 outline-none h-16 resize-none custom-scrollbar"
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex gap-3 pt-4 mt-auto border-t border-[#A6947D]/10">
                  <button onClick={handleGenerateContract} disabled={isGenerating} className="flex-1 bg-transparent border border-[#A6947D]/40 hover:border-[#A6947D] hover:bg-[#A6947D]/10 text-[#A6947D] font-bold py-3 px-4 rounded-sm flex items-center justify-center gap-2 transition-all text-[9px] uppercase tracking-widest shadow-md">
                    {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    GENERATE & SAVE TO ARCHIVE
                  </button>
                  <button onClick={() => triggerPDFDownload(contractData.contractId, contractData.sellerName, contractData.sellerRole, contractData.buyerName, contractData.material, contractData.quantity, contractData.price, contractData.incoterms, new Date().toLocaleDateString())} className="px-4 bg-[#A6947D]/10 border border-[#A6947D]/30 text-[#A6947D] hover:bg-[#A6947D]/20 rounded-sm flex items-center justify-center transition-colors" title="Download PDF">
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
                          <td className="py-2 font-bold text-[#0A192F]">
                            {contractData.inspection === 'waived' ? 'Mutual Waiver (No Physical Inspection)' : 
                             contractData.inspection === 'ai_audit' ? 'AXON AI Vision Audit (Advisory)' :
                             'Subject to Independent SGS Report'}
                          </td>
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
                      {contractData.inspection === 'ai_audit' 
                        ? "The Buyer accepts the AXON Neural Vision Audit (99.6% confidence rating) as the primary baseline for quality. While AXON guarantees the strict execution of the AI grading protocol, the final assumption of risk remains between the verified Vendor and Buyer. By proceeding, physical inspection is deemed waived."
                        : contractData.inspection === 'waived'
                        ? "By mutual agreement, the Buyer formally waives physical inspection rights and accepts the asset As Is. AXON holds no liability for natural material deviations."
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
          <div className="bg-[#020509] border border-[#A6947D]/30 rounded-sm w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#01030A]">
              <div className="flex items-center gap-3 text-[#A6947D]"><Edit size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Update Asset Protocol</h2></div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-[#A6947D]/40 hover:bg-red-500/10 hover:text-red-500 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Material Identity</label>
                  <input type="text" value={editForm.material} onChange={(e) => setEditForm({...editForm, material: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-sm px-4 py-3 text-sm text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Valuation (€)</label>
                  <input type="number" value={editForm.price} onChange={(e) => setEditForm({...editForm, price: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-sm px-4 py-3 text-sm font-mono text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Quantity (m²)</label>
                  <input type="text" value={editForm.quantity} onChange={(e) => setEditForm({...editForm, quantity: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-sm px-4 py-3 text-sm font-mono text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Thickness (cm)</label>
                  <input type="text" value={editForm.thickness} onChange={(e) => setEditForm({...editForm, thickness: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/20 rounded-sm px-4 py-3 text-sm font-mono text-[#F8F5EE] outline-none focus:border-[#A6947D]" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Market Visibility</label>
                <div className="flex bg-[#01030A] border border-[#A6947D]/20 rounded-sm p-1 gap-1">
                  <button type="button" onClick={() => setEditForm({...editForm, visibility: 'public'})} className={`flex-1 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${editForm.visibility === 'public' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30' : 'text-[#A6947D]/40 border border-transparent'}`}>Public Floor</button>
                  <button type="button" onClick={() => setEditForm({...editForm, visibility: 'private'})} className={`flex-1 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${editForm.visibility === 'private' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30' : 'text-[#A6947D]/40 border border-transparent'}`}>Private Vault (Off-Market)</button>
                </div>
              </div>
            </form>
            <div className="p-6 border-t border-[#A6947D]/20 bg-[#01030A]">
              <button onClick={handleEditSubmit} disabled={isSavingEdit} className="w-full border border-[#A6947D]/50 hover:bg-[#A6947D]/10 text-[#A6947D] font-bold uppercase tracking-widest py-4 rounded-sm transition-all text-[10px] flex items-center justify-center gap-2">
                {isSavingEdit ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> Override Protocol Data</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. TERM SHEET MODAL */}
      {isTermSheetOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#020509] border border-[#A6947D]/30 rounded-sm w-full max-w-md shadow-[0_0_40px_rgba(166,148,125,0.1)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-[#A6947D]"><FileSignature size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Generate Term Sheet</h2></div>
               <button onClick={() => setIsTermSheetOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Proposed Valuation (€)</label>
                <input type="number" value={termSheet.price} onChange={(e) => setTermSheet({...termSheet, price: e.target.value})} className="w-full bg-[#01030A] border border-[#A6947D]/30 rounded-sm px-4 py-4 font-mono text-[#F8F5EE] outline-none" required />
              </div>
              <button onClick={submitTermSheet} disabled={isSubmittingTerm} className="w-full border border-[#A6947D]/50 hover:bg-[#A6947D]/10 text-[#A6947D] font-bold uppercase tracking-widest py-4 rounded-sm transition-all text-[10px] shadow-lg flex justify-center items-center gap-2">
                {isSubmittingTerm ? <Loader2 size={16} className="animate-spin"/> : 'Transmit Term Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REFUND/TERMINATE MODAL */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[#020509] border border-red-500/30 rounded-sm w-full max-w-md shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-red-500/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-red-500"><RotateCcw size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Terminate Escrow</h2></div>
               <button onClick={() => setIsRefundModalOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-6">
              {refundSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={48} className="mx-auto text-[#F8F5EE] mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-[#F8F5EE]">Escrow Terminated Successfully</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-mono text-[#A6947D]/80 uppercase tracking-widest leading-relaxed">Warning: This action will reverse the secured funds via Stripe API and terminate the active contract.</p>
                  <button onClick={executeRefund} disabled={isRefunding} className="w-full bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-500 font-bold uppercase tracking-widest py-4 rounded-sm transition-all text-[10px] flex justify-center items-center gap-2">
                    {isRefunding ? <Loader2 size={16} className="animate-spin"/> : 'Authorize Termination & Refund'}
                  </button>
                </>
              )}
            </div>
           </div>
        </div>
      )}

    </div>
  );
}