import React from 'react';
import { TriageResponse } from '../types/api';
import { X, Clock, Sparkles, ShieldAlert, CheckCircle2, FileCheck, ArrowRight, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BriefModalProps {
  triage: TriageResponse | null;
  onClose: () => void;
  onViewEvidence: (cveId: string) => void;
}

export const BriefModal: React.FC<BriefModalProps> = ({
  triage,
  onClose,
  onViewEvidence,
}) => {
  if (!triage || triage.results.length === 0) return null;

  const topAction = triage.results[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-label-caps font-bold uppercase tracking-widest text-[#00E5FF]">
                Executive Intelligence Dossier
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">
                60-Second Security Brief: {triage.profile.name}
              </h2>
            </div>
          </div>

          <div className="space-y-6">
            {/* Section 1: WHAT TO DO FIRST */}
            <div className="p-6 bg-[#11141B] border border-[#FF3B30] relative overflow-hidden space-y-4">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FF3B30]" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-widest text-[#FF3B30] font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span>TOP DEFENSIVE PRIORITY (WHAT TO DO FIRST)</span>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30">
                  {topAction.priority} ({topAction.score.toFixed(1)} / 100 PTS)
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#F5F7FA]">
                {topAction.title} ({topAction.cve_id})
              </h3>

              <div className="text-xs sm:text-sm text-[#c3f5ff] font-semibold leading-relaxed bg-[#0c0e12] p-4 border border-[#00E5FF]/30">
                👉 {topAction.next_action}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <span className="text-[#bac9cc] font-mono flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-[#00E5FF]" />
                  <span>Asset: <strong className="text-[#F5F7FA]">{topAction.technology.product}</strong> ({topAction.exposure}, {topAction.importance})</span>
                </span>

                <button
                  onClick={() => {
                    onClose();
                    onViewEvidence(topAction.cve_id);
                  }}
                  className="text-xs font-label-caps tracking-wider text-[#00E5FF] hover:underline inline-flex items-center gap-1 cursor-pointer font-bold uppercase"
                >
                  <span>Inspect Forensic Evidence</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Section 2: WHAT MATTERS (Top 5 Vulnerabilities) */}
            <div className="p-6 bg-[#0c0e12] border border-[#1E2530] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1E2530] pb-3">
                <div className="flex items-center gap-2 text-xs font-label-caps uppercase tracking-widest text-[#F5F7FA] font-bold">
                  <ShieldAlert className="h-4 w-4 text-[#FF9500]" />
                  <span>DEFENSIVE TOP 5 PRIORITIES</span>
                </div>
                <span className="text-[11px] font-mono text-[#606D7A]">
                  Filtered from {triage.summary.matched_candidates} candidates
                </span>
              </div>

              <div className="space-y-2">
                {triage.results.map((item) => (
                  <div
                    key={item.cve_id}
                    className="flex items-center justify-between p-3.5 bg-[#111318] border border-[#1E2530] hover:border-[#3b494c] text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 bg-[#191c20] text-[#00E5FF] font-mono font-bold flex items-center justify-center shrink-0 border border-[#3b494c]">
                        #{item.rank}
                      </span>
                      <span className="font-mono font-bold text-[#F5F7FA] shrink-0">
                        {item.cve_id}
                      </span>
                      <span className="text-[#606D7A] truncate hidden sm:inline font-medium">
                        • {item.technology.product}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-[11px] px-2 py-0.5 bg-[#0c0e12] text-[#bac9cc] border border-[#1E2530]">
                        CVSS {item.signals.cvss.toFixed(1)} {item.signals.kev ? '| KEV ✓' : ''}
                      </span>
                      <span className="text-[#00E5FF] font-extrabold text-sm">
                        {item.score.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: WHY & CONFIDENCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-[#0c0e12] border border-[#1E2530] text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#F5F7FA] font-bold uppercase tracking-widest font-label-caps">
                  <CheckCircle2 className="h-4 w-4 text-[#00E5FF]" />
                  <span>WHY THIS MATTERS</span>
                </div>
                <p className="text-[#bac9cc] leading-relaxed text-[12px]">
                  Rankings prioritize confirmed in-the-wild exploitation (CISA KEV) and high empirical probabilities
                  (FIRST EPSS) deployed on your internet-facing perimeter and critical business services.
                </p>
              </div>

              <div className="p-5 bg-[#0c0e12] border border-[#1E2530] text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#F5F7FA] font-bold uppercase tracking-widest font-label-caps">
                  <FileCheck className="h-4 w-4 text-[#00daf3]" />
                  <span>DATA INTEGRITY & PROVENANCE</span>
                </div>
                <p className="text-[#bac9cc] leading-relaxed text-[12px]">
                  100% deterministic calculation. Full provenance retained from dataset snapshot without external API
                  dependencies or hallucinated AI reasoning.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E2530] flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#00E5FF] hover:bg-[#c3f5ff] text-[#0c0e12] font-bold text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
