'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// ΠΡΟΣΤΕΘΗΚΕ ΤΟ FileSignature ΣΤΑ ICONS
import { LayoutDashboard, Archive, MessageSquare, PlusSquare, LogOut, Shield, Crosshair, FileSignature } from 'lucide-react';
import SidebarLanguageSwitcher from './SidebarLanguageSwitcher'; // Προσάρμοσε το path αν χρειάζεται

const navLinks = [
  { name: 'ACTION CENTER', href: '/dashboard', icon: LayoutDashboard },
  { name: 'MY VAULT', href: '/vault', icon: Archive },
  { name: 'SCANNER', href: '/scanner', icon: Crosshair },
  { name: 'DEALS VAULT', href: '/contracts', icon: FileSignature },
  { name: 'DEAL DESK', href: '/inbox', icon: MessageSquare },
];

export default function SellerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-[#020509] border-r border-[#1A1D24] flex flex-col fixed left-0 top-0 z-40">
      {/* L O G O  S E C T I O N */}
      <div className="flex flex-col items-center justify-center pt-10 pb-6">
        <div className="w-10 h-10 border border-[#A6947D]/40 flex items-center justify-center mb-4 bg-[#1A1D24]/50">
          <Shield size={18} className="text-[#A6947D]" />
        </div>
        <h1 className="text-xl font-serif text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
        <p className="text-[8px] text-[#A6947D] tracking-[0.3em] font-bold uppercase">Vendor Cockpit</p>
      </div>

      <div className="px-6 mb-6">
         {/* THE ZERO FRICTION UPLOAD BUTTON */}
         <Link href="/vault/new" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#A6947D] to-[#8A7961] hover:from-[#B8A68F] hover:to-[#A6947D] text-[#020509] py-3.5 px-4 rounded-xl font-bold tracking-widest text-[10px] uppercase transition-all shadow-[0_0_20px_rgba(166,148,125,0.2)] hover:shadow-[0_0_30px_rgba(166,148,125,0.4)]">
            <PlusSquare size={14} />
            Upload New Asset
         </Link>
      </div>

      <SidebarLanguageSwitcher />

      {/* N A V I G A T I O N */}
      <nav className="flex-1 px-4 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                  ? 'bg-[#1A1D24] border border-[#A6947D]/20 shadow-inner' 
                  : 'hover:bg-[#0A0D14]'
              }`}
            >
              <Icon 
                size={16} 
                className={isActive ? 'text-[#A6947D]' : 'text-[#F8F5EE]/40 group-hover:text-[#A6947D]/70 transition-colors'} 
              />
              <span className={`text-[10px] font-bold tracking-widest ${isActive ? 'text-[#F8F5EE]' : 'text-[#F8F5EE]/60 group-hover:text-[#F8F5EE]'} transition-colors`}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* F O O T E R  S E C T I O N */}
      <div className="p-6 mt-auto border-t border-[#1A1D24]">
        <button className="flex items-center gap-3 text-[#E53935]/60 hover:text-[#E53935] transition-colors w-full px-4 py-2">
          <LogOut size={14} />
          <span className="text-[10px] font-bold tracking-widest uppercase">System Exit</span>
        </button>
      </div>
    </aside>
  );
}