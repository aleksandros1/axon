'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'el' | 'ar' | 'it' | 'es' | 'tr' | 'zh' | 'pt' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    menu: {
      portfolio: 'PORTFOLIO & DEALS',
      scanner: 'ASSET SCANNER',
      floor: 'PUBLIC MARKET',
      network: 'GLOBAL NETWORK',
      comms: 'SECURE COMMS',
      profile: 'CORPORATE PROFILE'
    },
    common: {
      institutional_grade: 'INSTITUTIONAL GRADE',
      disconnect: 'DISCONNECT',
      syncing: 'Synchronizing...',
      error: 'Error'
    },
    trading: {
      title: 'GLOBAL EXECUTION FLOOR',
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
      title: 'ASSET DIGITIZATION',
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
    menu: {
      portfolio: 'ΧΑΡΤΟΦΥΛΑΚΙΟ & ΣΥΜΦΩΝΙΕΣ',
      scanner: 'ΣΑΡΩΤΗΣ ΥΛΙΚΩΝ',
      floor: 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ',
      network: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ',
      comms: 'ΑΣΦΑΛΕΙΣ ΣΥΝΟΜΙΛΙΕΣ',
      profile: 'ΕΤΑΙΡΙΚΟ ΠΡΟΦΙΛ'
    },
    common: {
      institutional_grade: 'ΘΕΣΜΙΚΟΥ ΕΠΙΠΕΔΟΥ',
      disconnect: 'ΑΠΟΣΥΝΔΕΣΗ',
      syncing: 'Συγχρονισμός...',
      error: 'Σφάλμα'
    },
    trading: {
      title: 'ΔΗΜΟΣΙΑ ΑΓΟΡΑ',
      no_assets: 'Δεν βρέθηκαν υλικά'
    },
    dashboard: {
      title: 'ΕΠΙΒΛΕΨΗ ΧΑΡΤΟΦΥΛΑΚΙΟΥ',
      active_supply: 'Ενεργό Απόθεμα',
      tracked_targets: 'ΣΤΟΧΟΙ (VAULT)',
      pending_execution: 'Εκκρεμής Εκτέλεση',
      my_assets: 'ΤΑ ΥΛΙΚΑ ΜΟΥ',
      tracked_vault: 'ΠΑΡΑΚΟΛΟΥΘΟΥΜΕΝΑ',
      incoming: 'ΕΙΣΕΡΧΟΜΕΝΕΣ',
      outgoing: 'ΕΞΕΡΧΟΜΕΝΕΣ'
    },
    scanner: {
      title: 'ΨΗΦΙΟΠΟΙΗΣΗ ΥΛΙΚΟΥ',
      digitize: 'ΚΑΤΑΧΩΡΗΣΗ ΑΠΟΘΕΜΑΤΟΣ',
      material: 'ΥΛΙΚΟ',
      valuation: 'ΑΞΙΑ (€)',
      origin: 'ΠΡΟΕΛΕΥΣΗ',
      location: 'ΤΟΠΟΘΕΣΙΑ',
      thickness: 'ΠΑΧΟΣ (CM)',
      quantity: 'ΠΟΣΟΤΗΤΑ (M²)',
      incoterm: 'ΟΡΟΙ ΠΑΡΑΔΟΣΗΣ',
      visual_data: 'ΟΠΤΙΚΑ ΔΕΔΟΜΕΝΑ',
      add_photo: 'ΠΡΟΣΘΗΚΗ',
      publish_btn: 'ΑΝΑΡΤΗΣΗ ΣΤΟ ΔΙΚΤΥΟ',
      success_title: 'ΕΠΙΤΥΧΗΣ ΨΗΦΙΟΠΟΙΗΣΗ',
      success_subtitle: 'Το υλικό αναρτήθηκε στο δίκτυο'
    },
    inbox: {
      title: 'ΑΣΦΑΛΕΙΣ ΕΠΙΚΟΙΝΩΝΙΕΣ',
      encryption_active: 'Κρυπτογράφηση Ενεργή'
    },
    network: {
      title: 'ΠΑΓΚΟΣΜΙΟ ΔΙΚΤΥΟ',
      nodes: 'Ενεργοί Κόμβοι'
    }
  },
  ar: {
    menu: { portfolio: 'المحفظة والصفقات', scanner: 'ماسح الأصول', floor: 'السوق العام', network: 'الشبكة العالمية', comms: 'اتصالات آمنة', profile: 'ملف الشركة' },
    common: { institutional_grade: 'مستوى مؤسسي', disconnect: 'قطع الاتصال', syncing: 'مزامنة...', error: 'خطأ' },
    trading: { title: 'قاعة التداول العالمية', no_assets: 'لا توجد أصول' },
    dashboard: { title: 'إشراف المحفظة', active_supply: 'العرض النشط', tracked_targets: 'الأهداف المتعقبة', pending_execution: 'قيد التنفيذ', my_assets: 'أصولي', tracked_vault: 'القبو المتعقب', incoming: 'الصفقات الواردة', outgoing: 'الصفقات الصادرة' },
    scanner: { title: 'رقمنة الأصول', digitize: 'رقمنة المخزون', material: 'مادة', valuation: 'التقييم (€)', origin: 'أصل', location: 'موقع', thickness: 'سماكة (CM)', quantity: 'كمية (M²)', incoterm: 'شروط التسليم', visual_data: 'بيانات مرئية', add_photo: 'إضافة صورة', publish_btn: 'نشر', success_title: 'تمت الرقمنة', success_subtitle: 'نُشر بنجاح' },
    inbox: { title: 'اتصالات آمنة', encryption_active: 'تشفير نشط' },
    network: { title: 'الشبكة العالمية', nodes: 'عقد نشطة' }
  },
  it: {
    menu: { portfolio: 'PORTAFOGLIO & ACCORDI', scanner: 'SCANNER MATERIALI', floor: 'MERCATO PUBBLICO', network: 'RETE GLOBALE', comms: 'COM. SICURE', profile: 'PROFILO AZIENDALE' },
    common: { institutional_grade: 'LIVELLO ISTITUZIONALE', disconnect: 'DISCONNETTI', syncing: 'Sincronizzazione...', error: 'Errore' },
    trading: { title: 'MERCATO GLOBALE', no_assets: 'Zero Asset Trovati' },
    dashboard: { title: 'SUPERVISIONE PORTAFOGLIO', active_supply: 'Offerta Attiva', tracked_targets: 'OBIETTIVI MONITORATI', pending_execution: 'Esecuzione in Sospeso', my_assets: 'I MIEI ASSET', tracked_vault: 'VAULT MONITORATO', incoming: 'ACCORDI IN ENTRATA', outgoing: 'ACCORDI IN USCITA' },
    scanner: { title: 'DIGITALIZZAZIONE ASSET', digitize: 'DIGITALIZZA INVENTARIO', material: 'MATERIALE', valuation: 'VALUTAZIONE (€)', origin: 'ORIGINE', location: 'POSIZIONE', thickness: 'SPESSORE (CM)', quantity: 'QUANTITÀ (M²)', incoterm: 'INCOTERM', visual_data: 'DATI VISIVI', add_photo: 'AGGIUNGI FOTO', publish_btn: 'PUBBLICA', success_title: 'ASSET DIGITALIZZATO', success_subtitle: 'Pubblicato con successo' },
    inbox: { title: 'COMUNICAZIONI SICURE', encryption_active: 'Crittografia Attiva' },
    network: { title: 'RETE GLOBALE', nodes: 'Nodi Attivi' }
  },
  es: {
    menu: { portfolio: 'PORTAFOLIO Y ACUERDOS', scanner: 'ESCÁNER DE ACTIVOS', floor: 'MERCADO PÚBLICO', network: 'RED GLOBAL', comms: 'COM. SEGURAS', profile: 'PERFIL CORPORATIVO' },
    common: { institutional_grade: 'NIVEL INSTITUCIONAL', disconnect: 'DESCONECTAR', syncing: 'Sincronizando...', error: 'Error' },
    trading: { title: 'MERCADO GLOBAL', no_assets: 'Cero Activos Encontrados' },
    dashboard: { title: 'SUPERVISIÓN DEL PORTAFOLIO', active_supply: 'Oferta Activa', tracked_targets: 'OBJETIVOS RASTREADOS', pending_execution: 'Ejecución Pendiente', my_assets: 'MIS ACTIVOS', tracked_vault: 'BÓVEDA RASTREADA', incoming: 'ACUERDOS ENTRANTES', outgoing: 'ACUERDOS SALIENTES' },
    scanner: { title: 'DIGITALIZACIÓN DE ACTIVOS', digitize: 'DIGITALIZAR INVENTARIO', material: 'MATERIAL', valuation: 'VALORACIÓN (€)', origin: 'ORIGEN', location: 'UBICACIÓN', thickness: 'ESPESOR (CM)', quantity: 'CANTIDAD (M²)', incoterm: 'INCOTERM', visual_data: 'DATOS VISUALES', add_photo: 'AÑADIR FOTO', publish_btn: 'PUBLICAR', success_title: 'ACTIVO DIGITALIZADO', success_subtitle: 'Publicado con éxito' },
    inbox: { title: 'COMUNICACIONES SEGURAS', encryption_active: 'Cifrado Activo' },
    network: { title: 'RED GLOBAL', nodes: 'Nodos Activos' }
  },
  tr: {
    menu: { portfolio: 'PORTFÖY & ANLAŞMALAR', scanner: 'MATERYAL TARAYICI', floor: 'HALKA AÇIK PİYASA', network: 'KÜRESEL AĞ', comms: 'GÜVENLİ İLETİŞİM', profile: 'KURUMSAL PROFİL' },
    common: { institutional_grade: 'KURUMSAL SEVİYE', disconnect: 'ÇIKIŞ YAP', syncing: 'Senkronize ediliyor...', error: 'Hata' },
    trading: { title: 'KÜRESEL PİYASA', no_assets: 'Varlık Bulunamadı' },
    dashboard: { title: 'PORTFÖY DENETİMİ', active_supply: 'Aktif Arz', tracked_targets: 'İZLENEN HEDEFLER', pending_execution: 'Bekleyen İşlem', my_assets: 'VARLIKLARIM', tracked_vault: 'İZLENEN KASA', incoming: 'GELEN ANLAŞMALAR', outgoing: 'GİDEN ANLAŞMALAR' },
    scanner: { title: 'VARLIK DİJİTALLEŞTİRME', digitize: 'ENVANTERİ DİJİTALLEŞTİR', material: 'MATERYAL', valuation: 'DEĞERLEME (€)', origin: 'MENŞEİ', location: 'KONUM', thickness: 'KALINLIK (CM)', quantity: 'MİKTAR (M²)', incoterm: 'TESLİM ŞEKLİ', visual_data: 'GÖRSEL VERİ', add_photo: 'FOTOĞRAF EKLE', publish_btn: 'YAYINLA', success_title: 'VARLIK DİJİTALLEŞTİRİLDİ', success_subtitle: 'Başarıyla yayınlandı' },
    inbox: { title: 'GÜVENLİ İLETİŞİM', encryption_active: 'Şifreleme Aktif' },
    network: { title: 'KÜRESEL AĞ', nodes: 'Aktif Düğümler' }
  },
  zh: {
    menu: { portfolio: '投资组合与交易', scanner: '资产扫描仪', floor: '公开市场', network: '全球网络', comms: '安全通信', profile: '企业形象' },
    common: { institutional_grade: '机构级别', disconnect: '断开连接', syncing: '同步中...', error: '错误' },
    trading: { title: '全球市场', no_assets: '未找到资产' },
    dashboard: { title: '投资组合监督', active_supply: '活跃供应', tracked_targets: '追踪目标', pending_execution: '待执行', my_assets: '我的资产', tracked_vault: '追踪金库', incoming: '传入交易', outgoing: '传出交易' },
    scanner: { title: '资产数字化', digitize: '数字化库存', material: '材料', valuation: '估值 (€)', origin: '原产地', location: '位置', thickness: '厚度 (CM)', quantity: '数量 (M²)', incoterm: '交货条件', visual_data: '视觉数据', add_photo: '添加照片', publish_btn: '发布', success_title: '资产已数字化', success_subtitle: '成功发布' },
    inbox: { title: '安全通信', encryption_active: '加密激活' },
    network: { title: '全球网络', nodes: '活跃节点' }
  },
  pt: {
    menu: { portfolio: 'PORTFÓLIO E ACORDOS', scanner: 'SCANNER DE ATIVOS', floor: 'MERCADO PÚBLICO', network: 'REDE GLOBAL', comms: 'COM. SEGURAS', profile: 'PERFIL CORPORATIVO' },
    common: { institutional_grade: 'NÍVEL INSTITUCIONAL', disconnect: 'DESCONECTAR', syncing: 'Sincronizando...', error: 'Erro' },
    trading: { title: 'MERCADO GLOBAL', no_assets: 'Zero Ativos Encontrados' },
    dashboard: { title: 'SUPERVISÃO DE PORTFÓLIO', active_supply: 'Oferta Ativa', tracked_targets: 'ALVOS RASTREADOS', pending_execution: 'Execução Pendente', my_assets: 'MEUS ATIVOS', tracked_vault: 'COFRE RASTREADO', incoming: 'ACORDOS DE ENTRADA', outgoing: 'ACORDOS DE SAÍDA' },
    scanner: { title: 'DIGITALIZAÇÃO DE ATIVOS', digitize: 'DIGITALIZAR INVENTÁRIO', material: 'MATERIAL', valuation: 'AVALIAÇÃO (€)', origin: 'ORIGEM', location: 'LOCALIZAÇÃO', thickness: 'ESPESSURA (CM)', quantity: 'QUANTIDADE (M²)', incoterm: 'INCOTERM', visual_data: 'DADOS VISUAIS', add_photo: 'ADICIONAR FOTO', publish_btn: 'PUBLICAR', success_title: 'ATIVO DIGITALIZADO', success_subtitle: 'Publicado com sucesso' },
    inbox: { title: 'COMUNICAÇÕES SEGURAS', encryption_active: 'Criptografia Ativa' },
    network: { title: 'REDE GLOBAL', nodes: 'Nós Ativos' }
  },
  ru: {
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('axon_language') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('axon_language', lang);
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        // Fallback to English if translation missing
        let enValue: any = translations['en'];
        for (const enK of keys) {
          if (enValue && enValue[enK]) enValue = enValue[enK];
          else return key; // Return raw key if even English is missing
        }
        return enValue;
      }
    }
    return value;
  };

  if (!mounted) return <>{children}</>;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};