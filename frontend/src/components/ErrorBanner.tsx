import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="p-6 bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#ffb4ab] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 text-center sm:text-left">
        <div className="w-10 h-10 bg-[#FF3B30]/20 border border-[#FF3B30]/40 flex items-center justify-center shrink-0 text-[#FF3B30]">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#F5F7FA] font-label-caps uppercase tracking-wider">System Communication Error</h4>
          <p className="text-xs text-[#ffb4ab] mt-0.5">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2 bg-[#FF3B30] hover:bg-[#ffb4ab] text-[#0c0e12] font-bold text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};
