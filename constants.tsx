

import React from 'react';
import { NavItem, KullaniciRol } from './types.ts';
import {
  Squares2X2Icon,
  UsersIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  Cog6ToothIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  BuildingStorefrontIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  UserIcon,
  QuestionMarkCircleIcon,
  TicketIcon,
  LightBulbIcon,
  ChartBarIcon,
  MapIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  ComputerDesktopIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline';

// Icons from @heroicons/react package (Outline, 24x24, stroke-width: 1.5)
export const ICONS = {
    // Navigation Icons (24x24 outline)
    DASHBOARD: <Squares2X2Icon className="w-6 h-6" />,
    PEOPLE: <UsersIcon className="w-6 h-6" />,
    AID_RECIPIENT: <UserGroupIcon className="w-6 h-6" />,
    SCHOLARSHIP: <AcademicCapIcon className="w-6 h-6" />,
    KUMBARA: <CurrencyDollarIcon className="w-6 h-6" />,
    LEGAL: <ScaleIcon className="w-6 h-6" />,
    CALENDAR: <CalendarDaysIcon className="w-6 h-6" />,
    CLIPBOARD_DOCUMENT_LIST: <ClipboardDocumentListIcon className="w-6 h-6" />,
    FINANCE: <ChartPieIcon className="w-6 h-6" />,
    SETTINGS: <Cog6ToothIcon className="w-6 h-6" />,
    DONATION: <HeartIcon className="w-6 h-6" />,
    MESSAGE: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
    CHATBOT: <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />,
    WAREHOUSE: <BuildingStorefrontIcon className="w-6 h-6" />,
    VOLUNTEER: <HandRaisedIcon className="w-6 h-6" />,
    HEART_HAND: <HeartIcon className="w-6 h-6" />,
    SHIELD_CHECK: <ShieldCheckIcon className="w-6 h-6" />,
    ARCHIVE_BOX: <ArchiveBoxIcon className="w-6 h-6" />,
    ORPHAN: <UserIcon className="w-6 h-6" />,
    HELP: <QuestionMarkCircleIcon className="w-6 h-6" />,
    TICKET: <TicketIcon className="w-6 h-6" />,
    LIGHTBULB: <LightBulbIcon className="w-6 h-6" />,
    REPORT: <ChartBarIcon className="w-6 h-6" />,
    MAP: <MapIcon className="w-6 h-6" />,

    // UI Icons (20x20 or 24x24 outline)
    CHEVRON_DOWN: <ChevronDownIcon className="w-5 h-5" />,
    SUN: <SunIcon className="w-5 h-5" />,
    MOON: <MoonIcon className="w-5 h-5" />,
    COMPUTER: <ComputerDesktopIcon className="w-5 h-5" />,
    BELL: <BellIcon className="w-6 h-6" />,
    LOGOUT: <ArrowRightOnRectangleIcon className="w-6 h-6" />,
    X_MARK: <XMarkIcon className="w-6 h-6" />,
    HAMBURGER: <Bars3Icon className="w-6 h-6" />
};

const { YONETICI, EDITOR, MUHASEBE, GONULLU } = KullaniciRol;

export const NAVIGATION_ITEMS: NavItem[] = [
    { path: '/', name: 'Dashboard / Ana Sayfa', icon: ICONS.DASHBOARD },
    {
        path: '/bagis-yonetimi', name: 'Bağış Yönetimi', icon: ICONS.DONATION,
        subItems: [
            { path: '/bagis-yonetimi/tum-bagislar', name: 'Tüm Bağışlar' },
            { path: '/bagis-yonetimi/nakit', name: 'Nakit Bağışlar' },
            { path: '/bagis-yonetimi/ayni', name: 'Ayni Bağışlar' },
            { path: '/kumbaralar', name: 'Kumbara Takibi' },
        ]
    },
    {
        path: '/kisiler', name: 'Kişiler & Kurumlar', icon: ICONS.PEOPLE,
        subItems: [
            { path: '/kisiler', name: 'Kişi Listesi' },
            { path: '/gonulluler', name: 'Gönüllü Yönetimi' },
            { path: '/kurumlar', name: 'Kurumlar' },
        ]
    },
    {
        path: '/yardim-yonetimi', name: 'Yardım Yönetimi', icon: ICONS.AID_RECIPIENT,
        subItems: [
            { path: '/ihtiyac-sahipleri', name: 'Yardım Alanlar' },
            { path: '/yardimlar', name: 'Yardım Başvuruları' },
            { path: '/yardim-yonetimi/nakdi-yardimlar', name: 'Nakdi Yardım İşlemleri' },
            { path: '/yardim-yonetimi/ayni-yardimlar', name: 'Ayni Yardım İşlemleri' },
            { path: '/yardim-yonetimi/tum-yardimlar', name: 'Tüm Yardım İşlemleri' },
            { path: '/depo-yonetimi', name: 'Depo & Stok Yönetimi' },
            { path: '/vefa-destek', name: 'Vefa Destek Yönetimi', icon: ICONS.HEART_HAND },
            { path: '/odemeler', name: 'Banka Ödeme Emirleri' },
            { path: '/yardim-yonetimi/hizmet-takip', name: 'Hizmet Takip İşlemleri' },
            { path: '/yardim-yonetimi/hastane-sevk', name: 'Hastane Sevk İşlemleri' },
            { path: '/baskan-onayi', name: 'Onay Süreci' },
        ]
    },
    { path: '/harita', name: 'Harita Modülü', icon: ICONS.MAP },
    { path: '/dokuman-arsivi', name: 'Doküman Arşivi', icon: ICONS.ARCHIVE_BOX },
    { path: '/uyeler', name: 'Üye Yönetimi', icon: ICONS.PEOPLE },
    { path: '/takvim', name: 'Takvim', icon: ICONS.CALENDAR },
    { path: '/finansal-kayitlar', name: 'Finans & Fon Yönetimi', icon: ICONS.FINANCE },
    {
        path: '/mesajlasma', name: 'Mesajlaşma', icon: ICONS.MESSAGE,
        subItems: [
            { path: '/toplu-iletisim', name: 'SMS/E-Posta Gönder' },
            { path: '/mesajlasma/raporlar', name: 'Mesaj Raporları' },
        ]
    },
    { path: '/projeler', name: 'Proje Yönetimi', icon: ICONS.CLIPBOARD_DOCUMENT_LIST },
    { path: '/raporlama-analitik', name: 'Raporlama & Analitik', icon: ICONS.REPORT },
    { path: '/etkinlikler', name: 'Etkinlik Yönetimi', icon: ICONS.TICKET },
    { path: '/burslar', name: 'Burs Yönetimi', icon: ICONS.SCHOLARSHIP },
    { path: '/yetimler', name: 'Yetim Yönetimi', icon: ICONS.ORPHAN },
    { path: '/hukuki-yardim', name: 'Hukuk Yönetimi', icon: ICONS.LEGAL },
    { path: '/destek', name: 'Yardım & Destek', icon: ICONS.HELP },
    { path: '/chatbot-yonetimi', name: 'AI Chatbot Yönetimi', icon: ICONS.CHATBOT },
    {
        path: '/sistem-ayarlari', name: 'Sistem Ayarları', icon: ICONS.SETTINGS,
        subItems: [
            { path: '/sistem-ayarlari/genel', name: 'Genel Ayarlar' },
            { path: '/sistem-ayarlari/kullanicilar', name: 'Kullanıcı Yönetimi' },
            { path: '/sistem-ayarlari/yedekleme', name: 'Yedekleme & Geri Yükleme' },
        ]
    },
];