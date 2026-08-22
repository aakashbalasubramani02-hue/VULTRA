import React from 'react';
import { TriageItem } from '../types/api';
import {
  Layers,
  GitCommit,
  Sliders,
  ArrowRight,
} from 'lucide-react';

interface DecisionIntelligenceStripProps {
  topItem: TriageItem | null;
  onOpenTrace: () => void;
  onOpenCompare: () => void;
  onOpenStability: () => void;
}

export const DecisionIntelligenceStrip: React.FC<DecisionIntelligenceStripProps> = ({
  topItem,
  onOpenTrace,
  onOpenCompare,
  onOpenStability,
}) => {
  if (!topItem) return null;

  return (
    <div className="bg-[#11141B] border border-[#1E2530] p-5 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2530] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-[#00E5FF] animate-pulse" />
          <h3 className="font-label-caps text-xs uppercase font-bold tracking-widest text-[#F5F7FA]">
            VULTRA Decision Intelligence Matrix
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#606D7A] uppercase">
          Dynamic Contextual Reasoning
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: PRIORITY DELTA */}
        <div
          onClick={onOpenCompare}
          className="p-4 bg-[#0c0e12] border border-[#1E2530] hover:border-[#00E5FF]/60 transition-colors cursor-pointer group space-y-2.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#00E5FF] font-bold flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>Priority Delta</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#606D7A] group-hover:text-[#00E5FF] transition-colors" />
          </div>

          <div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl font-bold text-[#F5F7FA]">
                #05 → #01
              </span>
              <span className="text-xs font-bold text-[#00E5FF]">
                (+4 positions)
              </span>
            </div>
            <p className="text-[11px] text-[#bac9cc] leading-tight mt-1">
              Top vulnerability shifts priority dramatically when moving from internal to internet-facing perimeter.
            </p>
          </div>

          <div className="pt-2 border-t border-[#1E2530] flex items-center justify-between text-[9px] font-mono text-[#606D7A]">
            <span>CROSS-ORGANISATION AUDIT</span>
            <span className="text-[#00daf3] font-bold">Compare →</span>
          </div>
        </div>

        {/* Panel 2: DECISION TRACE */}
        <div
          onClick={onOpenTrace}
          className="p-4 bg-[#0c0e12] border border-[#1E2530] hover:border-[#00E5FF]/60 transition-colors cursor-pointer group space-y-2.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#00daf3] font-bold flex items-center gap-1.5">
              <GitCommit className="h-3.5 w-3.5" />
              <span>Decision Trace</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#606D7A] group-hover:text-[#00E5FF] transition-colors" />
          </div>

          <div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl font-bold text-[#F5F7FA]">
                8 Evidence Stages
              </span>
              <span className="text-xs font-bold text-[#00daf3]">
                ✓ 100% Traceable
              </span>
            </div>
            <p className="text-[11px] text-[#bac9cc] leading-tight mt-1">
              Every priority recommendation connects from NVD disclosure to organization assets without hallucination.
            </p>
          </div>

          <div className="pt-2 border-t border-[#1E2530] flex items-center justify-between text-[9px] font-mono text-[#606D7A]">
            <span>ZERO BLACK-BOX AI</span>
            <span className="text-[#00E5FF] font-bold">Inspect Trace →</span>
          </div>
        </div>

        {/* Panel 3: DECISION STABILITY */}
        <div
          onClick={onOpenStability}
          className="p-4 bg-[#0c0e12] border border-[#1E2530] hover:border-[#00E5FF]/60 transition-colors cursor-pointer group space-y-2.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-label-caps uppercase tracking-wider text-[#FFCC00] font-bold flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>Decision Stability</span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-[#606D7A] group-hover:text-[#00E5FF] transition-colors" />
          </div>

          <div>
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-xl font-bold text-[#00E5FF]">
                STABLE
              </span>
              <span className="text-xs text-[#bac9cc]">
                (Remains #01)
              </span>
            </div>
            <p className="text-[11px] text-[#bac9cc] leading-tight mt-1">
              Rank holds across threat-focused, severity-focused, and context-focused sensitivity simulations.
            </p>
          </div>

          <div className="pt-2 border-t border-[#1E2530] flex items-center justify-between text-[9px] font-mono text-[#606D7A]">
            <span>WHAT-IF SENSITIVITY TEST</span>
            <span className="text-[#FFCC00] font-bold">Simulate →</span>
          </div>
        </div>
      </div>
    </div>
  );
};
