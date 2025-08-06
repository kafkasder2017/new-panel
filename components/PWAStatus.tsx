import React from 'react';
import { usePWA } from '../src/hooks/usePWA';
import toast from 'react-hot-toast';

const PWAStatus: React.FC = () => {
  const {
    isOnline,
    isInstallable,
    isInstalled,
    isServiceWorkerReady,
    installApp,
    requestNotificationPermission,
    showNotification,
  } = usePWA();

  const handleInstallApp = async () => {
    try {
      await installApp();
      toast.success('Uygulama yükleme başlatıldı!');
    } catch (error) {
      toast.error('Uygulama yüklenirken hata oluştu');
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Bildirimler etkinleştirildi!');
      showNotification('KAFKASDER', {
        body: 'Bildirimler başarıyla etkinleştirildi!',
        tag: 'notification-enabled'
      });
    } else {
      toast.error('Bildirim izni reddedildi');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Offline Status */}
      {!isOnline && (
        <div className="mb-2 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium">Çevrimdışı Mod</span>
        </div>
      )}

      {/* Install App Button */}
      {isInstallable && !isInstalled && (
        <div className="mb-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Uygulamayı Yükle</span>
            </div>
            <button
              onClick={handleInstallApp}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Yükle
            </button>
          </div>
        </div>
      )}

      {/* Service Worker Status */}
      {isServiceWorkerReady && (
        <div className="mb-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">PWA Hazır</span>
        </div>
      )}

      {/* Enable Notifications */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div className="mb-2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.868 19.718c.64.64 1.673.64 2.313 0l9.9-9.9c.64-.64.64-1.673 0-2.313l-2.828-2.828c-.64-.64-1.673-.64-2.313 0l-9.9 9.9c-.64.64-.64 1.673 0 2.313l2.828 2.828z" />
              </svg>
              <span className="text-sm font-medium">Bildirimleri Etkinleştir</span>
            </div>
            <button
              onClick={handleEnableNotifications}
              className="bg-white text-purple-600 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Etkinleştir
            </button>
          </div>
        </div>
      )}

      {/* App Installed Status */}
      {isInstalled && (
        <div className="mb-2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Uygulama Yüklendi</span>
        </div>
      )}
    </div>
  );
};

export default PWAStatus;