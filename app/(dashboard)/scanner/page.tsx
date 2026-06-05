'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Shield, UploadCloud, X, Loader2, CheckCircle2, 
  BarChart3, Crosshair, Globe, MessageSquare, LogOut, Users, Camera, ImagePlus, User,
  ShoppingCart, Lock, ShieldCheck, FileText, Layers, Tag, Menu, FileSignature, Gavel,
  Layers3, UserCircle, Hexagon
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AssetScanner() {
  const router = useRouter();
  
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false); // Νέο state για το UI κατά τη μετατροπή HEIC
  const [success, setSuccess] = useState(false);
  
  // -- ASSET CLASSIFICATION STATE --
  const [assetType, setAssetType] = useState<'SLAB' | 'BLOCK' | 'GRANITE'>('SLAB');
  
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [origin, setOrigin] = useState('');
  const [incoterm, setIncoterm] = useState('EXW');
  
  // -- DYNAMIC FIELDS --
  const [thickness, setThickness] = useState('20');
  const [quantity, setQuantity] = useState('');
  
  // Block specifics
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(''); 
  
  const [visibility, setVisibility] = useState<'public' | 'private'>('public'); 
  const [pricingModel, setPricingModel] = useState<'PUBLIC' | 'ROQ'>('PUBLIC'); 
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- THE NEW INTERCEPTOR: HEIC TO JPG CONVERTER ---
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setConverting(true); // Ανάβουμε το loading για να μην πατήσει ο χρήστης κάτι
      try {
        const selectedFiles = Array.from(e.target.files);
        if (images.length + selectedFiles.length > 4) {
          alert(language === 'el' ? 'Μπορείτε να ανεβάσετε μέχρι 4 φωτογραφίες.' : 'You can upload up to 4 photos.');
          setConverting(false);
          return;
        }

        const processedFiles: File[] = [];
        const newPreviews: string[] = [];

        for (let file of selectedFiles) {
          // Έλεγχος αν το αρχείο είναι της Apple (HEIC)
          if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
            // Το φορτώνουμε δυναμικά για να μην "σπάσει" το Next.js
            const heic2any = (await import('heic2any')).default;
            
            const convertedBlob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.8
            });
            
            // Το heic2any μπορεί να επιστρέψει πίνακα (array), παίρνουμε το πρώτο
            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            
            // Δημιουργούμε νέο καθαρό αρχείο JPG
            const newFileName = file.name.replace(/\.heic$/i, '.jpg');
            file = new File([finalBlob], newFileName, { type: 'image/jpeg' });
          }
          
          processedFiles.push(file);
          newPreviews.push(URL.createObjectURL(file));
        }

        setImages(prev => [...prev, ...processedFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);
      } catch (err) {
        console.error("Error converting image:", err);
        alert(language === 'el' ? 'Σφάλμα κατά την επεξεργασία της φωτογραφίας. Δοκιμάστε άλλη.' : 'Error processing image format.');
      } finally {
        setConverting(false);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0 || !material || !price) {
      alert(language === 'el' ? "Απαιτείται φωτογραφία, υλικό και τιμή." : "Photo, material and price are required.");
      return;
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized access.");

      let uploadedUrls: string[] = [];
      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `slabs/${session.user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('axon-media').upload(filePath, image);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('axon-media').getPublicUrl(filePath);
        uploadedUrls.push(publicUrlData.publicUrl);
      }

      const { error: dbError } = await supabase.from('slabs').insert([{
        user_id: session.user.id,
        asset_type: assetType, 
        material,
        price: price || null,
        origin,
        incoterm,
        thickness: assetType !== 'BLOCK' ? (thickness || null) : null,
        quantity: assetType !== 'BLOCK' ? (quantity || null) : null,
        length: assetType === 'BLOCK' ? (length || null) : null,
        width: assetType === 'BLOCK' ? (width || null) : null,
        height: assetType === 'BLOCK' ? (height || null) : null,
        weight: assetType === 'BLOCK' ? (weight || null) : null,
        location,
        description, 
        image_url: uploadedUrls[0],
        images: JSON.stringify(uploadedUrls),
        visibility: visibility,
        is_vault: visibility === 'private',
        pricing_model: pricingModel
      }]);

      if (dbError) throw dbError;
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
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
            <p className="text-[10px] text-[#A6947D]/60 uppercase font-mono tracking-widest mb-4">ΒΑΣΙΚΕΣ ΕΝΟΤΗΤΕΣ</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#020509] border border-[#A6947D]/20 p-5 rounded-xl flex flex-col items-center justify-center gap-3 active:bg-[#A6947D]/10 transition-colors shadow-inner">
                <Layers3 size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Χαρτοφυλακιο &<br/>Συμφωνιες</span>
              </Link>
              <Link href="/scanner" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#A6947D]/10 border border-[#A6947D]/40 p-5 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors shadow-inner">
                <Crosshair size={24} className="text-[#A6947D]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#F8F5EE] text-center">Σαρωτης<br/>Υλικων</span>
              </Link>
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

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full z-10">
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Crosshair size={800} className="text-[#A6947D] shrink-0" strokeWidth={1} />
        </div>
        
        <div className="p-4 md:p-12 max-w-4xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-8 md:mb-10 animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light">{t('scanner.title')}</h2>
            <div className="flex items-center gap-2 md:gap-3 mt-2">
              <span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span>
              <p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">{t('scanner.digitize')}</p>
            </div>
          </header>

          {success ? (
            <div className="bg-[#01030A] border border-emerald-500/30 rounded-2xl p-12 md:p-16 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(16,185,129,0.05)] w-full animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full border border-emerald-500/30 flex items-center justify-center mb-8 bg-emerald-500/10 relative">
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-50"></div>
                <CheckCircle2 size={36} className="text-emerald-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE] mb-3">{t('scanner.success_title')}</h3>
              <p className="text-[#A6947D]/80 text-[10px] font-mono uppercase tracking-[0.3em]">{t('scanner.success_subtitle')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-5 md:p-10 shadow-2xl animate-in fade-in duration-500 delay-100 w-full relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#A6947D]/5 rounded-full blur-[80px] pointer-events-none shrink-0"></div>

              <div className="mb-10 w-full relative z-10">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-mono tracking-widest mb-4 flex items-center gap-2"><Camera size={14} className="text-[#A6947D]"/> {t('scanner.visual_data')} (MAX 4)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="aspect-square rounded-xl bg-[#020509] border border-[#A6947D]/20 relative overflow-hidden group shadow-inner">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-[#01030A]/80 text-[#F8F5EE] p-2 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-500/80 backdrop-blur-sm"><X size={12}/></button>
                      {idx === 0 && <span className="absolute bottom-2 left-2 bg-[#01030A]/90 text-[#A6947D] text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border border-[#A6947D]/30 backdrop-blur-md">Cover</span>}
                    </div>
                  ))}
                  {previews.length < 4 && (
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl bg-[#01030A] border border-[#A6947D]/30 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-[#020509] hover:border-[#A6947D]/60 transition-all group relative overflow-hidden">
                      {converting ? (
                        <div className="flex flex-col items-center text-[#A6947D]">
                          <Loader2 size={24} className="animate-spin mb-2" />
                          <span className="text-[7px] font-mono uppercase tracking-widest">CONVERTING...</span>
                        </div>
                      ) : (
                        <>
                          <ImagePlus size={24} strokeWidth={1} className="text-[#A6947D]/40 group-hover:text-[#A6947D] mb-3 transition-colors" />
                          <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#A6947D]/60 group-hover:text-[#A6947D]">{t('scanner.add_photo')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {/* Το input disabled όσο γίνεται μετατροπή για να μην πατήσει πολλά μαζί */}
                <input type="file" multiple accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handleImageSelect} disabled={converting} />
              </div>

              {/* -- THE METAMORPHOSIS SWITCH -- */}
              <div className="bg-[#01030A] p-5 rounded-2xl border border-[#A6947D]/20 shadow-inner mb-6 relative z-10">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest mb-4 flex items-center gap-2"><Layers size={14} className="text-[#A6947D]"/> Asset Classification</label>
                <div className="flex bg-[#020509] border border-[#A6947D]/10 rounded-xl p-1 flex-col sm:flex-row">
                  <button type="button" onClick={() => setAssetType('SLAB')} className={`flex-1 py-3 px-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${assetType === 'SLAB' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Marble Slab</button>
                  <button type="button" onClick={() => setAssetType('BLOCK')} className={`flex-1 py-3 px-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${assetType === 'BLOCK' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Raw Block</button>
                  <button type="button" onClick={() => setAssetType('GRANITE')} className={`flex-1 py-3 px-2 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${assetType === 'GRANITE' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Granite</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 w-full relative z-10">
                <div className="bg-[#01030A] p-5 rounded-2xl border border-[#A6947D]/20 shadow-inner">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-[#A6947D]"/> Placement</label>
                  <div className="flex bg-[#020509] border border-[#A6947D]/10 rounded-xl p-1">
                    <button type="button" onClick={() => setVisibility('public')} className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${visibility === 'public' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Public Floor</button>
                    <button type="button" onClick={() => setVisibility('private')} className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${visibility === 'private' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Private Vault</button>
                  </div>
                </div>

                <div className="bg-[#01030A] p-5 rounded-2xl border border-[#A6947D]/20 shadow-inner">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest mb-4 flex items-center gap-2"><Tag size={14} className="text-[#A6947D]"/> Strategy</label>
                  <div className="flex bg-[#020509] border border-[#A6947D]/10 rounded-xl p-1">
                    <button type="button" onClick={() => setPricingModel('PUBLIC')} className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${pricingModel === 'PUBLIC' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Fixed Value</button>
                    <button type="button" onClick={() => setPricingModel('ROQ')} className={`flex-1 py-3 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all ${pricingModel === 'ROQ' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm' : 'text-[#F8F5EE]/40 hover:text-[#F8F5EE] border border-transparent'}`}>Req. Quote</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full relative z-10">
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">{t('scanner.material')}</label>
                  <input type="text" required value={material} onChange={(e) => setMaterial(e.target.value)} placeholder={assetType === 'BLOCK' ? "e.g. Sivec Raw Block" : "e.g. Sivec Premium"} className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-sans text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all uppercase placeholder:text-[#F8F5EE]/20 shadow-inner" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex justify-between items-center">
                    <span>{pricingModel === 'ROQ' ? 'Internal Base (€)' : t('scanner.valuation')}</span>
                    {pricingModel === 'ROQ' && <Lock size={10} className="text-amber-500" />}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6947D]/60 font-mono">€</span>
                    <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={`w-full bg-[#020509] border rounded-xl pl-10 pr-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none transition-all placeholder:text-[#F8F5EE]/20 shadow-inner ${pricingModel === 'ROQ' ? 'border-amber-500/30 focus:border-amber-500/50' : 'border-[#A6947D]/30 focus:border-[#A6947D]'}`} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">{t('scanner.origin')}</label>
                  <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Drama, Greece" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-sans text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all uppercase placeholder:text-[#F8F5EE]/20 shadow-inner" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">{t('scanner.location')}</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Current Storage" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-sans text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all uppercase placeholder:text-[#F8F5EE]/20 shadow-inner" />
                </div>

                {/* -- DYNAMIC RENDERING: BLOCK vs SLAB/GRANITE -- */}
                {assetType === 'BLOCK' ? (
                  <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Length (CM)</label>
                      <input type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="280" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Width (CM)</label>
                      <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="150" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Height (CM)</label>
                      <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="130" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Weight (TONS)</label>
                      <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="24.5" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 shadow-inner" />
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2 grid grid-cols-2 gap-4 w-full">
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">{t('scanner.thickness')} (CM)</label>
                      <input type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="20" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 shadow-inner" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">{t('scanner.quantity')} (M²)</label>
                      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3.5 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all placeholder:text-[#F8F5EE]/20 shadow-inner" />
                    </div>
                  </div>
                )}

                <div className="space-y-2 w-full md:col-span-2">
                  <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">{t('scanner.incoterm')}</label>
                  <div className="flex gap-2">
                    {['EXW', 'FOB', 'CIF'].map(term => (
                      <button type="button" key={term} onClick={() => setIncoterm(term)} className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${incoterm === term ? 'bg-[#A6947D] text-[#020509] border-[#A6947D] shadow-[0_0_15px_rgba(166,148,125,0.2)]' : 'bg-[#020509] text-[#F8F5EE]/40 border-[#A6947D]/30 hover:border-[#A6947D]/60 shadow-inner'}`}>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-8 w-full relative z-10">
                <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest flex items-center gap-1.5"><FileText size={14} className="text-[#A6947D]"/> Asset Dossier</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="INPUT TECHNICAL SPECIFICATIONS OR QUALITY NOTES..." 
                  className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-5 py-4 text-xs font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] resize-none shadow-inner custom-scrollbar uppercase tracking-widest leading-relaxed placeholder:text-[#F8F5EE]/20" 
                  rows={4} 
                />
              </div>

              <div className="pt-6 border-t border-[#A6947D]/10 w-full relative z-10">
                <button type="submit" disabled={loading || converting || images.length === 0} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(166,148,125,0.2)] disabled:opacity-50">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> SYNCHRONIZING...</> : <><UploadCloud size={16} strokeWidth={2.5} /> {t('scanner.publish_btn')}</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/95 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)] w-full">
        <Link href="/dashboard" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Layers3 size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Port</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Floor</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 hover:text-[#A6947D] p-2 flex flex-col items-center gap-1 relative flex-1 transition-colors">
          <MessageSquare size={20} />
          <span className="text-[8px] uppercase font-bold tracking-widest">Comms</span>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} className="text-[#A6947D] p-2 flex flex-col items-center gap-1 flex-1 transition-colors"><Menu size={20} /><span className="text-[8px] uppercase font-bold tracking-widest">Menu</span></button>
      </nav>
    </div>
  );
}