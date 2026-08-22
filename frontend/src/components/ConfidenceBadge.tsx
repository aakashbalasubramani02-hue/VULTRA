import React, { useState } from 'react';
import { ConfidenceLevel } from '../types/api';
import { Info } from 'lucide-react';

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
          symbol: '●',
          label: 'High Confidence',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
          desc: 'Direct canonical product match with explicit verified version bounds and complete source signals.',
        };
      case 'MEDIUM':
        return {
          symbol: '◐',
          label: 'Medium Confidence',
          color: 'text-cyan-400',
          bg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300',
          desc: 'Canonical technology match with unconstrained installed version; active threat signals confirmed.',
        };
      case 'LOW':
        return {
          symbol: '○',
          label: 'Low Confidence',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
          desc: 'Partial product mapping or limited threat signal verification in snapshot data.',
        };
      default:
        return {
          symbol: '•',
          label: confidence,
          color: 'text-slate-400',
          bg: 'bg-slate-800 border-slate-700 text-slate-300',
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold border cursor-help transition-colors ${config.bg}`}
      >
        <span className={`text-xs ${config.color}`}>{config.symbol}</span>
        <span>{config.label}</span>
        {showTooltip && <Info className="h-3 w-3 opacity-60 ml-0.5" />}
      </div>

      {showTooltip && isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 pointer-events-none">
          <p className="font-semibold text-slate-200 text-[11px] mb-1">
            {config.label}
          </p>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {config.desc}
          </p>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[9px] text-cyan-400 font-mono">
            * Reflects data & matching certainty, not threat severity.
          </div>
        </div>
      )}
    </div>
  );
};
