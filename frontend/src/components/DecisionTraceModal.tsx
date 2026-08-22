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
      desc: `CVE ${item.cve_id} ingested with technical CVSS ${item.signals.cvss.toFixed(1)}, CISA KEV weaponisation flag = ${
        item.signals.kev ? 'CONFIRMED (YES)' : 'NO'
      }, and FIRST EPSS exploitation rate = ${(item.signals.epss * 100).toFixed(1)}%.`,
      badge: `CVSS ${item.signals.cvss.toFixed(1)} | KEV ${item.signals.kev ? '✓' : '✗'}`,
      layer: 'SOURCE FACT',
    },
    {
      step: '02',
      title: 'Canonical Normalisation & Product Match',
      icon: Server,
      desc: `Deterministic mapping resolved disclosure entity '${item.technology.product}' directly to ${orgName}'s active technology inventory.`,
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
      desc: `Asset powers service '${item.service}' with ${item.exposure.toUpperCase()} exposure and ${item.importance.toUpperCase()} criticality.`,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8"
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
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                Deterministic Decision Trace
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">Why is {item.cve_id} Rank #1?</h2>
            </div>
          </div>

          <p className="text-xs text-[#bac9cc] mb-6 bg-[#0c0e12] p-4 border border-[#1E2530] leading-relaxed">
            VULTRA combines empirical technical threat signals with <strong className="text-[#F5F7FA]">{orgName}</strong>'s perimeter exposure and service criticality. Here is the complete deterministic audit trace:
          </p>

          {/* Steps Pipeline */}
          <div className="space-y-4 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#1E2530]">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.step} className="relative flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center font-mono font-bold text-xs text-[#00E5FF] shrink-0 z-10">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 bg-[#0c0e12] p-4 border border-[#1E2530] space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#F5F7FA]">
                        {st.step}. {st.title}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-[#191c20] text-[#00daf3] border border-[#3b494c]">
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#bac9cc] leading-relaxed">{st.desc}</p>
                    <div className="pt-1">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#606D7A]">
                        Layer: {st.layer}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E2530] flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#00E5FF] text-[#0c0e12] font-bold text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer hover:bg-[#c3f5ff]"
            >
              Close Trace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
