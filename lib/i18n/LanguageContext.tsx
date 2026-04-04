'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'el' | 'ar' | 'it' | 'es' | 'tr' | 'zh' | 'pt' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// --- Ο ΑΥΤΟΜΑΤΟΣ ΚΑΘΑΡΙΣΤΗΣ (SAFEGUARD) ---
// Αν το σύστημα δεν βρει μια λέξη, καθαρίζει τις τελείες και τις κάτω παύλες 
// και τη μετατρέπει σε κανονικό, κεφαλαίο τίτλο (π.χ. dashboard.my_assets -> MY ASSETS)
const cleanFallback = (key: string) => {
  if (!key) return '';
  const lastPart = key.split('.').pop() || key;
  return lastPart.replace(/_/g, ' ').toUpperCase();
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: any = {
  en: {
    landing: { network_online: 'GLOBAL NETWORK ONLINE', hero_title_1: 'THE', hero_title_2: 'INSTITUTIONAL', hero_title_3: 'MARBLE EXCHANGE', hero_subtitle: 'AXON is the premier B2B trading terminal for natural stone.', hero_btn: 'ENTER TERMINAL', services_btn: 'EXPLORE SERVICES', verified_asset: 'VERIFIED ASSET', slab_bundle: 'SLAB BUNDLE', per_bundle: '/ BUNDLE' },
    auth: { request_access: 'REQUEST ACCESS' },
    menu: { portfolio: 'PORTFOLIO & DEALS', scanner: 'ASSET SCANNER', floor: 'TRADING FLOOR', network: 'GLOBAL NETWORK', comms: 'SECURE COMMS', profile: 'CORPORATE PROFILE' },
    common: { institutional_grade: 'INSTITUTIONAL GRADE', command_center: 'COMMAND CENTER', core_modules: 'CORE MODULES', system: 'SYSTEM', disconnect: 'DISCONNECT SESSION', syncing: 'Querying Ledger...', error: 'System Error' },
    trading: { title: 'GLOBAL EXECUTION FLOOR', no_assets: 'Zero Assets Found' },
    dashboard: { title: 'PORTFOLIO OVERSIGHT', active_supply: 'ACTIVE SUPPLY', tracked_targets: 'TRACKED TARGETS', pending_execution: 'PENDING EXECUTION', my_assets: 'MY ASSETS', tracked_vault: 'TRACKED VAULT', incoming: 'INCOMING DEALS', outgoing: 'OUTGOING DEALS' },
    scanner: { title: 'ASSET DIGITIZATION', digitize: 'DIGITIZE INVENTORY', material: 'MATERIAL', valuation: 'VALUATION', origin: 'ORIGIN', location: 'LOCATION', thickness: 'THICKNESS', quantity: 'QUANTITY', incoterm: 'INCOTERM', visual_data: 'VISUAL DATA', add_photo: 'ADD PHOTO', publish_btn: 'PUBLISH TO LEDGER', success_title: 'ASSET DIGITIZED', success_subtitle: 'Successfully published to global ledger' },
    inbox: { title: 'SECURE COMMUNICATIONS', encryption_active: 'End-to-End Encryption Active' },
    network: { title: 'GLOBAL NETWORK', nodes: 'Active Nodes' }
  },
  el: {
    landing: { network_online: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ ONLINE', hero_title_1: 'ΤΟ', hero_title_2: 'ΘΕΣΜΙΚΟ', hero_title_3: 'ΧΡΗΜΑΤΙΣΤΗΡΙΟ ΜΑΡΜΑΡΩΝ', hero_subtitle: 'Το AXON είναι το κορυφαίο τερματικό συναλλαγών B2B για φυσικά πετρώματα.', hero_btn: 'ΕΙΣΟΔΟΣ', services_btn: 'ΥΠΗΡΕΣΙΕΣ', verified_asset: 'ΠΙΣΤΟΠΟΙΗΜΕΝΟ ΥΛΙΚΟ', slab_bundle: 'ΠΑΚΕΤΟ ΠΛΑΚΩΝ', per_bundle: '/ ΠΑΚΕΤΟ' },
    auth: { request_access: 'ΑΙΤΗΜΑ ΠΡΟΣΒΑΣΗΣ' },
    menu: { portfolio: 'ΧΑΡΤΟΦΥΛΑΚΙΟ & ΣΥΜΦΩΝΙΕΣ', scanner: 'ΣΑΡΩΤΗΣ ΥΛΙΚΩΝ', floor: 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ', network: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ', comms: 'ΑΣΦΑΛΕΙΣ ΣΥΝΟΜΙΛΙΕΣ', profile: 'ΕΤΑΙΡΙΚΟ ΠΡΟΦΙΛ' },
    common: { institutional_grade: 'ΘΕΣΜΙΚΟΥ ΕΠΙΠΕΔΟΥ', command_center: 'ΚΕΝΤΡΟ ΕΠΙΧΕΙΡΗΣΕΩΝ', core_modules: 'ΒΑΣΙΚΕΣ ΕΝΟΤΗΤΕΣ', system: 'ΣΥΣΤΗΜΑ', disconnect: 'ΑΠΟΣΥΝΔΕΣΗ', syncing: 'Συγχρονισμός...', error: 'Σφάλμα' },
    trading: { title: 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ', no_assets: 'Δεν βρέθηκαν υλικά' },
    dashboard: { title: 'ΕΠΙΒΛΕΨΗ ΧΑΡΤΟΦΥΛΑΚΙΟΥ', active_supply: 'ΕΝΕΡΓΟ ΑΠΟΘΕΜΑ', tracked_targets: 'ΣΤΟΧΟΙ', pending_execution: 'ΕΚΚΡΕΜΕΙΣ', my_assets: 'ΤΑ ΥΛΙΚΑ ΜΟΥ', tracked_vault: 'ΠΑΡΑΚΟΛΟΥΘΟΥΜΕΝΑ', incoming: 'ΕΙΣΕΡΧΟΜΕΝΕΣ', outgoing: 'ΕΞΕΡΧΟΜΕΝΕΣ' },
    scanner: { title: 'ΨΗΦΙΟΠΟΙΗΣΗ ΥΛΙΚΟΥ', digitize: 'ΚΑΤΑΧΩΡΗΣΗ', material: 'ΥΛΙΚΟ', valuation: 'ΑΞΙΑ', origin: 'ΠΡΟΕΛΕΥΣΗ', location: 'ΤΟΠΟΘΕΣΙΑ', thickness: 'ΠΑΧΟΣ', quantity: 'ΠΟΣΟΤΗΤΑ', incoterm: 'ΟΡΟΙ ΠΑΡΑΔΟΣΗΣ', visual_data: 'ΟΠΤΙΚΑ ΔΕΔΟΜΕΝΑ', add_photo: 'ΠΡΟΣΘΗΚΗ', publish_btn: 'ΑΝΑΡΤΗΣΗ', success_title: 'ΕΠΙΤΥΧΗΣ ΨΗΦΙΟΠΟΙΗΣΗ', success_subtitle: 'Το υλικό αναρτήθηκε στο δίκτυο' },
    inbox: { title: 'ΑΣΦΑΛΕΙΣ ΕΠΙΚΟΙΝΩΝΙΕΣ', encryption_active: 'Κρυπτογράφηση Ενεργή' },
    network: { title: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ', nodes: 'Ενεργοί Κόμβοι' }
  },
  ru: {
    landing: { network_online: 'ГЛОБАЛЬНАЯ СЕТЬ ОНЛАЙН', hero_title_1: 'ГЛОБАЛЬНАЯ', hero_title_2: 'ИНСТИТУЦИОНАЛЬНАЯ', hero_title_3: 'БИРЖА МРАМОРА', hero_subtitle: 'AXON — это ведущий торговый терминал B2B для натурального камня.', hero_btn: 'ВОЙТИ', services_btn: 'УСЛУГИ', verified_asset: 'ПРОВЕРЕННЫЙ АКТИВ', slab_bundle: 'ПАРТИЯ ПЛИТ', per_bundle: '/ ПАРТИЯ' },
    auth: { request_access: 'ЗАПРОСИТЬ ДОСТУП' },
    menu: { portfolio: 'ПОРТФЕЛЬ И СДЕЛКИ', scanner: 'СКАНЕР АКТИВОВ', floor: 'ОТКРЫТЫЙ РЫНОК', network: 'ГЛОБАЛЬНАЯ СЕТЬ', comms: 'БЕЗОПАСНАЯ СВЯЗЬ', profile: 'ПРОФИЛЬ КОМПАНИИ' },
    common: { institutional_grade: 'ИНСТИТУЦИОНАЛЬНЫЙ УРОВЕНЬ', command_center: 'КОМАНДНЫЙ ЦЕНТР', core_modules: 'ОСНОВНЫЕ МОДУЛИ', system: 'СИСТЕМА', disconnect: 'ОТКЛЮЧИТЬСЯ', syncing: 'Синхронизация...', error: 'Ошибка' },
    trading: { title: 'ГЛОБАЛЬНЫЙ РЫНОК', no_assets: 'Активы не найдены' },
    dashboard: { title: 'ОБЗОР ПОРТФЕЛЯ', active_supply: 'Активное предложение', tracked_targets: 'ОТСЛЕЖИВАЕМЫЕ ЦЕЛИ', pending_execution: 'Ожидает выполнения', my_assets: 'МОИ АКТИВЫ', tracked_vault: 'ОТСЛЕЖИВАЕМОЕ', incoming: 'ВХОДЯЩИЕ СДЕЛКИ', outgoing: 'ИСХОДЯЩИЕ СДЕЛКИ' },
    scanner: { title: 'ОЦИФРОВКА АКТИВОВ', digitize: 'ОЦИФРОВКА', material: 'МАТЕРИАЛ', valuation: 'ОЦЕНКА', origin: 'ПРОИСХОЖДЕНИЕ', location: 'МЕСТОПОЛОЖЕНИЕ', thickness: 'ТОЛЩИНА', quantity: 'КОЛИЧЕСТВО', incoterm: 'ИНКОТЕРМС', visual_data: 'ВИЗУАЛЬНЫЕ ДАННЫЕ', add_photo: 'ДОБАВИТЬ ФОТО', publish_btn: 'ОПУБЛИКОВАТЬ', success_title: 'АКТИВ ОЦИФРОВАН', success_subtitle: 'Успешно опубликовано' },
    inbox: { title: 'БЕЗОПАСНАЯ СВЯЗЬ', encryption_active: 'Шифрование активно' },
    network: { title: 'ГЛОБАЛЬНАЯ СЕТЬ', nodes: 'Активные узлы' }
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('axon_language') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    } else if (savedLang === 'el') {
      setLanguageState('el');
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('axon_language', lang);
  };

  const t = (key: string) => {
    const path = key.toLowerCase().split('.');
    
    // 1. Έλεγχος στην επιλεγμένη γλώσσα
    let curr = translations[language];
    for (const k of path) {
      if (curr !== undefined && curr !== null) curr = curr[k];
      else { curr = undefined; break; }
    }
    if (curr !== undefined && typeof curr === 'string') return curr;

    // 2. Έλεγχος στα Αγγλικά (ως Fallback)
    let enCurr = translations['en'];
    for (const k of path) {
      if (enCurr !== undefined && enCurr !== null) enCurr = enCurr[k];
      else { enCurr = undefined; break; }
    }
    if (enCurr !== undefined && typeof enCurr === 'string') return enCurr;

    // 3. ΑΠΟΛΥΤΟ SAFEGUARD: Καθαρισμός του κωδικού (αφαιρεί τελείες και _, κάνει κεφαλαία)
    return cleanFallback(key);
  };

  if (!mounted) {
    // Παρέχουμε το cleanFallback και κατά το αρχικό render για να μην "σκάει" τίποτα
    return <LanguageContext.Provider value={{ language: 'en', setLanguage, t: cleanFallback }}>{children}</LanguageContext.Provider>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    return { language: 'en', setLanguage: () => {}, t: cleanFallback };
  }
  return context;
};