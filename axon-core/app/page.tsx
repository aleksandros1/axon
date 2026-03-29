import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-neutral-800">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 border-b border-neutral-800">
        <div className="text-2xl font-bold tracking-tighter">AXON</div>
        <div className="space-x-4 text-sm font-medium text-neutral-400">
          <button className="hover:text-white transition-colors">Suppliers</button>
          <button className="hover:text-white transition-colors">Buyers</button>
          <button className="bg-white text-black px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors">
            Access Platform
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AI Grading Engine v1.0 Offline
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl leading-tight mb-6">
          The Neural Monopoly for <br />
          <span className="text-neutral-500">Premium Natural Stone.</span>
        </h1>
        
        <p className="text-lg text-neutral-400 max-w-2xl mb-10">
          Transforming the global marble supply chain. Institutional-grade AI certification, frictionless B2B trading, and absolute data integrity.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-neutral-200 transition-all">
            Initialize Scanner
          </button>
          <button className="px-8 py-4 bg-transparent border border-neutral-700 font-semibold rounded-lg hover:bg-neutral-900 transition-all">
            View Deadstock Protocol
          </button>
        </div>
      </section>

      {/* Value Props */}
      <section className="grid md:grid-cols-3 gap-8 p-10 max-w-7xl mx-auto border-t border-neutral-900 mt-20">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3">Zero-Trust Certification</h3>
          <p className="text-neutral-500 text-sm">Immutable quality scoring powered by AI analysis. Bypassing human subjectivity.</p>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3">Global Liquidity</h3>
          <p className="text-neutral-500 text-sm">Instant matching between dormant quarry deadstock and verified buyers worldwide.</p>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold mb-3">Escrow Architecture</h3>
          <p className="text-neutral-500 text-sm">End-to-end transaction security. Capital moves only when AI verifies physical delivery.</p>
        </div>
      </section>
    </main>
  );
}
