import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const OfflineNotice = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Helper to sync any queued offline requests (e.g. Movers requests)
  const syncOfflineQueue = async () => {
    try {
      const moversQueueRaw = localStorage.getItem('rentzy_offline_movers_queue');
      if (moversQueueRaw) {
        const moversQueue = JSON.parse(moversQueueRaw);
        if (Array.isArray(moversQueue) && moversQueue.length > 0) {
          setSyncing(true);
          let successCount = 0;
          const remainingQueue = [];

          for (const item of moversQueue) {
            try {
              await api.post('/moving-requests', item);
              successCount++;
            } catch (err) {
              console.error('Failed to sync item:', err);
              remainingQueue.push(item);
            }
          }

          if (remainingQueue.length > 0) {
            localStorage.setItem('rentzy_offline_movers_queue', JSON.stringify(remainingQueue));
          } else {
            localStorage.removeItem('rentzy_offline_movers_queue');
          }

          if (successCount > 0) {
            toast.success(`🎉 Successfully synced ${successCount} offline relocation request${successCount > 1 ? 's' : ''}!`);
          }
          setSyncing(false);
        }
      }
    } catch (error) {
      console.error('Error syncing offline queue:', error);
      setSyncing(false);
    }
  };

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
      toast.error('⚠️ You are now offline. Switching to local cached mode.', {
        id: 'offline-toast',
        duration: 4000,
        icon: '📴'
      });
    };

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      toast.success('🟢 Internet connection restored!', {
        id: 'online-toast',
        duration: 3000
      });
      // Trigger sync for offline queued requests
      syncOfflineQueue();

      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check on mount
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline && !justReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
        isOffline
          ? 'bg-amber-500 text-white animate-pulse'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff size={15} className="shrink-0 animate-bounce" />
          <span>
            Offline Mode: You are currently disconnected from the internet. Cached data & offline request queue active.
          </span>
        </>
      ) : (
        <>
          {syncing ? (
            <RefreshCw size={15} className="shrink-0 animate-spin" />
          ) : (
            <Wifi size={15} className="shrink-0" />
          )}
          <span>
            {syncing
              ? 'Internet restored! Syncing queued offline requests to server...'
              : '🟢 Internet connection restored! All systems synchronized.'}
          </span>
        </>
      )}
    </div>
  );
};

export default OfflineNotice;
