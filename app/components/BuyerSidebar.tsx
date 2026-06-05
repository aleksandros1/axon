'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// ΠΡΟΣΤΕΘΗΚΕ ΤΟ Crosshair ΣΤΑ ICONS
import { Layers3, Globe, Users, MessageSquare, UserCircle, LogOut, Crosshair } from 'lucide-react';
import { useLanguage } from '../../lib/i18n/LanguageContext';
import SidebarLanguageSwitcher from './SidebarLanguageSwitcher';
import { supabase } from '../../lib/supabase';

export default function BuyerSidebar() {
  const pathname = usePathname(); // Ανιχνεύει σε ποιο URL είμαστε
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  // Η λίστα με τα μενού (ΠΡΟΣΤΕΘΗΚΕ ΤΟ SCANNER)
  const navItems = [
    { href: '/dashboard', icon: Layers3, label: t('menu.portfolio') || 'PORTFOLIO & DEALS' },
    { href: '/scanner', icon: Crosshair, label: t('menu.scanner') || 'ASSET DIGITIZATION' },
    { href: '/trading', icon: Globe, label: t('menu.floor') || 'TRADING FLOOR' },
    { href: '/network', icon: Users, label: t('menu.network') || 'GLOBAL NETWORK' },
    { href: '/inbox', icon: MessageSquare, label: t('menu.comms') || 'SECURE COMMS' },
    { href: '/me', icon: UserCircle, label: t('menu.profile') || 'CORPORATE PROFILE' },
  ];

  return (
    <aside className="w-[280px] flex-none bg-[#01030A] border-r border-[#A6947D]/10 hidden md:flex flex-col z-20 shadow-2xl fixed h-full">
      <div className="p-8 pb-10 relative z-10 flex flex-col items-center border-b border-[#A6947D]/10 mb-6">
        <div className="w-12 h-12 border border-[#A6947D]/30 rounded-full flex items-center justify-center relative mb-4 bg-[#01030A]">
          <Globe size={20} className="text-[#A6947D]"/>
        </div>
        <h1 className="text-2xl font-serif uppercase text-[#F8F5EE] tracking-[0.2em] mb-1">AXON</h1>
        <p className="text-[#A6947D]/80 text-[8px] font-bold uppercase tracking-[0.3em]">{t('common.institutional_grade') || 'INSTITUTIONAL GRADE'}</p>
      </div>
      
      <SidebarLanguageSwitcher />
      
      <nav className="flex-1 px-4 space-y-2 relative z-10 text-[10px] font-bold uppercase tracking-widest mt-4">
        {navItems.map((item) => {
          // Ελέγχει αν το τωρινό URL ταιριάζει με το link για να το φωτίσει!
          const isActive = pathname?.startsWith(item.href);
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-[#A6947D]/10 text-[#A6947D] border border-[#A6947D]/20 shadow-inner' 
                  : 'text-[#F8F5EE]/60 hover:text-[#A6947D]'
              }`}
            >
              <item.icon size={16} /> {item.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-[#A6947D]/10">
        <button onClick={handleLogout} className="text-red-400/80 hover:text-red-400 text-[10px] font-bold uppercase flex items-center gap-2 w-full">
          <LogOut size={16} /> {t('common.disconnect') || 'DISCONNECT SESSION'}
        </button>
      </div>
    </aside>
  );
}