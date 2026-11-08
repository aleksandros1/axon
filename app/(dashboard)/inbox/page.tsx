'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  Shield, Globe, Lock, Search, Send, CheckCircle2, Trash2, Package, AlertOctagon, ArrowLeft,
  Loader2, Paperclip, X, FileText, ImageIcon, Handshake, Layers, ZoomIn, Landmark, Wallet, Download,
  MessageSquare, Gavel
} from 'lucide-react';

import { useLanguage } from '../../../lib/i18n/LanguageContext';

function SecureCommsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage(); 
  
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
  
  // --- OTC PROTOCOL DYNAMIC STATE (NEW INSTITUTIONAL PARAMS) ---
  const [offerAssetId, setOfferAssetId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerIncoterm, setOfferIncoterm] = useState('FOB');
  const [offerPaymentTerms, setOfferPaymentTerms] = useState('100_escrow');
  const [offerInspection, setOfferInspection] = useState('waived');
  const [offerText, setOfferText] = useState('Here is my final offer for this asset.');

  const [draftContextAsset, setDraftContextAsset] = useState<any>(null);
  const [lastActivity, setLastActivity] = useState<Record<string, number>>({});
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({}); 
  const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  // --- IMAGE VIEWER MODAL STATE ---
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    const initComms = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      const { data: userSlabs } = await supabase.from('slabs').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (userSlabs) setMySlabs(userSlabs);

      const { data: userMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, created_at, is_read')
        .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

      const activityMap: Record<string, number> = {};
      const unreadMap: Record<string, number> = {};
      const contactIds = new Set<string>();

      if (userMessages) {
        userMessages.forEach(msg => {
          const isMine = msg.sender_id === session.user.id;
          const otherId = isMine ? msg.receiver_id : msg.sender_id;
          const time = new Date(msg.created_at).getTime();
          
          contactIds.add(otherId);

          if (!activityMap[otherId] || time > activityMap[otherId]) {
            activityMap[otherId] = time;
          }

          if (!isMine && !msg.is_read) {
            unreadMap[otherId] = (unreadMap[otherId] || 0) + 1;
          }
        });
      }
      setLastActivity(activityMap);
      setUnreadCounts(unreadMap);

      const chatParam = searchParams.get('chat');
      const assetParam = searchParams.get('asset');
      const attachParam = searchParams.get('attach'); 

      if (chatParam) {
        contactIds.add(chatParam);
      }

      const uniqueContactIds = Array.from(contactIds);
      let activeProfiles: any[] = [];

      if (uniqueContactIds.length > 0) {
        const { data: fetchedProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueContactIds);
          
        if (fetchedProfiles) {
          activeProfiles = fetchedProfiles;
          setAllUsers(activeProfiles);
        }
      } else {
        setAllUsers([]); 
      }

      if (chatParam && activeProfiles.length > 0) {
        const targetUser = activeProfiles.find(p => p.id === chatParam);
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
    if (currentUser && selectedContact && unreadCounts[selectedContact.id] > 0) {
      const markAsRead = async () => {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('sender_id', selectedContact.id)
          .eq('receiver_id', currentUser.id)
          .eq('is_read', false);
          
        setUnreadCounts(prev => ({ ...prev, [selectedContact.id]: 0 }));
      };
      markAsRead();
    }
  }, [currentUser, selectedContact, unreadCounts]);

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
          const isMine = newMsg.sender_id === currentUser.id;
          const otherId = isMine ? newMsg.receiver_id : newMsg.sender_id;
          
          setLastActivity(prev => ({ ...prev, [otherId]: new Date(newMsg.created_at).getTime() }));

          if (!isMine) {
            if (selectedContact && selectedContact.id === newMsg.sender_id) {
               supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
            } else {
               setUnreadCounts(prev => ({ ...prev, [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1 }));
            }
          }

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

  const formatCurrencyLocal = (val: any) => new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(parseFloat(val) || 0);

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

  const publicSlabs = filteredMySlabs.filter(s => s.is_public === true || s.status === 'public');
  const privateSlabs = filteredMySlabs.filter(s => s.is_public !== true && s.status !== 'public');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => { setAttachments(prev => prev.filter((_, i) => i !== index)); };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const safeText = newMessage.trim();
    if ((!safeText && attachments.length === 0 && !draftContextAsset) || !selectedContact || isUploading) return;

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
      text: safeText || (draftContextAsset && attachments.length === 0 ? 'Inquiring about this asset.' : ''), 
      is_offer: false, 
      attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
      is_read: false 
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
    
    setNewMessage(''); setAttachments([]); setDraftContextAsset(null); setIsUploading(false);

    const { data: insertedData, error: insertError } = await supabase.from('messages').insert([newMsgObj]).select().single();
    if (insertError) {
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

  const runVerificationProtocol = (callback: () => void) => {
    setIsVerifying(true); setVerificationStep(1); 
    setTimeout(() => { setVerificationStep(2); 
      setTimeout(() => { setVerificationStep(3); 
        setTimeout(() => { setIsVerifying(false); callback(); }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAssetId || !offerPrice.trim() || !selectedContact) return;

    const targetAsset = mySlabs.find(s => s.id === offerAssetId);
    
    runVerificationProtocol(async () => {
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
          material: targetAsset?.material || 'Private Asset',
          payment_terms: offerPaymentTerms,
          inspection: offerInspection
        },
        is_read: false 
      };

      const displayMsg = { ...newMsgObj, id: tempId, created_at: new Date().toISOString() };
      setMessages(prev => [...prev, displayMsg]);
      setLastActivity(prev => ({ ...prev, [selectedContact.id]: Date.now() }));

      setIsOfferModalOpen(false); 
      setOfferAssetId(''); 
      setOfferPrice(''); 
      setSlabSearchQuery(''); 
      setOfferText('Here is my final offer for this asset.');
      setOfferPaymentTerms('100_escrow');
      setOfferInspection('waived');
      router.replace('/inbox', { scroll: false });

      const { data: insertedData, error: insertError } = await supabase.from('messages').insert([newMsgObj]).select().single();
      if (insertError) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else if (insertedData) {
        setMessages(prev => prev.map(m => m.id === tempId ? insertedData : m));
        await supabase.from('notifications').insert([{
          user_id: selectedContact.id, title: 'OTC Protocol Engaged',
          message: `A new private proposal has been registered for your asset.`, type: 'offer', link: '/inbox'
        }]);
      }
    });
  };

  const handleAcceptOffer = async (msg: any) => {
    if (!currentUser || isAcceptingOffer) return;
    runVerificationProtocol(async () => {
      setIsAcceptingOffer(true);
      try {
        const payload = msg.offer_details;
        const priceClean = payload.price === 'Inquiry' ? 0 : Number(payload.price);
        
        const contractPayload = {
          asset_id: payload.asset_id, 
          buyer_id: currentUser.id, 
          vendor_id: msg.sender_id, 
          price: priceClean, 
          incoterms: payload.incoterm || payload.incoterms || 'FOB',
          payment_terms: payload.payment_terms || '100_escrow',
          inspection: payload.inspection || 'waived',
          custom_material: payload.material,
          status: 'pending'
        };

        const { error: contractError } = await supabase.from('contracts').insert([contractPayload]);
        if (contractError) throw contractError;

        const { error: slabUpdateError } = await supabase.from('slabs').update({ is_available: false }).eq('id', payload.asset_id);
        
        await supabase.from('notifications').insert([{
          user_id: msg.sender_id, title: 'Deal Accepted!',
          message: `The terms for Asset AX-${payload.asset_id.substring(0,6)} have been accepted. Check your Contracts Vault.`,
          type: 'contract', link: '/contracts'
        }]);
        
        router.push('/contracts');
      } catch (error: any) {
        console.error("💥 SUPABASE ERROR LOG 💥:", error);
        alert(`Transaction Failed: ${error.message || error.details || 'Check console for details.'}`);
      } finally {
        setIsAcceptingOffer(false);
      }
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    const { error } = await supabase.from('messages').delete().eq('id', messageId).eq('sender_id', currentUser?.id); 
    if (error) console.error("Failed to delete message:", error);
  };

  const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

  const renderSlabItem = (slab: any) => (
    <div key={slab.id} onClick={() => setOfferAssetId(slab.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${offerAssetId === slab.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-transparent border-transparent hover:bg-[#A6947D]/5'}`}>
      <div className="w-10 h-10 rounded bg-[#01030A] flex-none border border-[#A6947D]/20 overflow-hidden">
        {slab.image_url ? <img src={slab.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-2 text-[#A6947D]/30" />}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-bold uppercase truncate text-[#F8F5EE]">{slab.material}</p>
          <p className="text-[10px] font-mono font-bold text-amber-500">{formatCurrencyLocal(slab.price)}</p>
        </div>
        <p className="text-[8px] font-mono text-[#A6947D]/60 tracking-widest mt-0.5">ID: {slab.id.substring(0,8)}</p>
      </div>
      {offerAssetId === slab.id && <CheckCircle2 size={14} className="text-amber-500 flex-none" />}
    </div>
  );

  return (
    <div className="flex h-full w-full bg-transparent text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* IMAGE VIEWER MODAL */}
      {viewingImage && (
        <div className="fixed inset-0 z-[250] bg-[#01030A]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute top-6 right-6 flex gap-4 z-10">
             <a href={viewingImage} download target="_blank" rel="noopener noreferrer" className="bg-[#A6947D] text-[#020509] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(166,148,125,0.4)] hover:bg-white transition-colors">
               <Download size={16} /> Download
             </a>
             <button onClick={() => setViewingImage(null)} className="bg-white/10 text-white hover:bg-red-500 hover:text-white p-2 rounded-xl transition-colors backdrop-blur-md">
               <X size={24} />
             </button>
          </div>
          <div className="w-full max-w-5xl h-[80vh] relative flex items-center justify-center">
             <img src={viewingImage} alt="Attachment Full View" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-[#A6947D]/20" />
          </div>
        </div>
      )}

      {/* VERIFICATION PROTOCOL UI */}
      {isVerifying && (
        <div className="fixed inset-0 z-[200] bg-[#020509]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/20 rounded-full flex items-center justify-center animate-spin-slow">
              <Shield size={40} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-xl font-serif uppercase tracking-[0.3em] text-[#F8F5EE] mb-4">
            {verificationStep === 1 ? 'Encrypting Transmission' : verificationStep === 2 ? 'synchronizing ledger' : 'Finalizing Settlement'}
          </h2>
          <div className="w-48 h-1 bg-[#01040E] rounded-full overflow-hidden border border-[#A6947D]/10">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(verificationStep / 3) * 100}%` }}></div>
          </div>
          <p className="mt-6 text-[9px] font-mono text-[#A6947D] uppercase tracking-widest animate-pulse">End-to-End Encryption Active</p>
        </div>
      )}

      {/* --- INSTITUTIONAL OTC OFFER MODAL (NEW DYNAMIC) --- */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#020509]/95 backdrop-blur-md animate-in fade-in duration-200 overflow-x-hidden">
          <div className="bg-[#01030A] border border-amber-500/30 rounded-2xl w-full max-w-xl relative shadow-[0_0_50px_rgba(166,148,125,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 md:p-6 border-b border-[#A6947D]/20 bg-[#020509] flex-none">
              <div className="flex items-center gap-3 text-amber-500"><Handshake size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Institutional OTC Protocol</h2></div>
              <button onClick={() => {setIsOfferModalOpen(false); router.replace('/inbox', { scroll: false });}} className="text-[#F8F5EE]/40 hover:text-red-500 transition-colors p-2"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSendOffer} className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-[#01030A] flex-1">
              {!selectedContact && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertOctagon size={16} className="text-amber-500 mt-0.5 flex-none" />
                  <p className="text-[10px] text-amber-500/80 font-mono tracking-widest uppercase">Target Required: Select a counterparty from the directory first.</p>
                </div>
              )}

              {/* 1. ASSET SELECTION */}
              <div className="space-y-3">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><Layers size={12}/> Target Asset</label>
                <div className="bg-[#020509] border border-[#A6947D]/30 rounded-xl max-h-48 overflow-y-auto p-3 space-y-4 custom-scrollbar shadow-inner">
                  {mySlabs.length === 0 ? (
                    <div className="text-center py-6 text-[#A6947D]/50 text-[10px] uppercase font-mono tracking-widest">{t('trading.no_assets')}</div>
                  ) : (
                    <>
                      {privateSlabs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 border-b border-[#A6947D]/10 pb-1.5 px-1 sticky top-0 bg-[#020509] z-10"><Lock size={12} className="text-[#A6947D]" /><span className="text-[9px] uppercase font-bold tracking-widest text-[#A6947D]">Private Vault</span></div>
                          <div className="space-y-1">{privateSlabs.map(renderSlabItem)}</div>
                        </div>
                      )}
                      {publicSlabs.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <div className="flex items-center gap-2 border-b border-[#A6947D]/10 pb-1.5 px-1 sticky top-0 bg-[#020509] z-10"><Globe size={12} className="text-[#A6947D]" /><span className="text-[9px] uppercase font-bold tracking-widest text-[#A6947D]">Public Floor</span></div>
                          <div className="space-y-1">{publicSlabs.map(renderSlabItem)}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 2. VALUATION & INCOTERMS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Incoterm</label>
                  <div className="flex gap-2 bg-[#020509] p-1 rounded-xl border border-[#A6947D]/20">
                    <button type="button" onClick={() => setOfferIncoterm('EXW')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'EXW' ? 'bg-amber-500 text-[#020509]' : 'text-amber-500/60 hover:text-amber-500'}`}>EXW</button>
                    <button type="button" onClick={() => setOfferIncoterm('FOB')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'FOB' ? 'bg-amber-500 text-[#020509]' : 'text-amber-500/60 hover:text-amber-500'}`}>FOB</button>
                    <button type="button" onClick={() => setOfferIncoterm('CIF')} className={`flex-1 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${offerIncoterm === 'CIF' ? 'bg-amber-500 text-[#020509]' : 'text-amber-500/60 hover:text-amber-500'}`}>CIF</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Value (€)</label>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-mono">€</span>
                     <input type="number" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl pl-8 pr-4 py-3 text-sm font-mono text-amber-500 focus:outline-none focus:border-amber-500 transition-colors" placeholder="0.00" required />
                  </div>
                </div>
              </div>

              {/* 3. DYNAMIC ESCROW FUNDING SCHEDULE */}
              <div className="space-y-2 pt-4 border-t border-[#A6947D]/10">
                <label className="text-[9px] font-bold text-[#A6947D] uppercase tracking-widest block">Escrow Funding Schedule</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOfferPaymentTerms('100_escrow')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${offerPaymentTerms === '100_escrow' ? 'bg-amber-500/10 border-amber-500' : 'bg-[#020509] border-[#A6947D]/20 opacity-60'}`}>
                    <Wallet size={14} className={offerPaymentTerms === '100_escrow' ? 'text-amber-500' : 'text-[#A6947D]'} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${offerPaymentTerms === '100_escrow' ? 'text-amber-500' : 'text-[#A6947D]'}`}>100% Escrow</span>
                  </button>
                  <button type="button" onClick={() => setOfferPaymentTerms('30_70_split')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${offerPaymentTerms === '30_70_split' ? 'bg-amber-500/10 border-amber-500' : 'bg-[#020509] border-[#A6947D]/20 opacity-60'}`}>
                    <Landmark size={14} className={offerPaymentTerms === '30_70_split' ? 'text-amber-500' : 'text-[#A6947D]'} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${offerPaymentTerms === '30_70_split' ? 'text-amber-500' : 'text-[#A6947D]'}`}>30 / 70 Split</span>
                  </button>
                </div>
              </div>

              {/* 4. QUALITY ASSURANCE PROTOCOL */}
              <div className="space-y-2 pt-4 border-t border-[#A6947D]/10">
                <label className="text-[9px] font-bold text-[#A6947D] uppercase tracking-widest block">Quality Assurance Protocol</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOfferInspection('waived')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${offerInspection === 'waived' ? 'bg-blue-500/10 border-blue-500' : 'bg-[#020509] border-[#A6947D]/20 opacity-60'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${offerInspection === 'waived' ? 'text-blue-400' : 'text-[#A6947D]'}`}>Inspection Waived</span>
                  </button>
                  <button type="button" onClick={() => setOfferInspection('sgs_required')} className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${offerInspection === 'sgs_required' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-[#020509] border-[#A6947D]/20 opacity-60'}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${offerInspection === 'sgs_required' ? 'text-emerald-400' : 'text-[#A6947D]'}`}>SGS Required</span>
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={!offerAssetId || !offerPrice.trim() || !selectedContact} className="w-full bg-amber-500 hover:bg-white text-[#020509] font-black uppercase tracking-widest py-4 rounded-xl transition-all text-[10px] shadow-lg disabled:opacity-50 mt-4">Transmit Master Agreement</button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN COMMS AREA */}
      <main className="flex-1 flex overflow-hidden w-full relative">
        {loading ? (
          <div className="flex w-full items-center justify-center text-[#A6947D] animate-pulse font-mono text-[10px] uppercase tracking-[0.3em]">{t('common.syncing')}</div>
        ) : (
          <div className="flex flex-1 overflow-hidden w-full relative">
            
            {/* RADAR (CONTACTS) */}
            <div className={`w-full md:w-80 lg:w-96 flex-none border-r border-[#A6947D]/10 flex flex-col bg-[#01030A]/50 backdrop-blur-md z-10 overflow-hidden ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 md:p-6 border-b border-[#A6947D]/10 flex-none">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A6947D] mb-4">Network Directory</h2>
                <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A6947D]/50" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Counterparties..." className="w-full bg-[#020509] border border-[#A6947D]/20 rounded-xl pl-11 pr-4 py-3 text-xs text-[#F8F5EE] focus:border-[#A6947D]/60 focus:outline-none transition-all placeholder:text-[#A6947D]/30 shadow-inner" /></div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-1 custom-scrollbar overflow-x-hidden">
                {filteredContacts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-40 p-6 text-center">
                     <Shield size={32} className="text-[#A6947D] mb-3" />
                     <p className="text-[10px] font-mono text-[#A6947D] uppercase tracking-widest leading-relaxed">No Active Connections.<br/>Directory is empty.</p>
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <button key={contact.id} onClick={() => setSelectedContact(contact)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all border text-left overflow-hidden ${selectedContact?.id === contact.id ? 'bg-[#A6947D]/10 border-[#A6947D]/30' : 'bg-transparent border-transparent hover:bg-[#A6947D]/5'}`}>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="text-xs md:text-sm font-serif uppercase tracking-wider truncate flex items-center gap-2">
                          {contact.company_name || contact.email}
                          {unreadCounts[contact.id] > 0 && (
                            <span className="w-2 h-2 bg-[#FF204E] rounded-full shadow-[0_0_8px_rgba(255,32,78,0.6)] animate-pulse shrink-0"></span>
                          )}
                        </h3>
                        <p className="text-[8px] md:text-[9px] font-mono tracking-widest text-[#A6947D]/40 mt-1 uppercase">Verified Entity</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* CHAT WINDOW */}
            <div className={`flex-1 flex flex-col relative w-full overflow-hidden ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0 overflow-hidden"><Shield size={600} className="text-[#A6947D] shrink-0" /></div>

              {!selectedContact ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10 w-full">
                  <MessageSquare size={40} className="text-[#A6947D]/40 mb-4" strokeWidth={1} />
                  <h3 className="text-xl md:text-2xl font-serif text-[#A6947D] uppercase tracking-[0.2em] font-light">{t('inbox.title')}</h3>
                  <p className="text-[10px] text-[#F8F5EE]/40 uppercase tracking-[0.3em] font-mono mt-2">Select a verified counterparty to open an encrypted channel</p>
                </div>
              ) : (
                <>
                  <div className="p-4 md:p-6 border-b border-[#A6947D]/10 bg-[#01030A]/95 backdrop-blur-md flex items-center justify-between shadow-md z-10 flex-none w-full">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button onClick={() => setSelectedContact(null)} className="md:hidden text-[#A6947D] p-2 bg-[#A6947D]/10 rounded-lg flex-none"><ArrowLeft size={16} /></button>
                      <div className="overflow-hidden">
                        <button onClick={() => router.push(`/network/${selectedContact.id}`)} className="text-left group outline-none">
                          <h3 className="text-sm md:text-lg font-serif tracking-widest text-[#F8F5EE] group-hover:text-[#D4AF37] transition-colors uppercase truncate">
                            {selectedContact.company_name || selectedContact.email}
                          </h3>
                        </button>
                        <div className="flex items-center gap-1.5 mt-0.5 text-emerald-500/80"><Lock size={10} /><span className="text-[7px] md:text-[9px] font-mono tracking-widest uppercase">{t('inbox.encryption_active')}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 flex flex-col custom-scrollbar overflow-x-hidden relative z-10 bg-[#020509] w-full">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300 group`}>
                          {!msg.is_offer ? (
                            <div className={`max-w-[90%] md:max-w-[75%] p-3 md:p-4 rounded-2xl flex flex-col gap-1.5 shadow-lg ${isMine ? 'bg-[#A6947D]/15 border border-[#A6947D]/30 text-[#F8F5EE]' : 'bg-[#01030A] border border-[#A6947D]/15 text-[#F8F5EE]/90'}`}>
                              {msg.text && (
                                <p className="text-xs md:text-sm font-sans leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                              )}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex flex-col gap-2 mt-2">
                                  {msg.attachments.map((file: any, idx: number) => (
                                    file.isImage || file.url?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                      <div key={idx} onClick={() => setViewingImage(file.url)} className="relative group/img cursor-pointer">
                                        <img src={file.url} alt="attachment" className="w-full max-w-[200px] h-auto rounded-lg border border-[#A6947D]/30 object-cover group-hover/img:brightness-75 transition-all" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"><ZoomIn className="text-white drop-shadow-md" size={32} /></div>
                                      </div>
                                    ) : (
                                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-[#020509]/50 rounded-lg border border-[#A6947D]/20 hover:border-[#A6947D]/60 hover:bg-[#A6947D]/5 transition-all w-full max-w-[250px] group/file">
                                        <div className="flex items-center gap-2 overflow-hidden"><FileText size={16} className="shrink-0 text-[#A6947D]" /><span className="text-[10px] truncate text-[#A6947D] group-hover/file:text-[#F8F5EE] transition-colors">{file.name || 'Secure Document'}</span></div>
                                        <Download size={14} className="shrink-0 text-[#A6947D]/50 group-hover/file:text-[#A6947D] transition-colors" />
                                      </a>
                                    )
                                  ))}
                                </div>
                              )}
                              <div className={`flex items-center gap-2 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                {isMine && <button onClick={() => handleDeleteMessage(msg.id)} className="text-[#A6947D]/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Eradicate Message"><Trash2 size={12} /></button>}
                                <p className={`text-[7px] font-mono tracking-widest ${isMine ? 'text-[#A6947D]/60' : 'text-[#A6947D]/40'}`}>{formatTime(msg.created_at)}</p>
                              </div>
                            </div>
                          ) : (
                            <div className={`w-[280px] sm:w-[320px] p-4 md:p-5 rounded-2xl border shadow-2xl bg-[#01030A] ${isMine ? 'border-[#A6947D]/60' : 'border-[#A6947D]/20'}`}>
                                <div className="flex items-center gap-3 mb-3 md:mb-4 border-b border-[#A6947D]/10 pb-3"><Handshake size={16} className="text-amber-500" /><div><p className="text-[8px] text-[#A6947D] uppercase font-bold tracking-widest">Protocol Attached</p><p className="text-[10px] text-[#F8F5EE] uppercase truncate">{msg.offer_details?.material}</p></div></div>
                                
                                {/* --- NEW DYNAMIC OFFER DETAILS --- */}
                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between items-center bg-[#020509] p-3 rounded-lg border border-[#A6947D]/10"><span className="text-[8px] text-[#A6947D]/60 uppercase font-bold">Terms</span><span className="text-[9px] font-bold text-amber-500">{msg.offer_details?.incoterm || msg.offer_details?.incoterms}</span></div>
                                  <div className="flex justify-between items-center bg-[#020509] p-3 rounded-lg border border-[#A6947D]/10">
                                    <span className="text-[8px] text-[#A6947D]/60 uppercase font-bold">Escrow</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${msg.offer_details?.payment_terms === '30_70_split' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      {msg.offer_details?.payment_terms === '30_70_split' ? '30/70 Split' : '100% Locked'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center bg-[#020509] p-3 rounded-lg border border-[#A6947D]/10">
                                    <span className="text-[8px] text-[#A6947D]/60 uppercase font-bold">QA Status</span>
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${msg.offer_details?.inspection === 'waived' ? 'text-blue-400' : 'text-emerald-400'}`}>
                                      {msg.offer_details?.inspection === 'waived' ? 'Waived' : 'SGS Required'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center bg-[#A6947D]/5 p-3 rounded-lg border border-[#A6947D]/20"><span className="text-[8px] text-[#A6947D]/60 uppercase font-bold">Value</span><span className="text-[11px] font-mono text-[#F8F5EE]">{typeof msg.offer_details.price === 'number' ? formatCurrencyLocal(msg.offer_details.price) : `€${msg.offer_details.price}`}</span></div>
                                </div>

                                {!isMine && msg.offer_details.price !== 'Inquiry' && (
                                  <button onClick={() => handleAcceptOffer(msg)} disabled={isAcceptingOffer} className="w-full bg-emerald-600 text-[#020509] font-bold uppercase tracking-widest py-3 rounded-xl text-[9px] shadow-lg disabled:opacity-50">Accept & Execute Contract</button>
                                )}
                                
                                <div className={`flex items-center gap-2 mt-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  {isMine && <button onClick={() => handleDeleteMessage(msg.id)} className="text-[#A6947D]/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100" title="Revoke Offer"><Trash2 size={12} /></button>}
                                  <p className={`text-[7px] font-mono tracking-widest ${isMine ? 'text-[#A6947D]/60' : 'text-[#A6947D]/40'}`}>{formatTime(msg.created_at)}</p>
                                </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-2 md:p-4 border-t border-[#A6947D]/10 bg-[#01030A] relative z-20 w-full flex-none">
                    {attachments.length > 0 && (
                      <div className="flex items-center gap-2 mb-2 max-w-4xl mx-auto w-full overflow-x-auto custom-scrollbar pb-1">
                        {attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-[#A6947D]/20 text-[#A6947D] px-2 py-1 rounded-md border border-[#A6947D]/40 text-[9px] whitespace-nowrap">
                            <Paperclip size={10} />
                            <span className="max-w-[100px] truncate">{file.name}</span>
                            <button onClick={() => removeAttachment(idx)} className="ml-1 hover:text-red-400"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    {draftContextAsset && (
                      <div className="bg-[#A6947D]/10 border border-[#A6947D]/20 rounded-xl p-2 flex items-center justify-between mb-2 max-w-4xl mx-auto w-full">
                        <div className="flex items-center gap-2 overflow-hidden px-2"><Package size={14} className="text-[#A6947D] shrink-0"/><p className="text-[9px] text-[#F8F5EE] truncate uppercase tracking-widest">{draftContextAsset.material}</p></div>
                        <button onClick={() => setDraftContextAsset(null)} className="p-1 text-[#A6947D] shrink-0"><X size={14}/></button>
                      </div>
                    )}
                    
                    <form onSubmit={handleSendMessage} className="flex items-center bg-[#020509] border border-[#A6947D]/30 rounded-2xl p-1 max-w-4xl mx-auto w-full shadow-inner">
                      <input type="file" multiple hidden ref={fileInputRef} onChange={handleFileSelect} />
                      <div className="flex items-center gap-1 shrink-0 pl-0.5">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl text-[#A6947D]/60 hover:bg-[#A6947D]/10 hover:text-[#A6947D] transition-colors"><Paperclip size={18} /></button>
                        <button type="button" onClick={() => setIsOfferModalOpen(true)} className="h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-sm"><Gavel size={18} /></button>
                      </div>
                      <textarea 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        placeholder="Transmission..." 
                        className="flex-1 bg-transparent px-2 py-2.5 md:px-3 md:py-3 text-xs md:text-sm text-[#F8F5EE] outline-none resize-none max-h-[80px] min-w-0" 
                        rows={1} 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter' && !e.shiftKey) { 
                            e.preventDefault(); 
                            if (!newMessage.trim() && attachments.length === 0 && !draftContextAsset) return;
                            handleSendMessage(); 
                          } 
                        }} 
                      />
                      <div className="pr-0.5 shrink-0">
                        <button type="submit" disabled={(!newMessage.trim() && attachments.length === 0 && !draftContextAsset) || isUploading} className="h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl bg-[#A6947D] text-[#020509] disabled:opacity-30 shadow-md"><Send size={16} className="ml-0.5" /></button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SecureComms() {
  return (
    <Suspense fallback={<div className="flex h-[100dvh] w-full bg-[#020509] items-center justify-center text-[#A6947D] text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Establishing Secure Connection...</div>}>
      <SecureCommsContent />
    </Suspense>
  );
}