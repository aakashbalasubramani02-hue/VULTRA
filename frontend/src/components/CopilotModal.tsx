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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-label-caps font-bold uppercase tracking-widest text-[#00E5FF]">
                  VULTRA Copilot
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 bg-[#0c0e12] text-[#00daf3] border border-[#00daf3]/30 uppercase">
                  Source-Bound Fact Guard
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">
                Decision Explanation for {item.cve_id}
              </h2>
            </div>
          </div>

          {/* Official Priority Lock Header */}
          <div className="p-4 bg-[#0c0e12] border border-[#1E2530] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#606D7A] font-label-caps">OFFICIAL DETERMINISTIC SCORE:</span>
              <span className="font-extrabold text-[#00E5FF]">{item.score.toFixed(1)} / 100 PTS</span>
              <span className="px-2 py-0.5 bg-[#191c20] text-[#F5F7FA] border border-[#3b494c]">
                RANK #{item.rank} ({item.priority})
              </span>
            </div>
            <span className="text-[11px] text-[#606D7A]">
              ORG: <strong className="text-[#F5F7FA]">{orgName}</strong>
            </span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block h-8 w-8 animate-spin border-2 border-[#00E5FF] border-t-transparent" />
              <p className="text-xs font-mono text-[#00daf3]">
                Synthesizing verified structured evidence with VULTRA Copilot...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#ffb4ab] text-xs flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-[#FF3B30] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">AI Explanation Unavailable</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Content When Ready */}
          {!isLoading && aiData && (
            <div className="space-y-4">
              {/* Runtime Mode Status Bar */}
              <div className="flex items-center justify-between p-3 bg-[#0c0e12] border border-[#1E2530] text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      aiData.ai.mode === 'local' ? 'bg-[#00E5FF] animate-pulse' : 'bg-[#00daf3]'
                    }`}
                  />
                  <span className="font-bold text-[#F5F7FA]">
                    {aiData.ai.mode === 'local' ? 'LOCAL AI (ACTIVE)' : 'DETERMINISTIC FALLBACK'}
                  </span>
                  <span className="text-[#3b494c]">•</span>
                  <span className="text-[#606D7A]">
                    {aiData.ai.mode === 'local'
                      ? `Model: ${aiData.ai.model || 'Ollama instruct'}`
                      : 'No External AI Dependency'}
                  </span>
                </div>

                <span className="px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold font-label-caps text-[10px] tracking-wider uppercase">
                  {aiData.fact_guard.status === 'PASSED' ? 'Fact Guard PASSED' : 'Fallback Verified'}
                </span>
              </div>

              {/* 1. Why This Matters */}
              <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-2">
                <div className="flex items-center gap-2 text-[#00E5FF] text-xs font-label-caps font-bold uppercase tracking-widest">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Why This Matters</span>
                </div>
                <p className="text-xs text-[#bac9cc] leading-relaxed">
                  {aiData.explanation.why_it_matters}
                </p>
              </div>

              {/* 2. Potential Impact */}
              <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-2">
                <div className="flex items-center gap-2 text-[#FF9500] text-xs font-label-caps font-bold uppercase tracking-widest">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Potential Operational & Infrastructure Impact</span>
                </div>
                <p className="text-xs text-[#bac9cc] leading-relaxed">
                  {aiData.explanation.potential_impact}
                </p>
              </div>

              {/* 3. Recommended Next Action */}
              <div className="p-5 bg-[#0c0e12] border border-[#00E5FF]/40 space-y-2">
                <div className="flex items-center gap-2 text-[#00E5FF] text-xs font-label-caps font-bold uppercase tracking-widest">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Recommended Safe Next Action</span>
                </div>
                <p className="text-xs text-[#c3f5ff] font-semibold leading-relaxed">
                  {aiData.explanation.next_action}
                </p>
              </div>

              {/* Fact Guard Verification Matrix */}
              <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                  <div className="flex items-center gap-2 text-[#F5F7FA] font-label-caps tracking-wider uppercase font-bold text-[11px]">
                    <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
                    <span>SOURCE-BOUND FACT GUARD VALIDATION</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#606D7A]">
                    Strict Zero-Hallucination Barrier
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  {aiData.fact_guard.checks_performed.map((chk, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[#191c20] text-[#bac9cc] border border-[#3b494c]"
                    >
                      ✓ {chk.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Safety Notice */}
              <p className="text-[10px] text-[#606D7A] font-mono leading-relaxed pt-1">
                * AI explanations are informational summaries of supplied evidence. They do not determine vulnerability priority and do not alter deterministic engine decisions.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#1E2530] flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onViewEvidence(item.cve_id);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-label-caps tracking-wider uppercase text-[#00E5FF] hover:underline cursor-pointer"
            >
              <span>Inspect Raw Forensic Evidence</span>
              <ArrowRight className="h-3 w-3" />
            </button>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer"
            >
              Close Copilot
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
