'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, UploadCloud, X, Loader2, CheckCircle2, 
  BarChart3, Crosshair, Globe, MessageSquare, LogOut, Users, Camera, ImagePlus, User,
  ShoppingCart, Lock, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

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
  const [description, setDescription] = useState(''); // ΝΕΟ: ΠΕΡΙΓΡΑΦΗ
  
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
      alert(language === 'el' ? "Απαιτείται τουλάχιστον μία φωτογραφία, υλικό και τιμή." : "Photo, material and price are required.");
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
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]"><Crosshair size={20} className="text-[#A6947D]"/></div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
          <Link href="/me" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><User size={16} /> {t('menu.profile')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2"><LogOut size={16} /> {t('common.disconnect')}</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0"><Shield size={600} className="text-[#A6947D]" /></div>
        
        <div className="p-4 md:p-12 max-w-4xl mx-auto relative z-10">
          <header className="mb-6 md:mb-10 animate-in fade-in duration-700">
            <h2 className="text-2xl md:text-3xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light">{t('scanner.title')}</h2>
            <div className="flex items-center gap-2 md:gap-3 mt-2"><span className="h-px w-6 md:w-8 bg-[#A6947D]/30"></span><p className="text-[8px] md:text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">{t('scanner.digitize')}</p></div>
          </header>

          {success ? (
            <div className="bg-[#01030A] border border-emerald-500/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-[0_0_50px_rgba(16,185,129,0.1)] animate-in zoom-in">
              <div className="w-20 h-20 rounded-full border border-emerald-500/30 flex items-center justify-center mb-6 bg-emerald-500/10 relative"><div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping"></div><CheckCircle2 size={40} className="text-emerald-500" /></div>
              <h3 className="text-2xl font-serif uppercase tracking-widest text-[#F8F5EE] mb-2">{t('scanner.success_title')}</h3>
              <p className="text-[#A6947D] text-[10px] font-mono uppercase tracking-widest">{t('scanner.success_subtitle')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-6 md:p-10 shadow-xl animate-in fade-in duration-700 delay-100">
              
              <div className="mb-8">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest mb-3 flex items-center gap-2"><Camera size={12}/> {t('scanner.visual_data')} (Max 4)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="aspect-square rounded-xl bg-[#020509] border border-[#A6947D]/30 relative overflow-hidden group">
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                      {idx === 0 && <span className="absolute bottom-2 left-2 bg-[#020509]/90 text-[#A6947D] text-[7px] font-bold uppercase px-2 py-1 rounded border border-[#A6947D]/30 backdrop-blur-sm">Cover</span>}
                    </div>
                  ))}
                  {previews.length < 4 && (
                    <div onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl bg-[#020509]/50 border border-[#A6947D]/30 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-[#A6947D]/5 hover:border-[#A6947D] transition-all group">
                      <ImagePlus size={24} className="text-[#A6947D]/40 group-hover:text-[#A6947D] mb-2 transition-colors" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#A6947D]/60 group-hover:text-[#A6947D]">{t('scanner.add_photo')}</span>
                    </div>
                  )}
                </div>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#020509] p-4 rounded-xl border border-[#A6947D]/20 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2"><ShieldCheck size={12}/> Asset Placement</label>
                  </div>
                  <div className="flex bg-[#01030A] border border-[#A6947D]/30 rounded-lg p-1">
                    <button type="button" onClick={() => setVisibility('public')} className={`flex-1 py-2.5 rounded-md text-[9px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${visibility === 'public' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>
                      <Globe size={14}/> Public Floor
                    </button>
                    <button type="button" onClick={() => setVisibility('private')} className={`flex-1 py-2.5 rounded-md text-[9px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${visibility === 'private' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>
                      <Lock size={14}/> Private Vault
                    </button>
                  </div>
                </div>

                <div className="bg-[#020509] p-4 rounded-xl border border-[#A6947D]/20 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex items-center gap-2">Market Strategy</label>
                  </div>
                  <div className="flex bg-[#01030A] border border-[#A6947D]/30 rounded-lg p-1">
                    <button type="button" onClick={() => setPricingModel('PUBLIC')} className={`flex-1 py-2.5 rounded-md text-[9px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${pricingModel === 'PUBLIC' ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/20 shadow-sm' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>
                      <ShoppingCart size={14}/> Fixed Price
                    </button>
                    <button type="button" onClick={() => setPricingModel('ROQ')} className={`flex-1 py-2.5 rounded-md text-[9px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${pricingModel === 'ROQ' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm' : 'text-[#A6947D]/40 hover:text-[#A6947D]'}`}>
                      <Lock size={14}/> Request Quote
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('scanner.material')}</label><input type="text" required value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Volakas White" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]" /></div>
                
                <div className="space-y-2">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest flex justify-between items-center">
                    <span>{pricingModel === 'ROQ' ? 'Internal Valuation (€)' : t('scanner.valuation')}</span>
                    {pricingModel === 'ROQ' && <Lock size={8} className="text-amber-500" />}
                  </label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder={pricingModel === 'ROQ' ? "Target price (hidden)" : "e.g. 25000"} className={`w-full bg-[#020509] border rounded-xl px-4 py-3 text-sm font-mono text-[#F8F5EE] focus:outline-none transition-colors ${pricingModel === 'ROQ' ? 'border-amber-500/30 focus:border-amber-500' : 'border-[#A6947D]/30 focus:border-[#A6947D]'}`} />
                </div>
                
                <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('scanner.origin')}</label><input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. Drama, Greece" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]" /></div>
                <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('scanner.location')}</label><input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Thessaloniki Port" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('scanner.thickness')}</label><input type="number" value={thickness} onChange={(e) => setThickness(e.target.value)} placeholder="20" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]" /></div>
                  <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('scanner.quantity')}</label><input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 450" className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-3 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D]" /></div>
                </div>
                <div className="space-y-2"><label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">{t('scanner.incoterm')}</label>
                  <div className="flex gap-2">
                    {['EXW', 'FOB', 'CIF'].map(term => (
                      <button type="button" key={term} onClick={() => setIncoterm(term)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold border transition-all ${incoterm === term ? 'bg-[#A6947D] text-[#020509] border-[#A6947D]' : 'bg-[#020509] text-[#A6947D] border-[#A6947D]/30'}`}>{term}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ΝΕΟ ΠΕΔΙΟ: ΠΕΡΙΓΡΑΦΗ */}
              <div className="space-y-2 mb-8">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-widest">Asset Context / Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Provide material details, specific characteristics, or context..." 
                  className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-5 py-4 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] resize-none shadow-inner custom-scrollbar" 
                  rows={3} 
                />
              </div>

              <div className="pt-6 border-t border-[#A6947D]/10">
                <button type="submit" disabled={loading || images.length === 0} className="w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] px-6 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(166,148,125,0.2)]">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> {t('scanner.upload')}</> : <><UploadCloud size={16} /> {t('scanner.publish_btn')}</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#01030A]/90 backdrop-blur-xl border-t border-[#A6947D]/20 px-2 py-2 flex justify-between items-center z-50 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <Link href="/dashboard" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><BarChart3 size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.portfolio').substring(0,4)}</span></Link>
        <Link href="/scanner" className="text-[#A6947D] p-2 flex flex-col items-center gap-1"><Crosshair size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.scanner').substring(0,4)}</span></Link>
        <Link href="/trading" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1"><Globe size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.floor').substring(0,5)}</span></Link>
        <Link href="/inbox" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative"><MessageSquare size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.comms').substring(0,5)}</span></Link>
        <Link href="/me" className="text-[#A6947D]/40 p-2 flex flex-col items-center gap-1 relative"><User size={18} /><span className="text-[8px] uppercase font-bold tracking-widest">{t('menu.profile').substring(0,4)}</span></Link>
      </nav>
    </div>
  );
}