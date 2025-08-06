import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { supabase } from './services/supabaseClient';
import { User } from '@supabase/supabase-js';
import { KullaniciRol } from './types';

// Components (statik ve küçük olanlar)
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeProvider from './components/ThemeContext';

// Route-level lazy loading (bundle'ı küçültmek ve sayfa geçişlerini hızlandırmak için)
const Dashboard = lazy(() => import('./components/Dashboard'));
const KisiYonetimi = lazy(() => import('./components/KisiYonetimi'));
const BagisYonetimi = lazy(() => import('./components/BagisYonetimi'));
const GonulluYonetimi = lazy(() => import('./components/GonulluYonetimi'));
const EtkinlikYonetimi = lazy(() => import('./components/EtkinlikYonetimi'));
const FinansalKayitlar = lazy(() => import('./components/FinansalKayitlar'));
const ProjeYonetimi = lazy(() => import('./components/ProjeYonetimi'));
const YardimBasvurulari = lazy(() => import('./components/YardimBasvurulari'));
const YardimAlanlar = lazy(() => import('./components/YardimAlanlar'));
const UyeYonetimi = lazy(() => import('./components/UyeYonetimi'));
const Takvim = lazy(() => import('./components/Takvim'));
const TopluIletisim = lazy(() => import('./components/TopluIletisim'));
const MesajRaporlari = lazy(() => import('./components/MesajRaporlari'));
const RaporlamaAnalitik = lazy(() => import('./components/RaporlamaAnalitik'));
const ChatbotYonetimi = lazy(() => import('./components/ChatbotYonetimi'));
const YetimYonetimi = lazy(() => import('./components/YetimYonetimi'));
const HukukiYardim = lazy(() => import('./components/HukukiYardim'));
const Destek = lazy(() => import('./components/Destek'));
const KullaniciYonetimi = lazy(() => import('./components/KullaniciYonetimi'));
const Ayarlar = lazy(() => import('./components/Ayarlar'));
const Profil = lazy(() => import('./components/Profil'));
const AccessDenied = lazy(() => import('./components/AccessDenied'));
const HaritaModulu = lazy(() => import('./components/HaritaModulu'));
const DosyaYonetimi = lazy(() => import('./components/DosyaYonetimi'));
const KumbaraYonetimi = lazy(() => import('./components/KumbaraYonetimi'));
const StokYonetimi = lazy(() => import('./components/StokYonetimi'));
const VefaDestekYonetimi = lazy(() => import('./components/VefaDestekYonetimi'));
const OdemeYonetimi = lazy(() => import('./components/OdemeYonetimi'));
const HizmetTakipYonetimi = lazy(() => import('./components/HizmetTakipYonetimi'));
const HastaneSevkYonetimi = lazy(() => import('./components/HastaneSevkYonetimi'));
const BaskanOnayi = lazy(() => import('./components/BaskanOnayi'));
const OgrenciBurslari = lazy(() => import('./components/OgrenciBurslari'));
const AyniYardimIslemleri = lazy(() => import('./components/AyniYardimIslemleri'));
const TumYardimlarListesi = lazy(() => import('./components/TumYardimlarListesi'));
const ApiEntegrasyonu = lazy(() => import('./components/ApiEntegrasyonu'));
const Bildirimler = lazy(() => import('./components/Bildirimler'));

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole] = useState<KullaniciRol>(KullaniciRol.YONETICI); // Default role for now

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={async (email: string, password: string) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Router>
          <div className="flex h-screen bg-gray-100">
            <Sidebar 
              user={{
                id: 1,
                adSoyad: user.email || 'Kullanıcı',
                email: user.email || '',
                rol: userRole,
                telefon: '',
                profilFotoUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeD0iOCIgeT0iOCI+CjxwYXRoIGQ9Ik0yMCAyMXYtMmE0IDQgMCAwIDAtNC00SDZhNCA0IDAgMCAwLTQgNHYyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4K'
              }}
              onSignOut={() => supabase.auth.signOut()}
              isOpen={sidebarOpen}
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
              <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="flex items-center justify-between px-6 py-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-gray-500 hover:text-gray-700 lg:hidden"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-gray-900">Kafkasder Panel</h1>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              </header>
              
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                <div className="container mx-auto px-6 py-8">
                  <Suspense fallback={<div className="p-8 text-center text-zinc-600">Yükleniyor...</div>}>
                    <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    {/* Kişiler & Kurumlar */}
                    <Route path="/kisiler" element={<ProtectedRoute userRole={userRole}><KisiYonetimi /></ProtectedRoute>} />
                    <Route path="/gonulluler" element={<ProtectedRoute userRole={userRole}><GonulluYonetimi /></ProtectedRoute>} />
                    <Route path="/kurumlar" element={<ProtectedRoute userRole={userRole}><KisiYonetimi /></ProtectedRoute>} />
                    
                    {/* Bağış Yönetimi */}
                    <Route path="/bagis-yonetimi" element={<ProtectedRoute userRole={userRole}><BagisYonetimi /></ProtectedRoute>} />
                    <Route path="/bagis-yonetimi/tum-bagislar" element={<ProtectedRoute userRole={userRole}><BagisYonetimi /></ProtectedRoute>} />
                    <Route path="/bagis-yonetimi/nakit" element={<ProtectedRoute userRole={userRole}><BagisYonetimi /></ProtectedRoute>} />
                    <Route path="/bagis-yonetimi/ayni" element={<ProtectedRoute userRole={userRole}><AyniYardimIslemleri /></ProtectedRoute>} />
                    <Route path="/kumbaralar" element={<ProtectedRoute userRole={userRole}><KumbaraYonetimi /></ProtectedRoute>} />
                    
                    {/* Yardım Yönetimi */}
                    <Route path="/yardim-yonetimi" element={<ProtectedRoute userRole={userRole}><YardimBasvurulari /></ProtectedRoute>} />
                    <Route path="/ihtiyac-sahipleri" element={<ProtectedRoute userRole={userRole}><YardimAlanlar /></ProtectedRoute>} />
                    <Route path="/yardimlar" element={<ProtectedRoute userRole={userRole}><YardimBasvurulari /></ProtectedRoute>} />
                    <Route path="/yardim-yonetimi/nakdi-yardimlar" element={<ProtectedRoute userRole={userRole}><YardimBasvurulari /></ProtectedRoute>} />
                    <Route path="/yardim-yonetimi/ayni-yardimlar" element={<ProtectedRoute userRole={userRole}><AyniYardimIslemleri /></ProtectedRoute>} />
                    <Route path="/yardim-yonetimi/tum-yardimlar" element={<ProtectedRoute userRole={userRole}><TumYardimlarListesi /></ProtectedRoute>} />
                    <Route path="/depo-yonetimi" element={<ProtectedRoute userRole={userRole}><StokYonetimi /></ProtectedRoute>} />
                    <Route path="/vefa-destek" element={<ProtectedRoute userRole={userRole}><VefaDestekYonetimi /></ProtectedRoute>} />
                    <Route path="/odemeler" element={<ProtectedRoute userRole={userRole}><OdemeYonetimi /></ProtectedRoute>} />
                    <Route path="/yardim-yonetimi/hizmet-takip" element={<ProtectedRoute userRole={userRole}><HizmetTakipYonetimi /></ProtectedRoute>} />
                    <Route path="/yardim-yonetimi/hastane-sevk" element={<ProtectedRoute userRole={userRole}><HastaneSevkYonetimi /></ProtectedRoute>} />
                    <Route path="/baskan-onayi" element={<ProtectedRoute userRole={userRole}><BaskanOnayi /></ProtectedRoute>} />
                    
                    {/* Diğer Modüller */}
                    <Route path="/harita" element={<ProtectedRoute userRole={userRole}><HaritaModulu /></ProtectedRoute>} />
                    <Route path="/dokuman-arsivi" element={<ProtectedRoute userRole={userRole}><DosyaYonetimi /></ProtectedRoute>} />
                    <Route path="/uyeler" element={<ProtectedRoute userRole={userRole}><UyeYonetimi /></ProtectedRoute>} />
                    <Route path="/takvim" element={<ProtectedRoute userRole={userRole}><Takvim /></ProtectedRoute>} />
                    <Route path="/finansal-kayitlar" element={<ProtectedRoute userRole={userRole}><FinansalKayitlar /></ProtectedRoute>} />
                    
                    {/* Mesajlaşma */}
                    <Route path="/mesajlasma" element={<ProtectedRoute userRole={userRole}><TopluIletisim /></ProtectedRoute>} />
                    <Route path="/toplu-iletisim" element={<ProtectedRoute userRole={userRole}><TopluIletisim /></ProtectedRoute>} />
                    <Route path="/mesajlasma/raporlar" element={<ProtectedRoute userRole={userRole}><MesajRaporlari /></ProtectedRoute>} />
                    
                    {/* Proje & Etkinlik */}
                    <Route path="/projeler" element={<ProtectedRoute userRole={userRole}><ProjeYonetimi /></ProtectedRoute>} />
                    <Route path="/etkinlikler" element={<ProtectedRoute userRole={userRole}><EtkinlikYonetimi /></ProtectedRoute>} />
                    
                    {/* Özel Yönetim */}
                    <Route path="/burs-yonetimi" element={<ProtectedRoute userRole={userRole}><OgrenciBurslari /></ProtectedRoute>} />
                    <Route path="/burs-yonetimi/basvurular" element={<ProtectedRoute userRole={userRole}><OgrenciBurslari /></ProtectedRoute>} />
                    <Route path="/burs-yonetimi/bursiyerler" element={<ProtectedRoute userRole={userRole}><OgrenciBurslari /></ProtectedRoute>} />
                    <Route path="/yetim-yonetimi" element={<ProtectedRoute userRole={userRole}><YetimYonetimi /></ProtectedRoute>} />
                    <Route path="/yetim-yonetimi/yetim-kayitlari" element={<ProtectedRoute userRole={userRole}><YetimYonetimi /></ProtectedRoute>} />
                    <Route path="/yetim-yonetimi/sponsor-eslestirme" element={<ProtectedRoute userRole={userRole}><YetimYonetimi /></ProtectedRoute>} />
                    <Route path="/hukuk-yonetimi" element={<ProtectedRoute userRole={userRole}><HukukiYardim /></ProtectedRoute>} />
                    <Route path="/hukuk-yonetimi/davalar" element={<ProtectedRoute userRole={userRole}><HukukiYardim /></ProtectedRoute>} />
                    <Route path="/hukuk-yonetimi/sozlesmeler" element={<ProtectedRoute userRole={userRole}><HukukiYardim /></ProtectedRoute>} />
                    <Route path="/burslar" element={<ProtectedRoute userRole={userRole}><OgrenciBurslari /></ProtectedRoute>} />
                    <Route path="/yetimler" element={<ProtectedRoute userRole={userRole}><YetimYonetimi /></ProtectedRoute>} />
                    <Route path="/hukuki-yardim" element={<ProtectedRoute userRole={userRole}><HukukiYardim /></ProtectedRoute>} />
                    
                    {/* Sistem */}
                    <Route path="/raporlama-analitik" element={<ProtectedRoute userRole={userRole}><RaporlamaAnalitik /></ProtectedRoute>} />
                    <Route path="/destek" element={<ProtectedRoute userRole={userRole}><Destek /></ProtectedRoute>} />
                    <Route path="/chatbot-yonetimi" element={<ProtectedRoute userRole={userRole}><ChatbotYonetimi /></ProtectedRoute>} />
                    
                    {/* Sistem Ayarları */}
                    <Route path="/sistem-ayarlari" element={<ProtectedRoute userRole={userRole}><Ayarlar /></ProtectedRoute>} />
                    <Route path="/sistem-ayarlari/genel" element={<ProtectedRoute userRole={userRole}><Ayarlar /></ProtectedRoute>} />
                    <Route path="/sistem-ayarlari/kullanicilar" element={<ProtectedRoute userRole={userRole}><KullaniciYonetimi /></ProtectedRoute>} />
                    <Route path="/sistem-ayarlari/yedekleme" element={<ProtectedRoute userRole={userRole}><Ayarlar /></ProtectedRoute>} />
                    
                    {/* Eski route'lar için yönlendirmeler */}
                    <Route path="/kisi-yonetimi" element={<Navigate to="/kisiler" replace />} />
                    <Route path="/proje-yonetimi" element={<Navigate to="/projeler" replace />} />
                    <Route path="/yardim-basvurulari" element={<Navigate to="/yardimlar" replace />} />
                    <Route path="/gonullu-yonetimi" element={<Navigate to="/gonulluler" replace />} />
                    <Route path="/etkinlik-yonetimi" element={<Navigate to="/etkinlikler" replace />} />
                    <Route path="/uye-yonetimi" element={<Navigate to="/uyeler" replace />} />
                    <Route path="/yetim-yonetimi" element={<Navigate to="/yetimler" replace />} />
                    <Route path="/stok-yonetimi" element={<Navigate to="/depo-yonetimi" replace />} />
                    <Route path="/kumbara-yonetimi" element={<Navigate to="/kumbaralar" replace />} />
                    <Route path="/api-entegrasyonu" element={<ProtectedRoute userRole={userRole}><ApiEntegrasyonu /></ProtectedRoute>} />
                    <Route path="/bildirimler" element={<ProtectedRoute userRole={userRole}><Bildirimler /></ProtectedRoute>} />
                    <Route path="/dosya-yonetimi" element={<Navigate to="/dokuman-arsivi" replace />} />
                    <Route path="/raporlar" element={<Navigate to="/raporlama-analitik" replace />} />
                    <Route path="/ayarlar" element={<Navigate to="/sistem-ayarlari" replace />} />
                    <Route path="/profil" element={<ProtectedRoute userRole={userRole}><KullaniciYonetimi /></ProtectedRoute>} />
                    <Route path="/access-denied" element={<ProtectedRoute userRole={userRole}><AccessDenied /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  </Suspense>
                </div>
              </main>
            </div>
          </div>
          
          <Toaster position="top-right" />
        </Router>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
