import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 text-center sm:text-left">
        <div className="h-10 w-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">System Error</h4>
          <p className="text-xs text-rose-300 mt-0.5">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
};
