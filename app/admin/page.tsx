'use client'; // <-- ΑΥΤΟ ΗΤΑΝ ΤΟ ΚΛΕΙΔΙ ΓΙΑ ΝΑ ΠΕΡΑΣΕΙ ΤΟ BUILD

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, Users, Building2, MapPin, ShieldAlert, ShieldCheck, 
  Search, Loader2, CheckCircle2, XCircle, FileText, ChevronLeft, 
  LayoutDashboard, Eye, Trash2, Package, X, ExternalLink, Activity, 
  Megaphone, Ban, Wallet, DollarSign, Send, Lock, RotateCcw,
  FileSignature, Ship, Handshake, Clock, ArrowRight, AlertOctagon 
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function AdminOverwatch() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage(); // Προσαρμογή στο δικό μας σύστημα 
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [allSlabs, setAllSlabs] = useState<any[]>([]);
  const [allDeals, setAllDeals] = useState<any[]>([]);
  
  const [allContracts, setAllContracts] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'kyc' | 'floor' | 'escrow' | 'ledger' | 'broadcast'>('kyc');
  const [kycFilter, setKycFilter] = useState<'pending' | 'verified' | 'suspended'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [inspectingProfile, setInspectingProfile] = useState<any>(null);
  const [profileSlabs, setProfileSlabs] = useState<any[]>([]);
  const [loadingSlabs, setLoadingSlabs] = useState(false);
  const [deletingSlabId, setDeletingSlabId] = useState<string | null>(null);

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  
  const [directMessage, setDirectMessage] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data: profilesData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (profilesData) setProfiles(profilesData);

      const { data: slabsData } = await supabase.from('slabs').select('*').order('created_at', { ascending: false });
      if (slabsData) setAllSlabs(slabsData);

      const { data: offersData } = await supabase.from('messages').select('*').eq('is_offer', true).order('created_at', { ascending: false });
      if (offersData) setAllDeals(offersData);

      const { data: contractsData } = await supabase
        .from('contracts')
        .select(`
          *,
          slabs ( material, image_url ),
          buyer:profiles!contracts_buyer_id_fkey ( company_name, email ),
          vendor:profiles!contracts_vendor_id_fkey ( company_name, email )
        `)
        .order('created_at', { ascending: false });
      if (contractsData) setAllContracts(contractsData);

      setLoading(false);
    };
    fetchAdminData();
  }, [router]);

  const handleStatusChange = async (userId: string, newStatus: string) => {
    setProcessingId(userId);
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p));
      if (inspectingProfile?.id === userId) {
        setInspectingProfile({ ...inspectingProfile, status: newStatus });
      }
    } else {
      alert(`${t('common.error')}: ${error.message}`);
    }
    setProcessingId(null);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const openInspectModal = async (profile: any) => {
    setInspectingProfile(profile);
    setLoadingSlabs(true);
    setDirectMessage('');
    const { data } = await supabase.from('slabs').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
    if (data) setProfileSlabs(data);
    setLoadingSlabs(false);
  };

  const closeInspectModal = () => {
    setInspectingProfile(null);
    setProfileSlabs([]);
    setDirectMessage('');
  };

  const forceDeleteSlab = async (slabId: string) => {
    if (!confirm(language === 'el' ? 'ΠΡΟΣΟΧΗ: Αυτή η ενέργεια θα διαγράψει οριστικά το Asset. Είστε σίγουρος;' : 'WARNING: This action will permanently delete the Asset. Are you sure?')) return;
    setDeletingSlabId(slabId);
    const { error } = await supabase.from('slabs').delete().eq('id', slabId);
    if (!error) {
      setProfileSlabs(prev => prev.filter(slab => slab.id !== slabId));
      setAllSlabs(prev => prev.filter(slab => slab.id !== slabId));
    }
    setDeletingSlabId(null);
  };

  const forceTerminateDeal = async (dealId: string, paymentIntentId: string) => {
    if (!confirm(language === 'el' ? 'ΠΡΟΣΟΧΗ: Αναγκαστική ακύρωση συμβολαίου. Θα γίνει Refund αν έχουν δεσμευτεί χρήματα. Είστε σίγουρος;' : 'WARNING: Forced contract cancellation. Refund will be triggered if funds are held. Are you sure?')) return;
    setProcessingId(dealId);
    try {
      if (paymentIntentId) {
        await fetch('/api/refund', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId, amountToRefund: null }) });
      }
      await supabase.from('messages').delete().eq('id', dealId);
      setAllDeals(prev => prev.filter(deal => deal.id !== dealId));
    } catch (err) {
      alert(t('common.error'));
    }
    setProcessingId(null);
  };

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim() || profiles.length === 0) return;
    setBroadcasting(true);

    const notificationsToInsert = profiles.map(p => ({
      user_id: p.id,
      title: `SYSTEM: ${broadcastTitle}`,
      message: broadcastMsg,
      type: 'system'
    }));

    const { error } = await supabase.from('notifications').insert(notificationsToInsert);
    if (!error) {
      alert(language === 'el' ? "Το μήνυμα μεταδόθηκε σε όλο το δίκτυο." : "Message broadcast to the network.");
      setBroadcastTitle(''); setBroadcastMsg('');
    } else {
      alert(`${t('common.error')}: ${error.message}`);
    }
    setBroadcasting(false);
  };

  const sendDirectMessage = async (userId: string) => {
    if (!directMessage.trim()) return;
    setSendingDirect(true);
    
    const { error } = await supabase.from('notifications').insert([{
      user_id: userId,
      title: 'SYSTEM TRANSMISSION',
      message: directMessage,
      type: 'system'
    }]);

    if (!error) {
      alert(language === 'el' ? 'Το στοχευμένο μήνυμα εστάλη επιτυχώς.' : 'Targeted message sent successfully.');
      setDirectMessage('');
    } else {
      alert(`${t('common.error')}: ${error.message}`);
    }
    setSendingDirect(false);
  };

  const getVendorName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile ? (profile.company_name || profile.email) : 'Unknown Entity';
  };

  const formatCurrency = (amount: string | number) => {
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStageProgress = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'funded': return 2;
      case 'shipped': return 3;
      case 'released': return 4;
      default: return 0;
    }
  };

  const totalGMV = allSlabs.reduce((acc, curr) => acc + (parseFloat(curr.price?.toString().replace(/\./g, '').replace(/,/g, '.')) || 0), 0);
  const totalEscrowValue = allDeals.reduce((acc, curr) => acc + (parseFloat(curr.offer_details?.price?.toString().replace(/\./g, '').replace(/,/g, '.')) || 0), 0);

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = (p.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesTab = p.status === kycFilter;
    return matchesSearch && matchesTab;
  });

  const filteredSlabs = allSlabs.filter(s => (s.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (s.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {inspectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020509]/95 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#01030A] border border-[#A6947D]/30 rounded-2xl w-full max-w-4xl relative shadow-[0_0_50px_rgba(220,38,38,0.05)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-[#A6947D]/20 bg-[#020509]">
              <div className="flex items-center gap-3 text-[#A6947D]"><Eye size={20} className="text-red-500" /><h2 className="text-sm md:text-lg font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">{t('admin.inspect')}</h2></div>
              <button onClick={closeInspectModal} className="text-[#F8F5EE]/40 hover:text-red-500 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-[#01030A] p-6">
              
              <div className="bg-[#020509] border border-[#A6947D]/15 rounded-xl p-6 mb-6 flex flex-col md:flex-row gap-6 relative overflow-hidden shadow-inner">
                 <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500/50"></div>
                 <div className="w-16 h-16 rounded-xl bg-[#01030A] border border-[#A6947D]/20 flex items-center justify-center flex-none overflow-hidden">
                    {inspectingProfile.logo_url ? <img src={inspectingProfile.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={24} className="text-[#A6947D]/40" />}
                 </div>
                 <div className="flex-1">
                    <h3 className="font-serif text-[#F8F5EE] text-xl uppercase tracking-wider mb-2">{inspectingProfile.company_name || 'Unknown Entity'}</h3>
                    <div className="flex flex-wrap gap-2 text-[9px] font-mono text-[#A6947D]/80 uppercase tracking-widest">
                       <span className="bg-[#A6947D]/10 px-2 py-1 rounded-md">{inspectingProfile.country || 'N/A'}</span>
                       <span className="bg-[#A6947D]/10 px-2 py-1 rounded-md">VAT: {inspectingProfile.vat_number || 'N/A'}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button onClick={() => handleStatusChange(inspectingProfile.id, 'suspended')} disabled={processingId === inspectingProfile.id} className="w-full bg-transparent border border-red-900/50 text-red-500 hover:bg-red-900/20 px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                      {processingId === inspectingProfile.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} {t('admin.suspend')}
                    </button>
                    {inspectingProfile.status !== 'verified' && (
                      <button onClick={() => handleStatusChange(inspectingProfile.id, 'verified')} disabled={processingId === inspectingProfile.id} className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#020509] px-4 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        {processingId === inspectingProfile.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {t('admin.verify')}
                      </button>
                    )}
                 </div>
              </div>

              <div className="bg-[#020509] border border-[#A6947D]/20 rounded-xl p-4 md:p-5 mb-8 shadow-md">
                <h4 className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest mb-3 flex items-center gap-2"><Send size={12}/> {t('admin.targeted_transmission')}</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    value={directMessage} 
                    onChange={(e) => setDirectMessage(e.target.value)} 
                    placeholder="..." 
                    className="flex-1 bg-[#01030A] border border-[#A6947D]/30 rounded-lg px-4 py-3 text-xs text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] shadow-inner"
                    onKeyDown={(e) => { if (e.key === 'Enter') sendDirectMessage(inspectingProfile.id); }}
                  />
                  <button 
                    onClick={() => sendDirectMessage(inspectingProfile.id)}
                    disabled={sendingDirect || !directMessage.trim()}
                    className="bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-3 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {sendingDirect ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} {t('admin.transmit')}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 border-b border-[#A6947D]/10 pb-2"><Package size={16} className="text-[#A6947D]" /><h3 className="text-xs font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">{t('admin.entities_assets').split(' & ')[1]} ({profileSlabs.length})</h3></div>
              {loadingSlabs ? ( <div className="flex justify-center py-12 text-[#A6947D] animate-pulse"><Loader2 size={24} className="animate-spin" /></div> ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileSlabs.map(slab => (
                    <div key={slab.id} className="bg-[#020509] border border-[#A6947D]/15 rounded-xl overflow-hidden group shadow-lg flex flex-col">
                      <Link href={`/trading/${slab.id}`} target="_blank" className="h-32 relative bg-[#01030A] border-b border-[#A6947D]/10 block overflow-hidden">
                        {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-[#A6947D]/30" /></div>}
                        <div className="absolute top-2 right-2 bg-[#020509]/90 px-2 py-1 rounded text-[7px] font-mono text-[#A6947D]">AX-{slab.id.substring(0,6)}</div>
                      </Link>
                      <div className="p-3 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-serif uppercase text-[#F8F5EE] truncate mb-2">{slab.material}</h4>
                        <div className="flex justify-between items-end mt-auto pt-2 border-t border-[#A6947D]/10">
                          <p className="text-xs font-mono text-[#A6947D]">{formatCurrency(slab.price)}</p>
                          <button onClick={() => forceDeleteSlab(slab.id)} disabled={deletingSlabId === slab.id} className="text-red-500 hover:bg-red-500/10 px-2 py-1 rounded text-[8px] font-bold uppercase transition-all flex items-center gap-1">
                            {deletingSlabId === slab.id ? <Loader2 size={10} className="animate-spin"/> : <Trash2 size={10}/>} {t('admin.purge')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-16 h-16 border border-red-500/20 rounded-full flex items-center justify-center mb-6 bg-red-900/10 shadow-[0_0_25px_rgba(220,38,38,0.1)]"><ShieldAlert size={24} className="text-red-500" /></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
          <p className="text-red-500/80 text-[8px] font-bold uppercase tracking-[0.4em]">Overwatch Node</p>
        </div>

        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#020509] border border-[#A6947D]/20 p-1 rounded-lg shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-all ${language === 'el' ? 'bg-[#A6947D] text-[#020509]' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] rounded-xl text-xs font-bold uppercase tracking-widest transition-all"><LayoutDashboard size={16} /> Exit Overwatch</Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-red-500/20">God Mode Active</div>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar">
        <div className="p-4 md:p-10 max-w-7xl mx-auto relative z-10">
          <header className="mb-6 md:mb-8 animate-in fade-in duration-700">
            <div className="flex items-center gap-2 mb-4"><span className="h-px w-6 bg-red-500/30"></span><p className="text-red-500 text-[9px] font-bold uppercase tracking-[0.3em] flex items-center gap-2"><ShieldAlert size={12} /> {t('admin.targeted_transmission').split(' SYSTEM')[0]}</p></div>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-8">{t('admin.title')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/15 p-4 md:p-5 rounded-xl shadow-lg border-l-2 border-l-emerald-500">
                 <div className="flex items-center gap-2 mb-2"><DollarSign size={14} className="text-emerald-500"/><p className="text-[8px] text-[#A6947D] uppercase tracking-widest font-bold">{t('admin.total_gmv')}</p></div>
                 <p className="text-xl md:text-2xl font-mono text-[#F8F5EE]">{formatCurrency(totalGMV)}</p>
              </div>
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/15 p-4 md:p-5 rounded-xl shadow-lg border-l-2 border-l-amber-500">
                 <div className="flex items-center gap-2 mb-2"><Wallet size={14} className="text-amber-500"/><p className="text-[8px] text-[#A6947D] uppercase tracking-widest font-bold">{t('admin.value_escrow')}</p></div>
                 <p className="text-xl md:text-2xl font-mono text-[#F8F5EE]">{formatCurrency(totalEscrowValue)}</p>
              </div>
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/15 p-4 md:p-5 rounded-xl shadow-lg border-l-2 border-l-[#A6947D]">
                 <div className="flex items-center gap-2 mb-2"><Users size={14} className="text-[#A6947D]"/><p className="text-[8px] text-[#A6947D] uppercase tracking-widest font-bold">{t('admin.entities_assets')}</p></div>
                 <p className="text-lg md:text-xl font-mono text-[#F8F5EE]">{profiles.length} <span className="text-[10px] text-[#A6947D] font-sans">Nodes</span> / {allSlabs.length} <span className="text-[10px] text-[#A6947D] font-sans">Assets</span></p>
              </div>
            </div>
          </header>

          <div className="flex gap-2 border-b border-[#A6947D]/10 mb-6 overflow-x-auto custom-scrollbar pb-px w-full scroll-smooth">
            <button onClick={() => setActiveTab('kyc')} className={`pb-3 px-3 text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'kyc' ? 'text-red-400 border-b-2 border-red-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><ShieldCheck size={14} /> {t('admin.kyc_network')}</button>
            <button onClick={() => setActiveTab('floor')} className={`pb-3 px-3 text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'floor' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Activity size={14} /> {t('admin.live_floor')}</button>
            <button onClick={() => setActiveTab('escrow')} className={`pb-3 px-3 text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'escrow' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Lock size={14} /> {t('admin.escrow_deals')}</button>
            <button onClick={() => setActiveTab('ledger')} className={`pb-3 px-3 text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'ledger' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><FileSignature size={14} /> Master Ledger</button>
            <button onClick={() => setActiveTab('broadcast')} className={`pb-3 px-3 text-[9px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'broadcast' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE]/80'}`}><Megaphone size={14} /> {t('admin.global_broadcast')}</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20 text-[#A6947D] animate-pulse font-mono text-xs uppercase tracking-widest"><Loader2 size={24} className="animate-spin mb-4 mx-auto" />{t('common.syncing')}</div>
          ) : (
            <div className="animate-in fade-in duration-500">
              
              {activeTab === 'kyc' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex bg-[#01030A] rounded-lg border border-[#A6947D]/20 p-1">
                      <button onClick={() => setKycFilter('pending')} className={`px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-md ${kycFilter === 'pending' ? 'bg-[#A6947D]/20 text-[#F8F5EE]' : 'text-[#A6947D]/60'}`}>Pending</button>
                      <button onClick={() => setKycFilter('verified')} className={`px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-md ${kycFilter === 'verified' ? 'bg-[#A6947D]/20 text-[#F8F5EE]' : 'text-[#A6947D]/60'}`}>Verified</button>
                      <button onClick={() => setKycFilter('suspended')} className={`px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-md ${kycFilter === 'suspended' ? 'bg-red-500/20 text-red-400' : 'text-[#A6947D]/60'}`}>Suspended</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProfiles.map(profile => (
                      <div key={profile.id} className="bg-[#01030A] border border-[#A6947D]/15 rounded-xl overflow-hidden shadow-lg flex flex-col group">
                        <div className="p-5 flex gap-4 items-start relative">
                          <div className="w-12 h-12 rounded-xl bg-[#020509] border border-[#A6947D]/20 flex items-center justify-center flex-none overflow-hidden">{profile.logo_url ? <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Building2 size={20} className="text-[#A6947D]/40" />}</div>
                          <div className="flex-1 overflow-hidden"><h3 className="font-serif text-[#F8F5EE] text-sm uppercase truncate mb-1">{profile.company_name || 'Unknown Entity'}</h3><p className="text-[9px] font-mono text-[#A6947D]/80 truncate">{profile.email}</p></div>
                        </div>
                        <div className="p-4 border-t border-[#A6947D]/10 bg-[#020509] grid grid-cols-2 gap-2 mt-auto">
                          <button onClick={() => openInspectModal(profile)} className="w-full py-2.5 rounded-lg bg-transparent border border-[#A6947D]/30 hover:border-[#A6947D] text-[#A6947D] text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5"><Eye size={12}/> {t('admin.inspect')}</button>
                          {profile.status !== 'suspended' ? (
                            <button onClick={() => handleStatusChange(profile.id, 'suspended')} disabled={processingId === profile.id} className="w-full py-2.5 rounded-lg border border-red-900/50 text-red-500 hover:bg-red-900/20 text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50"><Ban size={10} /> {t('admin.suspend')}</button>
                          ) : (
                            <button onClick={() => handleStatusChange(profile.id, 'pending')} disabled={processingId === profile.id} className="w-full py-2.5 rounded-lg border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 text-[8px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50"><RotateCcw size={10} /> {t('admin.restore')}</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'floor' && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="bg-[#01030A]/80 border border-[#A6947D]/20 rounded-xl p-1.5 flex items-center gap-2 max-w-sm w-full"><Search size={14} className="text-[#A6947D]/60 ml-2" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Asset..." className="w-full bg-transparent border-none py-1.5 text-xs outline-none text-[#F8F5EE]" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSlabs.map(slab => (
                      <div key={slab.id} className="bg-[#020509] border border-[#A6947D]/15 rounded-xl overflow-hidden group shadow-lg flex flex-col">
                        <div className="flex justify-between items-center px-4 py-3 border-b border-[#A6947D]/10 bg-[#01030A]"><div className="flex items-center gap-2"><Building2 size={12} className="text-[#A6947D]"/><span className="text-[9px] font-bold text-[#F8F5EE] uppercase truncate max-w-[120px]">{getVendorName(slab.user_id || slab.vendor_id)}</span></div><span className="text-[7px] font-mono text-[#A6947D] bg-[#A6947D]/10 px-2 py-1 rounded border border-[#A6947D]/20">AX-{slab.id.substring(0,6)}</span></div>
                        <Link href={`/trading/${slab.id}`} target="_blank" className="h-40 relative bg-[#01030A] border-b border-[#A6947D]/10 block overflow-hidden">{slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-transform duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-[#A6947D]/30" /></div>}</Link>
                        <div className="p-4 flex-1 flex flex-col"><h4 className="text-xs font-serif uppercase text-[#F8F5EE] truncate mb-3">{slab.material}</h4>
                          <div className="flex justify-between items-end mt-auto pt-3 border-t border-[#A6947D]/10">
                            <p className="text-base font-mono text-[#A6947D] tracking-tighter">{formatCurrency(slab.price)}</p>
                            <button onClick={() => forceDeleteSlab(slab.id)} disabled={deletingSlabId === slab.id} className="text-red-500 hover:bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"><Trash2 size={10}/> {t('admin.purge')}</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'escrow' && (
                <div className="space-y-4">
                  {allDeals.length === 0 ? (
                    <div className="text-center py-20 bg-[#01030A]/40 border border-[#A6947D]/10 rounded-2xl"><Lock size={40} className="mx-auto mb-4 text-[#A6947D]/20" /><p className="text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-[0.2em]">No active escrow deals.</p></div>
                  ) : (
                    allDeals.map(deal => (
                      <div key={deal.id} className="bg-[#01030A] border border-amber-500/20 rounded-xl p-5 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start md:items-center relative shadow-lg">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40"></div>
                        <div className="flex-1 w-full pl-2">
                          <div className="flex items-center gap-3 border-b border-[#A6947D]/10 pb-2 mb-3">
                            <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1"><Lock size={10}/> Escrow Contract</span>
                            <span className="text-[#A6947D]/60 text-[9px] font-mono">{formatTime(deal.created_at)}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div><p className="text-[8px] text-[#A6947D] uppercase font-bold tracking-widest mb-1">Initiator (Buyer)</p><p className="text-sm font-serif text-[#F8F5EE] uppercase">{getVendorName(deal.sender_id)}</p></div>
                            <div><p className="text-[8px] text-[#A6947D] uppercase font-bold tracking-widest mb-1">Receiver (Seller)</p><p className="text-sm font-serif text-[#F8F5EE] uppercase">{getVendorName(deal.receiver_id)}</p></div>
                          </div>
                          <div className="bg-[#020509] border border-[#A6947D]/15 p-3 rounded-lg flex justify-between items-center w-full max-w-sm">
                            <span className="text-[9px] text-[#A6947D] uppercase tracking-widest font-bold">Locked Value</span><span className="text-lg font-mono text-amber-400">{formatCurrency(deal.offer_details?.price)}</span>
                          </div>
                        </div>
                        <div className="w-full md:w-auto">
                          <button onClick={() => forceTerminateDeal(deal.id, deal.stripe_payment_id)} disabled={processingId === deal.id} className="w-full bg-transparent border border-red-900/50 hover:bg-red-900/20 text-red-500 px-6 py-3 md:py-4 rounded-xl text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                            {processingId === deal.id ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>} Force Terminate
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'ledger' && (
                <div className="space-y-6 md:space-y-8">
                  {allContracts.length === 0 ? (
                    <div className="bg-[#01030A]/60 backdrop-blur-md border border-[#A6947D]/10 rounded-3xl p-12 md:p-20 text-center flex flex-col items-center shadow-[0_0_50px_rgba(166,148,125,0.02)]">
                      <div className="w-24 h-24 rounded-full border border-[#A6947D]/20 flex items-center justify-center mb-6 bg-[#A6947D]/5"><FileSignature size={40} className="text-[#A6947D]/40" /></div>
                      <h3 className="text-xl md:text-2xl font-serif text-[#F8F5EE] uppercase tracking-[0.15em] mb-3">No Active Contracts</h3>
                      <p className="text-[10px] md:text-xs text-[#A6947D]/60 font-mono uppercase tracking-widest max-w-md">Network ledger is currently empty.</p>
                    </div>
                  ) : (
                    allContracts.map((contract) => {
                      const stage = getStageProgress(contract.status);
                      const buyerName = contract.buyer?.company_name || contract.buyer?.email || 'Unknown Buyer';
                      const vendorName = contract.vendor?.company_name || contract.vendor?.email || 'Unknown Vendor';

                      return (
                        <div key={contract.id} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl overflow-hidden shadow-2xl relative group hover:border-purple-500/30 transition-colors">
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#020509]">
                            <div className={`w-full h-full transition-all duration-1000 ${stage === 4 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : stage > 0 ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-[#A6947D]'}`}></div>
                          </div>

                          <div className="p-6 md:p-8 pl-8 md:pl-10">
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest border ${stage === 4 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'}`}>
                                    {stage === 4 ? 'Settled' : 'In Progress'}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#A6947D]/60 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> {formatDate(contract.created_at)}</span>
                                </div>
                                <h2 className="text-xl md:text-2xl font-serif uppercase tracking-widest text-[#F8F5EE] flex items-center gap-3">
                                  {contract.slabs?.material || 'Premium Asset'}
                                </h2>
                                <p className="text-[9px] text-[#A6947D] font-mono tracking-widest uppercase mt-1">Global ID: AX-{contract.id.substring(0,8)}</p>
                              </div>

                              <div className="bg-[#020509] border border-purple-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-inner min-w-[320px] w-full xl:w-auto">
                                <div className="flex-1">
                                  <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1 text-emerald-500/80">Buyer Entity</p>
                                  <p className="text-xs font-bold uppercase text-[#F8F5EE] flex items-center gap-1.5"><Building2 size={12} className="text-[#A6947D]"/> {buyerName}</p>
                                </div>
                                <ArrowRight size={16} className="text-[#A6947D]/30 hidden sm:block"/>
                                <div className="flex-1">
                                  <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1 text-amber-500/80">Vendor Entity</p>
                                  <p className="text-xs font-bold uppercase text-[#F8F5EE] flex items-center gap-1.5"><Building2 size={12} className="text-[#A6947D]"/> {vendorName}</p>
                                </div>
                                <div className="h-8 w-px bg-[#A6947D]/20 hidden sm:block"></div>
                                <div className="mt-2 sm:mt-0">
                                  <p className="text-[7px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Contract Value</p>
                                  <p className="text-lg font-mono text-purple-400">{formatCurrency(contract.price)}</p>
                                </div>
                              </div>
                            </div>

                            <div className="mb-8">
                              <p className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em] mb-4">Network Execution Status</p>
                              <div className="relative">
                                <div className="absolute top-5 left-0 w-full h-0.5 bg-[#A6947D]/10"></div>
                                <div className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-1000 ease-in-out" style={{ width: `${(stage / 4) * 100}%` }}></div>
                                
                                <div className="relative z-10 flex justify-between">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 bg-[#01030A] ${stage >= 1 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#A6947D]/20 text-[#A6947D]/40'}`}>
                                      <FileText size={18} />
                                    </div>
                                    <div className="text-center hidden sm:block">
                                      <p className={`text-[10px] font-bold uppercase tracking-widest ${stage >= 1 ? 'text-[#F8F5EE]' : 'text-[#A6947D]/60'}`}>Term Sheet</p>
                                      <p className="text-[8px] font-mono text-[#A6947D]/40 uppercase mt-0.5">Accepted</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 bg-[#01030A] ${stage >= 2 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#A6947D]/20 text-[#A6947D]/40'}`}>
                                      <ShieldCheck size={18} />
                                    </div>
                                    <div className="text-center hidden sm:block">
                                      <p className={`text-[10px] font-bold uppercase tracking-widest ${stage >= 2 ? 'text-[#F8F5EE]' : 'text-[#A6947D]/60'}`}>Escrow</p>
                                      <p className="text-[8px] font-mono text-[#A6947D]/40 uppercase mt-0.5">{contract.deposit_percentage}% Funded</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 bg-[#01030A] ${stage >= 3 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#A6947D]/20 text-[#A6947D]/40'}`}>
                                      <Ship size={18} />
                                    </div>
                                    <div className="text-center hidden sm:block">
                                      <p className={`text-[10px] font-bold uppercase tracking-widest ${stage >= 3 ? 'text-[#F8F5EE]' : 'text-[#A6947D]/60'}`}>Logistics</p>
                                      <p className="text-[8px] font-mono text-[#A6947D]/40 uppercase mt-0.5">{contract.incoterms} Terms</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 bg-[#01030A] ${stage >= 4 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'border-[#A6947D]/20 text-[#A6947D]/40'}`}>
                                      <Handshake size={18} />
                                    </div>
                                    <div className="text-center hidden sm:block">
                                      <p className={`text-[10px] font-bold uppercase tracking-widest ${stage >= 4 ? 'text-emerald-400' : 'text-[#A6947D]/60'}`}>Released</p>
                                      <p className="text-[8px] font-mono text-[#A6947D]/40 uppercase mt-0.5">Settlement</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex items-center gap-6">
                                <div>
                                  <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Incoterms</p>
                                  <p className="text-[10px] font-mono text-[#F8F5EE] bg-[#A6947D]/10 px-2 py-1 rounded border border-[#A6947D]/20">{contract.incoterms}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">Inspection Window</p>
                                  <p className="text-[10px] font-mono text-[#F8F5EE]">{contract.inspection_days} Days</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none bg-transparent border border-[#A6947D]/30 text-[#A6947D] hover:text-[#F8F5EE] hover:border-[#A6947D] px-6 py-3 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                                  <Eye size={12}/> Audit Ledger
                                </button>
                                <button className="flex-1 md:flex-none bg-transparent border border-red-500/30 text-red-500 hover:bg-red-500/10 px-6 py-3 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                                  <AlertOctagon size={12}/> Force Override
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'broadcast' && (
                <div className="max-w-2xl">
                  <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-6 md:p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-[#A6947D]/10 pb-4"><Megaphone size={20} className="text-emerald-500" /><div><h3 className="text-lg font-serif uppercase tracking-[0.2em] text-[#F8F5EE]">{t('admin.global_transmission')}</h3></div></div>
                    <form onSubmit={sendBroadcast} className="space-y-5">
                      <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('admin.signal_subject')}</label><input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="..." className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-emerald-500 transition-colors shadow-inner" required /></div>
                      <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('admin.payload_message')}</label><textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={4} placeholder="..." className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-emerald-500 transition-colors shadow-inner resize-none custom-scrollbar" required /></div>
                      <div className="pt-2"><button type="submit" disabled={broadcasting || !broadcastTitle.trim() || !broadcastMsg.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 disabled:opacity-50">{broadcasting ? <><Loader2 size={16} className="animate-spin"/> ...</> : <><Send size={16}/> {t('admin.transmit')}</>}</button></div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  );
}