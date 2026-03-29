'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, BarChart3, Crosshair, MessageSquare, 
  LogOut, User, Users, FileText, Upload, Database, CheckCircle2, 
  AlertTriangle, X, ArrowLeft, Loader2, Table as TableIcon, Download
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

export default function BulkUpload() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setUser(session.user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 1) return;
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const results = lines.slice(1).filter(line => line.trim() !== '').map(line => {
      const values = line.split(',').map(v => v.trim());
      const entry: any = {};
      headers.forEach((header, index) => {
        entry[header] = values[index];
      });
      return entry;
    });

    setCsvData(results);
    setUploadStatus('idle');
  };

  const handleBulkInsert = async () => {
    if (!user || csvData.length === 0) return;
    setIsProcessing(true);

    const finalData = csvData.map(item => ({
      user_id: user.id,
      material: item.material || 'Unknown Marble',
      price: parseFloat(item.price) || 0,
      quantity: parseFloat(item.quantity) || 0,
      thickness: parseFloat(item.thickness) || 2,
      origin: item.origin || '',
      location: item.location || '',
      incoterm: item.incoterm || 'EXW',
      pricing_model: item.pricing_model?.toUpperCase() === 'ROQ' ? 'ROQ' : 'PUBLIC',
      is_available: true
    }));

    const { error } = await supabase.from('slabs').insert(finalData);

    if (error) {
      console.error('Bulk Upload Failed:', error);
      setUploadStatus('error');
    } else {
      setUploadStatus('success');
      setCsvData([]);
      setTimeout(() => router.push('/dashboard'), 2000);
    }
    setIsProcessing(false);
  };

  const downloadTemplate = () => {
    const headers = "material,price,quantity,thickness,origin,location,incoterm,pricing_model\n";
    const example = "Calacatta Oro,12500,45.5,2,Carrara Italy,Piraeus Port,FOB,PUBLIC";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'axon_bulk_template.csv';
    a.click();
  };

  if (loading) return null;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans">
      
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 relative overflow-hidden">
        <div className="p-8 pb-12 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]">
            <Database size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase tracking-[0.2em] font-light leading-none mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>

        <SidebarLanguageSwitcher />

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><BarChart3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/scanner" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Crosshair size={16} /> {t('menu.scanner')}</Link>
          <Link href="/bulk" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><Upload size={16} /> Bulk Upload</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/network" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Users size={16} /> {t('menu.network')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10 relative z-10">
          <button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> {t('common.disconnect')}</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-24 md:pb-0 custom-scrollbar">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.01] z-0 fixed"><Database size={800} className="text-[#A6947D]" /></div>
        
        <div className="p-4 md:p-12 max-w-6xl mx-auto relative z-10">
          <header className="mb-12">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-[#A6947D] hover:text-[#F8F5EE] transition-colors mb-8 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Return</span>
            </button>
            <h2 className="text-3xl md:text-5xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light mb-4">Bulk Import</h2>
            <p className="text-[10px] md:text-xs text-[#A6947D]/60 uppercase tracking-[0.3em] font-mono">Massive Inventory Digitization Protocol</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#A6947D]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="w-16 h-16 rounded-2xl bg-[#020509] border border-[#A6947D]/30 flex items-center justify-center mb-2 relative z-10">
                  <FileText size={32} className="text-[#A6947D]" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE] mb-2">Drop CSV File</h3>
                  <p className="text-[10px] text-[#A6947D]/60 font-mono uppercase leading-relaxed">System supports .csv files encoded in UTF-8</p>
                </div>
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative z-10 w-full bg-[#A6947D] hover:bg-[#c4b198] text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-[10px] flex items-center justify-center gap-2 shadow-lg"
                >
                  <Upload size={16} /> Select Archive
                </button>

                <button 
                  onClick={downloadTemplate}
                  className="relative z-10 w-full bg-transparent border border-[#A6947D]/30 text-[#A6947D] hover:border-[#A6947D] hover:text-[#F8F5EE] font-bold uppercase tracking-widest py-3 rounded-xl transition-all text-[9px] flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Download Template
                </button>
              </div>

              {uploadStatus === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Protocol Success</p>
                    <p className="text-[10px] text-emerald-500/70 font-mono mt-1 uppercase">Inventory updated. Redirecting...</p>
                  </div>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                  <AlertTriangle className="text-red-500" size={24} />
                  <div>
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Protocol Failure</p>
                    <p className="text-[10px] text-red-500/70 font-mono mt-1 uppercase">Verification error. Check CSV formatting.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8">
              <div className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/10 rounded-3xl overflow-hidden flex flex-col h-full shadow-2xl">
                <div className="p-6 border-b border-[#A6947D]/10 flex justify-between items-center bg-[#020509]">
                  <div className="flex items-center gap-3">
                    <TableIcon size={18} className="text-[#A6947D]" />
                    <h3 className="text-sm font-serif uppercase tracking-widest text-[#F8F5EE]">Archive Preview</h3>
                  </div>
                  {csvData.length > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {csvData.length} Entities Detected
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar max-h-[500px]">
                  {csvData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-32 text-center opacity-30">
                      <Database size={48} className="mb-4 text-[#A6947D]" />
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em]">No data to display. Upload archive.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-[#01030A] z-10 shadow-sm">
                        <tr className="border-b border-[#A6947D]/20">
                          <th className="px-6 py-4 text-[9px] font-bold uppercase text-[#A6947D] tracking-widest">Material</th>
                          <th className="px-6 py-4 text-[9px] font-bold uppercase text-[#A6947D] tracking-widest">Price (€)</th>
                          <th className="px-6 py-4 text-[9px) font-bold uppercase text-[#A6947D] tracking-widest">Quantity</th>
                          <th className="px-6 py-4 text-[9px] font-bold uppercase text-[#A6947D] tracking-widest">Logistics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#A6947D]/5">
                        {csvData.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#A6947D]/5 transition-colors">
                            <td className="px-6 py-4 text-[11px] font-serif uppercase text-[#F8F5EE]">{item.material}</td>
                            <td className="px-6 py-4 text-[11px] font-mono text-[#A6947D]">€{item.price}</td>
                            <td className="px-6 py-4 text-[11px] font-mono text-[#F8F5EE]/60">{item.quantity} m²</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-amber-500 uppercase tracking-widest">{item.incoterm || 'EXW'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {csvData.length > 0 && (
                  <div className="p-6 border-t border-[#A6947D]/10 bg-[#020509]">
                    <button 
                      onClick={handleBulkInsert}
                      disabled={isProcessing}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-[#020509] font-bold uppercase tracking-widest py-4 rounded-xl transition-all text-xs flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                    >
                      {isProcessing ? <><Loader2 size={18} className="animate-spin" /> Digitizing...</> : <><CheckCircle2 size={18} /> Confirm & Publish to Floor</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}