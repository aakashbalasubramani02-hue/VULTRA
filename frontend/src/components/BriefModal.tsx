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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 md:p-8"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                Presentation Briefing Mode
              </div>
              <h2 className="text-xl font-extrabold text-white">
                60-Second Security Brief: {triage.profile.name}
              </h2>
            </div>
          </div>

          <div className="space-y-5">
            {/* Section 1: WHAT TO DO FIRST (Hero Box) */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-950/80 border border-cyan-500/35 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-extrabold">
                  <Sparkles className="h-4 w-4" />
                  <span>WHAT TO DO FIRST (TOP DEFENSIVE PRIORITY)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {topAction.priority} ({topAction.score.toFixed(1)} / 100)
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-white">
                {topAction.title} ({topAction.cve_id})
              </h3>

              <div className="text-xs sm:text-sm text-cyan-100 font-semibold leading-relaxed bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/25">
                👉 {topAction.next_action}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                <span className="text-slate-400 font-mono flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Target: <strong className="text-white">{topAction.technology.product}</strong> ({topAction.exposure}, {topAction.importance})</span>
                </span>

                <button
                  onClick={() => {
                    onClose();
                    onViewEvidence(topAction.cve_id);
                  }}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-200 underline inline-flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>Inspect Forensic Evidence</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Section 2: WHAT MATTERS (Top 5 Vulnerabilities) */}
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>WHAT MATTERS (DEFENSIVE TOP 5 LIST)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Selected from {triage.summary.matched_candidates} candidates
                </span>
              </div>

              <div className="space-y-2">
                {triage.results.map((item) => (
                  <div
                    key={item.cve_id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-7 w-7 rounded-xl bg-slate-800 text-cyan-400 font-mono font-bold flex items-center justify-center shrink-0 border border-slate-700">
                        #{item.rank}
                      </span>
                      <span className="font-mono font-bold text-white shrink-0">
                        {item.cve_id}
                      </span>
                      <span className="text-slate-400 truncate hidden sm:inline font-medium">
                        • {item.technology.product}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        CVSS {item.signals.cvss.toFixed(1)} {item.signals.kev ? '| KEV ✓' : ''}
                      </span>
                      <span className="text-cyan-400 font-extrabold text-sm">
                        {item.score.toFixed(1)} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: WHY & CONFIDENCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider font-mono">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span>WHY THIS MATTERS</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Rankings prioritize confirmed in-the-wild exploitation (CISA KEV) and high empirical probabilities
                  (FIRST EPSS) deployed on your internet-facing perimeter and critical business services.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-200 font-bold uppercase tracking-wider font-mono">
                  <FileCheck className="h-4 w-4 text-emerald-400" />
                  <span>DATA INTEGRITY & PROVENANCE</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  100% deterministic calculation. Full provenance retained from dataset snapshot without external API
                  dependencies or hallucinated AI reasoning.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Close Executive Brief
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
