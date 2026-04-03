'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'el' | 'ar' | 'it' | 'es' | 'tr' | 'zh' | 'pt' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: any = {
  en: {
    landing: {
      network_online: 'GLOBAL NETWORK ONLINE',
      hero_title_1: 'THE',
      hero_title_2: 'INSTITUTIONAL',
      hero_title_3: 'MARBLE EXCHANGE',
      hero_subtitle: 'AXON is the premier B2B trading terminal for natural stone. We connect verified extraction entities directly with global institutional buyers through secure smart-escrow contracts.',
      hero_btn: 'ENTER TERMINAL',
      services_btn: 'EXPLORE SERVICES',
      verified_asset: 'VERIFIED ASSET',
      slab_bundle: 'SLAB BUNDLE',
      per_bundle: '/ BUNDLE'
    },
    menu: {
      portfolio: 'PORTFOLIO & DEALS',
      scanner: 'AI SCANNER',
      floor: 'TRADING FLOOR',
      network: 'GLOBAL NETWORK',
      comms: 'SECURE COMMS',
      profile: 'CORPORATE PROFILE'
    },
    common: {
      institutional_grade: 'INSTITUTIONAL GRADE',
      command_center: 'COMMAND CENTER',
      core_modules: 'CORE MODULES',
      system: 'SYSTEM',
      disconnect: 'DISCONNECT SESSION',
      syncing: 'Synchronizing...',
      error: 'Error'
    },
    trading: {
      title: 'TRADING FLOOR',
      no_assets: 'Zero Assets Found'
    },
    dashboard: {
      title: 'PORTFOLIO OVERSIGHT',
      active_supply: 'Active Supply',
      tracked_targets: 'TRACKED TARGETS',
      pending_execution: 'Pending Execution',
      my_assets: 'MY ASSETS',
      tracked_vault: 'TRACKED VAULT',
      incoming: 'INCOMING DEALS',
      outgoing: 'OUTGOING DEALS'
    },
    scanner: {
      title: 'AI ASSET SCANNER',
      digitize: 'DIGITIZE INVENTORY',
      material: 'MATERIAL',
      valuation: 'VALUATION (€)',
      origin: 'ORIGIN',
      location: 'LOCATION',
      thickness: 'THICKNESS (CM)',
      quantity: 'QUANTITY (M²)',
      incoterm: 'INCOTERM',
      visual_data: 'VISUAL DATA',
      add_photo: 'ADD PHOTO',
      publish_btn: 'PUBLISH TO LEDGER',
      success_title: 'ASSET DIGITIZED',
      success_subtitle: 'Successfully published to global ledger'
    },
    inbox: {
      title: 'SECURE COMMUNICATIONS',
      encryption_active: 'End-to-End Encryption Active'
    },
    network: {
      title: 'GLOBAL NETWORK',
      nodes: 'Active Nodes'
    }
  },
  el: {
    landing: {
      network_online: 'GLOBAL NETWORK ONLINE',
      hero_title_1: 'ΤΟ',
      hero_title_2: 'ΘΕΣΜΙΚΟ',
      hero_title_3: 'MARBLE EXCHANGE',
      hero_subtitle: 'Το AXON είναι το κορυφαίο τερματικό συναλλαγών B2B για φυσικά πετρώματα. Σύνδεση πιστοποιημένων οντοτήτων με διεθνείς θεσμικούς αγοραστές μέσω smart-escrow.',
      hero_btn: 'ENTER TERMINAL',
      services_btn: 'EXPLORE SERVICES',
      verified_asset: 'VERIFIED ASSET',
      slab_bundle: 'SLAB BUNDLE',
      per_bundle: '/ BUNDLE'
    },
    menu: {
      portfolio: 'PORTFOLIO & DEALS',
      scanner: 'AI SCANNER',
      floor: 'TRADING FLOOR',
      network: 'GLOBAL NETWORK',
      comms: 'SECURE COMMS',
      profile: 'CORPORATE PROFILE'
    },
    common: {
      institutional_grade: 'INSTITUTIONAL GRADE',
      command_center: 'COMMAND CENTER',
      core_modules: 'CORE MODULES',
      system: 'SYSTEM',
      disconnect: 'DISCONNECT SESSION',
      syncing: 'Συγχρονισμός...',
      error: 'Σφάλμα'
    },
    trading: {
      title: 'TRADING FLOOR',
      no_assets: 'Δεν βρέθηκαν υλικά'
    },
    dashboard: {
      title: 'PORTFOLIO OVERSIGHT',
      active_supply: 'Ενεργό Απόθεμα',
      tracked_targets: 'TRACKED TARGETS',
      pending_execution: 'Εκκρεμής Εκτέλεση',
      my_assets: 'MY ASSETS',
      tracked_vault: 'TRACKED VAULT',
      incoming: 'INCOMING',
      outgoing: 'OUTGOING'
    },
    scanner: {
      title: 'AI ASSET SCANNER',
      digitize: 'DIGITIZE INVENTORY',
      material: 'ΥΛΙΚΟ',
      valuation: 'VALUATION (€)',
      origin: 'ORIGIN',
      location: 'LOCATION',
      thickness: 'THICKNESS (CM)',
      quantity: 'QUANTITY (M²)',
      incoterm: 'INCOTERM',
      visual_data: 'VISUAL DATA',
      add_photo: 'ADD PHOTO',
      publish_btn: 'PUBLISH TO LEDGER',
      success_title: 'ASSET DIGITIZED',
      success_subtitle: 'Το υλικό αναρτήθηκε στο παγκόσμιο δίκτυο'
    },
    inbox: {
      title: 'SECURE COMMS',
      encryption_active: 'End-to-End Encryption Active'
    },
    network: {
      title: 'GLOBAL NETWORK',
      nodes: 'Active Nodes'
    }
  },
  ru: {
    landing: {
      network_online: 'ГЛОБАЛЬНАЯ СЕТЬ ОНЛАЙН',
      hero_title_1: 'ГЛОБАЛЬНАЯ',
      hero_title_2: 'ИНСТИТУЦИОНАЛЬНАЯ',
      hero_title_3: 'БИРЖА МРАМОРА',
      hero_subtitle: 'AXON — это ведущий торговый терминал B2B для натурального камня.',
      hero_btn: 'ВОЙТИ В ТЕРМИНАЛ',
      services_btn: 'УСЛУГИ',
      verified_asset: 'ПРОВЕРЕННЫЙ АКТИВ',
      slab_bundle: 'ПАРТИЯ ПЛИТ',
      per_bundle: '/ ПАРТИЯ'
    },
    menu: { portfolio: 'PORTFOLIO & DEALS', scanner: 'AI SCANNER', floor: 'TRADING FLOOR', network: 'GLOBAL NETWORK', comms: 'SECURE COMMS', profile: 'CORPORATE PROFILE' },
    common: { institutional_grade: 'INSTITUTIONAL GRADE', command_center: 'COMMAND CENTER', core_modules: 'CORE MODULES', system: 'SYSTEM', disconnect: 'DISCONNECT', syncing: 'Синхронизация...', error: 'Ошибка' },
    trading: { title: 'TRADING FLOOR', no_assets: 'Активы не найдены' },
    dashboard: { title: 'PORTFOLIO OVERSIGHT', active_supply: 'Активное предложение', tracked_targets: 'TRACKED TARGETS', pending_execution: 'Ожидает выполнения', my_assets: 'MY ASSETS', tracked_vault: 'TRACKED VAULT', incoming: 'INCOMING', outgoing: 'OUTGOING' },
    scanner: { title: 'AI ASSET SCANNER', digitize: 'DIGITIZE INVENTORY', material: 'МАТЕРИАЛ', valuation: 'VALUATION (€)', origin: 'ORIGIN', location: 'LOCATION', thickness: 'THICKNESS (CM)', quantity: 'QUANTITY (M²)', incoterm: 'INCOTERM', visual_data: 'VISUAL DATA', add_photo: 'ADD PHOTO', publish_btn: 'PUBLISH', success_title: 'ASSET DIGITIZED', success_subtitle: 'Успешно опубликовано' },
    inbox: { title: 'SECURE COMMS', encryption_active: 'End-to-End Encryption Active' },
    network: { title: 'GLOBAL NETWORK', nodes: 'Active Nodes' }
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('axon_language') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('axon_language', lang);
  };

  const t = (key: string) => {
    const keys = key.toLowerCase().split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value && value[k]) { value = value[k]; } 
      else {
        let enValue: any = translations['en'];
        for (const enK of keys) {
          if (enValue && enValue[enK]) enValue = enValue[enK];
          else return key;
        }
        return enValue;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return { language: 'en', setLanguage: () => {}, t: (s: string) => s };
  }
  return context;
};