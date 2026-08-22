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
    <div className="py-16 px-6 text-center bg-[#11141B] border border-[#1E2530] space-y-4">
      <div className="w-12 h-12 mx-auto bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center text-[#00E5FF]">
        <ShieldCheck className="h-6 w-6" />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base font-bold text-[#F5F7FA]">{title}</h3>
        <p className="text-xs text-[#606D7A] leading-relaxed">{message}</p>
      </div>

      {actionText && onAction && (
        <div className="pt-2">
          <button
            onClick={onAction}
            className="px-6 py-2 bg-[#00E5FF] hover:bg-[#c3f5ff] text-[#0c0e12] font-bold text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer"
          >
            {actionText}
          </button>
        </div>
      )}
    </div>
  );
};
