'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, Lock, BarChart3, Crosshair, MessageSquare, 
  LogOut, Search, Send, Building2, ShieldCheck, Users, Gavel, 
  Loader2, Paperclip, X, FileText, ImageIcon, Handshake, Layers, CheckCircle2, Trash2, Anchor, Factory, MapPin, User, Package, AlertOctagon
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';

// 1. Μετονομάζουμε την κύρια συνάρτηση σε Content
function SecureCommsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [mySlabs, setMySlabs] = useState<any[]>([]); 
  const [slabSearchQuery, setSlabSearchQuery] = useState(''); 
  const [offerAssetId, setOfferAssetId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerIncoterm, setOfferIncoterm] = useState('EXW');
  const [offerText, setOfferText] = useState('Here is my final offer for this asset.');

  const [draftContextAsset, setDraftContextAsset] = useState<any>(null);
  const [lastActivity, setLastActivity] = useState<Record<string, number>>({});

  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);

  useEffect(() => {
    const initComms = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      const { data: profiles } = await supabase.from('profiles').select('*').neq('id', session.user.id);
      if (profiles) setAllUsers(profiles);

      const { data: userSlabs } = await supabase.from('slabs').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (userSlabs) setMySlabs(userSlabs);

      const { data: userMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

      const activityMap: Record<string, number> = {};
      if (userMessages) {
        userMessages.forEach(msg => {
          const otherId = msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id;
          const time = new Date(msg.created_at).getTime();
          if (!activityMap[otherId] || time > activityMap[otherId]) {
            activityMap[otherId] = time;
          }
        });
      }
      setLastActivity(activityMap);

      const chatParam = searchParams.get('chat');
      const assetParam = searchParams.get('asset');
      const attachParam = searchParams.get('attach'); 

      if (chatParam && profiles) {
        const targetUser = profiles.find(p => p.id === chatParam);
        if (targetUser) setSelectedContact(targetUser);
      }

      if (assetParam) {
        const { data: targetAsset } = await supabase.from('slabs').select('*').eq('id', assetParam).single();
        if (targetAsset) {
          setDraftContextAsset(targetAsset);
          setOfferAssetId(targetAsset.id); 
        }
      }

      if (attachParam && userSlabs) {
        const targetPrivateAsset = userSlabs.find(s => s.id === attachParam);
        if (targetPrivateAsset) {
           setOfferAssetId(targetPrivateAsset.id);
           setIsOfferModalOpen(true); 
        }
      }

      setLoading(false);
    };
    initComms();
  }, [router, searchParams]);

  useEffect(() => {
    if (!currentUser || !selectedContact) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase.channel('chat_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new;
          
          const otherId = newMsg.sender_id === currentUser.id ? newMsg.receiver_id : newMsg.sender_id;
          setLastActivity(prev => ({ ...prev, [otherId]: new Date(newMsg.created_at).getTime() }));

          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedContact.id) ||
            (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        } 
        else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser, selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const sortedUsers = [...allUsers].sort((a, b) => {
    const timeA = lastActivity[a.id] || 0;
    const timeB = lastActivity[b.id] || 0;
    return timeB - timeA; 
  });

  const filteredContacts = sortedUsers.filter(user => 
    (user.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const filteredMySlabs = mySlabs.filter(slab => 
    (slab.material?.toLowerCase() || '').includes(slabSearchQuery.toLowerCase()) ||
    (slab.id?.toLowerCase() || '').includes(slabSearchQuery.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => { setAttachments(prev => prev.filter((_, i) => i !== index)); };

  const handleDeleteMessage = async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
    const { error } = await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', currentUser.id);
    if (error) { alert(`${t('common.error')}: ${error.message}`); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && attachments.length === 0 && !draftContextAsset) || !selectedContact || isUploading) return;

    setIsUploading(true);
    let uploadedFiles: any[] = [];

    if (attachments.length > 0) {
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `chat/${currentUser.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('axon-media').upload(filePath, file);

        if (uploadError) { alert(`UPLOAD ERROR: ${uploadError.message}`); setIsUploading(false); return; }
        const { data: publicUrlData } = supabase.storage.from('axon-media').getPublicUrl(filePath);
        uploadedFiles.push({ name: file.name, type: file.type, url: publicUrlData.publicUrl, isImage: file.type.startsWith('image/') });
      }
    }

    const tempId = `temp_${Date.now()}`;
    
    let newMsgObj: any = { 
      sender_id: currentUser.id, 
      receiver_id: selectedContact.id, 
      text: newMessage || (draftContextAsset && attachments.length === 0 ? 'Inquiring about this asset.' : ''), 
      is_offer: false, 
      attachments: uploadedFiles.length > 0 ? uploadedFiles : null 
    };

    if (draftContextAsset) {
      newMsgObj.is_offer = true;
      newMsgObj.offer_details = {
        asset_id: draftContextAsset.id,
        price: draftContextAsset.pricing_model === 'ROQ' ? 'Requesting Details' : 'Inquiry',
        incoterm: draftContextAsset.incoterm || 'EXW',
        material: draftContextAsset.material 
      };
    }

    const displayMsg = { ...newMsgObj, id: tempId, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, displayMsg]);
    
    setLastActivity(prev => ({ ...prev, [selectedContact.id]: Date.now() }));
    
    setNewMessage(''); 
    setAttachments([]); 
    setDraftContextAsset(null); 
    setIsUploading(false);

    const { data: insertedData, error: insertError } = await supabase.from('messages').insert([newMsgObj]).select().single();
    if (insertError) {
      alert(`Transmission Failed: ${insertError.message}`);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (insertedData) {
      setMessages(prev => prev.map(m => m.id === tempId ? insertedData : m));
      
      await supabase.from('notifications').insert([{
        user_id: selectedContact.id,
        title: 'New Secure Message',
        message: `Incoming transmission from ${currentUser.email}.`,
        type: 'message',
        link: '/inbox'
      }]);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAssetId || !offerPrice.trim() || !selectedContact) return;

    const targetAsset = mySlabs.find(s => s.id === offerAssetId);

    const tempId = `temp_offer_${Date.now()}`;
    const newMsgObj = { 
      sender_id: currentUser.id, 
      receiver_id: selectedContact.id, 
      text: offerText, 
      is_offer: true, 
      offer_details: { 
        asset_id: offerAssetId, 
        price: offerPrice,
        incoterm: offerIncoterm,
        material: targetAsset?.material || 'Private Asset' 
      } 
    };

    const displayMsg = { ...newMsgObj, id: tempId, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, displayMsg]);
    
    setLastActivity(prev => ({ ...prev, [selectedContact.id]: Date.now() }));

    setIsOfferModalOpen(false); setOfferAssetId(''); setOfferPrice(''); setSlabSearchQuery(''); setOfferText('Here is my final offer for this asset.');
    router.replace('/inbox', { scroll: false });

    const { data: insertedData, error: insertError } = await supabase.from('messages').insert([newMsgObj]).select().single();
    if (insertError) {
      alert(`Deal Protocol Failed: ${insertError.message}`);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else if (insertedData) {
      setMessages(prev => prev.map(m => m.id === tempId ? insertedData : m));
      
      await supabase.from('notifications').insert([{
        user_id: selectedContact.id,
        title: 'OTC Protocol Engaged',
        message: `A new private proposal has been registered for your asset.`,
        type: 'offer',
        link: '/inbox'
      }]);
    }
  };

  const handleAcceptOffer = async (msg: any) => {
    if (!currentUser || isAcceptingOffer) return;
    setIsAcceptingOffer(true);

    try {
      const contractPayload = {
        asset_id: msg.offer_details.asset_id,
        buyer_id: currentUser.id, 
        vendor_id: msg.sender_id, 
        price: msg.offer_details.price,
        incoterms: msg.offer_details.incoterm || 'EXW',
        deposit_percentage: '30', 
        inspection_days: '7',     
        status: 'pending'
      };

      const { error: contractError } = await supabase.from('contracts').insert([contractPayload]);
      if (contractError) throw contractError;

      const { error: slabUpdateError } = await supabase
        .from('slabs')
        .update({ is_available: false })
        .eq('id', msg.offer_details.asset_id);
        
      if (slabUpdateError) throw slabUpdateError;

      await supabase.from('notifications').insert([{
        user_id: msg.sender_id,
        title: 'Deal Accepted!',
        message: `The terms for Asset AX-${msg.offer_details.asset_id.substring(0,6)} have been accepted. Check your Contracts Vault.`,
        type: 'contract',
        link: '/contracts'
      }]);

      router.push('/contracts');

    } catch (error: any) {
      console.error('Escrow Execution Failed:', error);
      alert('Failed to initialize contract. Database error.');
    } finally {
      setIsAcceptingOffer(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (val: any) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020509]/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#01030A] border border-[#A6947D]/30 rounded-2xl w-full max-w-lg relative shadow-[0_0_50px_rgba(166,148,125,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#A6947D]/20 bg-[#020509]">
              <div className="flex items-center gap-3 text-[#A6947D]"><Handshake size={20} /><h2 className="text-xl font-serif uppercase tracking-widest text-[#F8F5EE]">{language === 'el' ? 'Πρωτόκολλο OTC Deal' : 'OTC Deal Protocol'}</h2></div>
              <button onClick={() => {setIsOfferModalOpen(false); router.replace('/inbox', { scroll: false });}} className="text-[#F8F5EE]/40 hover:text-red-500 transition-colors p-2"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSendOffer} className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-[#01030A]">
              {!selectedContact && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertOctagon size={16} className="text-amber-500 mt-0.5 flex-none" />
                  <p className="text-[10px] text-amber-500/80 font-mono tracking-widest uppercase">Target Entity Required: Please select a contact from the Radar list first.</p>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Layers size={12}/> {language === 'el' ? 'Επιλογή από το Απόθεμά σας' : 'Select from your Inventory'}</label>
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6947D]/50" /><input type="text" value={slabSearchQuery} onChange={(e) => setSlabSearchQuery(e.target.value)} placeholder={t('trading.search_placeholder')} className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-t-xl pl-9 pr-4 py-3 text-xs text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" /></div>
                <div className="bg-[#020509] border border-t-0 border-[#A6947D]/30 rounded-b-xl max-h-56 overflow-y-auto p-2 space-y-1 custom-scrollbar shadow-inner">
                  {mySlabs.length === 0 ? <div className="text-center py-6 text-[#A6947D]/50 text-[10px] uppercase font-mono tracking-widest">{t('trading.no_assets')}</div> : filteredMySlabs.map(slab => (
                    <div key={slab.id} onClick={() => setOfferAssetId(slab.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${offerAssetId === slab.id ? 'bg-[#A6947D]/15 border-[#A6947D]/50' : 'bg-transparent border-transparent hover:bg-[#A6947D]/5'}`}>
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-[#01030A] flex-none border border-[#A6947D]/20 relative">
                        {slab.visibility === 'private' && <div className="absolute top-0 right-0 bg-indigo-500 p-0.5 rounded-bl text-white"><Lock size={8}/></div>}
                        {slab.image_url ? <img src={slab.image_url} alt={slab.material} className="w-full h-full object-cover grayscale-[20%]" /> : <ImageIcon className="w-full h-full p-3 text-[#A6947D]/30" />}
                      </div>
                      <div className="flex-1 overflow-hidden"><p className={`text-xs font-bold uppercase tracking-wider truncate ${offerAssetId === slab.id ? 'text-[#A6947D]' : 'text-[#F8F5EE]'}`}>{slab.material || 'Unknown'}</p><p className="text-[9px] font-mono text-[#A6947D]/80 tracking-widest mt-0.5 truncate">ID: {slab.id.substring(0,8)}... | €{slab.price}</p></div>
                      <div className="pr-2">{offerAssetId === slab.id && <CheckCircle2 size={16} className="text-[#A6947D] flex-none" />}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Incoterm</label>
                  <div className="flex gap-2">
                    {['EXW', 'FOB'].map(term => (
                      <button key={term} type="button" onClick={() => setOfferIncoterm(term)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${offerIncoterm === term ? 'bg-[#A6947D] text-[#020509] border-[#A6947D]' : 'bg-[#020509] text-[#A6947D] border-[#A6947D]/20'}`}>{term}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2">{language === 'el' ? 'Ιδιωτική Αποτίμηση (€)' : 'Private Value (€)'}</label>
                  <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="e.g. 12500" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm font-mono text-[#A6947D] focus:outline-none focus:border-[#A6947D] transition-colors shadow-inner" required disabled={!offerAssetId} />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2">{language === 'el' ? 'Όροι / Μήνυμα' : 'Terms / Message'}</label>
                <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} rows={2} className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-5 py-4 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] resize-none shadow-inner custom-scrollbar" required disabled={!offerAssetId} />
              </div>
              
              <div className="pt-4 border-t border-[#A6947D]/10"><button type="submit" disabled={!offerAssetId || !offerPrice.trim() || !selectedContact} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"><Handshake size={16}/> {language === 'el' ? 'Αποστολή Ασφαλούς Προσφοράς' : 'Transmit Secure Offer'}</button></div>
            </form>
          </div>
        </div>
      )}

      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]">
            <Shield size={20} className="text-[#A6947D]" />
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><MessageSquare size={16} /> {t('menu.comms')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      <main className="flex-1 flex overflow-hidden bg-[#020509] pb-24 md:pb-0">
        {loading ? (
          <div className="flex w-full items-center justify-center text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]">{t('common.syncing')}</div>
        ) : (
          <>
            <div className="w-full md:w-80 lg:w-96 flex-none border-r border-[#A6947D]/10 flex flex-col bg-[#01030A]/50 backdrop-blur-md z-10">
              <div className="p-6 border-b border-[#A6947D]/10">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A6947D] mb-4">Radar</h2>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6947D]/50 group-focus-within:text-[#A6947D] transition-colors" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === 'el' ? 'Αναζήτηση...' : 'Search...'} className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl pl-11 pr-4 py-3 text-xs text-[#F8F5EE] focus:border-[#A6947D]/60 focus:outline-none transition-all placeholder:text-[#A6947D]/30 shadow-inner" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {filteredContacts.map(contact => {
                  const activityTime = lastActivity[contact.id];
                  return (
                  <button key={contact.id} onClick={() => setSelectedContact(contact)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all border text-left ${selectedContact?.id === contact.id ? 'bg-[#A6947D]/10 border-[#A6947D]/30 shadow-md' : 'bg-transparent border-transparent hover:bg-[#A6947D]/5'}`}>
                    <div className="flex-1 overflow-hidden">
                      <h3 className={`text-xs font-serif uppercase tracking-wider truncate ${selectedContact?.id === contact.id ? 'text-[#F8F5EE]' : 'text-[#F8F5EE]/70'}`}>{contact.company_name || contact.email}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[9px] font-mono tracking-widest truncate flex items-center gap-1.5 leading-none">
                          {contact.status === 'verified' ? <span className="text-[#A6947D] flex items-center gap-1"><ShieldCheck size={10}/> {t('trading.verified')}</span> : <span className="text-[#A6947D]/40">Active Node</span>}
                        </p>
                      </div>
                    </div>
                  </button>
                )})}
              </div>
            </div>

            <div className={`flex-1 flex flex-col relative ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0"><Shield size={600} className="text-[#A6947D]" /></div>

              {!selectedContact ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
                  <div className="relative mb-8"><Shield size={160} className="text-[#A6947D]/20" strokeWidth={0.5} /><div className="absolute inset-0 flex items-center justify-center"><MessageSquare size={40} className="text-[#A6947D]/80" strokeWidth={1} /></div></div>
                  <h3 className="text-2xl md:text-3xl font-serif text-[#A6947D] uppercase tracking-[0.2em] mb-6 font-light">{t('inbox.title')}</h3>
                  <p className="text-[10px] text-[#F8F5EE]/50 uppercase tracking-[0.3em] font-mono">{language === 'el' ? 'Επιλογή Οντότητας' : 'Select Target Entity'}</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-[#A6947D]/10 bg-[#01030A]/90 backdrop-blur-md flex items-center justify-between shadow-md z-10 flex-none">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelectedContact(null)} className="md:hidden text-[#A6947D] p-2"><LogOut size={16} className="rotate-180" /></button>
                      <div>
                        <h3 className="text-lg font-serif tracking-widest text-[#F8F5EE] uppercase">{selectedContact.company_name || selectedContact.email}</h3>
                        <div className="flex items-center gap-2 mt-1 leading-none text-emerald-500/80"><Lock size={12} /><span className="text-[9px] font-mono tracking-widest uppercase">{t('inbox.encryption_active')}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col custom-scrollbar relative z-10 bg-[#020509]">
                    <div className="text-center mb-8"><span className="bg-[#01030A] border border-[#A6947D]/20 text-[#A6947D] text-[9px] uppercase tracking-[0.3em] font-bold px-6 py-2 rounded-full shadow-md">AXON P2P ENCRYPTION ENABLED</span></div>
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex w-full group items-center gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {isMine && !msg.id.toString().startsWith('temp_') && (
                            <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 text-[#A6947D]/40 hover:text-red-500 transition-all p-2 rounded-full"><Trash2 size={16} /></button>
                          )}
                          {!msg.is_offer ? (
                            <div className={`max-w-[85%] md:max-w-[70%] p-4 md:p-5 rounded-2xl flex flex-col gap-2 shadow-lg ${isMine ? 'bg-[#A6947D]/10 border border-[#A6947D]/30 text-[#F8F5EE]' : 'bg-[#01030A] border border-[#A6947D]/10 text-[#F8F5EE]/80'}`}>
                              {msg.text && <p className="text-sm font-sans leading-relaxed">{msg.text}</p>}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {msg.attachments.map((att: any, idx: number) => (
                                    att.isImage ? (
                                      <img key={idx} src={att.url} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-[#A6947D]/20 shadow-md" />
                                    ) : (
                                      <a key={idx} href={att.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#020509] border border-[#A6947D]/30 p-2.5 rounded-lg text-[10px] text-[#A6947D] hover:text-[#F8F5EE] transition-colors"><FileText size={14}/> <span className="truncate max-w-[150px]">{att.name}</span></a>
                                    )
                                  ))}
                                </div>
                              )}
                              <p className={`text-[8px] font-mono tracking-widest mt-1 text-right ${isMine ? 'text-[#A6947D]/60' : 'text-[#A6947D]/40'}`}>{formatTime(msg.created_at)}</p>
                            </div>
                          ) : (
                            <div className={`w-[280px] sm:w-[340px] p-6 rounded-2xl border shadow-xl ${isMine ? 'bg-[#01030A] border border-[#A6947D]/60' : 'bg-[#01030A] border border-[#A6947D]/20'}`}>
                                <div className="flex items-center gap-4 mb-5 border-b border-[#A6947D]/10 pb-4"><Handshake size={18} className="text-[#A6947D]" /><div><p className="text-[10px] text-[#A6947D] uppercase font-bold tracking-widest leading-tight">Asset Context Protocol</p><p className="text-[8px] text-[#A6947D]/50 font-mono uppercase tracking-widest mt-1">{msg.offer_details?.material || 'INQUIRY / OFFER'}</p></div></div>
                                <div className="space-y-3 mb-6">
                                  <div className="flex justify-between items-center bg-[#020509] p-4 rounded-xl border border-[#A6947D]/15 shadow-inner"><span className="text-[9px] text-[#A6947D]/80 uppercase tracking-[0.2em] font-bold">Terms</span><span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">{msg.offer_details?.incoterm === 'EXW' ? <Factory size={10}/> : <Anchor size={10}/>} {msg.offer_details?.incoterm || 'EXW'}</span></div>
                                  <div className="flex justify-between items-center bg-[#020509] p-4 rounded-xl border border-[#A6947D]/30 shadow-inner"><span className="text-[9px] text-[#A6947D] uppercase tracking-[0.2em] font-bold">Value / Status</span><span className={`text-sm font-mono font-light uppercase tracking-widest ${msg.offer_details.price === 'Requesting Details' || msg.offer_details.price === 'Inquiry' ? 'text-amber-500' : 'text-[#A6947D]'}`}>{msg.offer_details.price === 'Requesting Details' || msg.offer_details.price === 'Inquiry' ? msg.offer_details.price : formatCurrency(msg.offer_details.price)}</span></div>
                                </div>
                                {msg.text && <div className="mt-4 pt-4 border-t border-[#A6947D]/10"><p className="text-xs text-[#F8F5EE]/80 italic">"{msg.text}"</p></div>}
                                
                                {!isMine && msg.offer_details.price !== 'Requesting Details' && msg.offer_details.price !== 'Inquiry' && (
                                  <div className="mt-5 pt-5 border-t border-[#A6947D]/20">
                                    <button onClick={() => handleAcceptOffer(msg)} disabled={isAcceptingOffer} className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#020509] font-bold uppercase tracking-widest py-3 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50">
                                      {isAcceptingOffer ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><ShieldCheck size={14} /> Accept & Escrow</>}
                                    </button>
                                  </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-[#A6947D]/10 flex justify-between items-center">
                                  <Link href={`/trading/${msg.offer_details.asset_id}`} className="text-[9px] font-bold uppercase tracking-widest text-[#A6947D] hover:text-[#F8F5EE] transition-colors border border-[#A6947D]/30 px-3 py-1.5 rounded-lg flex items-center gap-2"><Search size={10}/> View Asset</Link>
                                </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 md:p-6 border-t border-[#A6947D]/10 bg-[#01030A] flex flex-col gap-3 relative z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex-none">
                    
                    {draftContextAsset && (
                      <div className="bg-[#A6947D]/10 border border-[#A6947D]/30 rounded-xl p-3 flex items-center justify-between mb-2 max-w-4xl mx-auto w-full backdrop-blur-md">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-[#020509] flex items-center justify-center border border-[#A6947D]/20 text-[#A6947D] flex-none"><Package size={14}/></div>
                          <div className="flex-col overflow-hidden"><p className="text-[9px] text-[#A6947D] font-bold uppercase tracking-widest leading-none">Context Attached</p><p className="text-xs text-[#F8F5EE] truncate mt-1">{draftContextAsset.material || 'Asset Inquiry'}</p></div>
                        </div>
                        <button onClick={() => setDraftContextAsset(null)} className="p-2 text-[#A6947D]/60 hover:text-red-500 transition-colors"><X size={14}/></button>
                      </div>
                    )}

                    {attachments.length > 0 && (
                      <div className="flex gap-2 flex-wrap mb-2 max-w-4xl mx-auto w-full">
                        {attachments.map((file, idx) => (
                          <div key={idx} className="bg-[#020509] border border-[#A6947D]/30 rounded-lg px-3 py-1.5 flex items-center gap-2 text-[10px] text-[#A6947D]">
                            <ImageIcon size={12}/><span className="truncate max-w-[120px]">{file.name}</span><button type="button" onClick={() => removeAttachment(idx)} className="hover:text-red-500 ml-1"><X size={12}/></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto w-full">
                      <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*,.pdf,.doc,.docx" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="h-[56px] w-[56px] flex items-center justify-center rounded-xl bg-[#020509] border border-[#A6947D]/20 text-[#A6947D]/60 hover:text-[#A6947D] transition-all flex-none"><Paperclip size={20} /></button>
                      <button type="button" onClick={() => setIsOfferModalOpen(true)} className="h-[56px] w-[56px] hidden sm:flex items-center justify-center rounded-xl bg-transparent border border-[#A6947D]/40 text-[#A6947D] hover:bg-[#A6947D]/10 transition-all flex-none"><Handshake size={20} /></button>
                      <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={draftContextAsset ? 'Add a message to your inquiry...' : t('inbox.type_message')} className="flex-1 bg-[#020509] border border-[#A6947D]/20 rounded-xl px-4 md:px-5 py-4 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]/60 transition-colors shadow-inner placeholder:text-[#A6947D]/30 min-h-[56px] max-h-[120px] custom-scrollbar" rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} />
                      <button type="submit" disabled={(!newMessage.trim() && attachments.length === 0 && !draftContextAsset) || isUploading} className="bg-[#A6947D] text-[#020509] h-[56px] min-w-[56px] px-4 sm:px-6 flex items-center justify-center rounded-xl transition-all flex-none font-bold text-[10px] uppercase tracking-widest disabled:opacity-50"><Send size={18} /></button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/90 backdrop-blur-xl border-t border-[#A6947D]/20 px-4 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><BarChart3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/network" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><Users size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.network').substring(0,3)}</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-[#A6947D] p-2 flex flex-col items-center gap-1 relative"><MessageSquare size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.comms').substring(0,5)}</span></Link>
      </nav>
    </div>
  );
}

// 2. Εξάγουμε το Component τυλιγμένο σε Suspense
export default function SecureComms() {
  return (
    <Suspense fallback={<div className="flex h-[100dvh] w-full bg-[#020509] items-center justify-center text-[#A6947D] text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Establishing Secure Connection...</div>}>
      <SecureCommsContent />
    </Suspense>
  );
}