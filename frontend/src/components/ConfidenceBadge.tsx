import React, { useState } from 'react';
import { ConfidenceLevel } from '../types/api';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel | string;
  showTooltip?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  showTooltip = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getConfig = () => {
    switch (confidence.toUpperCase()) {
      case 'HIGH':
        return {
          dotColor: 'bg-[#00E5FF]',
          borderColor: 'border-[#00E5FF]/40',
          textColor: 'text-[#c3f5ff]',
          label: 'HIGH CONFIDENCE',
          desc: 'Direct canonical product match with explicit verified version bounds and complete source signals.',
        };
      case 'MEDIUM':
        return {
          dotColor: 'bg-[#FFCC00]',
          borderColor: 'border-[#FFCC00]/40',
          textColor: 'text-[#ffeac0]',
          label: 'MEDIUM CONFIDENCE',
          desc: 'Canonical technology match with unconstrained installed version; active threat signals confirmed.',
        };
      case 'LOW':
        return {
          dotColor: 'bg-[#606D7A]',
          borderColor: 'border-[#3b494c]',
          textColor: 'text-[#bac9cc]',
          label: 'LOW CONFIDENCE',
          desc: 'Partial product mapping or limited threat signal verification in snapshot data.',
        };
      default:
        return {
          dotColor: 'bg-[#606D7A]',
          borderColor: 'border-[#3b494c]',
          textColor: 'text-[#bac9cc]',
          label: String(confidence).toUpperCase(),
          desc: 'Confidence rating reflecting data completeness.',
        };
    }
  };

  const config = getConfig();

  return (
    <div className="relative inline-flex items-center">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex items-center gap-2 px-2.5 py-1 border text-[11px] font-label-caps tracking-widest uppercase transition-colors bg-[#11141B] ${config.borderColor} ${config.textColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
        <span>{config.label}</span>
      </div>

      {showTooltip && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0c0e12] border border-[#3b494c] text-xs shadow-2xl z-50 pointer-events-none">
          <p className="font-semibold text-[#F5F7FA] font-label-caps tracking-wider text-[11px] mb-1">
            {config.label}
          </p>
          <p className="text-[11px] text-[#bac9cc] leading-relaxed">
            {config.desc}
          </p>
          <div className="mt-2 pt-2 border-t border-[#1E2530] text-[10px] text-[#00E5FF] font-mono">
            * Reflects data & matching certainty, not threat severity.
          </div>
        </div>
      )}
    </div>
  );
};
