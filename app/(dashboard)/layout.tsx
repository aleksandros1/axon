import React from 'react';
import BuyerSidebar from '@/app/components/BuyerSidebar'; // Βεβαιώσου ότι το import path είναι σωστό

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#020509] overflow-hidden text-[#F8F5EE]">
      <BuyerSidebar />
      {/* Το main content ξεκινάει δεξιά από το sidebar (280px) */}
      <main className="flex-1 ml-[280px] overflow-y-auto h-screen relative scroll-smooth">
        <div className="max-w-[1600px] mx-auto p-8 lg:p-12">
           {children}
        </div>
      </main>
    </div>
  );
}