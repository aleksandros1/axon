'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Shield, ArrowLeft, Loader2, Lock, FileText, CheckCircle2, 
  UploadCloud, Download, Building2, Globe, Ship, Landmark
} from 'lucide-react';

export default function DealRoom({ params }: { params: { id: string } }) {
  const router = useRouter();
  const contractId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    const fetchDealRoom = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      // Fetch Contract with Relations
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          buyer:buyer_id (company_name, email),
          vendor:vendor_id (company_name, email),
          slab:slab_id (material, quantity, thickness)
        `)
        .eq('id', contractId)
        .single();

      if (error || !data) {
        console.error(error);
        router.push('/dashboard');
        return;
      }

      setContract(data);
      setLoading(false);
    };

    fetchDealRoom();
  }, [contractId, router]);

  // --- ΣΥΝΑΡΤΗΣΗ UPLOAD ΑΡΧΕΙΟΥ ΣΤΟ STORAGE ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'proforma' | 'sgs' | 'bol') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading(docType);

    try {
      // 1. Upload στο Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${contractId}-${docType}-${Date.now()}.${fileExt}`;
      const filePath = `${contractId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('deal_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Πάρε το Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('deal_documents')
        .getPublicUrl(filePath);

      // 3. Ενημέρωσε το Contract Table με το link
      const dbColumn = `${docType}_url`;
      const { error: dbError } = await supabase
        .from('contracts')
        .update({ [dbColumn]: publicUrl })
        .eq('id', contractId);

      if (dbError) throw dbError;

      // 4. Ενημέρωσε το τοπικό State για να φανεί κατευθείαν στην οθόνη
      setContract((prev: any) => ({ ...prev, [dbColumn]: publicUrl }));

    } catch (err) {
      console.error("Upload failed", err);
      alert("Αποτυχία ανεβάσματος εγγράφου.");
    } finally {
      setIsUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020509] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#A6947D]" size={32} />
      </div>
    );
  }

  if (!contract) return null;

  const isSeller = currentUser?.id === contract.vendor_id;
  const isBuyer = currentUser?.id === contract.buyer_id;

  const formatCurrency = (amount: number | string) => {
    const val = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Status Logic for Visual Timeline
  const statusLevels = ['pending', 'advance_paid', 'funded', 'inspected', 'shipped', 'completed'];
  const currentStepIndex = statusLevels.indexOf(contract.status) !== -1 ? statusLevels.indexOf(contract.status) : 0;

  return (
    <div className="min-h-screen bg-[#020509] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 pb-20">
      
      {/* HEADER */}
      <header className="border-b border-[#A6947D]/20 bg-[#01030A] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 text-[#A6947D]/60 hover:text-white transition-colors rounded-full hover:bg-[#A6947D]/10">
              <ArrowLeft size={18} />
            </button>
            <div className="h-6 w-px bg-[#A6947D]/20"></div>
            <div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#A6947D]" />
                <h1 className="text-sm font-serif uppercase tracking-widest text-[#F8F5EE]">Smart Deal Room</h1>
              </div>
              <p className="text-[10px] font-mono text-[#A6947D]/60 mt-0.5">AX-{contractId.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border border-[#A6947D]/30 px-3 py-1.5 rounded-sm bg-[#A6947D]/5">
            <div className={`w-2 h-2 rounded-full ${contract.status === 'cancelled' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#A6947D]">{contract.status.replace('_', ' ')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        
        {/* ESCROW TIMELINE (Visual LC Progress) */}
        <div className="mb-12 border border-[#A6947D]/10 bg-[#01030A] rounded-sm p-6 overflow-x-auto custom-scrollbar">
          <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#A6947D] mb-6">Transaction Dossier Protocol</h3>
          <div className="flex items-center justify-between min-w-[600px] relative">
            {/* Background Line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#A6947D]/10 -translate-y-1/2 z-0"></div>
            
            {/* Steps */}
            {['Initiated', 'Escrow Funded', 'SGS Inspected', 'Bill of Lading', 'Settled'].map((step, index) => {
              const isActive = index <= currentStepIndex;
              return (
                <div key={index} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-[#020509] border-[#A6947D] text-[#A6947D]' : 'bg-[#01030A] border-[#A6947D]/20 text-[#A6947D]/20'}`}>
                    {isActive ? <CheckCircle2 size={12} /> : <div className="w-1.5 h-1.5 rounded-full bg-[#A6947D]/20"></div>}
                  </div>
                  <span className={`text-[8px] uppercase tracking-widest font-bold ${isActive ? 'text-[#F8F5EE]' : 'text-[#A6947D]/40'}`}>{step}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ: The Commercial Terms */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-sm p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A6947D] border-b border-[#A6947D]/20 pb-3 mb-4">Counterparties</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Building2 size={10}/> Seller</p>
                  <p className="text-sm font-serif text-[#F8F5EE] uppercase">{contract.vendor?.company_name || 'System Vendor'}</p>
                </div>
                <div>
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1"><Globe size={10}/> Buyer</p>
                  <p className="text-sm font-serif text-[#F8F5EE] uppercase">{contract.buyer?.company_name || contract.buyer_name || 'System Buyer'}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-sm p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A6947D] border-b border-[#A6947D]/20 pb-3 mb-4">Asset Definition</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-[#A6947D]/5 pb-2">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Material</span>
                  <span className="text-[11px] font-bold text-[#F8F5EE] uppercase">{contract.slab?.material || contract.custom_material || 'Custom Asset'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#A6947D]/5 pb-2">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Quantity</span>
                  <span className="text-[11px] font-bold text-[#F8F5EE]">{contract.custom_quantity || contract.slab?.quantity || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#A6947D]/5 pb-2">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Incoterms</span>
                  <span className="text-[11px] font-bold text-[#F8F5EE]">{contract.custom_incoterms || contract.incoterms || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Total Valuation</span>
                  <span className="text-sm font-mono text-emerald-400">{formatCurrency(contract.price)}</span>
                </div>
              </div>
            </div>

            {/* Smart Contract Clauses */}
            <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-sm p-6">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A6947D] border-b border-[#A6947D]/20 pb-3 mb-4 flex items-center gap-2"><Lock size={12}/> Legal Covenants</h2>
              <p className="text-[10px] leading-relaxed text-[#A6947D]/80 font-mono bg-[#A6947D]/5 p-3 rounded-sm">
                Funds are held in AXON Stripe Institutional Escrow. Release requires strict fulfillment of the attached documentation vault.
                {contract.inspection === 'sgs_required' ? " SGS Independent Audit is MANDATORY." : " Inspection WAIVED by buyer."}
              </p>
            </div>
          </div>

          {/* ΔΕΞΙΑ ΣΤΗΛΗ: The Action Vault (Documents & Payments) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Stripe Funding Warning (If Pending) */}
            {contract.status === 'pending' && (
              <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-serif text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Landmark size={16}/> Awaiting Escrow Funding</h3>
                  <p className="text-[10px] text-amber-500/60 font-mono">The buyer must authorize the Stripe Escrow vault to initiate the transaction protocol.</p>
                </div>
                <button disabled={!isBuyer} className="bg-amber-500 text-[#020509] px-6 py-3 rounded-sm font-bold uppercase tracking-widest text-[9px] shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                  {isBuyer ? 'Fund Escrow Vault' : 'Waiting for Buyer'}
                </button>
              </div>
            )}

            <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-sm p-6">
              <h2 className="text-lg font-serif uppercase tracking-[0.1em] text-[#F8F5EE] mb-1">Document Vault</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-6">Secure File Uploads & Cryptographic Hash Checks</p>
              
              <div className="space-y-4">
                {/* PROFORMA INVOICE ROW */}
                <div className="flex flex-col md:flex-row justify-between md:items-center p-4 border border-[#A6947D]/10 rounded-sm bg-[#020509] gap-4 group hover:border-[#A6947D]/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${contract.proforma_url ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#A6947D]/10 text-[#A6947D]'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#F8F5EE]">Proforma Invoice</h4>
                      <p className="text-[9px] text-[#A6947D]/60 font-mono mt-0.5">Required for Ledger Registration</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {contract.proforma_url ? (
                      <a href={contract.proforma_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-sm hover:bg-emerald-400/10 transition-colors">
                        <Download size={12}/> View / Download
                      </a>
                    ) : (
                      <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-[#A6947D] border border-[#A6947D]/30 px-3 py-1.5 rounded-sm hover:bg-[#A6947D]/10 transition-colors cursor-pointer">
                        {isUploading === 'proforma' ? <Loader2 size={12} className="animate-spin"/> : <UploadCloud size={12}/>}
                        {isUploading === 'proforma' ? 'Uploading...' : 'Upload Document'}
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, 'proforma')} disabled={isUploading !== null} />
                      </label>
                    )}
                  </div>
                </div>

                {/* SGS REPORT ROW */}
                <div className="flex flex-col md:flex-row justify-between md:items-center p-4 border border-[#A6947D]/10 rounded-sm bg-[#020509] gap-4 group hover:border-[#A6947D]/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${contract.sgs_url ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#A6947D]/10 text-[#A6947D]'}`}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#F8F5EE]">SGS Inspection Report</h4>
                      <p className="text-[9px] text-[#A6947D]/60 font-mono mt-0.5">Independent Quality Assurance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {contract.sgs_url ? (
                      <a href={contract.sgs_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-sm hover:bg-emerald-400/10 transition-colors">
                        <Download size={12}/> View / Download
                      </a>
                    ) : (
                      <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-[#A6947D] border border-[#A6947D]/30 px-3 py-1.5 rounded-sm hover:bg-[#A6947D]/10 transition-colors cursor-pointer">
                        {isUploading === 'sgs' ? <Loader2 size={12} className="animate-spin"/> : <UploadCloud size={12}/>}
                        {isUploading === 'sgs' ? 'Uploading...' : 'Upload Report'}
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, 'sgs')} disabled={isUploading !== null} />
                      </label>
                    )}
                  </div>
                </div>

                {/* BILL OF LADING ROW */}
                <div className="flex flex-col md:flex-row justify-between md:items-center p-4 border border-[#A6947D]/10 rounded-sm bg-[#020509] gap-4 group hover:border-[#A6947D]/30 transition-colors relative overflow-hidden">
                  {/* Μικρό Overlay αν δεν έχει πληρωθεί το Escrow */}
                  {contract.status === 'pending' && (
                    <div className="absolute inset-0 bg-[#020509]/80 backdrop-blur-sm z-10 flex items-center justify-center">
                      <p className="text-[9px] font-bold text-[#A6947D] uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Locked until Escrow is funded</p>
                    </div>
                  )}

                  <div className="flex items-start gap-3 relative z-0">
                    <div className={`p-2 rounded-lg ${contract.bol_url ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#A6947D]/10 text-[#A6947D]'}`}>
                      <Ship size={16} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#F8F5EE]">Bill of Lading (B/L)</h4>
                      <p className="text-[9px] text-[#A6947D]/60 font-mono mt-0.5">Triggers Automatic Funds Release</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-0">
                    {contract.bol_url ? (
                      <a href={contract.bol_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-400 border border-emerald-400/30 px-3 py-1.5 rounded-sm hover:bg-emerald-400/10 transition-colors">
                        <Download size={12}/> View / Download
                      </a>
                    ) : (
                      <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-[#A6947D] border border-[#A6947D]/30 px-3 py-1.5 rounded-sm hover:bg-[#A6947D]/10 transition-colors cursor-pointer">
                        {isUploading === 'bol' ? <Loader2 size={12} className="animate-spin"/> : <UploadCloud size={12}/>}
                        {isUploading === 'bol' ? 'Uploading...' : 'Upload B/L'}
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, 'bol')} disabled={isUploading !== null} />
                      </label>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Audit Trail (Activity Log) */}
            <div className="bg-transparent border border-[#A6947D]/10 rounded-sm p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A6947D] mb-4">Immutable Audit Trail</h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#A6947D]/20 before:via-[#A6947D]/20 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full border border-[#A6947D] bg-[#020509] text-[#A6947D] absolute left-0 md:left-1/2 -translate-x-1/2 translate-y-1 shadow-[0_0_10px_rgba(166,148,125,0.2)]">
                    <div className="w-1.5 h-1.5 bg-[#A6947D] rounded-full"></div>
                  </div>
                  <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-sm border border-[#A6947D]/10 bg-[#01030A] ml-8 md:ml-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-bold uppercase text-[#A6947D]">Contract Initiated</span>
                      <span className="text-[8px] font-mono text-slate-500">{formatDateTime(contract.created_at)}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono">Digital dossier generated via AXON Protocol.</p>
                  </div>
                </div>

                {contract.proforma_url && (
                  <div className="relative flex items-center justify-between md:justify-normal md:even:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-emerald-500/50 bg-[#020509] text-emerald-500 absolute left-0 md:left-1/2 -translate-x-1/2 translate-y-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 size={10} />
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 ml-8 md:ml-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold uppercase text-emerald-400">Proforma Uploaded</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono">Document cryptographic hash registered.</p>
                    </div>
                  </div>
                )}
                
                {contract.sgs_url && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-emerald-500/50 bg-[#020509] text-emerald-500 absolute left-0 md:left-1/2 -translate-x-1/2 translate-y-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 size={10} />
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-sm border border-emerald-500/20 bg-emerald-500/5 ml-8 md:ml-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold uppercase text-emerald-400">Inspection Logged</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono">SGS Audit document attached to ledger.</p>
                    </div>
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