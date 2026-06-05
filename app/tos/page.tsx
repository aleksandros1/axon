import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-[100dvh] w-full bg-[#020509] flex flex-col items-center py-12 px-4 relative overflow-hidden font-sans text-[#F8F5EE] selection:bg-[#A6947D]/30">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] fixed">
        <Shield size={800} className="text-[#A6947D]" />
      </div>

      <div className="w-full max-w-4xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* BACK BUTTON */}
        <Link href="/auth" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#A6947D]/60 hover:text-[#A6947D] transition-colors mb-8 group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> RETURN TO AUTHENTICATION
        </Link>

        {/* CONTENT BOX */}
        <div className="bg-[#01030A]/80 backdrop-blur-xl border border-[#A6947D]/20 p-8 md:p-12 rounded-2xl shadow-2xl">
          <h1 className="text-2xl font-serif uppercase tracking-widest text-[#A6947D] mb-8 border-b border-[#A6947D]/20 pb-4">
            AXON Institutional Marketplace: Terms of Service & Escrow Protocol
          </h1>
          
          <div className="space-y-8 text-[11px] leading-relaxed tracking-wider text-[#A6947D]/80">
            <p className="text-[9px] font-bold tracking-[0.2em] text-[#F8F5EE]/50">LAST UPDATED: MAY 2026</p>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">1.</span> Platform Role & Non-Custodial Nature
              </h2>
              <p className="pl-5">
                AXON operates exclusively as a B2B technology provider and digital infrastructure network. <strong className="text-[#A6947D]">AXON is not a bank, financial institution, or licensed custodian.</strong> All financial transactions, Know Your Business (KYB) compliance, and escrow fund retention are executed entirely by our licensed Electronic Money Institution (EMI) partner, Trustshare (or respective authorized EMI). AXON never holds, touches, or assumes legal ownership of User funds at any point in the transaction lifecycle.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">2.</span> B2B Escrow Clearance & Milestone Release
              </h2>
              <p className="pl-5">
                By utilizing the AXON Secure Escrow Protocol, the Buyer agrees to deposit the full transaction amount into the designated EMI escrow account. Funds are strictly locked and will only be released to the Seller upon the fulfillment of predefined digital milestones (e.g., upload and algorithmic verification of the Bill of Lading or equivalent shipping documents). Once the protocol criteria are met, the release of funds is irreversible.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">3.</span> The Inspection Clause & Dispute Resolution
              </h2>
              <p className="pl-5">
                AXON facilitates the transaction of premium, natural raw materials. It is the sole responsibility of the Buyer to mandate an independent, third-party physical inspection (e.g., SGS, Bureau Veritas) <strong className="text-[#A6947D]">prior to loading</strong>. 
                <br/><br/>
                If the Buyer waives their right to pre-shipment inspection, they legally accept the material <strong className="text-[#A6947D]">"AS IS"</strong> at the point of origin. AXON assumes zero liability for material fractures, quality discrepancies, or transit damages discovered post-loading. Escrow funds will not be withheld for disputes arising after the verified execution of the loading milestone.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">4.</span> Platform Fees & Autonomous Routing
              </h2>
              <p className="pl-5">
                The utilization of the AXON Escrow network incurs a predefined platform fee. By authorizing a transaction, Users agree that this fee is compensation strictly for the deployment of AXON’s proprietary routing technology, network access, and document verification protocols. This fee is automatically deducted at the point of clearance by the EMI layer, prior to the final disbursement to the Seller. The Seller receives the exact negotiated value, net of any Buyer-assumed platform costs.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">5.</span> Institutional Clearance & Access Revocation
              </h2>
              <p className="pl-5">
                Access to the AXON network is strictly by approval. AXON reserves the right to immediately terminate access, lock accounts, or suspend transactions if an Entity fails subsequent AML (Anti-Money Laundering) checks, engages in fraudulent documentation practices, or violates the integrity of the ecosystem.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">6.</span> Limitation of Liability & Force Majeure
              </h2>
              <p className="pl-5">
                To the maximum extent permitted by applicable law, AXON shall not be held liable for any indirect, incidental, or consequential damages, loss of profits, or disruption of business operations. Furthermore, AXON is exempt from performance obligations in the event of Force Majeure (including but not limited to global pandemics, geopolitical conflicts, port closures, or catastrophic failures of third-party EMI infrastructure).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-[13px] font-bold text-[#F8F5EE] uppercase tracking-widest flex items-center gap-2">
                <span className="text-[#A6947D]">7.</span> Governing Law & Jurisdiction
              </h2>
              <p className="pl-5">
                These Terms of Service and any dispute or claim arising out of them shall be governed by and construed in accordance with the laws of Greece. Any legal action or proceeding shall be brought exclusively in the courts of Athens, Greece, and Users irrevocably submit to this jurisdiction.
              </p>
            </section>
          </div>
        </div>
        
      </div>
    </div>
  );
}