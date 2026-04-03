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
    auth: { request_access: 'REQUEST ACCESS' },
    menu: { portfolio: 'PORTFOLIO & DEALS', scanner: 'ASSET SCANNER', floor: 'PUBLIC MARKET', network: 'GLOBAL NETWORK', comms: 'SECURE COMMS', profile: 'CORPORATE PROFILE' },
    common: { institutional_grade: 'INSTITUTIONAL GRADE', disconnect: 'DISCONNECT', syncing: 'Synchronizing...', error: 'Error' },
    trading: { title: 'GLOBAL EXECUTION FLOOR', no_assets: 'Zero Assets Found' },
    dashboard: { title: 'PORTFOLIO OVERSIGHT', active_supply: 'Active Supply', tracked_targets: 'TRACKED TARGETS', pending_execution: 'Pending Execution', my_assets: 'MY ASSETS', tracked_vault: 'TRACKED VAULT', incoming: 'INCOMING DEALS', outgoing: 'OUTGOING DEALS' },
    scanner: { title: 'ASSET DIGITIZATION', digitize: 'DIGITIZE INVENTORY', material: 'MATERIAL', valuation: 'VALUATION (€)', origin: 'ORIGIN', location: 'LOCATION', thickness: 'THICKNESS (CM)', quantity: 'QUANTITY (M²)', incoterm: 'INCOTERM', visual_data: 'VISUAL DATA', add_photo: 'ADD PHOTO', publish_btn: 'PUBLISH TO LEDGER', success_title: 'ASSET DIGITIZED', success_subtitle: 'Successfully published to global ledger' },
    inbox: { title: 'SECURE COMMUNICATIONS', encryption_active: 'End-to-End Encryption Active' },
    network: { title: 'GLOBAL NETWORK', nodes: 'Active Nodes' }
  },
  el: {
    landing: {
      network_online: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ ONLINE',
      hero_title_1: 'ΤΟ',
      hero_title_2: 'ΘΕΣΜΙΚΟ',
      hero_title_3: 'ΧΡΗΜΑΤΙΣΤΗΡΙΟ ΜΑΡΜΑΡΩΝ',
      hero_subtitle: 'Το AXON είναι το κορυφαίο τερματικό συναλλαγών B2B για φυσικά πετρώματα. Συνδέουμε πιστοποιημένα λατομεία απευθείας με διεθνείς θεσμικούς αγοραστές μέσω ασφαλών συμβολαίων smart-escrow.',
      hero_btn: 'ΕΙΣΟΔΟΣ ΣΤΟ ΤΕΡΜΑΤΙΚΟ',
      services_btn: 'ΕΞΕΡΕΥΝΗΣΗ ΥΠΗΡΕΣΙΩΝ',
      verified_asset: 'ΠΙΣΤΟΠΟΙΗΜΕΝΟ ΥΛΙΚΟ',
      slab_bundle: 'ΠΑΚΕΤΟ ΠΛΑΚΩΝ',
      per_bundle: '/ ΠΑΚΕΤΟ'
    },
    auth: { request_access: 'ΑΙΤΗΜΑ ΠΡΟΣΒΑΣΗΣ' },
    menu: { portfolio: 'ΧΑΡΤΟΦΥΛΑΚΙΟ & ΣΥΜΦΩΝΙΕΣ', scanner: 'ΣΑΡΩΤΗΣ ΥΛΙΚΩΝ', floor: 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ', network: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ', comms: 'ΑΣΦΑΛΕΙΣ ΣΥΝΟΜΙΛΙΕΣ', profile: 'ΕΤΑΙΡΙΚΟ ΠΡΟΦΙΛ' },
    common: { institutional_grade: 'ΘΕΣΜΙΚΟΥ ΕΠΙΠΕΔΟΥ', disconnect: 'ΑΠΟΣΥΝΔΕΣΗ', syncing: 'Συγχρονισμός...', error: 'Σφάλμα' },
    trading: { title: 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ', no_assets: 'Δεν βρέθηκαν υλικά' },
    dashboard: { title: 'ΕΠΙΒΛΕΨΗ ΧΑΡΤΟΦΥΛΑΚΙΟΥ', active_supply: 'Ενεργό Απόθεμα', tracked_targets: 'ΣΤΟΧΟΙ (VAULT)', pending_execution: 'Εκκρεμής Εκτέλεση', my_assets: 'ΤΑ ΥΛΙΚΑ ΜΟΥ', tracked_vault: 'ΠΑΡΑΚΟΛΟΥΘΟΥΜΕΝΑ', incoming: 'ΕΙΣΕΡΧΟΜΕΝΕΣ', outgoing: 'ΕΞΕΡΧΟΜΕΝΕΣ' },
    scanner: { title: 'ΨΗΦΙΟΠΟΙΗΣΗ ΥΛΙΚΟΥ', digitize: 'ΚΑΤΑΧΩΡΗΣΗ ΑΠΟΘΕΜΑΤΟΣ', material: 'ΥΛΙΚΟ', valuation: 'ΑΞΙΑ (€)', origin: 'ΠΡΟΕΛΕΥΣΗ', location: 'ΤΟΠΟΘΕΣΙΑ', thickness: 'ΠΑΧΟΣ (CM)', quantity: 'ΠΟΣΟΤΗΤΑ (M²)', incoterm: 'ΟΡΟΙ ΠΑΡΑΔΟΣΗΣ', visual_data: 'ΟΠΤΙΚΑ ΔΕΔΟΜΕΝΑ', add_photo: 'ΠΡΟΣΘΗΚΗ', publish_btn: 'ΑΝΑΡΤΗΣΗ ΣΤΟ ΔΙΚΤΥΟ', success_title: 'ΕΠΙΤΥΧΗΣ ΨΗΦΙΟΠΟΙΗΣΗ', success_subtitle: 'Το υλικό αναρτήθηκε στο δίκτυο' },
    inbox: { title: 'ΑΣΦΑΛΕΙΣ ΕΠΙΚΟΙΝΩΝΙΕΣ', encryption_active: 'Κρυπτογράφηση Ενεργή' },
    network: { title: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ', nodes: 'Ενεργοί Κόμβοι' }
  },
  ru: {
    landing: {
      network_online: 'ГЛОБАЛЬНАЯ СЕТЬ ОНЛАЙН',
      hero_title_1: 'ГЛОБАЛЬНАЯ',
      hero_title_2: 'ИНСТИТУЦИОНАЛЬНАЯ',
      hero_title_3: 'БИРЖА МРАМОРА',
      hero_subtitle: 'AXON — это ведущий торговый терминал B2B для натурального камня. Мы напрямую соединяем проверенные добывающие предприятия с глобальными институциональными покупателями.',
      hero_btn: 'ВОЙТИ В ТЕРМИНАЛ',
      services_btn: 'УСЛУГИ',
      verified_asset: 'ПРОВЕРЕННЫЙ АКТИВ',
      slab_bundle: 'ПАРТИЯ ПЛИТ',
      per_bundle: '/ ПАРТИЯ'
    },
    auth: { request_access: 'ЗАПРОСИТЬ ДОСТУП' },
    menu: { portfolio: 'ПОРТФЕЛЬ И СДЕЛКИ', scanner: 'СКАНЕР АКТИВОВ', floor: 'ОТКРЫТЫЙ РЫНОК', network: 'ГЛОБАЛЬНАЯ СЕТЬ', comms: 'БЕЗОПАСНАЯ СВЯЗЬ', profile: 'ПРОФИЛЬ КОМПАНИИ' },
    common: { institutional_grade: 'ИНСТИТУЦИОНАЛЬНЫЙ УРОВЕНЬ', disconnect: 'ОТКЛЮЧИТЬСЯ', syncing: 'Синхронизация...', error: 'Ошибка' },
    trading: { title: 'ГЛОБАЛЬНЫЙ РЫНОК', no_assets: 'Активы не найдены' },
    dashboard: { title: 'ОБЗОР ПОРТФЕЛЯ', active_supply: 'Активное предложение', tracked_targets: 'ОТСЛЕЖИВАЕМЫЕ ЦЕЛИ', pending_execution: 'Ожидает выполнения', my_assets: 'МОИ АКТИВЫ', tracked_vault: 'ОТСЛЕЖИВАЕМОЕ', incoming: 'ВХОДЯЩИЕ СДЕЛКИ', outgoing: 'ИСХОДЯЩИЕ СДЕЛКИ' },
    scanner: { title: 'ОЦИФРОВКА АКТИВОВ', digitize: 'ОЦИФРОВКА ИНВЕНТАРЯ', material: 'МАТЕРИАЛ', valuation: 'ОЦЕНКА (€)', origin: 'ПРОИСХОЖДЕНИЕ', location: 'МЕСТОПОЛОЖЕНИЕ', thickness: 'ТОЛЩИНА (CM)', quantity: 'КОЛИЧЕСТВО (M²)', incoterm: 'ИНКОТЕРМС', visual_data: 'ВИЗУАЛЬНЫЕ ДАННЫЕ', add_photo: 'ДОБАВИТЬ ФОТО', publish_btn: 'ОПУБЛИКОВАТЬ', success_title: 'АКТИВ ОЦИФРОВАН', success_subtitle: 'Успешно опубликовано' },
    inbox: { title: 'БЕЗОПАСНАЯ СВЯЗЬ', encryption_active: 'Шифрование активно' },
    network: { title: 'ГЛОБАЛЬНАЯ СЕТЬ', nodes: 'Активные узлы' }
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
    const keys = key.toLowerCase().split('.'); // Μετατροπή σε πεζά για σιγουριά
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