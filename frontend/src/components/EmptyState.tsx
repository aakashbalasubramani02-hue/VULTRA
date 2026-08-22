import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Relevant Vulnerabilities Found',
  message = 'Nothing matched this profile in the supplied data.',
  actionText,
  onAction,
}) => {
  return (
    <div className="py-16 px-6 text-center rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
      <div className="h-14 w-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
        <ShieldCheck className="h-7 w-7" />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};
