import { useState, useEffect } from 'react';
import { offlineManager } from '@/lib/offline-manager';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize state properly for SSR
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to online for SSR
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('syncing');
      
      // Trigger sync
      offlineManager.syncPendingData()
        .then(() => setSyncStatus('idle'))
        .catch(() => setSyncStatus('error'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('idle');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    syncStatus,
    offlineManager
  };
}