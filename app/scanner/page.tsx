'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, UploadCloud, X, Loader2, CheckCircle2, 
  BarChart3, Crosshair, Globe, MessageSquare, LogOut, Users, Camera, ImagePlus, User,
  ShoppingCart, Lock, ShieldCheck, FileText, Layers, Tag
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function AssetScanner() {
  const router = useRouter();
  
  const { t, language, setLanguage } = useLanguage(); 
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [origin, setOrigin] = useState('');
  const [incoterm, setIncoterm] = useState('EXW');
  const [thickness, setThickness] = useState('20');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState(''); 
  
  const [visibility, setVisibility] = useState<'public' | 'private'>('public'); 
  const [pricingModel, setPricingModel] = useState<'PUBLIC' | 'ROQ'>('PUBLIC'); 
  
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 4) {
        alert(language === 'el' ? 'Μπορείτε να ανεβάσετε μέχρι 4 φωτογραφίες.' : 'You can upload up to 4 photos.');
        return;
      }
      const newImages = [...images, ...selectedFiles];
      setImages(newImages);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
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
        material,
        price,
        origin,
        incoterm,
        thickness,
        quantity,
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
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#000000] text-gray-200 overflow-x-hidden font-sans selection:bg-[#A6947D]/30 relative antialiased">
      
      {/* SIDEBAR - DESKTOP ONLY */}
      <aside className="w-[280px] flex-none bg-[#030303] border-r border-gray-900 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-5 pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-gray-900 mb-6">
          <div className="w-10 h-10 border border-[#A6947D]/50 rounded-sm flex items-center justify-center relative mb-5 bg-[#000000] shadow-[0_0_15px_rgba(166,148,125,0.1)]">
            <Crosshair size={18} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-xl font-serif uppercase text-white tracking-[0.3em] font-light leading-none mb-2">AXON</h1>
          <p className="text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        {/* INLINE LANGUAGE SWITCHER (MATCHING OTHER PAGES) */}
        <div className="px-8 mb-6 relative z-10">
          <div className="flex items-center justify-between bg-[#000000] border border-gray-800 p-1 rounded-sm shadow-inner">
            <button onClick={() => setLanguage('en')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'en' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EN</button>
            <button onClick={() => setLanguage('el')} className={`flex-1 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-all ${language === 'el' ? 'bg-[#A6947D] text-black' : 'text-gray-500 hover:text-white'}`}>EL</button>
          </div>
        </div>

        <nav className="flex-1 px-5 space-y-1.5 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-4 px-4 py-3.5 bg-[#050505] text-[#A6947D] rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border border-gray-800 shadow-inner"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-4 px-4 py-3.5 text-gray-500 hover:text-white hover:bg-gray-900 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-gray-900 relative z-10"><button onClick={handleLogout} className="text-red-500/80 hover:text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-3 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-[#000000] pb-[80px] md:pb-0 custom-scrollbar w-full">
        
        {/* BACKGROUND SUBTLE GRID & ICON */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-30 z-0"></div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0 overflow-hidden">
          <Crosshair size={600} className="text-[#A6947D] shrink-0" strokeWidth={1} />
        </div>
        
        <div className="p-5 md:p-12 max-w-4xl mx-auto relative z-10 w-full overflow-x-hidden">
          
          <header className="mb-10 animate-in fade-in duration-500">
            <h2 className="text-2xl md:text-3xl font-serif text-white uppercase tracking-[0.2em] font-light">{t('scanner.title')}</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="h-px w-8 bg-[#A6947D]/50"></span>
              <p className="text-[9px] text-[#A6947D] uppercase tracking-[0.3em] font-mono">{t('scanner.digitize')}</p>
            </div>
          </header>

          {success ? (
            <div className="bg-[#030303] border border-emerald-900/50 rounded-sm p-12 md:p-16 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(16,185,129,0.05)] w-full animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-full border border-emerald-500/30 flex items-center justify-center mb-8 bg-emerald-950/20 relative">
                <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-50"></div>
                <CheckCircle2 size={36} className="text-emerald-500" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-white mb-3">{t('scanner.success_title')}</h3>
              <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.3em]">{t('scanner.success_subtitle')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#030303] border border-gray-900 rounded-sm p-6 md:p-10 shadow-2xl animate-in fade-in duration-500 delay-100 w-full relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#A6947D]/5 rounded-full blur-[60px] pointer-events-none shrink-0"></div>

              {/* IMAGE UPLOAD SECTION */}
              <div className="mb-10 w-full relative z-10">
                <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-4 flex items-center gap-2"><Camera size={14} className="text-[#A6947D]"/> {t('scanner.visual_data')} (MAX 4)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="aspect-square rounded-sm bg-[#050505] border border-gray-800 relative overflow-hidden group shadow-inner">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-105" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600"><X size={12}/></button>
                      {idx === 0 && <span className="absolute bottom-2 left-2 bg-black/90 text-[#A6947D] text-[7px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded-sm border border-[#A6947D]/30 backdrop-blur-md">Cover</span>}
                    </div>
                  ))}
                  {previews.length < 4 && (
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-sm bg-[#020202] border border-gray-800 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-[#050505] hover:border-[#A6947D]/50 transition-all group">
                      <ImagePlus size={24} strokeWidth={1} className="text-gray-700 group-hover:text-[#A6947D] mb-3 transition-colors" />
                      <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-gray-600 group-hover:text-[#A6947D]">{t('scanner.add_photo')}</span>
                    </div>
                  )}
                </div>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
              </div>

              {/* STRATEGY & PLACEMENT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 w-full relative z-10">
                <div className="bg-[#050505] p-5 rounded-sm border border-gray-900 shadow-inner">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-4 flex items-center gap-2"><ShieldCheck size={14} className="text-[#A6947D]"/> Placement</label>
                  <div className="flex bg-[#020202] border border-gray-800 rounded-sm p-1">
                    <button type="button" onClick={() => setVisibility('public')} className={`flex-1 py-3 rounded-sm text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${visibility === 'public' ? 'bg-emerald-950/30 text-emerald-500 border border-emerald-900/50 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Public Floor</button>
                    <button type="button" onClick={() => setVisibility('private')} className={`flex-1 py-3 rounded-sm text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${visibility === 'private' ? 'bg-[#111] text-[#A6947D] border border-gray-700 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Private Vault</button>
                  </div>
                </div>

                <div className="bg-[#050505] p-5 rounded-sm border border-gray-900 shadow-inner">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] mb-4 flex items-center gap-2"><Tag size={14} className="text-[#A6947D]"/> Strategy</label>
                  <div className="flex bg-[#020202] border border-gray-800 rounded-sm p-1">
                    <button type="button" onClick={() => setPricingModel('PUBLIC')} className={`flex-1 py-3 rounded-sm text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${pricingModel === 'PUBLIC' ? 'bg-white/10 text-white border border-gray-700 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Fixed Value</button>
                    <button type="button" onClick={() => setPricingModel('ROQ')} className={`flex-1 py-3 rounded-sm text-[9px] font-mono uppercase tracking-[0.2em] transition-all ${pricingModel === 'ROQ' ? 'bg-amber-950/30 text-amber-500 border border-amber-900/50 shadow-sm' : 'text-gray-600 hover:text-gray-400'}`}>Req. Quote</button>
                  </div>
                </div>
              </div>

              {/* DATA ENTRY GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full relative z-10">
                {/* Material */}
                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em]">{t('scanner.material')}</label>
                  <input type="text" required value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Sivec Premium" className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner placeholder:text-gray-700" />
                </div>
                
                {/* Price / Valuation */}
                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] flex justify-between items-center">
                    <span>{pricingModel === 'ROQ' ? 'Internal Base (€)' : t('scanner.valuation')}</span>
                    {pricingModel === 'ROQ' && <Lock size={10} className="text-amber-500" />}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono">€</span>
                    <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className={`w-full h-14 bg-[#050505] border rounded-sm pl-10 pr-4 font-mono text-sm text-white focus:outline-none transition-all shadow-inner placeholder:text-gray-700 ${pricingModel === 'ROQ' ? 'border-amber-900/30 focus:border-amber-500/50 focus:bg-amber-950/10' : 'border-gray-800 focus:border-[#A6947D]/50 focus:bg-[#080808]'}`} />
                  </div>
                </div>
                
                {/* Origin */}
                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em]">{t('scanner.origin')}</label>
                  <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Drama, Greece" className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner placeholder:text-gray-700" />
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em]">{t('scanner.location')}</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Current Storage" className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all uppercase shadow-inner placeholder:text-gray-700" />
                </div>

                {/* Specs (Thickness & Quantity) */}
                <div className="grid grid-cols-2 gap-5 w-full">
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em]">{t('scanner.thickness')} (CM)</label>
                    <input type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="20" className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all shadow-inner placeholder:text-gray-700" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em]">{t('scanner.quantity')} (M²)</label>
                    <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-4 font-mono text-sm text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] transition-all shadow-inner placeholder:text-gray-700" />
                  </div>
                </div>

                {/* Incoterm */}
                <div className="space-y-3 w-full">
                  <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em]">{t('scanner.incoterm')}</label>
                  <div className="flex gap-3 h-14">
                    {['EXW', 'FOB', 'CIF'].map(term => (
                      <button type="button" key={term} onClick={() => setIncoterm(term)} className={`flex-1 rounded-sm text-[10px] font-mono uppercase tracking-[0.2em] border transition-all ${incoterm === term ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-[#050505] text-gray-500 border-gray-800 hover:border-gray-600'}`}>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3 mb-10 w-full relative z-10">
                <label className="text-[9px] text-gray-500 uppercase font-mono tracking-[0.3em] flex items-center gap-2"><FileText size={14} className="text-[#A6947D]"/> Asset Dossier</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="INPUT TECHNICAL SPECIFICATIONS OR QUALITY NOTES..." 
                  className="w-full bg-[#050505] border border-gray-800 rounded-sm px-5 py-4 text-xs font-mono text-white focus:outline-none focus:border-[#A6947D]/50 focus:bg-[#080808] resize-none shadow-inner custom-scrollbar uppercase tracking-widest leading-relaxed placeholder:text-gray-700" 
                  rows={4} 
                />
              </div>

              <div className="pt-8 border-t border-gray-900 w-full relative z-10">
                <button type="submit" disabled={loading || images.length === 0} className="w-full h-16 bg-white text-black font-extrabold uppercase tracking-[0.3em] rounded-sm hover:bg-gray-200 transition-all text-[10px] md:text-xs flex items-center justify-center gap-3 disabled:opacity-20 disabled:hover:bg-white shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> SYNCHRONIZING...</> : <><UploadCloud size={16} strokeWidth={2.5} /> {t('scanner.publish_btn')}</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* MOBILE NAV - PRECISION INSTRUMENT STYLE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#020202]/95 backdrop-blur-2xl border-t border-gray-900 px-2 py-2 flex justify-between items-center z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-[64px]">
        <Link href="/dashboard" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><BarChart3 size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/scanner" className="text-[#A6947D] flex flex-col items-center gap-1 flex-1 transition-colors"><Crosshair size={20} strokeWidth={2} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.scanner').substring(0,4)}</span></Link>
        <Link href="/trading" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 flex-1 transition-colors"><Globe size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><MessageSquare size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.comms').substring(0,5)}</span></Link>
        <Link href="/me" className="text-gray-600 hover:text-white flex flex-col items-center gap-1 relative flex-1 transition-colors"><User size={20} strokeWidth={1.5} /><span className="text-[7px] font-mono uppercase tracking-[0.2em]">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}