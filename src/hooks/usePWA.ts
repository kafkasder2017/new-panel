import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  isServiceWorkerReady: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [state, setState] = useState<PWAState>({
    isOnline: navigator.onLine,
    isInstallable: false,
    isInstalled: false,
    isServiceWorkerReady: false,
    installPrompt: null,
  });

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          setState(prev => ({ ...prev, isServiceWorkerReady: true }));
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setState(prev => ({ 
        ...prev, 
        isInstallable: true, 
        installPrompt: installEvent 
      }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({ 
        ...prev, 
        isInstalled: true, 
        isInstallable: false, 
        installPrompt: null 
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setState(prev => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (state.installPrompt) {
      try {
        await state.installPrompt.prompt();
        const choiceResult = await state.installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setState(prev => ({ ...prev, installPrompt: null, isInstallable: false }));
      } catch (error) {
        console.error('Error during app installation:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...options,
          });
        });
      }
    }
  };

  return {
    ...state,
    installApp,
    requestNotificationPermission,
    showNotification,
  };
};