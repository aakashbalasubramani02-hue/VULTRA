import React from 'react';
import { TriageItem } from '../types/api';
import { X, CheckCircle, Shield, Server, Globe, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DecisionTraceModalProps {
  item: TriageItem | null;
  orgName: string;
  onClose: () => void;
}

export const DecisionTraceModal: React.FC<DecisionTraceModalProps> = ({
  item,
  orgName,
  onClose,
}) => {
  if (!item) return null;

  const steps = [
    {
      step: '01',
      title: 'Vulnerability Candidate Ingestion',
      icon: Activity,
      desc: `CVE ${item.cve_id} evaluated with technical CVSS ${item.signals.cvss.toFixed(1)}, CISA KEV weaponisation flag = ${
        item.signals.kev ? 'CONFIRMED (YES)' : 'NO'
      }, and FIRST EPSS exploitation rate = ${(item.signals.epss * 100).toFixed(1)}%.`,
      badge: `Signals: CVSS ${item.signals.cvss.toFixed(1)} | KEV ${item.signals.kev ? '✓' : '✗'}`,
      layer: 'SOURCE FACT',
    },
    {
      step: '02',
      title: 'Canonical Normalisation & Product Match',
      icon: Server,
      desc: `Normalisation mapped disclosure identifier '${item.technology.product}' directly to ${orgName}'s active technology inventory.`,
      badge: 'Product Match: CONFIRMED',
      layer: 'ENGINE DECISION',
    },
    {
      step: '03',
      title: 'Version Verification Decision',
      icon: CheckCircle,
      desc:
        item.match_status === 'NEEDS_VERIFICATION'
          ? 'Installed version is unconstrained in organisation profile; candidate is retained under verification rather than discarded.'
          : 'Installed version matches affected vulnerability boundary conditions.',
      badge: `Outcome: ${item.match_status}`,
      layer: 'ENGINE DECISION',
    },
    {
      step: '04',
      title: 'Organisational Deployment Context',
      icon: Globe,
      desc: `Asset powers service '${item.service}' with ${item.exposure.toUpperCase()} exposure and ${item.importance.toUpperCase()} business criticality.`,
      badge: `Context: +${item.factors.exposure.toFixed(1)} Exp | +${item.factors.importance.toFixed(1)} Imp`,
      layer: 'CONTEXT FACT',
    },
    {
      step: '05',
      title: 'Deterministic Score & Top Rank Assignment',
      icon: Sparkles,
      desc: `5-Signal multi-factor calculation: KEV (+${item.factors.kev.toFixed(1)}) + EPSS (+${item.factors.epss.toFixed(
        1
      )}) + CVSS (+${item.factors.cvss.toFixed(1)}) + Exposure (+${item.factors.exposure.toFixed(
        1
      )}) + Criticality (+${item.factors.importance.toFixed(1)}) = ${item.score.toFixed(1)} pts.`,
      badge: `Assigned: Rank #${item.rank} (${item.priority})`,
      layer: 'RANKING RESULT',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 md:p-8"
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
            <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Deterministic Decision Trace
              </div>
              <h2 className="text-xl font-bold text-white">Why is {item.cve_id} Rank #1?</h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 mb-6 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 leading-relaxed">
            VULTRA combines empirical technical threat signals with <strong className="text-slate-100">{orgName}</strong>'s perimeter exposure and service criticality. Here is the complete deterministic audit trace:
          </p>

          {/* Steps Pipeline */}
          <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.step} className="relative flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl bg-slate-950 border border-slate-750 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0 z-10 shadow-md">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/90 space-y-1.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {st.step}. {st.title}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{st.desc}</p>
                    <div className="pt-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Layer: {st.layer}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              Close Trace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
