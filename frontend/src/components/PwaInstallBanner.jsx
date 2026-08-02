import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PwaInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running as installed standalone PWA
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    ) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect iOS (iPhone/iPad/iPod)
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iosDevice);

    // If on iOS and not installed, show banner after 3 seconds
    if (iosDevice) {
      const iosDismissed = localStorage.getItem('rentzy_pwa_ios_dismissed');
      if (!iosDismissed) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // 3. Listen for Android/Desktop PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default mini-infobar
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show custom install banner if user hasn't dismissed it recently
      const dismissedTime = localStorage.getItem('rentzy_pwa_dismissed_time');
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 86400000) { // Show again after 24 hours
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for custom trigger from Homepage or Navbar buttons
    const handleCustomTrigger = () => {
      setShowBanner(true);
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }) => {
          if (outcome === 'accepted') {
            toast.success('Installing RentXY...');
            setShowBanner(false);
          }
        });
      } else if (isIOS) {
        toast('To install on iPhone: Tap Share (⬆️) at the bottom of Safari and select "Add to Home Screen" 📱', { duration: 6000, icon: 'ℹ️' });
      } else {
        toast('To install: Click the install icon (🖥️/➕) in your browser address bar or download our APK below!', { duration: 5000, icon: 'ℹ️' });
      }
    };
    window.addEventListener('trigger-pwa-install', handleCustomTrigger);

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
      toast.success('🎉 RentXY successfully installed to your Home Screen!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger-pwa-install', handleCustomTrigger);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, isIOS]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast('To install on iPhone: Tap the Share button (⬆️) at the bottom of Safari and select "Add to Home Screen" 📱', {
          duration: 6000,
          icon: 'ℹ️'
        });
      }
      return;
    }

    // Show the native browser install dialog
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('Installing RentXY...');
      setShowBanner(false);
    } else {
      toast('Installation cancelled.', { icon: 'ℹ️' });
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('rentzy_pwa_ios_dismissed', 'true');
    } else {
      localStorage.setItem('rentzy_pwa_dismissed_time', Date.now().toString());
    }
  };

  // If already installed or banner hidden, render nothing
  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9999] bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 backdrop-blur-md animate-slideUp flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/40 border border-indigo-400/30">
            <Smartphone size={24} className="text-white animate-bounce" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm md:text-base leading-tight tracking-tight text-white flex items-center gap-1.5">
              Install RentXY App <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full font-bold uppercase">Free</span>
            </h4>
            <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
              {isIOS ? (
                'Add to your iPhone Home Screen for instant offline access & push notifications!'
              ) : (
                'Install app for 10x faster load times, offline mover quotes & push notifications!'
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>

      {isIOS ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-gray-200 flex items-center gap-2">
          <Share2 size={16} className="text-indigo-400 shrink-0" />
          <span>
            Tap <strong className="text-white font-bold">Share ⬆️</strong> in Safari, then tap <strong className="text-white font-bold">"Add to Home Screen 📱"</strong>.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 border border-indigo-400/30"
          >
            <Download size={15} />
            Install Mobile App
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Later
          </button>
        </div>
      )}
    </div>
  );
};

export default PwaInstallBanner;
