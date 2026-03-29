'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { 
  ShieldCheck, UploadCloud, Building2, FileText, 
  CheckCircle2, Clock, AlertOctagon, ArrowLeft, Lock, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function KYCVerification() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Φόρμα Data
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      alert("You must accept the Terms of Service to proceed.");
      return;
    }
    
    setSubmitting(true);

    try {
      let documentUrl = profile.kyc_document_url;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(filePath);

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
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#020509] flex items-center justify-center">
        <div className="w-12 h-12 border border-[#A6947D]/30 border-t-[#A6947D] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] text-[#F8F5EE] font-sans selection:bg-[#A6947D]/30 relative overflow-x-hidden">
      
      {/* TOP NAVIGATION */}
      <nav className="border-b border-[#A6947D]/10 bg-[#01030A]/80 backdrop-blur-md sticky top-0 z-20 w-full">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/dashboard" className="w-8 h-8 md:w-10 md:h-10 border border-[#A6947D]/30 rounded-full flex items-center justify-center text-[#A6947D] hover:bg-[#A6947D]/10 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-sm md:text-xl font-serif uppercase tracking-[0.2em] text-[#F8F5EE] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#A6947D]" /> KYC Protocol
              </h1>
              <p className="text-[#A6947D]/60 text-[8px] md:text-[10px] font-mono uppercase tracking-widest mt-0.5">Institutional Verification</p>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10 w-full">
        
        {/* STATUS BANNER */}
        <div className={`mb-8 md:mb-10 rounded-2xl p-5 md:p-6 border flex items-start md:items-center gap-4 ${
          profile?.status === 'verified' ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-400' :
          profile?.status === 'pending' ? 'bg-amber-900/10 border-amber-500/30 text-amber-500' :
          'bg-red-900/10 border-red-500/30 text-red-400'
        }`}>
          <div className="shrink-0 mt-1 md:mt-0">
            {profile?.status === 'verified' && <CheckCircle2 size={28} />}
            {profile?.status === 'pending' && <Clock size={28} />}
            {(profile?.status === 'unverified' || !profile?.status) && <AlertOctagon size={28} />}
          </div>
          
          <div>
            <h2 className="text-sm md:text-lg font-bold uppercase tracking-widest">
              {profile?.status === 'verified' ? 'Entity Verified' : profile?.status === 'pending' ? 'Verification Pending' : 'Action Required'}
            </h2>
            <p className="text-[10px] md:text-xs font-mono opacity-80 mt-1 leading-relaxed">
              {profile?.status === 'verified' ? 'Approved. You have full network access.' : 
               profile?.status === 'pending' ? 'Documents under review by AXON Compliance.' : 
               'Submit details to unlock trading capabilities.'}
            </p>
          </div>
        </div>

        {/* KYC FORM */}
        {profile?.status !== 'verified' && (
          <div className="bg-[#01030A] border border-[#A6947D]/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#A6947D]/5 rounded-full blur-[40px] pointer-events-none"></div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10 w-full">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-[#A6947D] uppercase font-bold tracking-widest">Legal Entity Name</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6947D]/60" />
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required disabled={profile?.status === 'pending'} className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl pl-12 pr-4 py-4 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all" placeholder="Entity Name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] text-[#A6947D] uppercase font-bold tracking-widest">Tax ID / VAT No.</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A6947D]/60" />
                    <input type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} required disabled={profile?.status === 'pending'} className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl pl-12 pr-4 py-4 text-sm font-mono text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] transition-all" placeholder="VAT Number" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] text-[#A6947D] uppercase font-bold tracking-widest">Incorporation Region</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)} required disabled={profile?.status === 'pending'} className="w-full bg-[#020509] border border-[#A6947D]/30 rounded-xl px-4 py-4 text-sm text-[#F8F5EE] focus:outline-none focus:border-[#A6947D] appearance-none cursor-pointer transition-all">
                  <option value="" disabled>Select Country</option>
                  <option value="Greece">Greece</option>
                  <option value="Italy">Italy</option>
                  <option value="Turkey">Turkey</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2 pt-4 border-t border-[#A6947D]/10 w-full">
                <label className="text-[9px] md:text-[10px] text-[#A6947D] uppercase font-bold tracking-widest">Corporate Documentation</label>
                <div className="relative border-2 border-dashed border-[#A6947D]/30 rounded-xl p-6 md:p-8 text-center hover:border-[#A6947D]/60 transition-colors bg-[#020509]/50 overflow-hidden w-full">
                  <input type="file" onChange={handleFileChange} disabled={profile?.status === 'pending'} accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <UploadCloud size={32} className="mx-auto text-[#A6947D]/60 mb-3" />
                  <p className="text-xs md:text-sm font-serif text-[#F8F5EE] truncate px-4">
                    {file ? file.name : "Tap to upload Cert. of Incorporation"}
                  </p>
                  <p className="text-[8px] md:text-[9px] font-mono text-[#A6947D]/40 uppercase tracking-widest mt-2">Max Size: 5MB</p>
                </div>
              </div>

              <div className="bg-[#020509] border border-[#A6947D]/10 rounded-xl p-4 flex gap-3 items-start w-full">
                <input type="checkbox" id="terms" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} disabled={profile?.status === 'pending'} className="mt-1 w-4 h-4 shrink-0 accent-[#A6947D] cursor-pointer" />
                <label htmlFor="terms" className="text-[9px] md:text-[10px] text-[#F8F5EE]/50 font-mono leading-relaxed cursor-pointer select-none">
                  I declare accuracy of info. AXON is a Software Provider & Escrow Facilitator. No liability for physical quality or logistics. <span className="text-[#A6947D]">Terms & Conditions apply.</span>
                </label>
              </div>

              <button 
                type="submit" 
                disabled={submitting || profile?.status === 'pending' || !acceptedTerms}
                className="w-full bg-[#A6947D] text-[#020509] font-bold uppercase tracking-[0.2em] py-4 md:py-5 rounded-xl transition-all text-[10px] md:text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-6 shadow-xl"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock size={16}/> Synchronize Verification</>}
              </button>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}