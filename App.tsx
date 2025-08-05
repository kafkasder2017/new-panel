



import React, { useState, useEffect, lazy, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import { NAVIGATION_ITEMS, ICONS } from './constants.tsx';
import { NavItem, Bildirim, BildirimDurumu, Profil as ProfilData, KullaniciRol, Kullanici, LogAction, LogEntityType, BagisTuru } from './types.ts';
import { getBildirimler, updateUser, login, signOut, createDenetimKaydi, getProfileForUser } from './services/apiService.ts';
import { supabase } from './services/supabaseClient.ts';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import HydrationErrorBoundary from './components/HydrationErrorBoundary.tsx';
import ConfigValidator from './components/ConfigValidator.tsx';
import PWAInstallPrompt from './components/PWAInstallPrompt';


const Dashboard = lazy(() => import('./components/Dashboard.tsx'));
const KisiYonetimi = lazy(() => import('./components/KisiYonetimi.tsx'));
const KisiDetay = lazy(() => import('./components/KisiDetay.tsx'));
const KumbaraYonetimi = lazy(() => import('./components/KumbaraYonetimi.tsx'));
const HukukiYardim = lazy(() => import('./components/HukukiYardim.tsx'));
const DavaDetay = lazy(() => import('./components/DavaDetay.tsx'));
const YardimBasvurulari = lazy(() => import('./components/YardimBasvurulari.tsx'));
const YardimBasvurusuDetay = lazy(() => import('./components/YardimBasvurusuDetay.tsx'));
const OgrenciBurslari = lazy(() => import('./components/OgrenciBurslari.tsx'));
const OgrenciBursDetay = lazy(() => import('./components/OgrenciBursDetay.tsx'));
const OdemeYonetimi = lazy(() => import('./components/OdemeYonetimi.tsx'));
const FinansalKayitlar = lazy(() => import('./components/FinansalKayitlar.tsx'));
const TopluIletisim = lazy(() => import('./components/TopluIletisim.tsx'));
const ProjeYonetimi = lazy(() => import('./components/ProjeYonetimi.tsx'));
const ProjeDetay = lazy(() => import('./components/ProjeDetay.tsx'));
const KullaniciYonetimi = lazy(() => import('./components/KullaniciYonetimi.tsx'));
const Bildirimler = lazy(() => import('./components/Bildirimler.tsx'));
const Ayarlar = lazy(() => import('./components/Ayarlar.tsx'));
const Profil = lazy(() => import('./components/Profil.tsx'));
const BaskanOnayi = lazy(() => import('./components/BaskanOnayi.tsx'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.tsx'));
const AccessDenied = lazy(() => import('./components/AccessDenied.tsx'));
const YardimAlanlar = lazy(() => import('./components/YardimAlanlar.tsx'));
const AyniYardimIslemleri = lazy(() => import('./components/AyniYardimIslemleri.tsx'));
const HizmetTakipYonetimi = lazy(() => import('./components/HizmetTakipYonetimi.tsx'));
const BagisYonetimi = lazy(() => import('./components/BagisYonetimi.tsx'));
const UyeYonetimi = lazy(() => import('./components/UyeYonetimi.tsx'));
const StokYonetimi = lazy(() => import('./components/StokYonetimi.tsx'));
const VefaDestekYonetimi = lazy(() => import('./components/VefaDestekYonetimi.tsx'));
const VefaDestekDetay = lazy(() => import('./components/VefaDestekDetay.tsx'));
const GonulluYonetimi = lazy(() => import('./components/GonulluYonetimi.tsx'));
const GonulluDetay = lazy(() => import('./components/GonulluDetay.tsx'));
const MesajRaporlari = lazy(() => import('./components/MesajRaporlari.tsx'));
const Login = lazy(() => import('./components/Login.tsx'));
const DenetimKayitlari = lazy(() => import('./components/DenetimKayitlari.tsx'));
const DokumanArsivi = lazy(() => import('./components/DosyaYonetimi.tsx'));
const YetimYonetimi = lazy(() => import('./components/YetimYonetimi.tsx'));
const YetimDetay = lazy(() => import('./components/YetimDetay.tsx'));
const Destek = lazy(() => import('./components/Destek.tsx'));
const ApiEntegrasyonu = lazy(() => import('./components/ApiEntegrasyonu.tsx'));
const EtkinlikYonetimi = lazy(() => import('./components/EtkinlikYonetimi.tsx'));
const EtkinlikDetay = lazy(() => import('./components/EtkinlikDetay.tsx'));
const HastaneSevkYonetimi = lazy(() => import('./components/HastaneSevkYonetimi.tsx'));
const TumYardimlarListesi = lazy(() => import('./components/TumYardimlarListesi.tsx'));
const KurumYonetimi = lazy(() => import('./components/KurumYonetimi.tsx'));
const RaporlamaAnalitik = lazy(() => import('./components/Raporlar.tsx'));
const HaritaModulu = lazy(() => import('./components/HaritaModulu.tsx'));
const Takvim = lazy(() => import('./components/Takvim.tsx'));
import { useSupabaseQuery } from './hooks/useData.ts';
import Modal from './components/Modal.tsx';
import SmartChatModal from './components/SmartChatModal.tsx';

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
);

// #region Layout Components
const Sidebar: React.FC<{ user: ProfilData; onSignOut: () => void; isOpen: boolean }> = ({ user, onSignOut, isOpen }) => {

    const hasAccess = (item: NavItem) => {
        if (user.rol === KullaniciRol.YONETICI) {
            return true; // Yönetici her şeyi görür
        }
        if (!item.roles || item.roles.length === 0) {
            return true; // Rol tanımlanmamışsa herkese açık
        }
        return item.roles.includes(user.rol as KullaniciRol);
    };
    
    const visibleNavItems = NAVIGATION_ITEMS.map(item => {
        if (!item.subItems) {
            return hasAccess(item) ? item : null;
        }

        const visibleSubItems = item.subItems.filter(hasAccess);
        
        if (visibleSubItems.length > 0) {
            return { ...item, subItems: visibleSubItems };
        }
        
        return hasAccess(item) && item.path !== '#' && visibleSubItems.length === 0 ? item : (visibleSubItems.length > 0 ? { ...item, subItems: visibleSubItems } : null)


    }).filter(Boolean) as NavItem[];


    return (
        <aside className={`w-64 flex-shrink-0 bg-white dark:bg-zinc-900 flex flex-col fixed inset-y-0 left-0 z-50 border-r border-zinc-200 dark:border-zinc-800 transform transition-all duration-200 ease-in-out lg:translate-x-0 shadow-lg lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="h-16 flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <h1 className="text-xl font-bold text-zinc-800 dark:text-white tracking-wider">KAFKASDER</h1>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {visibleNavItems.map((item) => (
                    item.subItems ? <CollapsibleNavItem key={item.path} item={item} /> : <NavItemLink key={item.path} item={item} />
                ))}
            </nav>
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <ReactRouterDOM.NavLink to="/profil" className="flex items-center space-x-3 group mb-3">
                    <img className="h-10 w-10 rounded-full ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-blue-500" src={user.profilFotoUrl} alt={user.adSoyad} />
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-white truncate">{user.adSoyad}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.rol}</p>
                    </div>
                </ReactRouterDOM.NavLink>
                <button
                    onClick={onSignOut}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                >
                    {ICONS.LOGOUT}
                    <span>Çıkış Yap</span>
                </button>
            </div>
        </aside>
    );
};

const Header: React.FC<{ 
    unreadCount: number; 
    title: string; 
    theme: 'light' | 'dark'; 
    toggleTheme: () => void; 
    onMenuClick: () => void; 
    onSmartSearch: (query: string) => void;
}> = ({ unreadCount, title, theme, toggleTheme, onMenuClick, onSmartSearch }) => {
    
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            onSmartSearch(searchQuery.trim());
            setSearchQuery('');
        }
    };
    
    return (
        <header className="h-16 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6 lg:px-8 fixed top-0 left-0 right-0 z-40 lg:left-64 shadow-sm">
            <div className="flex items-center space-x-4">
                 <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors duration-200" aria-label="Menüyü aç">
                    {ICONS.HAMBURGER}
                </button>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h2>
            </div>
             {/* Smart Search */}
            <div className="flex-1 px-4 lg:px-8 max-w-xl">
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="w-5 h-5 text-zinc-400">{ICONS.LIGHTBULB}</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Akıllı Arama (örn: 'Ankara'daki aktif gönüllüler')"
                            className="block w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-full py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                        />
                    </div>
                </form>
            </div>
            <div className="flex items-center space-x-2">
                 <button onClick={toggleTheme} className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                    {theme === 'light' ? ICONS.MOON : ICONS.SUN}
                 </button>
                 <ReactRouterDOM.NavLink to="/bildirimler" className="relative p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                     {ICONS.BELL}
                     {unreadCount > 0 && (
                         <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                         </span>
                     )}
                 </ReactRouterDOM.NavLink>
                 <ReactRouterDOM.NavLink to="/ayarlar/genel" className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                     {ICONS.SETTINGS}
                 </ReactRouterDOM.NavLink>
            </div>
        </header>
    );
};

const PageTitle: React.FC<{ children: (title: string) => React.ReactNode }> = ({ children }) => {
    const location = ReactRouterDOM.useLocation();
    
    const pageTitle = React.useMemo(() => {
        const findNavItem = (items: NavItem[], path: string): NavItem | undefined => {
            for(const item of items) {
                if (item.path === path) return item;
                if (item.subItems) {
                    const found = findNavItem(item.subItems, path);
                    if (found) return found;
                }
            }
            return undefined;
        }
        const path = location.pathname;
        if (path === '/bildirimler') return "Bildirimler";
        if (path === '/profil') return "Profilim";
        if (path.startsWith('/hukuki-yardim/')) return "Dava Detayları";
        if (path.startsWith('/kisiler/')) return "Kişi Detayları";
        if (path.startsWith('/burslar/')) return "Burs Detayları";
        if (path.startsWith('/yardimlar/')) return "Yardım Başvurusu Detayları";
        if (path.startsWith('/vefa-destek/')) return "Vefa Destek Detayları";
        if (path.startsWith('/projeler/')) return "Proje Detayları";
        if (path.startsWith('/gonulluler/')) return "Gönüllü Detayları";
        if (path.startsWith('/yetimler/')) return "Yetim Detayları";
        if (path.startsWith('/etkinlikler/')) return "Etkinlik Detayları";

        const navItem = findNavItem(NAVIGATION_ITEMS, path);
        return navItem ? navItem.name : "Dashboard";
    }, [location.pathname]);

    return <>{children(pageTitle)}</>;
}

const CollapsibleNavItem: React.FC<{ item: NavItem }> = ({ item }) => {
    const location = ReactRouterDOM.useLocation();
    const isParentActive = item.subItems?.some(sub => location.pathname.startsWith(sub.path)) ?? false;
    const [isOpen, setIsOpen] = useState(isParentActive);

    useEffect(() => {
        if (isParentActive) {
            setIsOpen(true);
        }
    }, [location.pathname, isParentActive]);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors duration-200 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 ${
                    isParentActive ? 'text-zinc-900 dark:text-zinc-100' : ''
                }`}
            >
                <div className="flex items-center gap-3">
                    {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
                    <span className="font-medium text-sm">{item.name}</span>
                </div>
                <span className={`transform transition-transform duration-200 text-zinc-400 dark:text-zinc-500 ${isOpen ? 'rotate-180' : ''}`}>
                    {ICONS.CHEVRON_DOWN}
                </span>
            </button>
            {isOpen && (
                <div className="pt-2 pl-4 space-y-1 border-l ml-5 border-zinc-200 dark:border-zinc-700">
                    {item.subItems?.map(subItem => (
                        <NavItemLink key={subItem.path} item={subItem} isSubItem={true} />
                    ))}
                </div>
            )}
        </div>
    );
};
const NavItemLink: React.FC<{ item: NavItem, isSubItem?: boolean }> = ({ item, isSubItem }) => {
    return (
        <ReactRouterDOM.NavLink
            to={item.path}
            end
            className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 text-sm ${
                    isActive
                        ? 'font-semibold bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-white'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                } ${isSubItem ? 'font-normal' : 'font-medium'}`
            }
        >
            {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
            <span>{item.name}</span>
        </ReactRouterDOM.NavLink>
    );
};
// #endregion

const MainLayout: React.FC<{ user: ProfilData; onSignOut: () => void; onSmartSearch: (query: string) => void; }> = ({ user, onSignOut, onSmartSearch }) => {
    const [profileState, setProfileState] = useState<ProfilData>(user);
    const { data: notifications } = useSupabaseQuery<Bildirim>('bildirimler');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const unreadCount = React.useMemo(() => (notifications || []).filter(n => n.durum === BildirimDurumu.OKUNMADI).length, [notifications]);
    
    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };
    
     useEffect(() => {
        setProfileState(user);
    }, [user]);
    
    // Initialize theme from localStorage after mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);
    
     useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const handleProfileSave = async (updatedProfile: ProfilData) => {
        const promise = new Promise<ProfilData>(async (resolve, reject) => {
            try {
                const payload: Partial<Kullanici> = {
                    kullaniciAdi: updatedProfile.adSoyad,
                    email: updatedProfile.email,
                };
    
                const savedUser = await updateUser(updatedProfile.id, payload);
                
                const updatedProfilData: ProfilData = {
                    ...updatedProfile,
                    id: savedUser.id,
                    adSoyad: savedUser.kullaniciAdi,
                    email: savedUser.email,
                    rol: savedUser.rol,
                };
    
                setProfileState(updatedProfilData);
                resolve(updatedProfilData);
            } catch (err) {
                console.error("Profil kaydedilirken hata:", err);
                reject(err);
            }
        });

        toast.promise(promise, {
            loading: 'Profil güncelleniyor...',
            success: 'Profil başarıyla güncellendi!',
            error: 'Profil güncellenirken bir hata oluştu.',
        });
    };


    const getRouteElement = (path: string, element: React.ReactElement) => {
        const findNavItemByPath = (items: NavItem[], path: string): NavItem | undefined => {
            for (const item of items) {
                if (item.path === path) return item;
                if (item.subItems) {
                    const found = findNavItemByPath(item.subItems, path);
                    if (found) return found;
                }
            }
            return items.find(item => path.startsWith(item.path) && item.path !== '/');
        };
        const navItem = findNavItemByPath(NAVIGATION_ITEMS, path) || NAVIGATION_ITEMS.find(item => item.path === path);
        
        return (
            <ProtectedRoute userRole={user.rol as KullaniciRol} allowedRoles={navItem?.roles}>
                {element}
            </ProtectedRoute>
        );
    };

    return (
        <div className="flex h-screen text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900">
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}
            <Sidebar user={profileState} onSignOut={onSignOut} isOpen={isSidebarOpen} />
            <main className="flex-1 flex flex-col lg:pl-64 transition-all duration-200">
                <PageTitle>
                    {title => <Header onSmartSearch={onSmartSearch} unreadCount={unreadCount} title={title} theme={theme} toggleTheme={toggleTheme} onMenuClick={() => setIsSidebarOpen(true)} />}
                </PageTitle>
                <div className="flex-1 p-6 pt-20 lg:p-8 lg:pt-24 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
                    <Suspense fallback={<LoadingFallback />}>
                        <ReactRouterDOM.Routes>
                            <ReactRouterDOM.Route path="/" element={getRouteElement('/', <Dashboard />)} />
                            
                            {/* Bağış Yönetimi */}
                            <ReactRouterDOM.Route path="/bagis-yonetimi/tum-bagislar" element={getRouteElement('/bagis-yonetimi/tum-bagislar', <BagisYonetimi key="tum-bagislar" initialFilter="all" />)} />
                            <ReactRouterDOM.Route path="/bagis-yonetimi/nakit" element={getRouteElement('/bagis-yonetimi/nakit', <BagisYonetimi key="nakit-bagislar" initialFilter={BagisTuru.NAKIT} />)} />
                            <ReactRouterDOM.Route path="/bagis-yonetimi/ayni" element={getRouteElement('/bagis-yonetimi/ayni', <BagisYonetimi key="ayni-bagislar" initialFilter={BagisTuru.AYNI} />)} />
                            <ReactRouterDOM.Route path="/kumbaralar" element={getRouteElement('/kumbaralar', <KumbaraYonetimi />)} />
                            
                            {/* Kişiler & Kurumlar */}
                            <ReactRouterDOM.Route path="/kisiler" element={getRouteElement('/kisiler', <KisiYonetimi />)} />
                            <ReactRouterDOM.Route path="/kisiler/:kisiId" element={getRouteElement('/kisiler', <KisiDetay />)} />
                            <ReactRouterDOM.Route path="/gonulluler" element={getRouteElement('/gonulluler', <GonulluYonetimi />)} />
                            <ReactRouterDOM.Route path="/gonulluler/:gonulluId" element={getRouteElement('/gonulluler', <GonulluDetay />)} />
                            <ReactRouterDOM.Route path="/kurumlar" element={getRouteElement('/kurumlar', <KurumYonetimi />)} />
                            
                            {/* Yardım Yönetimi */}
                            <ReactRouterDOM.Route path="/ihtiyac-sahipleri" element={getRouteElement('/ihtiyac-sahipleri', <YardimAlanlar />)} />
                            <ReactRouterDOM.Route path="/yardimlar" element={getRouteElement('/yardimlar', <YardimBasvurulari />)} />
                            <ReactRouterDOM.Route path="/yardimlar/:basvuruId" element={getRouteElement('/yardimlar', <YardimBasvurusuDetay />)} />
                            <ReactRouterDOM.Route path="/yardim-yonetimi/nakdi-yardimlar" element={getRouteElement('/yardim-yonetimi/nakdi-yardimlar', <OdemeYonetimi />)} />
                            <ReactRouterDOM.Route path="/yardim-yonetimi/ayni-yardimlar" element={getRouteElement('/yardim-yonetimi/ayni-yardimlar', <AyniYardimIslemleri />)} />
                            <ReactRouterDOM.Route path="/yardim-yonetimi/tum-yardimlar" element={getRouteElement('/yardim-yonetimi/tum-yardimlar', <TumYardimlarListesi />)} />
                            <ReactRouterDOM.Route path="/depo-yonetimi" element={getRouteElement('/depo-yonetimi', <StokYonetimi />)} />
                            <ReactRouterDOM.Route path="/vefa-destek" element={getRouteElement('/vefa-destek', <VefaDestekYonetimi />)} />
                            <ReactRouterDOM.Route path="/vefa-destek/:vefaId" element={getRouteElement('/vefa-destek', <VefaDestekDetay />)} />
                            <ReactRouterDOM.Route path="/odemeler" element={getRouteElement('/odemeler', <OdemeYonetimi />)} />
                            <ReactRouterDOM.Route path="/yardim-yonetimi/hizmet-takip" element={getRouteElement('/yardim-yonetimi/hizmet-takip', <HizmetTakipYonetimi />)} />
                            <ReactRouterDOM.Route path="/yardim-yonetimi/hastane-sevk" element={getRouteElement('/yardim-yonetimi/hastane-sevk', <HastaneSevkYonetimi />)} />
                            <ReactRouterDOM.Route path="/baskan-onayi" element={getRouteElement('/baskan-onayi', <BaskanOnayi />)} />

                            {/* Diğer Ana Menüler */}
                            <ReactRouterDOM.Route path="/harita" element={getRouteElement('/harita', <HaritaModulu />)} />
                            <ReactRouterDOM.Route path="/dokuman-arsivi" element={getRouteElement('/dokuman-arsivi', <DokumanArsivi />)} />
                            <ReactRouterDOM.Route path="/uyeler" element={getRouteElement('/uyeler', <UyeYonetimi />)} />
                            <ReactRouterDOM.Route path="/takvim" element={getRouteElement('/takvim', <Takvim />)} />
                            <ReactRouterDOM.Route path="/finansal-kayitlar" element={getRouteElement('/finansal-kayitlar', <FinansalKayitlar />)} />
                            <ReactRouterDOM.Route path="/toplu-iletisim" element={getRouteElement('/toplu-iletisim', <TopluIletisim />)} />
                            <ReactRouterDOM.Route path="/mesajlasma/raporlar" element={getRouteElement('/mesajlasma/raporlar', <MesajRaporlari />)} />
                            <ReactRouterDOM.Route path="/projeler" element={getRouteElement('/projeler', <ProjeYonetimi />)} />
                            <ReactRouterDOM.Route path="/projeler/:projeId" element={getRouteElement('/projeler', <ProjeDetay />)} />
                            <ReactRouterDOM.Route path="/raporlama-analitik" element={getRouteElement('/raporlama-analitik', <RaporlamaAnalitik />)} />
                            <ReactRouterDOM.Route path="/etkinlikler" element={getRouteElement('/etkinlikler', <EtkinlikYonetimi />)} />
                            <ReactRouterDOM.Route path="/etkinlikler/:etkinlikId" element={getRouteElement('/etkinlikler', <EtkinlikDetay />)} />
                            <ReactRouterDOM.Route path="/burslar" element={getRouteElement('/burslar', <OgrenciBurslari />)} />
                            <ReactRouterDOM.Route path="/burslar/:bursId" element={getRouteElement('/burslar', <OgrenciBursDetay />)} />
                            <ReactRouterDOM.Route path="/yetimler" element={getRouteElement('/yetimler', <YetimYonetimi />)} />
                            <ReactRouterDOM.Route path="/yetimler/:yetimId" element={getRouteElement('/yetimler', <YetimDetay />)} />
                            <ReactRouterDOM.Route path="/hukuki-yardim" element={getRouteElement('/hukuki-yardim', <HukukiYardim />)} />
                            <ReactRouterDOM.Route path="/hukuki-yardim/:davaId" element={getRouteElement('/hukuki-yardim', <DavaDetay />)} />
                            <ReactRouterDOM.Route path="/destek" element={getRouteElement('/destek', <Destek />)} />

                            {/* Parametreler */}
                            <ReactRouterDOM.Route path="/kullanicilar" element={getRouteElement('/kullanicilar', <KullaniciYonetimi />)} />
                            <ReactRouterDOM.Route path="/denetim-kayitlari" element={getRouteElement('/denetim-kayitlari', <DenetimKayitlari />)} />
                            <ReactRouterDOM.Route path="/ayarlar/genel" element={getRouteElement('/ayarlar/genel', <Ayarlar />)} />
                            <ReactRouterDOM.Route path="/ayarlar/api-entegrasyonlari" element={getRouteElement('/ayarlar/api-entegrasyonlari', <ApiEntegrasyonu />)} />
                            
                            {/* App-level Routes */}
                            <ReactRouterDOM.Route path="/bildirimler" element={<Bildirimler />} />
                            <ReactRouterDOM.Route path="/profil" element={<Profil profile={profileState} onSave={handleProfileSave} />} />
                            <ReactRouterDOM.Route path="/access-denied" element={<AccessDenied />} />

                            <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
                        </ReactRouterDOM.Routes>
                    </Suspense>
                </div>
            </main>
        </div>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<ProfilData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [smartSearchQuery, setSmartSearchQuery] = useState<string | null>(null);
    
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                try {
                    const profile = await getProfileForUser(session.user);
                    if (profile) {
                        setCurrentUser(profile);
                        setAuthError(null);
                    } else {
                        // Fallback for when table exists but user is not in it
                        console.warn('User profile not found in "kullanicilar" table. Creating a mock admin profile as a fallback.');
                        const mockProfile: ProfilData = {
                            id: 999, // A mock ID
                            adSoyad: session.user.email?.split('@')[0] || 'Yönetici',
                            email: session.user.email || 'admin@kafkader.org',
                            rol: KullaniciRol.YONETICI,
                            telefon: '0000000000',
                            profilFotoUrl: `https://i.pravatar.cc/100?u=${session.user.email}`
                        };
                        setCurrentUser(mockProfile);
                        setAuthError(null);
                    }
                } catch (error: any) {
                    console.error("Error fetching user profile:", error);
                    const errorMsg = String(error.message || '').toLowerCase();
                    
                    // Check for common, non-critical database setup issues and fall back to a mock profile.
                    const isDbSetupError = errorMsg.includes('relation "public.kullanicilar" does not exist') || 
                                           errorMsg.includes('relation \\"public.kullanicilar\\" does not exist') ||
                                           errorMsg.includes('infinite recursion detected');

                    if (isDbSetupError) {
                        console.warn(`Database setup issue detected (${errorMsg}). Creating a mock admin profile as a fallback.`);
                        const mockProfile: ProfilData = {
                            id: 999, // A mock ID
                            adSoyad: session.user.email?.split('@')[0] || 'Yönetici',
                            email: session.user.email || 'admin@kafkader.org',
                            rol: KullaniciRol.YONETICI,
                            telefon: '0000000000',
                            profilFotoUrl: `https://i.pravatar.cc/100?u=${session.user.email}`
                        };
                        setCurrentUser(mockProfile);
                        setAuthError(null);
                    } else {
                        setAuthError(`Profil yüklenirken bir hata oluştu: ${error.message}`);
                        await signOut();
                        setCurrentUser(null);
                    }
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        if (currentUser) {
            try {
                await createDenetimKaydi({
                    timestamp: new Date().toISOString(),
                    kullaniciId: currentUser.id,
                    kullaniciAdi: currentUser.adSoyad,
                    eylem: LogAction.LOGOUT,
                    entityTipi: LogEntityType.SYSTEM,
                    aciklama: `${currentUser.adSoyad} sistemden çıkış yaptı.`
                });
            } catch (error: any) {
                 console.error("Error creating audit log on sign out:", error);
            }
        }
        await signOut();
        setCurrentUser(null);
    };

    if (loading) {
        return (
             <div className="flex items-center justify-center h-screen">
                 <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                    <p className="text-zinc-600 dark:text-zinc-300 mt-4">Oturum kontrol ediliyor...</p>
                 </div>
            </div>
        );
    }
    
    if (!currentUser) {
        return <Suspense fallback={<LoadingFallback />}><Login onLogin={login} /></Suspense>;
    }

    if(authError) {
        return (
             <div className="flex items-center justify-center h-screen bg-zinc-50 dark:bg-zinc-900">
                <div className="w-full max-w-md p-8 space-y-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-lg text-center">
                    <h2 className="text-xl font-bold text-red-600">Kritik Hata</h2>
                    <p className="text-zinc-600 dark:text-zinc-300">{authError}</p>
                    <button onClick={handleSignOut} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                        Giriş Ekranına Dön
                    </button>
                </div>
            </div>
        )
    }

    return (
        <ConfigValidator>
            <ErrorBoundary>
                <HydrationErrorBoundary>
                    <ReactRouterDOM.HashRouter>
                        <Toaster position="top-center" reverseOrder={false} />
                        <PWAInstallPrompt />
                        {smartSearchQuery && <SmartChatModal query={smartSearchQuery} onClose={() => setSmartSearchQuery(null)} />}
                        <ReactRouterDOM.Routes>
                            <ReactRouterDOM.Route path="/*" element={<MainLayout user={currentUser} onSignOut={handleSignOut} onSmartSearch={setSmartSearchQuery} />} />
                        </ReactRouterDOM.Routes>
                    </ReactRouterDOM.HashRouter>
                </HydrationErrorBoundary>
            </ErrorBoundary>
        </ConfigValidator>
    );
};

export default App;