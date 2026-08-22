import React, { useEffect, useState } from 'react';
import { AIExplanationResponse, TriageItem } from '../types/api';
import { api } from '../api/client';
import {
  X,
  Bot,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CopilotModalProps {
  item: TriageItem | null;
  profileId: string;
  orgName: string;
  onClose: () => void;
  onViewEvidence: (cveId: string) => void;
}

export const CopilotModal: React.FC<CopilotModalProps> = ({
  item,
  profileId,
  orgName,
  onClose,
  onViewEvidence,
}) => {
  const [aiData, setAiData] = useState<AIExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item || !profileId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api
      .explainWithAI(profileId, item.cve_id)
      .then((res) => {
        if (isMounted) setAiData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to generate explanation');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item, profileId]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/25">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                  VULTRA Copilot
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Source-Bound Assistant
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Decision Explanation for {item.cve_id}
              </h2>
            </div>
          </div>

          {/* Official Priority Lock Header */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Official Deterministic Priority:</span>
              <span className="font-extrabold text-cyan-400">{item.score.toFixed(1)} / 100 pts</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Rank #{item.rank} ({item.priority})
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Organisation: <strong className="text-slate-200">{orgName}</strong>
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              <p className="text-xs font-mono text-cyan-300 animate-pulse">
                Analyzing supplied structured evidence with VULTRA Copilot...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">AI Explanation Failed</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Content When Ready */}
          {!isLoading && aiData && (
            <div className="space-y-4">
              {/* Runtime Mode Status Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      aiData.ai.mode === 'local' ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                    }`}
                  />
                  <span className="font-bold text-slate-200">
                    {aiData.ai.mode === 'local' ? 'LOCAL AI' : 'DETERMINISTIC FALLBACK'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    {aiData.ai.mode === 'local'
                      ? `Model: ${aiData.ai.model || 'Ollama instruct'}`
                      : 'No External AI Required'}
                  </span>
                </div>

                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-bold">
                  {aiData.fact_guard.status === 'PASSED' ? 'Fact Guard PASSED' : 'Fallback Verified'}
                </span>
              </div>

              {/* 1. Why This Matters */}
              <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Why This Matters</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {aiData.explanation.why_it_matters}
                </p>
              </div>

              {/* 2. Potential Impact */}
              <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Potential Business & Infrastructure Impact</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {aiData.explanation.potential_impact}
                </p>
              </div>

              {/* 3. Recommended Next Action */}
              <div className="p-4.5 rounded-2xl bg-cyan-950/25 border border-cyan-500/30 space-y-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Recommended Safe Next Action</span>
                </div>
                <p className="text-xs text-cyan-100 font-semibold leading-relaxed font-sans">
                  {aiData.explanation.next_action}
                </p>
              </div>

              {/* Compact Trust & Fact Guard Panel */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div className="flex items-center gap-2 text-slate-300 font-mono font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>SOURCE-BOUND FACT GUARD</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Uses supplied evidence only
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 font-mono text-[10px]">
                  {aiData.fact_guard.checks_performed.map((chk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      ✓ {chk.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Safety Notice */}
              <p className="text-[10px] text-slate-500 font-mono leading-relaxed pt-1">
                * AI explanations are informational summaries of supplied evidence. They do not determine vulnerability priority and do not establish that an organisation is secure.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onViewEvidence(item.cve_id);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              <span>Inspect Raw Forensic Evidence</span>
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Close Copilot
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
