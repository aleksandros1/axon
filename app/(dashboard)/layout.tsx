import React from 'react';
import BuyerSidebar from '@/app/components/BuyerSidebar';

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#020509] overflow-hidden text-[#F8F5EE]">
      {/* Sidebar - Σταθερό στο πλάι */}
      <BuyerSidebar />
      
      {/* Main Content 
        Προσθήκη custom-scrollbar για να ταιριάζει με το dark theme 
        και διατήρηση του ml-[280px] για να μην πέφτει πάνω στο sidebar.
      */}
      <main className="flex-1 ml-[280px] overflow-y-auto h-screen relative scroll-smooth custom-scrollbar">
        {/* Αφαιρέσαμε το max-w-1600px αν θέλεις η γκαλερί να είναι πιο επιβλητική 
          ή το αφήνουμε για να μην "απλώνουν" υπερβολικά οι φωτογραφίες σε ultra-wide οθόνες.
        */}
        <div className="w-full">
           {children}
        </div>
      </main>
    </div>
  );
}