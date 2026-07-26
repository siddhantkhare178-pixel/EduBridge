'use client';

import { useOffline } from '@/hooks/use-offline';
import { Wifi, WifiOff, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
  showStorageInfo?: boolean;
  position?: 'fixed' | 'inline';
  size?: 'sm' | 'md';
}

export function OfflineIndicator({ 
  showStorageInfo = false, 
  position = 'inline',
  size = 'sm' 
}: OfflineIndicatorProps) {
  const { isOnline, syncStatus } = useOffline();

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-3 w-3" />;
    if (syncStatus === 'syncing') return <Loader2 className="h-3 w-3 animate-spin" />;
    if (syncStatus === 'error') return <AlertCircle className="h-3 w-3" />;
    return <Wifi className="h-3 w-3" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing';
    if (syncStatus === 'error') return 'Sync Error';
    return 'Online';
  };

  const badgeContent = (
    <Badge variant={isOnline ? "secondary" : "outline"} className="flex items-center gap-1">
      {getStatusIcon()}
      {size === 'md' && getStatusText()}
    </Badge>
  );

  if (position === 'fixed') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        {badgeContent}
      </div>
    );
  }

  return badgeContent;
}