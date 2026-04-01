'use client'; 

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
  const { t, language, setLanguage } = useLanguage(); 
  
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
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#000000] text-gray-200 overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* INSPECT MODAL - VAULT STYLE */}
      {inspectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#030303] border border-red-900/50 rounded-sm w-full max-w-4xl relative shadow-[0_0_50px_rgba(220,38,38,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-900 bg-[#020202]">
              <div className="flex items-center gap-3 text-red-500"><Eye size={18} strokeWidth={1.5} /><h2 className="text-sm md:text-base font-serif uppercase tracking-[0.3em] text-white">{t('admin.inspect')}</h2></div>
              <button onClick={closeInspectModal} className="text-gray-600 hover:text-red-500 transition-colors p-2"><X size={20} strokeWidth={1.5}/></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-[#000000] p-6 md:p-8">
              
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-2 h-full bg-red-500/50"></div>
                 <div className="w-20 h-20 rounded-sm bg-[#020202] border border-gray-800 flex items-center justify-center flex-none overflow-hidden shadow-inner">
                    {inspectingProfile.logo_url ? <img src={inspectingProfile.logo_url} alt="Logo" className="w-full h-full object-cover grayscale-[30%]" /> : <Building2 size={24} className="text-gray-600 stroke-1" />}
                 </div>
                 <div className="flex-1">
                    <h3 className="font-serif text-white text-xl uppercase tracking-[0.2em] mb-3">{inspectingProfile.company_name || 'Unknown Entity'}</h3>
                    <div className="flex flex-wrap gap-3 text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em]">
                       <span className="bg-[#020202] border border-gray-800 px-3 py-1.5 rounded-sm">{inspectingProfile.country || 'N/A'}</span>
                       <span className="bg-[#020202] border border-gray-800 px-3 py-1.5 rounded-sm">VAT: {inspectingProfile.vat_number || 'N/A'}</span>
                    </div>
                 </div>
                 <div className="flex flex-col gap-3 w-full md:w-48">
                    <button onClick={() => handleStatusChange(inspectingProfile.id, 'suspended')} disabled={processingId === inspectingProfile.id} className="w-full h-12 bg-black border border-red-900/50 text-red-500 hover:bg-red-950/30 rounded-sm text-[9px] font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors disabled:opacity-50">
                      {processingId === inspectingProfile.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} strokeWidth={1.5} />} SUSPEND
                    </button>
                    {inspectingProfile.status !== 'verified' && (
                      <button onClick={() => handleStatusChange(inspectingProfile.id, 'verified')} disabled={processingId === inspectingProfile.id} className="w-full h-12 bg-emerald-950/30 border border-emerald-900/50 text-emerald-500 hover:bg-emerald-900/40 rounded-sm text-[9px] font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors disabled:opacity-50">
                        {processingId === inspectingProfile.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} strokeWidth={1.5} />} VERIFY
                      </button>
                    )}
                 </div>
              </div>

              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 mb-10 shadow-2xl">
                <h4 className="text-[9px] text-[#A6947D] font-mono uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Send size={14} strokeWidth={1.5}/> {t('admin.targeted_transmission')}</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" 
                    value={directMessage} 
                    onChange={(e) => setDirectMessage(e.target.value)} 
                    placeholder="ENTER OVERRIDE MESSAGE..." 
                    className="flex-1 h-14 bg-[#020202] border border-gray-800 rounded-sm px-5 text-xs font-mono text-white focus:outline-none focus:border-[#A6947D]/50 shadow-inner uppercase placeholder:text-gray-700"
                    onKeyDown={(e) => { if (e.key === 'Enter') sendDirectMessage(inspectingProfile.id); }}
                  />
                  <button 
                    onClick={() => sendDirectMessage(inspectingProfile.id)}
                    disabled={sendingDirect || !directMessage.trim()}
                    className="h-14 bg-white text-black px-8 rounded-sm text-[9px] font-bold font-mono uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-30 hover:bg-gray-200"
                  >
                    {sendingDirect ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2} />} TRANSMIT
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 border-b border-gray-900 pb-3">
                <Package size={16} className="text-gray-600" strokeWidth={1.5} />
                <h3 className="text-xs font-serif uppercase tracking-[0.3em] text-white">ENTITY ASSETS ({profileSlabs.length})</h3>
              </div>
              
              {loadingSlabs ? ( <div className="flex justify-center py-16 text-[#A6947D] animate-pulse"><Loader2 size={24} className="animate-spin" /></div> ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {profileSlabs.map(slab => (
                    <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden group shadow-2xl flex flex-col relative hover:border-red-900/30 transition-colors">
                      <Link href={`/trading/${slab.id}`} target="_blank" className="h-36 relative bg-[#020202] border-b border-gray-900 block overflow-hidden">
                        {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-700 stroke-1" /></div>}
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-sm text-[7px] font-mono text-[#A6947D] tracking-widest border border-gray-800">AX-{slab.id.substring(0,6)}</div>
                      </Link>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-serif uppercase tracking-widest text-white truncate mb-4">{slab.material}</h4>
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-900">
                          <p className="text-xs font-mono text-gray-400">{formatCurrency(slab.price)}</p>
                          <button onClick={() => forceDeleteSlab(slab.id)} disabled={deletingSlabId === slab.id} className="text-red-500 hover:text-red-400 bg-red-950/10 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                            {deletingSlabId === slab.id ? <Loader2 size={10} className="animate-spin"/> : <Trash2 size={10} strokeWidth={1.5}/>} PURGE
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

      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none"><Shield size={300} className="text-red-500" /></div>
        <div className="p-8 pb-10 flex flex-col items-center border-b border-gray-900 mb-6 relative z-10">
          <div className="w-12 h-12 border border-red-500/20 rounded-sm flex items-center justify-center mb-5 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <ShieldAlert size={20} className="text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] mb-1 font-light leading-none">AXON</h1>
          <p className="text-red-500 text-[7px] font-mono uppercase tracking-[0.4em] mt-2">Overwatch Node</p>
        </div>

        <div className="px-5 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#000000] border border-gray-800 p-1 rounded-sm shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'en' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'el' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] transition-all"><LayoutDashboard size={16} strokeWidth={1.5}/> Exit Overwatch</Link>
          <div className="flex items-center gap-4 px-4 py-3.5 bg-red-950/20 text-red-500 border border-red-900/30 rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] shadow-inner mt-4"><ShieldAlert size={16} strokeWidth={1.5}/> God Mode Active</div>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} strokeWidth={1.5}/> DISCONNECT</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>

        <div className="p-5 md:p-12 max-w-7xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-10 md:mb-16 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-px w-8 bg-red-500/50"></span>
              <p className="text-red-500 text-[9px] font-mono uppercase tracking-[0.4em] flex items-center gap-2"><ShieldAlert size={12} strokeWidth={2} /> Administrator Terminal</p>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif text-white uppercase tracking-[0.2em] font-light mb-10">{t('admin.title')}</h2>

            {/* METRICS - BANKING STYLE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6 mb-12">
              <div className="bg-[#050505] border border-gray-900 p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                 <div className="flex items-center gap-3 mb-4"><DollarSign size={16} className="text-emerald-500" strokeWidth={1.5}/><p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em]">{t('admin.total_gmv')}</p></div>
                 <p className="text-2xl md:text-3xl font-mono text-white tracking-widest">{formatCurrency(totalGMV)}</p>
              </div>
              <div className="bg-[#050505] border border-gray-900 p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none"></div>
                 <div className="flex items-center gap-3 mb-4"><Wallet size={16} className="text-amber-500" strokeWidth={1.5}/><p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em]">{t('admin.value_escrow')}</p></div>
                 <p className="text-2xl md:text-3xl font-mono text-white tracking-widest">{formatCurrency(totalEscrowValue)}</p>
              </div>
              <div className="bg-[#050505] border border-gray-900 p-6 md:p-8 rounded-sm shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-[#A6947D]/10 rounded-full blur-[40px] pointer-events-none"></div>
                 <div className="flex items-center gap-3 mb-4"><Users size={16} className="text-[#A6947D]" strokeWidth={1.5}/><p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.3em]">{t('admin.entities_assets')}</p></div>
                 <p className="text-xl md:text-2xl font-mono text-white tracking-widest">{profiles.length} <span className="text-[10px] text-gray-600 font-mono">NODES</span> / {allSlabs.length} <span className="text-[10px] text-gray-600 font-mono">ASSETS</span></p>
              </div>
            </div>
          </header>

          {/* TABS - SCROLLABLE & SHARP */}
          <div className="flex gap-6 md:gap-8 border-b border-gray-900 mb-10 overflow-x-auto no-scrollbar pb-px w-full scroll-smooth">
            <button onClick={() => setActiveTab('kyc')} className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2.5 whitespace-nowrap transition-colors ${activeTab === 'kyc' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-600 hover:text-gray-400'}`}><ShieldCheck size={14} strokeWidth={1.5}/> {t('admin.kyc_network')}</button>
            <button onClick={() => setActiveTab('floor')} className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2.5 whitespace-nowrap transition-colors ${activeTab === 'floor' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}><Activity size={14} strokeWidth={1.5}/> {t('admin.live_floor')}</button>
            <button onClick={() => setActiveTab('escrow')} className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2.5 whitespace-nowrap transition-colors ${activeTab === 'escrow' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-600 hover:text-gray-400'}`}><Lock size={14} strokeWidth={1.5}/> {t('admin.escrow_deals')}</button>
            <button onClick={() => setActiveTab('ledger')} className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2.5 whitespace-nowrap transition-colors ${activeTab === 'ledger' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}><FileSignature size={14} strokeWidth={1.5}/> Master Ledger</button>
            <button onClick={() => setActiveTab('broadcast')} className={`pb-5 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2.5 whitespace-nowrap transition-colors ${activeTab === 'broadcast' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-600 hover:text-gray-400'}`}><Megaphone size={14} strokeWidth={1.5}/> {t('admin.global_broadcast')}</button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 text-red-500 animate-pulse font-mono text-[9px] uppercase tracking-[0.4em]"><div className="w-12 h-12 border-[0.5px] border-red-500/30 border-t-red-500 rounded-full animate-spin mb-6"></div>Querying Matrix...</div>
          ) : (
            <div className="animate-in fade-in duration-500 w-full">
              
              {/* TAB 1: KYC */}
              {activeTab === 'kyc' && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                    <div className="flex bg-[#020202] rounded-sm border border-gray-800 p-1">
                      <button onClick={() => setKycFilter('pending')} className={`px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.2em] rounded-sm transition-all ${kycFilter === 'pending' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30' : 'text-gray-600 hover:text-gray-400'}`}>Pending</button>
                      <button onClick={() => setKycFilter('verified')} className={`px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.2em] rounded-sm transition-all ${kycFilter === 'verified' ? 'bg-emerald-950/30 text-emerald-500 border border-emerald-900/50' : 'text-gray-600 hover:text-gray-400'}`}>Verified</button>
                      <button onClick={() => setKycFilter('suspended')} className={`px-4 py-2.5 text-[9px] font-mono uppercase tracking-[0.2em] rounded-sm transition-all ${kycFilter === 'suspended' ? 'bg-red-950/30 text-red-500 border border-red-900/50' : 'text-gray-600 hover:text-gray-400'}`}>Suspended</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {filteredProfiles.map(profile => (
                      <div key={profile.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden shadow-2xl flex flex-col group hover:border-[#A6947D]/30 transition-colors">
                        <div className="p-6 md:p-8 flex gap-5 items-start relative">
                          <div className="w-14 h-14 rounded-sm bg-[#020202] border border-gray-800 flex items-center justify-center flex-none overflow-hidden shadow-inner">
                            {profile.logo_url ? <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover grayscale-[30%]" /> : <Building2 size={20} className="text-gray-700 stroke-1" />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h3 className="font-serif text-white text-sm uppercase tracking-widest truncate mb-1.5">{profile.company_name || 'Unknown Entity'}</h3>
                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest truncate">{profile.email}</p>
                          </div>
                        </div>
                        <div className="p-4 border-t border-gray-900 bg-[#020202] grid grid-cols-2 gap-3 mt-auto">
                          <button onClick={() => openInspectModal(profile)} className="w-full h-10 rounded-sm bg-black border border-gray-800 hover:border-white text-white text-[8px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all"><Eye size={12} strokeWidth={1.5}/> {t('admin.inspect')}</button>
                          {profile.status !== 'suspended' ? (
                            <button onClick={() => handleStatusChange(profile.id, 'suspended')} disabled={processingId === profile.id} className="w-full h-10 rounded-sm bg-red-950/10 border border-red-900/30 text-red-500 hover:bg-red-950/30 text-[8px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"><Ban size={12} strokeWidth={1.5} /> {t('admin.suspend')}</button>
                          ) : (
                            <button onClick={() => handleStatusChange(profile.id, 'pending')} disabled={processingId === profile.id} className="w-full h-10 rounded-sm bg-amber-950/10 border border-amber-900/30 text-amber-500 hover:bg-amber-950/30 text-[8px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2 disabled:opacity-50 transition-all"><RotateCcw size={12} strokeWidth={1.5} /> {t('admin.restore')}</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 2: FLOOR */}
              {activeTab === 'floor' && (
                <>
                  <div className="flex items-center gap-4 mb-8 w-full">
                    <div className="bg-[#050505] border border-gray-800 rounded-sm p-1.5 flex items-center gap-3 w-full max-w-md shadow-inner focus-within:border-[#A6947D]/50 transition-colors">
                      <Search size={14} className="text-gray-600 ml-3" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ENTER ASSET ID OR MATERIAL..." className="w-full bg-transparent border-none h-10 text-[10px] font-mono uppercase tracking-widest outline-none text-white placeholder:text-gray-700" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                    {filteredSlabs.map(slab => (
                      <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden group shadow-2xl flex flex-col hover:border-[#A6947D]/30 transition-colors">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-900 bg-[#020202]">
                          <div className="flex items-center gap-3"><Building2 size={12} className="text-gray-600"/><span className="text-[9px] font-mono text-gray-300 uppercase tracking-widest truncate max-w-[120px]">{getVendorName(slab.user_id || slab.vendor_id)}</span></div>
                          <span className="text-[8px] font-mono text-[#A6947D] tracking-[0.2em]">AX-{slab.id.substring(0,6)}</span>
                        </div>
                        <Link href={`/trading/${slab.id}`} target="_blank" className="h-44 relative bg-[#000000] border-b border-gray-900 block overflow-hidden">
                          {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-transform duration-700 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-800 stroke-1" /></div>}
                        </Link>
                        <div className="p-5 flex-1 flex flex-col">
                          <h4 className="text-sm font-serif uppercase tracking-widest text-white truncate mb-4">{slab.material}</h4>
                          <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-900">
                            <p className="text-sm font-mono text-gray-400">{formatCurrency(slab.price)}</p>
                            <button onClick={() => forceDeleteSlab(slab.id)} disabled={deletingSlabId === slab.id} className="text-red-500 hover:text-red-400 bg-transparent border border-red-900/30 hover:border-red-500/50 hover:bg-red-950/20 px-4 py-2 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 transition-all">
                              {deletingSlabId === slab.id ? <Loader2 size={10} className="animate-spin"/> : <Trash2 size={10} strokeWidth={1.5}/>} PURGE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 3: ESCROW */}
              {activeTab === 'escrow' && (
                <div className="space-y-5 w-full">
                  {allDeals.length === 0 ? (
                    <div className="text-center py-24 bg-[#050505] border border-gray-900 rounded-sm shadow-2xl w-full">
                      <Lock size={32} className="mx-auto mb-6 text-gray-800" strokeWidth={1} />
                      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">Zero Active Escrow Protocols</p>
                    </div>
                  ) : (
                    allDeals.map(deal => (
                      <div key={deal.id} className="bg-[#050505] border border-amber-900/30 rounded-sm p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 justify-between items-start md:items-center relative shadow-2xl overflow-hidden group hover:border-amber-500/30 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/50"></div>
                        <div className="flex-1 w-full pl-4 md:pl-6">
                          <div className="flex items-center gap-4 border-b border-gray-900 pb-4 mb-5">
                            <span className="bg-amber-950/30 text-amber-500 border border-amber-900/50 px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] flex items-center gap-2"><Lock size={10} strokeWidth={2}/> Escrow Contract</span>
                            <span className="text-gray-600 text-[9px] font-mono uppercase tracking-widest">{formatTime(deal.created_at)}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 w-full">
                            <div><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Initiator (Buyer)</p><p className="text-xs md:text-sm font-serif text-white uppercase tracking-widest">{getVendorName(deal.sender_id)}</p></div>
                            <div><p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-2">Receiver (Seller)</p><p className="text-xs md:text-sm font-serif text-white uppercase tracking-widest">{getVendorName(deal.receiver_id)}</p></div>
                          </div>
                          <div className="bg-[#020202] border border-gray-800 p-4 rounded-sm flex justify-between items-center w-full max-w-md shadow-inner">
                            <span className="text-[9px] text-gray-500 uppercase tracking-[0.3em] font-mono">Locked Valuation</span>
                            <span className="text-lg md:text-xl font-mono text-amber-400 tracking-wider">{formatCurrency(deal.offer_details?.price)}</span>
                          </div>
                        </div>
                        <div className="w-full md:w-auto mt-4 md:mt-0">
                          <button onClick={() => forceTerminateDeal(deal.id, deal.stripe_payment_id)} disabled={processingId === deal.id} className="w-full h-14 bg-black border border-red-900/50 hover:bg-red-950/20 text-red-500 px-8 rounded-sm text-[9px] font-mono uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                            {processingId === deal.id ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14} strokeWidth={1.5}/>} FORCE TERMINATE
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: MASTER LEDGER */}
              {activeTab === 'ledger' && (
                <div className="space-y-6 md:space-y-8 w-full">
                  {allContracts.length === 0 ? (
                    <div className="bg-[#050505] border border-gray-900 rounded-sm p-16 md:p-24 text-center flex flex-col items-center shadow-2xl w-full">
                      <div className="w-20 h-20 rounded-full border border-gray-800 flex items-center justify-center mb-8 bg-[#020202] shadow-inner"><FileSignature size={32} className="text-gray-700 stroke-1" /></div>
                      <h3 className="text-xl md:text-2xl font-serif text-white uppercase tracking-[0.3em] mb-4">Zero Active Contracts</h3>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">Network Master Ledger is currently empty.</p>
                    </div>
                  ) : (
                    allContracts.map((contract) => {
                      const stage = getStageProgress(contract.status);
                      const buyerName = contract.buyer?.company_name || contract.buyer?.email || 'Unknown Buyer';
                      const vendorName = contract.vendor?.company_name || contract.vendor?.email || 'Unknown Vendor';

                      return (
                        <div key={contract.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden shadow-2xl relative group hover:border-purple-900/50 transition-colors w-full">
                          
                          {/* Side Status Indicator */}
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#020202]">
                            <div className={`w-full h-full transition-all duration-1000 ${stage === 4 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : stage > 0 ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'bg-purple-500'}`}></div>
                          </div>

                          <div className="p-6 md:p-10 pl-8 md:pl-12 w-full">
                            
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 w-full border-b border-gray-900 pb-8">
                              <div className="flex-1 w-full overflow-hidden">
                                <div className="flex flex-wrap items-center gap-4 mb-4">
                                  <span className={`px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.3em] border shadow-inner ${stage === 4 ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-500' : 'bg-purple-950/30 border-purple-900/50 text-purple-500'}`}>
                                    {stage === 4 ? 'SETTLED' : 'IN PROGRESS'}
                                  </span>
                                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={12} className="text-[#A6947D]"/> {formatDate(contract.created_at)}</span>
                                </div>
                                <h2 className="text-xl md:text-3xl font-serif uppercase tracking-widest text-white mb-2 truncate">
                                  {contract.slabs?.material || 'PREMIUM ASSET'}
                                </h2>
                                <p className="text-[9px] text-gray-600 font-mono tracking-[0.3em] uppercase">GLOBAL ID: AX-{contract.id.substring(0,8)}</p>
                              </div>

                              <div className="bg-[#020202] border border-gray-800 rounded-sm p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 md:gap-8 shadow-inner w-full xl:w-auto flex-none">
                                <div className="flex-1 min-w-[120px]">
                                  <p className="text-[8px] text-emerald-500/80 uppercase font-mono tracking-[0.2em] mb-2">Buyer Entity</p>
                                  <p className="text-xs md:text-sm font-serif uppercase tracking-widest text-white truncate"><Building2 size={12} className="inline mr-2 text-gray-600"/>{buyerName}</p>
                                </div>
                                <ArrowRight size={16} className="text-gray-700 hidden sm:block stroke-1"/>
                                <div className="flex-1 min-w-[120px]">
                                  <p className="text-[8px] text-amber-500/80 uppercase font-mono tracking-[0.2em] mb-2">Vendor Entity</p>
                                  <p className="text-xs md:text-sm font-serif uppercase tracking-widest text-white truncate"><Building2 size={12} className="inline mr-2 text-gray-600"/>{vendorName}</p>
                                </div>
                                <div className="h-10 w-px bg-gray-800 hidden sm:block mx-2"></div>
                                <div className="mt-4 sm:mt-0 w-full sm:w-auto border-t sm:border-t-0 border-gray-800 pt-4 sm:pt-0">
                                  <p className="text-[8px] text-gray-500 uppercase font-mono tracking-[0.2em] mb-2">Contract Value</p>
                                  <p className="text-xl md:text-2xl font-mono text-white tracking-widest">{formatCurrency(contract.price)}</p>
                                </div>
                              </div>
                            </div>

                            {/* PROGRESS TRACKER - HIGH TECH */}
                            <div className="mb-10 w-full">
                              <p className="text-[9px] text-[#A6947D] font-mono uppercase tracking-[0.4em] mb-6 border-l-2 border-[#A6947D] pl-3">Network Execution Status</p>
                              
                              <div className="relative mt-10 md:mt-12 px-4 md:px-8 w-full max-w-4xl mx-auto">
                                {/* Base Line */}
                                <div className="absolute top-[19px] left-[5%] right-[5%] h-px bg-gray-900"></div>
                                {/* Active Line */}
                                <div className="absolute top-[19px] left-[5%] h-px bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000 ease-in-out" style={{ width: `calc(${(stage / 4) * 90}% )` }}></div>
                                
                                <div className="relative z-10 flex justify-between w-full">
                                  
                                  {/* Point 1: Term Sheet */}
                                  <div className="flex flex-col items-center gap-4 relative">
                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 1 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                                      <FileText size={16} strokeWidth={stage >= 1 ? 2 : 1.5} />
                                    </div>
                                    <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2">
                                      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 1 ? 'text-white' : 'text-gray-600'}`}>Term Sheet</p>
                                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Accepted</p>
                                    </div>
                                  </div>

                                  {/* Point 2: Escrow */}
                                  <div className="flex flex-col items-center gap-4 relative">
                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 2 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                                      <ShieldCheck size={16} strokeWidth={stage >= 2 ? 2 : 1.5} />
                                    </div>
                                    <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2">
                                      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 2 ? 'text-white' : 'text-gray-600'}`}>Escrow</p>
                                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{contract.deposit_percentage}% Funded</p>
                                    </div>
                                  </div>

                                  {/* Point 3: Logistics */}
                                  <div className="flex flex-col items-center gap-4 relative">
                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 3 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                                      <Ship size={16} strokeWidth={stage >= 3 ? 2 : 1.5} />
                                    </div>
                                    <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2 hidden sm:block">
                                      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 3 ? 'text-white' : 'text-gray-600'}`}>Logistics</p>
                                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">{contract.incoterms} Terms</p>
                                    </div>
                                  </div>

                                  {/* Point 4: Settlement */}
                                  <div className="flex flex-col items-center gap-4 relative">
                                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center border transition-all duration-500 bg-[#020202] ${stage >= 4 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-gray-800 text-gray-600'}`}>
                                      <Handshake size={16} strokeWidth={stage >= 4 ? 2 : 1.5} />
                                    </div>
                                    <div className="text-center absolute top-14 w-32 left-1/2 -translate-x-1/2 hidden sm:block">
                                      <p className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-1 ${stage >= 4 ? 'text-emerald-400' : 'text-gray-600'}`}>Released</p>
                                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Settlement</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Spacing for absolute text above */}
                            <div className="h-16 sm:h-8"></div>

                            <div className="bg-[#020202] border border-gray-900 rounded-sm p-6 flex flex-col md:flex-row justify-between items-center gap-6 w-full shadow-inner mt-4">
                              <div className="flex flex-wrap items-center gap-6 md:gap-10 w-full md:w-auto">
                                <div>
                                  <p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2">Incoterms</p>
                                  <p className="text-[11px] font-mono text-white bg-[#050505] px-3 py-1.5 rounded-sm border border-gray-800 tracking-widest">{contract.incoterms}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-600 uppercase font-mono tracking-[0.3em] mb-2">Inspection Window</p>
                                  <p className="text-[11px] font-mono text-white tracking-widest bg-[#050505] px-3 py-1.5 rounded-sm border border-gray-800">{contract.inspection_days} Days</p>
                                </div>
                              </div>
                              
                              <div className="flex gap-4 w-full md:w-auto">
                                <button className="flex-1 md:flex-none h-12 bg-[#050505] border border-gray-800 text-white hover:bg-gray-900 px-6 rounded-sm text-[9px] font-mono uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                                  <Eye size={14} strokeWidth={1.5}/> AUDIT
                                </button>
                                <button className="flex-1 md:flex-none h-12 bg-black border border-red-900/50 text-red-500 hover:bg-red-950/20 px-6 rounded-sm text-[9px] font-mono uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                                  <AlertOctagon size={14} strokeWidth={1.5}/> OVERRIDE
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

              {/* TAB 5: BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="max-w-3xl w-full">
                  <div className="bg-[#050505] border border-gray-900 rounded-sm p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500/50"></div>
                    <div className="flex items-center gap-4 mb-10 border-b border-gray-900 pb-5">
                      <Megaphone size={24} className="text-emerald-500" strokeWidth={1.5} />
                      <div>
                        <h3 className="text-xl font-serif uppercase tracking-[0.2em] text-white">Global Transmission</h3>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em] mt-1">Broadcast to all network nodes</p>
                      </div>
                    </div>
                    <form onSubmit={sendBroadcast} className="space-y-8 w-full relative z-10">
                      <div className="space-y-3">
                        <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.4em]">{t('admin.signal_subject')}</label>
                        <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="ENTER SUBJECT..." className="w-full h-14 bg-[#020202] border border-gray-800 rounded-sm px-5 text-sm font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner uppercase tracking-widest placeholder:text-gray-700" required />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.4em]">{t('admin.payload_message')}</label>
                        <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={6} placeholder="TYPE BROADCAST MESSAGE..." className="w-full bg-[#020202] border border-gray-800 rounded-sm px-5 py-5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner resize-none custom-scrollbar uppercase tracking-widest leading-[2] placeholder:text-gray-700" required />
                      </div>
                      <div className="pt-4 border-t border-gray-900">
                        <button type="submit" disabled={broadcasting || !broadcastTitle.trim() || !broadcastMsg.trim()} className="w-full h-16 bg-white text-black font-extrabold uppercase tracking-[0.4em] rounded-sm transition-all text-[10px] md:text-xs flex items-center justify-center gap-3 disabled:opacity-20 hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                          {broadcasting ? <><Loader2 size={16} className="animate-spin"/> SYNCHRONIZING...</> : <><Send size={16} strokeWidth={2}/> {t('admin.transmit')}</>}
                        </button>
                      </div>
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