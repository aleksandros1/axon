'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  ShieldCheck, UploadCloud, Building2, FileText, 
  CheckCircle2, Clock, AlertOctagon, ArrowLeft, Lock, Loader2, Shield
} from 'lucide-react';
import Link from 'next/link';

import { useLanguage } from '../../lib/i18n/LanguageContext';

export default function KYCVerification() {
  const router = useRouter();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // VERIFICATION LOGIC STATES
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  // Form Data
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [country, setCountry] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth'); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setCompanyName(data.company_name || '');
        setVatNumber(data.vat_number || '');
        setCountry(data.country || '');
      }
      setLoading(false);
    };

    fetchUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const runVerificationProtocol = (callback: () => void) => {
    setIsVerifying(true);
    setVerificationStep(1); 
    setTimeout(() => {
      setVerificationStep(2); 
      setTimeout(() => {
        setVerificationStep(3); 
        setTimeout(() => {
          setIsVerifying(false);
          callback();
        }, 1000);
      }, 1200);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    
    setSubmitting(true);

    runVerificationProtocol(async () => {
      try {
        let documentUrl = profile.kyc_document_url;

        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('kyc-documents')
            .upload(fileName, file);

          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage
            .from('kyc-documents')
            .getPublicUrl(fileName);
          documentUrl = publicUrlData.publicUrl;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            company_name: companyName,
            vat_number: vatNumber,
            country: country,
            kyc_document_url: documentUrl,
            status: 'pending'
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
        window.location.reload();

      } catch (error: any) {
        alert(`KYC Error: ${error.message}`);
      } finally {
        setSubmitting(false);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#000000] flex items-center justify-center">
        <div className="w-12 h-12 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#000000] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 relative overflow-x-hidden antialiased">
      
      {/* VERIFICATION OVERLAY */}
      {isVerifying && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-6">
          <div className="relative mb-8">
            <div className="w-24 h-24 border border-[#A6947D]/30 rounded-full flex items-center justify-center animate-spin-slow shadow-[0_0_30px_rgba(166,148,125,0.1)]">
              <Shield size={32} className="text-[#A6947D] animate-pulse" />
            </div>
            <div className="absolute inset-0 border-[0.5px] border-[#A6947D]/50 rounded-full animate-ping opacity-20"></div>
          </div>
          <h2 className="text-lg md:text-xl font-serif uppercase tracking-[0.3em] text-white mb-6 font-light">
            {verificationStep === 1 ? 'Encrypting Payload' : verificationStep === 2 ? 'Synchronizing Ledger' : 'Finalizing Protocol'}
          </h2>
          <div className="w-56 h-px bg-gray-900 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-[#A6947D] transition-all duration-1000 shadow-[0_0_10px_#A6947D]" style={{ width: `${(verificationStep / 3) * 100}%` }}></div>
          </div>
          <p className="mt-6 text-[9px] font-mono text-[#A6947D]/60 uppercase tracking-widest animate-pulse">Institutional-Grade Security Sync</p>
        </div>
      )}

      {/* TOP NAVIGATION */}
      <nav className="border-b border-gray-900 bg-[#000000]/80 backdrop-blur-xl sticky top-0 z-20 w-full">
        <div className="max-w-3xl mx-auto px-5 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="w-10 h-10 border border-gray-800 rounded-sm flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-900 transition-all">
              <ArrowLeft size={18} strokeWidth={1.5} />
            </Link>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm md:text-base font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#A6947D]" /> KYC Protocol
              </h1>
              <p className="text-gray-500 text-[9px] font-mono uppercase tracking-[0.2em] mt-1">Entity Verification Vault</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-16 relative z-10 w-full">
        
        {/* STATUS BANNER - REDESIGNED FOR LUXURY */}
        <div className={`mb-12 relative overflow-hidden bg-[#030303] border border-gray-800 p-6 md:p-8 rounded-sm shadow-2xl flex items-start md:items-center gap-5 transition-all ${
          profile?.status === 'verified' ? 'border-l-2 border-l-emerald-500' :
          profile?.status === 'pending' ? 'border-l-2 border-l-amber-500' :
          'border-l-2 border-l-red-500'
        }`}>
          {/* Subtle Background Glow */}
          <div className={`absolute top-0 left-0 w-32 h-full opacity-5 blur-2xl pointer-events-none ${
             profile?.status === 'verified' ? 'bg-emerald-500' : profile?.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
          }`}></div>

          <div className="shrink-0 mt-1 md:mt-0 relative z-10">
            {profile?.status === 'verified' && <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={1.5} />}
            {profile?.status === 'pending' && <Clock size={28} className="text-amber-500" strokeWidth={1.5} />}
            {(profile?.status === 'unverified' || !profile?.status) && <AlertOctagon size={28} className="text-red-500" strokeWidth={1.5} />}
          </div>
          
          <div className="relative z-10">
            <h2 className={`text-xs md:text-sm font-bold uppercase tracking-[0.2em] ${
              profile?.status === 'verified' ? 'text-emerald-500' : profile?.status === 'pending' ? 'text-amber-500' : 'text-red-500'
            }`}>
              {profile?.status === 'verified' ? 'Entity Verified' : profile?.status === 'pending' ? 'Verification Pending' : 'Action Required'}
            </h2>
            <p className="text-[10px] md:text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-2 leading-relaxed max-w-lg">
              {profile?.status === 'verified' ? 'Approved. You have full network access to the global trading floor.' : 
               profile?.status === 'pending' ? 'Documents under review by AXON Compliance Protocol.' : 
               'Submit institutional details to unlock trading capabilities and escrow terminal.'}
            </p>
          </div>
        </div>

        {/* KYC FORM - BANKING AESTHETIC */}
        {profile?.status !== 'verified' && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10 w-full">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Corporate Entity */}
                <div className="space-y-3">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em]">{t('auth.corporate_entity')}</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="text" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)} 
                      required 
                      disabled={profile?.status === 'pending'} 
                      className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm pl-12 pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-[#A6947D]/60 focus:bg-[#080808] transition-all placeholder:text-gray-700 shadow-inner" 
                      placeholder="e.g. Pavlidis S.A." 
                    />
                  </div>
                </div>

                {/* VAT Number */}
                <div className="space-y-3">
                  <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em]">{t('auth.tax_id')}</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                    <input 
                      type="text" 
                      value={vatNumber} 
                      onChange={(e) => setVatNumber(e.target.value)} 
                      required 
                      disabled={profile?.status === 'pending'} 
                      className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm pl-12 pr-4 text-xs md:text-sm font-mono text-white focus:outline-none focus:border-[#A6947D]/60 focus:bg-[#080808] transition-all placeholder:text-gray-700 shadow-inner uppercase" 
                      placeholder="VAT / TAX ID" 
                    />
                  </div>
                </div>
              </div>

              {/* Country Selection */}
              <div className="space-y-3">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em]">Incorporation Region</label>
                <select 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)} 
                  required 
                  disabled={profile?.status === 'pending'} 
                  className="w-full h-14 bg-[#050505] border border-gray-800 rounded-sm px-4 text-xs md:text-sm text-white focus:outline-none focus:border-[#A6947D]/60 focus:bg-[#080808] appearance-none cursor-pointer transition-all uppercase tracking-widest shadow-inner"
                >
                  <option value="" disabled className="text-gray-700">{language === 'el' ? 'ΕΠΙΛΕΞΤΕ ΧΩΡΑ' : 'SELECT COUNTRY'}</option>
                  <option value="Greece">Greece</option>
                  <option value="Italy">Italy</option>
                  <option value="Turkey">Turkey</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Other">Other Region</option>
                </select>
              </div>

              {/* File Upload - Secure Vault Style */}
              <div className="space-y-3 pt-4 w-full">
                <label className="text-[9px] text-[#A6947D] uppercase font-bold tracking-[0.2em]">Corporate Documentation</label>
                <div className="relative border border-dashed border-gray-700 bg-[#030303] rounded-sm p-8 text-center hover:border-[#A6947D]/50 hover:bg-[#050505] transition-all overflow-hidden w-full group">
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    disabled={profile?.status === 'pending'} 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                  />
                  <UploadCloud size={28} strokeWidth={1.5} className="mx-auto text-gray-600 group-hover:text-[#A6947D] transition-colors mb-4" />
                  <p className="text-xs font-bold uppercase tracking-widest text-white truncate px-4">
                    {file ? file.name : "UPLOAD CERT. OF INCORPORATION"}
                  </p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-3">PDF / JPG / PNG (MAX 5MB)</p>
                </div>
              </div>

              {/* Terms Checkbox - Minimalist */}
              <div className="pt-4 flex gap-4 items-start w-full">
                <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={acceptedTerms} 
                    onChange={(e) => setAcceptedTerms(e.target.checked)} 
                    disabled={profile?.status === 'pending'} 
                    className="w-full h-full appearance-none border border-gray-600 rounded-[2px] checked:bg-[#A6947D] checked:border-[#A6947D] transition-colors cursor-pointer peer" 
                  />
                  <CheckCircle2 size={12} className="absolute text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                </div>
                <label htmlFor="terms" className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-[1.6] cursor-pointer select-none">
                  I declare accuracy of information. AXON is a Software & Escrow Provider. No liability for physical logistics. <span className="text-[#A6947D]">Terms Apply.</span>
                </label>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={submitting || profile?.status === 'pending' || !acceptedTerms}
                className="w-full h-16 bg-white text-black font-extrabold uppercase tracking-[0.3em] rounded-sm hover:bg-gray-200 transition-all text-[10px] md:text-xs flex items-center justify-center gap-3 disabled:opacity-20 disabled:hover:bg-white mt-8 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Lock size={16} strokeWidth={2}/> Synchronize Verification</>}
              </button>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}