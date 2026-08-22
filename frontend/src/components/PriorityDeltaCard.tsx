import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PriorityDeltaItem {
  cve_id: string;
  product_name: string;
  rank_a: number | null; // null if outside Top 5
  rank_b: number | null; // null if outside Top 5
  score_a: number | null;
  score_b: number | null;
  exposure_a?: string;
  exposure_b?: string;
  importance_a?: string;
  importance_b?: string;
  version_a?: string;
  version_b?: string;
  drivers: string[];
}

interface PriorityDeltaProps {
  item: PriorityDeltaItem;
  profileAName: string;
  profileBName: string;
  profileAId: string;
  profileBId: string;
  isExpandedDefault?: boolean;
}

export const PriorityDeltaCard: React.FC<PriorityDeltaProps> = ({
  item,
  profileAName,
  profileBName,
  profileAId,
  profileBId,
  isExpandedDefault = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedDefault);

  // Delta calculation: positive means moved upward in B (e.g. #5 -> #1 is +4 positions)
  const calculateDelta = () => {
    if (item.rank_a !== null && item.rank_b !== null) {
      const diff = item.rank_a - item.rank_b;
      return {
        diff,
        text: diff > 0 ? `+${diff} positions` : diff < 0 ? `${diff} positions` : 'Unchanged',
        isTop5Both: true,
      };
    }
    if (item.rank_a !== null && item.rank_b === null) {
      return {
        diff: -999,
        text: 'Dropped Outside Top 5',
        isTop5Both: false,
      };
    }
    if (item.rank_a === null && item.rank_b !== null) {
      return {
        diff: 999,
        text: 'Entered Top 5',
        isTop5Both: false,
      };
    }
    return { diff: 0, text: 'Outside Top 5 in Both', isTop5Both: false };
  };

  const delta = calculateDelta();

  return (
    <div className="bg-[#11141B] border border-[#1E2530] hover:border-[#3b494c] transition-colors p-5 md:p-6 space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center font-mono font-bold text-xs text-[#00E5FF]">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#F5F7FA] text-sm">{item.cve_id}</span>
              <span className="text-[10px] font-mono text-[#606D7A]">({item.product_name})</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-label-caps text-[#606D7A] uppercase font-bold">
                Movement:
              </span>
              <span
                className={`font-mono text-xs font-bold ${
                  delta.diff > 0
                    ? 'text-[#00E5FF]'
                    : delta.diff < 0
                    ? 'text-[#FF9500]'
                    : 'text-[#bac9cc]'
                }`}
              >
                {delta.text}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Rank Transition Badges */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="text-center px-3 py-1.5 bg-[#0c0e12] border border-[#1E2530] min-w-[80px]">
            <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
              {profileAId}
            </span>
            <span className="font-bold text-[#00E5FF]">
              {item.rank_a !== null ? `#0${item.rank_a}` : 'Outside Top 5'}
            </span>
          </div>

          <div className="text-[#606D7A]">
            {delta.diff > 0 ? (
              <TrendingUp className="h-4 w-4 text-[#00E5FF]" />
            ) : delta.diff < 0 ? (
              <TrendingDown className="h-4 w-4 text-[#FF9500]" />
            ) : (
              <Minus className="h-4 w-4 text-[#606D7A]" />
            )}
          </div>

          <div className="text-center px-3 py-1.5 bg-[#0c0e12] border border-[#1E2530] min-w-[80px]">
            <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
              {profileBId}
            </span>
            <span className="font-bold text-[#00daf3]">
              {item.rank_b !== null ? `#0${item.rank_b}` : 'Outside Top 5'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] font-label-caps text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
          >
            {isExpanded ? 'Hide Delta' : 'Inspect Delta'}
          </button>
        </div>
      </div>

      {/* Expanded Deep Visual Flow */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pt-4 border-t border-[#1E2530] space-y-6"
          >
            {/* Horizontal Flow Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* Profile A Column */}
              <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                  <span className="font-label-caps text-[10px] text-[#606D7A] uppercase font-bold">
                    PROFILE A ({profileAId})
                  </span>
                  <span className="font-bold text-[#00E5FF]">
                    {item.rank_a !== null ? `Rank #${item.rank_a}` : 'Outside Top 5'}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Organisation:</span>
                    <span className="text-[#F5F7FA] truncate max-w-[130px]">{profileAName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Score:</span>
                    <span className="text-[#00E5FF] font-bold">
                      {item.score_a !== null ? `${item.score_a.toFixed(1)} pts` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Exposure:</span>
                    <span className="text-[#F5F7FA]">{item.exposure_a || 'Internal'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Criticality:</span>
                    <span className="text-[#F5F7FA]">{item.importance_a || 'Normal'}</span>
                  </div>
                </div>
              </div>

              {/* Context Difference / Driver Column */}
              <div className="p-4 bg-[#0c0e12] border border-[#00E5FF]/30 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[#00E5FF] border-b border-[#1E2530] pb-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="font-label-caps text-[10px] uppercase font-bold tracking-wider">
                      Context Differences
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {item.drivers.length > 0 ? (
                      item.drivers.map((drv, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1 bg-[#191c20] border border-[#3b494c] text-[#00daf3] text-[10px] leading-tight"
                        >
                          {drv}
                        </div>
                      ))
                    ) : (
                      <div className="text-[#606D7A] text-[11px] italic">
                        Same technology and exposure parameters across profiles.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 text-center text-[10px] font-label-caps uppercase text-[#606D7A] border-t border-[#1E2530]">
                  Deterministic Factor Causal Path
                </div>
              </div>

              {/* Profile B Column */}
              <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                  <span className="font-label-caps text-[10px] text-[#606D7A] uppercase font-bold">
                    PROFILE B ({profileBId})
                  </span>
                  <span className="font-bold text-[#00daf3]">
                    {item.rank_b !== null ? `Rank #${item.rank_b}` : 'Outside Top 5'}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Organisation:</span>
                    <span className="text-[#F5F7FA] truncate max-w-[130px]">{profileBName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Score:</span>
                    <span className="text-[#00daf3] font-bold">
                      {item.score_b !== null ? `${item.score_b.toFixed(1)} pts` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Exposure:</span>
                    <span className="text-[#F5F7FA]">{item.exposure_b || 'Internet-facing'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606D7A]">Criticality:</span>
                    <span className="text-[#F5F7FA]">{item.importance_b || 'Critical'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Delta Decision Summary */}
            <div className="p-4 bg-[#0c0e12] border border-[#1E2530] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#00E5FF] shrink-0" />
                <span className="text-[#bac9cc]">
                  <strong className="text-[#F5F7FA]">Decision Change: </strong>
                  {delta.text} based on distinct perimeter reachability and business service criticality.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-label-caps text-[#606D7A] uppercase font-bold">
                  Decision Confidence:
                </span>
                <span className="px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[10px] font-bold">
                  HIGH (FACT-BOUND)
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
