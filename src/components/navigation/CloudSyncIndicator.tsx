'use client';

import React from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { SyncStatus } from '@/lib/supabase/client';

interface CloudSyncIndicatorProps {
  status: SyncStatus;
  lastSyncedAt?: Date | null;
  onManualSync?: () => void;
  errorMessage?: string | null;
}

export const CloudSyncIndicator: React.FC<CloudSyncIndicatorProps> = ({
  status,
  lastSyncedAt,
  onManualSync,
  errorMessage,
}) => {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs border border-gray-200 bg-white shadow-xs">
      {status === 'syncing' ? (
        <span className="flex items-center gap-1.5 text-amber-600 font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Đang đồng bộ...</span>
        </span>
      ) : status === 'synced' ? (
        <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Cloud Đã lưu</span>
        </span>
      ) : status === 'connected' ? (
        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
          <Cloud className="w-3.5 h-3.5" />
          <span>Supabase Cloud</span>
        </span>
      ) : status === 'error' ? (
        <span
          className="flex items-center gap-1.5 text-rose-600 font-medium cursor-pointer"
          title={errorMessage || 'Lỗi đồng bộ Supabase'}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Lỗi Cloud</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-gray-500 font-medium">
          <CloudOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </span>
      )}

      {onManualSync && (
        <button
          type="button"
          onClick={onManualSync}
          className="text-gray-400 hover:text-blue-600 transition-colors p-0.5"
          title="Đồng bộ lại dữ liệu lên Supabase Cloud"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
