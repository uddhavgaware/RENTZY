import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, MessageSquare, Truck, Users, X, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { setupPushNotifications } from '../utils/pushNotification';

const NotificationPermissionModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if (!('Notification' in window)) return;

    const checkAndShowModal = () => {
      // If permission is already granted or denied, don't show automatic popup
      if (Notification.permission !== 'default') return;

      // Check if user dismissed it within the last 12 hours (43200000 ms)
      const dismissedTime = localStorage.getItem('rentzy_notif_prompt_dismissed');
      if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 43200000) {
        return;
      }

      // Show modal after a 2-second delay for smooth onboarding
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    };

    checkAndShowModal();

    // Listen for manual triggers (e.g. from navbar bell icon or settings)
    const handleManualTrigger = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        setIsOpen(true);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        toast.success('🎉 Notifications are already enabled on your device!');
      } else {
        toast.error('⚠️ Notifications are blocked in your browser. Please enable them in your browser/device site settings.', {
          duration: 5000,
          icon: '🔕'
        });
      }
    };

    window.addEventListener('trigger-notif-modal', handleManualTrigger);
    return () => window.removeEventListener('trigger-notif-modal', handleManualTrigger);
  }, []);

  const handleAllowNotifications = async () => {
    if (!('Notification' in window)) return;
    setLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await setupPushNotifications();
        toast.success('🎉 Notifications Enabled! You will now receive instant alerts.', {
          duration: 4000,
          icon: '🔔'
        });
        localStorage.removeItem('rentzy_notif_prompt_dismissed');
        setIsOpen(false);
      } else if (permission === 'denied') {
        toast('⚠️ Notice: You blocked notifications. You can re-enable them anytime in browser site settings.', {
          duration: 5000,
          icon: 'ℹ️'
        });
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request permission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('rentzy_notif_prompt_dismissed', Date.now().toString());
    toast('You can enable notifications anytime from the Bell icon in the navbar!', {
      duration: 3500,
      icon: '🔔'
    });
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-indigo-500/30 dark:border-indigo-500/20 text-center relative overflow-hidden animate-scale-up">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Skip for now"
        >
          <X size={20} />
        </button>

        {/* Animated Bell Icon Header */}
        <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-75" />
          <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-indigo-400/40 text-white">
            <Bell size={32} className="animate-bounce" />
          </div>
        </div>

        <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 sm:bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2 border border-indigo-200 dark:border-indigo-500/30">
          Must-Have Feature ⚡
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
          Don't Miss Out! <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Enable Instant Alerts
          </span>
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-2 leading-relaxed">
          To protect your tenancy and keep you in the loop, RENTZY requires real-time push notifications on your device.
        </p>

        {/* Feature List */}
        <div className="mt-6 space-y-3 text-left bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <MessageSquare size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">Direct Chat Messages</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Instant alerts when landlords or tenants message you.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
              <Users size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">Roommate Matches</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Get notified the second a high compatibility roommate joins.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Truck size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">Mover & Relocation Quotes</h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Live tracking and price confirmations from verified movers.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleAllowNotifications}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 border border-indigo-400/30 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Bell size={18} className="animate-bounce" />
            )}
            <span>{loading ? 'Enabling Alerts...' : '🚀 Allow Notifications Now'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-6 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-bold text-xs rounded-xl transition-colors"
          >
            Not Now (Remind me later)
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
