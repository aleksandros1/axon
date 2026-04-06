'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  Shield, Globe, MessageSquare, LogOut, FileSignature, 
  CheckCircle2, X, Loader2, AlertTriangle, RotateCcw, Lock, Ship, ArrowLeft, Layers3
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from '../components/SidebarLanguageSwitcher';

export default function ContractsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contracts, setContracts] = useState<any[]>([]);

  // --- MODAL STATES ---
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [cancelType, setCancelType] = useState<'full' | 'partial'>('full');
  const [retainAmount, setRetainAmount] = useState('');
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }
      setCurrentUser(session.user);

      // Fetch contracts where user is buyer or vendor
      // Υποθέτουμε ότι έχεις relationships slabs, profiles στη βάση
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          slabs ( material ),
          buyer:buyer_id ( company_name ),
          vendor:vendor_id ( company_name )
        `)
        .or(`buyer_id.eq.${session.user.id},vendor_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (data) {
        setContracts(data);
      } else if (error) {
        console.error("Error fetching contracts:", error);
      }
      setLoading(false);
    };
    fetchContracts();
  }, [router]);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/auth'); };

  const formatCurrency = (amount: any) => {
    const val = typeof amount === 'string' ? parseFloat(amount.replace(/\./g, '').replace(/,/g, '.')) : amount;
    return new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // --- ESCROW TERMINATION LOGIC ---
  const openCancelModal = (contract: any) => {
    setSelectedContract(contract);
    setCancelType('full');
    setRetainAmount('');
    setCancelSuccess(false);
    setIsCancelModalOpen(true);
  };

  const executeTermination = async () => {
    if (!selectedContract) return;
    setIsProcessingCancel(true);

    try {
      const contractValue = typeof selectedContract.price === 'string' 
        ? parseFloat(selectedContract.price.replace(/\./g, '').replace(/,/g, '.')) 
        : selectedContract.price;

      const retained = cancelType === 'partial' ? parseFloat(retainAmount || '0') : 0;
      const amountToRefund = contractValue - retained; // Το ποσό που επιστρέφεται στον αγοραστή

      // 1. Κλήση στο API του Stripe (αν έχεις το /api/refund route)
      await fetch('/api/refund', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          paymentIntentId: selectedContract.stripe_payment_id || 'pi_DUMMY', 
          amountToRefund 
        }) 
      });

      // 2. Ενημέρωση της βάσης (Αλλαγή status σε cancelled)
      await supabase.from('contracts')
        .update({ status: 'cancelled', termination_details: { type: cancelType, retained } })
        .eq('id', selectedContract.id);

      // 3. Ενημέρωση του UI
      setContracts(prev => prev.map(c => c.id === selectedContract.id ? { ...c, status: 'cancelled' } : c));
      
      setCancelSuccess(true);
      setTimeout(() => { setIsCancelModalOpen(false); setSelectedContract(null); }, 2500);
    } catch (error) {
      console.error(error);
      alert("Error processing termination. Check console.");
    } finally {
      setIsProcessingCancel(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] overflow-hidden font-sans selection:bg-[#A6947D]/30 relative">
      
      {/* SIDEBAR */}
      <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-10 left-[-40%] opacity-[0.02] pointer-events-none shrink-0"><Shield size={300} className="text-[#A6947D]" /></div>
        <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
          <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 shadow-[0_0_15px_rgba(166,148,125,0.05)] bg-[#01030A]">
            <Shield size={20} className="text-[#A6947D]"/>
          </div>
          <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
          <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.4em]">{t('common.institutional_grade')}</p>
        </div>
        <SidebarLanguageSwitcher />
        <nav className="flex-1 px-4 space-y-2 relative z-10">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Layers3 size={16} /> {t('menu.portfolio')}</Link>
          <Link href="/contracts" className="flex items-center gap-3 px-4 py-3 bg-[#A6947D]/10 text-[#A6947D] rounded-xl text-[10px] font-bold uppercase tracking-widest border border-[#A6947D]/20 shadow-inner"><FileSignature size={16} /> Escrow Contracts</Link>
          <Link href="/trading" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><Globe size={16} /> {t('menu.floor')}</Link>
          <Link href="/inbox" className="flex items-center gap-3 px-4 py-3 text-[#F8F5EE]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"><MessageSquare size={16} /> {t('menu.comms')}</Link>
        </nav>
        <div className="p-6 border-t border-[#A6947D]/10"><button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 transition-colors"><LogOut size={16} /> ΑΠΟΣΥΝΔΕΣΗ</button></div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto relative bg-[#020509] pb-[80px] md:pb-0 custom-scrollbar w-full z-10">
        <div className="p-4 md:p-12 max-w-5xl mx-auto relative z-10 w-full">
          <header className="mb-10 flex items-center gap-4">
            <Link href="/dashboard" className="p-2 border border-[#A6947D]/30 rounded-xl text-[#A6947D]/60 hover:text-[#A6947D] hover:bg-[#A6947D]/10 transition-colors"><ArrowLeft size={16}/></Link>
            <div>
              <h2 className="text-3xl font-serif text-[#F8F5EE] uppercase tracking-[0.1em] font-light">Escrow Contracts</h2>
              <div className="flex items-center gap-3 mt-2"><span className="h-px w-8 bg-[#A6947D]/30"></span><p className="text-[10px] text-[#A6947D] uppercase tracking-[0.2em] font-mono">Active & Settled Agreements</p></div>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center py-20 text-[#A6947D] animate-pulse font-mono text-xs uppercase tracking-widest"><Loader2 size={24} className="animate-spin mr-2"/> Synchronizing...</div>
          ) : contracts.length === 0 ? (
            <div className="bg-[#01030A]/60 border border-[#A6947D]/10 rounded-2xl p-16 text-center shadow-lg">
               <FileSignature size={48} className="mx-auto text-[#A6947D]/20 mb-6" />
               <p className="text-[#A6947D]/40 font-mono text-[10px] uppercase tracking-[0.4em]">NO ACTIVE CONTRACTS RECORDED</p>
            </div>
          ) : (
            <div className="space-y-6">
              {contracts.map(contract => {
                const isBuyer = contract.buyer_id === currentUser?.id;
                const counterpartyName = isBuyer ? (contract.vendor?.company_name || 'Vendor') : (contract.buyer?.company_name || 'Buyer');
                const isCancelled = contract.status === 'cancelled';
                const isSettled = contract.status === 'settled';

                return (
                  <div key={contract.id} className="bg-[#01030A]/80 backdrop-blur-md border border-[#A6947D]/20 rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden group">
                    {isCancelled && <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>}
                    {!isCancelled && !isSettled && <div className="absolute top-0 left-0 w-full h-1 bg-[#A6947D]/50"></div>}
                    {isSettled && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50"></div>}

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${isBuyer ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                            {isBuyer ? 'YOU ARE BUYER' : 'YOU ARE VENDOR'}
                          </span>
                          <span className="text-[9px] text-[#A6947D]/60 font-mono tracking-widest uppercase">AX-{contract.slab_id?.substring(0,8) || contract.id.substring(0,8)}</span>
                        </div>
                        <h3 className="text-2xl font-serif text-[#F8F5EE] uppercase tracking-widest mb-1">{contract.slabs?.material || 'SECURED ASSET'}</h3>
                        <p className="text-[10px] font-mono text-[#A6947D] uppercase flex items-center gap-2"><Building2 size={12}/> COUNTERPARTY: <span className="text-[#F8F5EE]">{counterpartyName}</span></p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-[8px] text-[#A6947D]/60 uppercase font-bold tracking-widest mb-1">CONTRACT VALUE</p>
                        <p className="text-2xl font-mono text-[#F8F5EE]">{formatCurrency(contract.price)}</p>
                      </div>
                    </div>

                    {/* TIMELINE (Απλοποιημένο για το UI) */}
                    <div className="relative flex justify-between items-center mb-12 px-2 md:px-8">
                      <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-px bg-[#A6947D]/20 z-0"></div>
                      
                      {/* Step 1: Locked */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-[#A6947D]/10 border border-[#A6947D] flex items-center justify-center text-[#A6947D] shadow-[0_0_15px_rgba(166,148,125,0.2)]"><Lock size={16}/></div>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#A6947D]">FUNDS LOCKED</span>
                      </div>
                      
                      {/* Step 2: BOL */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${contract.status === 'shipped' || isSettled ? 'bg-[#A6947D]/10 border-[#A6947D] text-[#A6947D]' : 'bg-[#020509] border-[#A6947D]/30 text-[#A6947D]/30'}`}><Ship size={16}/></div>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${contract.status === 'shipped' || isSettled ? 'text-[#A6947D]' : 'text-[#A6947D]/40'}`}>LOGISTICS (BOL)</span>
                      </div>

                      {/* Step 3: Settled */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isSettled ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#020509] border-[#A6947D]/30 text-[#A6947D]/30'}`}><CheckCircle2 size={16}/></div>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${isSettled ? 'text-emerald-400' : 'text-[#A6947D]/40'}`}>SETTLED</span>
                      </div>
                    </div>

                    {/* ACTION BAR */}
                    <div className="border-t border-[#A6947D]/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCancelled ? 'bg-red-500' : isSettled ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isCancelled ? 'text-red-500' : isSettled ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {isCancelled ? 'CONTRACT TERMINATED' : isSettled ? 'TRANSACTION COMPLETE' : isBuyer ? 'AWAITING VENDOR SHIPMENT' : 'AWAITING YOUR SHIPMENT'}
                        </span>
                      </div>
                      
                      {!isCancelled && !isSettled && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {/* ΤΟ ΝΕΟ ΚΟΥΜΠΙ ΑΚΥΡΩΣΗΣ */}
                          <button 
                            onClick={() => openCancelModal(contract)} 
                            className="flex-1 sm:flex-none border border-red-500/30 text-red-500/80 hover:text-red-500 hover:bg-red-500/10 px-4 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all text-center"
                          >
                            Terminate Protocol
                          </button>

                          {/* ACTION BUTTON */}
                          {isBuyer ? (
                            <button disabled className="flex-1 sm:flex-none border border-[#A6947D]/20 text-[#A6947D]/40 px-4 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-center cursor-not-allowed">
                              VENDOR ACTION PENDING
                            </button>
                          ) : (
                            <button className="flex-1 sm:flex-none bg-[#F8F5EE] text-[#020509] hover:bg-white px-6 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                              <Ship size={14}/> UPLOAD BOL
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* --- ESCROW TERMINATION MODAL --- */}
      {/* ========================================================= */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#01030A]/95 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-[#020509] border border-red-500/30 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-red-500/20 bg-[#01030A]">
               <div className="flex items-center gap-3 text-red-500"><RotateCcw size={20} /><h2 className="text-lg font-serif uppercase tracking-widest text-[#F8F5EE]">Escrow Termination Protocol</h2></div>
               <button onClick={() => setIsCancelModalOpen(false)} className="text-[#A6947D]/40 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 md:p-8 space-y-6">
              {cancelSuccess ? (
                <div className="text-center py-8 animate-in zoom-in">
                  <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-2">Escrow Terminated Successfully</p>
                  <p className="text-[10px] text-[#A6947D]/60 font-mono">Funds have been processed according to protocol.</p>
                </div>
              ) : (
                <>
                  <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
                    <AlertTriangle size={16} className="text-red-500 flex-none mt-0.5" />
                    <p className="text-[10px] font-mono text-red-500/80 uppercase tracking-widest leading-relaxed">
                      Warning: Terminating this contract will reverse secured funds via the Stripe API. Choose the resolution type below.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] text-[#A6947D]/80 uppercase font-bold tracking-widest">Select Resolution Type</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button 
                        onClick={() => setCancelType('full')}
                        className={`p-4 rounded-xl border text-left transition-all ${cancelType === 'full' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-inner' : 'bg-[#01030A] border-[#A6947D]/20 text-[#A6947D]/60 hover:border-[#A6947D]/40'}`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Mutual Cancellation</p>
                        <p className="text-[8px] font-mono opacity-70 leading-relaxed">100% of funds returned to buyer.</p>
                      </button>
                      <button 
                        onClick={() => setCancelType('partial')}
                        className={`p-4 rounded-xl border text-left transition-all ${cancelType === 'partial' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-inner' : 'bg-[#01030A] border-[#A6947D]/20 text-[#A6947D]/60 hover:border-[#A6947D]/40'}`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Cost Retention (Penalty)</p>
                        <p className="text-[8px] font-mono opacity-70 leading-relaxed">Vendor retains a specific amount.</p>
                      </button>
                    </div>
                  </div>

                  {cancelType === 'partial' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[9px] text-amber-500 uppercase font-bold tracking-widest">Amount to Retain for Vendor (€)</label>
                      <input 
                        type="number" 
                        value={retainAmount} 
                        onChange={(e) => setRetainAmount(e.target.value)} 
                        className="w-full bg-[#01030A] border border-amber-500/30 rounded-xl px-4 py-4 font-mono text-amber-400 outline-none focus:border-amber-500" 
                        placeholder="e.g. 2000"
                        required 
                      />
                      <p className="text-[8px] text-[#A6947D]/60 font-mono mt-2 uppercase tracking-widest">The remaining balance will be refunded to the buyer.</p>
                    </div>
                  )}

                  <button 
                    onClick={executeTermination} 
                    disabled={isProcessingCancel || (cancelType === 'partial' && !retainAmount)} 
                    className="w-full bg-red-500 hover:bg-red-400 text-[#020509] font-bold uppercase tracking-[0.2em] py-4 rounded-xl transition-all text-[10px] shadow-[0_4px_15px_rgba(239,68,68,0.2)] disabled:opacity-50 flex justify-center items-center gap-2 mt-4"
                  >
                    {isProcessingCancel ? <Loader2 size={16} className="animate-spin"/> : 'AUTHORIZE TERMINATION'}
                  </button>
                </>
              )}
            </div>
           </div>
        </div>
      )}

    </div>
  );
}

// Χρησιμοποιούμε Building2 icon επειδή λείπει από τα imports πάνω
import { Building2 } from 'lucide-react';