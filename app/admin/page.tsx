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
  FileSignature, Ship, Handshake, Clock, ArrowRight, AlertOctagon,
  Award, Key, Terminal, Edit, Save, History
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
  const [systemLogs, setSystemLogs] = useState<any[]>([]); // NEW: INTELLIGENCE FEED
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'kyc' | 'floor' | 'escrow' | 'ledger' | 'intelligence' | 'broadcast'>('kyc');
  const [kycFilter, setKycFilter] = useState<'pending' | 'verified' | 'suspended'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [inspectingProfile, setInspectingProfile] = useState<any>(null);
  const [profileSlabs, setProfileSlabs] = useState<any[]>([]);
  const [loadingSlabs, setLoadingSlabs] = useState(false);
  const [deletingSlabId, setDeletingSlabId] = useState<string | null>(null);

  // NEW: EDIT SLAB MODAL
  const [editingSlab, setEditingSlab] = useState<any>(null);
  const [slabForm, setSlabForm] = useState({ material: '', price: '' });

  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  
  const [directMessage, setDirectMessage] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, [router]);

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

    const { data: contractsData } = await supabase.from('contracts')
      .select(`*, slabs ( material, image_url ), buyer:profiles!contracts_buyer_id_fkey ( company_name, email ), vendor:profiles!contracts_vendor_id_fkey ( company_name, email )`)
      .order('created_at', { ascending: false });
    if (contractsData) setAllContracts(contractsData);

    const { data: logsData } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (logsData) setSystemLogs(logsData);

    setLoading(false);
  };

  // --- LOGGING FUNCTION ---
  const logSystemEvent = async (type: string, description: string) => {
    await supabase.from('system_logs').insert([{ event_type: type, description }]);
    const { data: logsData } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (logsData) setSystemLogs(logsData);
  };

  // --- PROFILE MANAGEMENT ---
  const handleStatusChange = async (userId: string, newStatus: string) => {
    setProcessingId(userId);
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, status: newStatus } : p));
      if (inspectingProfile?.id === userId) setInspectingProfile({ ...inspectingProfile, status: newStatus });
      logSystemEvent('SECURITY', `User status updated to ${newStatus} for ID: ${userId.substring(0,8)}`);
    }
    setProcessingId(null);
  };

  const toggleBadge = async (userId: string, field: 'is_verified' | 'has_gold_badge', currentValue: boolean) => {
    setProcessingId(field);
    const { error } = await supabase.from('profiles').update({ [field]: !currentValue }).eq('id', userId);
    if (!error) {
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, [field]: !currentValue } : p));
      if (inspectingProfile?.id === userId) setInspectingProfile({ ...inspectingProfile, [field]: !currentValue });
      logSystemEvent('AUTHORIZATION', `Badge ${field} set to ${!currentValue} for ID: ${userId.substring(0,8)}`);
    }
    setProcessingId(null);
  };

  const triggerPasswordReset = async (email: string) => {
    if (!confirm(`Send password reset link to ${email}?`)) return;
    setProcessingId('password');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (!error) {
      alert('Password reset link transmitted.');
      logSystemEvent('SUPPORT', `Password reset triggered for ${email}`);
    } else {
      alert(`Error: ${error.message}`);
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

  // --- ASSET MANAGEMENT ---
  const forceDeleteSlab = async (slabId: string) => {
    if (!confirm('WARNING: PERMANENTLY PURGE ASSET?')) return;
    setDeletingSlabId(slabId);
    const { error } = await supabase.from('slabs').delete().eq('id', slabId);
    if (!error) {
      setProfileSlabs(prev => prev.filter(slab => slab.id !== slabId));
      setAllSlabs(prev => prev.filter(slab => slab.id !== slabId));
      logSystemEvent('ASSET_PURGE', `Asset AX-${slabId.substring(0,8)} purged from global ledger.`);
    }
    setDeletingSlabId(null);
  };

  const openEditSlab = (slab: any) => {
    setEditingSlab(slab);
    setSlabForm({ material: slab.material || '', price: slab.price || '' });
  };

  const saveSlabEdit = async () => {
    setProcessingId('edit-slab');
    const { error } = await supabase.from('slabs').update({ material: slabForm.material, price: slabForm.price }).eq('id', editingSlab.id);
    if (!error) {
      setAllSlabs(prev => prev.map(s => s.id === editingSlab.id ? { ...s, ...slabForm } : s));
      setProfileSlabs(prev => prev.map(s => s.id === editingSlab.id ? { ...s, ...slabForm } : s));
      logSystemEvent('ASSET_MODIFIED', `Asset AX-${editingSlab.id.substring(0,8)} parameters overridden.`);
      setEditingSlab(null);
    }
    setProcessingId(null);
  };

  // --- CONTRACT MANAGEMENT ---
  const forceTerminateDeal = async (dealId: string, paymentIntentId: string) => {
    if (!confirm('WARNING: FORCE CANCEL ESCROW OFFER?')) return;
    setProcessingId(dealId);
    try {
      if (paymentIntentId) await fetch('/api/refund', { method: 'POST', body: JSON.stringify({ paymentIntentId, amountToRefund: null }) });
      await supabase.from('messages').delete().eq('id', dealId);
      setAllDeals(prev => prev.filter(deal => deal.id !== dealId));
      logSystemEvent('ESCROW_OVERRIDE', `Pending Escrow Offer ${dealId.substring(0,8)} terminated.`);
    } catch (err) {}
    setProcessingId(null);
  };

  const forceTerminateContract = async (contractId: string) => {
    if (!confirm('WARNING: TERMINATE BINDING CONTRACT? This will flag it as cancelled.')) return;
    setProcessingId(contractId);
    const { error } = await supabase.from('contracts').update({ status: 'cancelled' }).eq('id', contractId);
    if (!error) {
      setAllContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'cancelled' } : c));
      logSystemEvent('CONTRACT_TERMINATED', `Binding Contract AX-${contractId.substring(0,8)} force-cancelled by Overwatch.`);
    }
    setProcessingId(null);
  };

  // --- COMMUNICATIONS ---
  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim() || profiles.length === 0) return;
    setBroadcasting(true);
    const notificationsToInsert = profiles.map(p => ({ user_id: p.id, title: `SYSTEM: ${broadcastTitle}`, message: broadcastMsg, type: 'system' }));
    const { error } = await supabase.from('notifications').insert(notificationsToInsert);
    if (!error) {
      alert("Message broadcast to the network.");
      logSystemEvent('BROADCAST', `Global signal transmitted: ${broadcastTitle}`);
      setBroadcastTitle(''); setBroadcastMsg('');
    }
    setBroadcasting(false);
  };

  const sendDirectMessage = async (userId: string) => {
    if (!directMessage.trim()) return;
    setSendingDirect(true);
    const { error } = await supabase.from('notifications').insert([{ user_id: userId, title: 'SYSTEM TRANSMISSION', message: directMessage, type: 'system' }]);
    if (!error) {
      alert('Targeted message sent successfully.');
      logSystemEvent('DIRECT_COMMS', `Direct transmission sent to node ${userId.substring(0,8)}`);
      setDirectMessage('');
    }
    setSendingDirect(false);
  };

  // --- HELPERS ---
  const getVendorName = (userId: string) => {
    const profile = profiles.find(p => p.id === userId);
    return profile ? (profile.company_name || profile.email) : 'Unknown Entity';
  };
  const formatCurrency = (amount: string | number) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(amount?.toString().replace(/\./g, '').replace(/,/g, '.')) || 0);
  const formatTime = (isoString: string) => new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getStageProgress = (status: string) => { switch (status) { case 'pending': return 1; case 'funded': return 2; case 'shipped': return 3; case 'released': return 4; default: return 0; } };

  const totalGMV = allSlabs.reduce((acc, curr) => acc + (parseFloat(curr.price?.toString().replace(/\./g, '').replace(/,/g, '.')) || 0), 0);
  const totalEscrowValue = allContracts.reduce((acc, curr) => acc + (parseFloat(curr.price?.toString().replace(/\./g, '').replace(/,/g, '.')) || 0), 0);

  const filteredProfiles = profiles.filter(p => ((p.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())) && p.status === kycFilter);
  const filteredSlabs = allSlabs.filter(s => (s.material?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || (s.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#000000] text-gray-200 overflow-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* EDIT SLAB MODAL */}
      {editingSlab && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#030303] border border-emerald-900/50 rounded-sm w-full max-w-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden">
            <div className="p-6 border-b border-gray-900 bg-[#020202] flex justify-between items-center">
              <div className="flex items-center gap-3 text-emerald-500"><Edit size={18}/><h2 className="text-sm font-serif uppercase tracking-[0.3em] text-white">Override Asset Parameters</h2></div>
              <button onClick={() => setEditingSlab(null)} className="text-gray-600 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div><label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mb-2">Material Designation</label><input type="text" value={slabForm.material} onChange={e => setSlabForm({...slabForm, material: e.target.value})} className="w-full bg-[#000000] border border-gray-800 p-4 text-xs font-mono text-white focus:outline-none focus:border-emerald-500" /></div>
              <div><label className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mb-2">Valuation (€)</label><input type="number" value={slabForm.price} onChange={e => setSlabForm({...slabForm, price: e.target.value})} className="w-full bg-[#000000] border border-gray-800 p-4 text-xs font-mono text-white focus:outline-none focus:border-emerald-500" /></div>
              <button onClick={saveSlabEdit} disabled={processingId === 'edit-slab'} className="w-full bg-emerald-950/30 border border-emerald-900/50 text-emerald-500 hover:bg-emerald-900/40 p-4 rounded-sm text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2">{processingId === 'edit-slab' ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} COMMIT CHANGES</button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT MODAL - VAULT STYLE */}
      {inspectingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#030303] border border-red-900/50 rounded-sm w-full max-w-4xl relative shadow-[0_0_50px_rgba(220,38,38,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-900 bg-[#020202]">
              <div className="flex items-center gap-3 text-red-500"><Eye size={18} strokeWidth={1.5} /><h2 className="text-sm md:text-base font-serif uppercase tracking-[0.3em] text-white">{t('admin.inspect')} - {inspectingProfile.id.substring(0,8)}</h2></div>
              <button onClick={closeInspectModal} className="text-gray-600 hover:text-red-500 transition-colors p-2"><X size={20} strokeWidth={1.5}/></button>
            </div>
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-[#000000] p-6 md:p-8">
              
              {/* TOP PROFILE BANNER */}
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 md:p-8 mb-8 flex flex-col md:flex-row gap-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-2 h-full bg-red-500/50"></div>
                 <div className="w-20 h-20 rounded-sm bg-[#020202] border border-gray-800 flex items-center justify-center flex-none overflow-hidden shadow-inner">
                    {inspectingProfile.logo_url ? <img src={inspectingProfile.logo_url} alt="Logo" className="w-full h-full object-cover grayscale-[30%]" /> : <Building2 size={24} className="text-gray-600 stroke-1" />}
                 </div>
                 <div className="flex-1">
                    <h3 className="font-serif text-white text-xl uppercase tracking-[0.2em] mb-3">{inspectingProfile.company_name || 'Unknown Entity'}</h3>
                    <div className="flex flex-wrap gap-3 text-[9px] font-mono text-gray-500 uppercase tracking-[0.3em]">
                       <span className="bg-[#020202] border border-gray-800 px-3 py-1.5 rounded-sm">{inspectingProfile.email}</span>
                       <span className="bg-[#020202] border border-gray-800 px-3 py-1.5 rounded-sm">VAT: {inspectingProfile.vat_number || 'N/A'}</span>
                    </div>
                 </div>
                 
                 {/* SUPPORT/ADMIN CONTROLS */}
                 <div className="flex flex-col gap-3 w-full md:w-56">
                    <div className="flex gap-2">
                      <button onClick={() => toggleBadge(inspectingProfile.id, 'is_verified', inspectingProfile.is_verified)} disabled={processingId === 'is_verified'} className={`flex-1 h-10 border rounded-sm text-[8px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${inspectingProfile.is_verified ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' : 'bg-[#020202] border-gray-800 text-gray-500'}`}>
                        {processingId === 'is_verified' ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle2 size={12}/>} Verified
                      </button>
                      <button onClick={() => toggleBadge(inspectingProfile.id, 'has_gold_badge', inspectingProfile.has_gold_badge)} disabled={processingId === 'has_gold_badge'} className={`flex-1 h-10 border rounded-sm text-[8px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${inspectingProfile.has_gold_badge ? 'bg-amber-900/20 border-amber-500/50 text-amber-400' : 'bg-[#020202] border-gray-800 text-gray-500'}`}>
                        {processingId === 'has_gold_badge' ? <Loader2 size={12} className="animate-spin"/> : <Award size={12}/>} Gold
                      </button>
                    </div>
                    
                    <button onClick={() => triggerPasswordReset(inspectingProfile.email)} disabled={processingId === 'password'} className="w-full h-10 bg-[#020202] border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white rounded-sm text-[8px] font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                      {processingId === 'password' ? <Loader2 size={12} className="animate-spin"/> : <Key size={12}/>} Force Password Reset
                    </button>
                    
                    <div className="h-px w-full bg-gray-900 my-1"></div>

                    {inspectingProfile.status !== 'suspended' ? (
                      <button onClick={() => handleStatusChange(inspectingProfile.id, 'suspended')} disabled={processingId === inspectingProfile.id} className="w-full h-10 bg-red-950/10 border border-red-900/30 text-red-500 hover:bg-red-950/30 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors">
                        {processingId === inspectingProfile.id ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />} SUSPEND
                      </button>
                    ) : (
                      <button onClick={() => handleStatusChange(inspectingProfile.id, 'verified')} disabled={processingId === inspectingProfile.id} className="w-full h-10 bg-emerald-950/10 border border-emerald-900/30 text-emerald-500 hover:bg-emerald-950/30 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-colors">
                        {processingId === inspectingProfile.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} RESTORE
                      </button>
                    )}
                 </div>
              </div>

              {/* DIRECT MESSAGE */}
              <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 mb-10 shadow-2xl">
                <h4 className="text-[9px] text-[#A6947D] font-mono uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Send size={14} strokeWidth={1.5}/> Targeted Transmission</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <input type="text" value={directMessage} onChange={(e) => setDirectMessage(e.target.value)} placeholder="ENTER OVERRIDE MESSAGE..." className="flex-1 h-12 bg-[#020202] border border-gray-800 rounded-sm px-5 text-xs font-mono text-white focus:outline-none focus:border-[#A6947D]/50 shadow-inner uppercase placeholder:text-gray-700" onKeyDown={(e) => { if (e.key === 'Enter') sendDirectMessage(inspectingProfile.id); }}/>
                  <button onClick={() => sendDirectMessage(inspectingProfile.id)} disabled={sendingDirect || !directMessage.trim()} className="h-12 bg-white text-black px-8 rounded-sm text-[9px] font-bold font-mono uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-30 hover:bg-gray-200">
                    {sendingDirect ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2} />} TRANSMIT
                  </button>
                </div>
              </div>

              {/* SLABS GRID */}
              <div className="flex items-center gap-3 mb-6 border-b border-gray-900 pb-3">
                <Package size={16} className="text-gray-600" strokeWidth={1.5} />
                <h3 className="text-xs font-serif uppercase tracking-[0.3em] text-white">ENTITY ASSETS ({profileSlabs.length})</h3>
              </div>
              
              {loadingSlabs ? ( <div className="flex justify-center py-16 text-[#A6947D] animate-pulse"><Loader2 size={24} className="animate-spin" /></div> ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {profileSlabs.map(slab => (
                    <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden group shadow-2xl flex flex-col relative hover:border-[#A6947D]/30 transition-colors">
                      <Link href={`/trading/${slab.id}`} target="_blank" className="h-32 relative bg-[#020202] border-b border-gray-900 block overflow-hidden">
                        {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-gray-700 stroke-1" /></div>}
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-sm text-[7px] font-mono text-[#A6947D] tracking-widest border border-gray-800">AX-{slab.id.substring(0,6)}</div>
                      </Link>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="text-[10px] font-serif uppercase tracking-widest text-white truncate mb-2">{slab.material}</h4>
                        <p className="text-[10px] font-mono text-[#A6947D] mb-4">{formatCurrency(slab.price)}</p>
                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-900">
                          <button onClick={() => openEditSlab(slab)} className="text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2"><Edit size={10}/> EDIT</button>
                          <button onClick={() => forceDeleteSlab(slab.id)} disabled={deletingSlabId === slab.id} className="text-red-500 hover:text-red-400 bg-red-950/10 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 px-3 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2">
                            {deletingSlabId === slab.id ? <Loader2 size={10} className="animate-spin"/> : <Trash2 size={10}/>} PURGE
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
            <Terminal size={20} className="text-red-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] mb-1 font-light leading-none">OVERWATCH</h1>
          <p className="text-red-500 text-[7px] font-mono uppercase tracking-[0.4em] mt-2">God Mode Enabled</p>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] transition-all"><LayoutDashboard size={16} strokeWidth={1.5}/> Exit Terminal</Link>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-mono uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} strokeWidth={1.5}/> DISCONNECT</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>

        <div className="p-5 md:p-12 max-w-7xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-10 animate-in fade-in duration-500">
            <h2 className="text-3xl md:text-4xl font-serif text-white uppercase tracking-[0.2em] font-light mb-8">Tactical Command</h2>
          </header>

          {/* TABS - SCROLLABLE & SHARP */}
          <div className="flex gap-6 md:gap-8 border-b border-gray-900 mb-8 overflow-x-auto no-scrollbar pb-px w-full scroll-smooth">
            <button onClick={() => setActiveTab('kyc')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'kyc' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600 hover:text-gray-400'}`}><Users size={14}/> Node Mgmt</button>
            <button onClick={() => setActiveTab('floor')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'floor' ? 'text-[#A6947D] border-b-2 border-[#A6947D]' : 'text-gray-600 hover:text-gray-400'}`}><Package size={14}/> Global Stock</button>
            <button onClick={() => setActiveTab('escrow')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'escrow' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-gray-600 hover:text-gray-400'}`}><Lock size={14}/> Escrow Offers</button>
            <button onClick={() => setActiveTab('ledger')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'ledger' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-400'}`}><FileSignature size={14}/> Contracts</button>
            <button onClick={() => setActiveTab('intelligence')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'intelligence' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-600 hover:text-gray-400'}`}><History size={14}/> Intelligence</button>
            <button onClick={() => setActiveTab('broadcast')} className={`pb-4 px-1 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'broadcast' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-gray-600 hover:text-gray-400'}`}><Megaphone size={14}/> Broadcast</button>
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 text-red-500 animate-pulse font-mono text-[9px] uppercase tracking-[0.4em]"><Loader2 size={24} className="animate-spin mb-4"/>Querying Matrix...</div>
          ) : (
            <div className="animate-in fade-in duration-500 w-full">
              
              {/* TAB 1: KYC */}
              {activeTab === 'kyc' && (
                <>
                  <div className="flex bg-[#020202] rounded-sm border border-gray-800 p-1 mb-6 max-w-fit">
                    <button onClick={() => setKycFilter('pending')} className={`px-4 py-2 text-[8px] font-mono uppercase tracking-[0.2em] rounded-sm ${kycFilter === 'pending' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>Pending</button>
                    <button onClick={() => setKycFilter('verified')} className={`px-4 py-2 text-[8px] font-mono uppercase tracking-[0.2em] rounded-sm ${kycFilter === 'verified' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>Verified</button>
                    <button onClick={() => setKycFilter('suspended')} className={`px-4 py-2 text-[8px] font-mono uppercase tracking-[0.2em] rounded-sm ${kycFilter === 'suspended' ? 'bg-gray-800 text-white' : 'text-gray-600'}`}>Suspended</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProfiles.map(profile => (
                      <div key={profile.id} className="bg-[#050505] border border-gray-900 p-6 flex items-center justify-between group hover:border-[#A6947D]/30 transition-colors cursor-pointer" onClick={() => openInspectModal(profile)}>
                        <div>
                          <h3 className="font-serif text-white text-sm uppercase tracking-widest truncate flex items-center gap-2">
                            {profile.company_name || profile.email}
                            {profile.is_verified && <CheckCircle2 size={12} className="text-blue-500"/>}
                            {profile.has_gold_badge && <Award size={12} className="text-amber-500"/>}
                          </h3>
                          <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mt-1">ID: {profile.id.substring(0,8)}</p>
                        </div>
                        <Eye size={16} className="text-gray-700 group-hover:text-white transition-colors" />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* TAB 2: FLOOR */}
              {activeTab === 'floor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {allSlabs.map(slab => (
                    <div key={slab.id} className="bg-[#050505] border border-gray-900 rounded-sm overflow-hidden group flex flex-col">
                      <div className="h-32 bg-[#020202] relative overflow-hidden">
                        {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover grayscale-[50%]" /> : <Package size={24} className="m-auto text-gray-800 h-full" />}
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 text-[7px] font-mono text-[#A6947D] tracking-widest border border-gray-800">AX-{slab.id.substring(0,6)}</div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="text-xs font-serif uppercase tracking-widest text-white truncate mb-2">{slab.material}</h4>
                        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-900">
                          <button onClick={() => openEditSlab(slab)} className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"><Edit size={10}/> EDIT</button>
                          <button onClick={() => forceDeleteSlab(slab.id)} className="flex-1 bg-red-950/10 hover:bg-red-950/30 text-red-500 py-1.5 rounded-sm text-[8px] font-mono uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"><Trash2 size={10}/> PURGE</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: ESCROW (Offers) */}
              {activeTab === 'escrow' && (
                <div className="space-y-4">
                  {allDeals.map(deal => (
                    <div key={deal.id} className="bg-[#050505] border border-gray-900 p-5 flex items-center justify-between hover:border-amber-900/50 transition-colors">
                      <div>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Offer on AX-{deal.offer_details?.asset_id?.substring(0,6)}</p>
                        <p className="text-sm font-serif text-white uppercase tracking-widest">{formatCurrency(deal.offer_details?.price)}</p>
                      </div>
                      <button onClick={() => forceTerminateDeal(deal.id, deal.stripe_payment_id)} className="bg-red-950/20 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/50 px-4 py-2 rounded-sm text-[8px] font-mono uppercase tracking-widest transition-all">FORCE CANCEL</button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MASTER LEDGER (Contracts) */}
              {activeTab === 'ledger' && (
                <div className="space-y-4">
                  {allContracts.map((contract) => (
                    <div key={contract.id} className="bg-[#050505] border border-gray-900 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-purple-900/50 transition-colors">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded-sm text-[7px] font-mono uppercase tracking-widest ${contract.status === 'cancelled' ? 'bg-red-900/30 text-red-500' : 'bg-purple-900/30 text-purple-400'}`}>{contract.status}</span>
                          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">ID: AX-{contract.id.substring(0,8)}</span>
                        </div>
                        <h2 className="text-base font-serif uppercase tracking-widest text-white">{contract.slabs?.material}</h2>
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">{contract.buyer?.company_name} → {contract.vendor?.company_name}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="text-lg font-mono text-white">{formatCurrency(contract.price)}</p>
                        {contract.status !== 'cancelled' && (
                           <button onClick={() => forceTerminateContract(contract.id)} className="bg-black border border-red-900/50 text-red-500 hover:bg-red-900 hover:text-white px-4 py-2 rounded-sm text-[8px] font-mono uppercase tracking-widest transition-all">OVERRIDE</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: INTELLIGENCE FEED (NEW) */}
              {activeTab === 'intelligence' && (
                <div className="bg-[#050505] border border-gray-900 rounded-sm p-6 overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 border-b border-gray-900 pb-4">
                    <Activity size={18} className="text-red-500" />
                    <h3 className="text-sm font-serif uppercase tracking-widest text-white">System Logs</h3>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {systemLogs.length === 0 ? <p className="text-[9px] text-gray-600 font-mono uppercase">No logs detected.</p> : systemLogs.map(log => (
                      <div key={log.id} className="bg-[#020202] border border-gray-900 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-[8px] text-gray-600 font-mono whitespace-nowrap">{formatDate(log.created_at)}</span>
                        <span className={`text-[7px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest whitespace-nowrap border ${log.event_type.includes('PURGE') || log.event_type.includes('TERMINATE') || log.event_type.includes('SUSPEND') ? 'border-red-900/50 text-red-500 bg-red-950/20' : log.event_type === 'SECURITY' ? 'border-blue-900/50 text-blue-500 bg-blue-950/20' : 'border-gray-800 text-gray-400 bg-gray-900'}`}>{log.event_type}</span>
                        <span className="text-[10px] font-mono text-gray-300">{log.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: BROADCAST */}
              {activeTab === 'broadcast' && (
                <div className="max-w-2xl">
                  <div className="bg-[#050505] border border-gray-900 p-8">
                    <h3 className="text-sm font-serif uppercase tracking-widest text-emerald-500 mb-6">Global Transmission</h3>
                    <form onSubmit={sendBroadcast} className="space-y-6">
                      <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="SUBJECT..." className="w-full bg-[#000000] border border-gray-800 p-4 text-xs font-mono text-white focus:outline-none focus:border-emerald-500" required />
                      <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={5} placeholder="MESSAGE..." className="w-full bg-[#000000] border border-gray-800 p-4 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 resize-none" required />
                      <button type="submit" disabled={broadcasting} className="w-full bg-emerald-950/30 border border-emerald-900/50 text-emerald-500 hover:bg-emerald-900/50 p-4 rounded-sm text-[10px] font-mono uppercase tracking-[0.3em] flex items-center justify-center gap-2">{broadcasting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>} TRANSMIT TO ALL NODES</button>
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