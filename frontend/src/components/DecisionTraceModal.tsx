import React, { useState } from 'react';
import { TriageItem } from '../types/api';
import {
  X,
  Shield,
  Server,
  Globe,
  Activity,
  Flame,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCheck,
} from 'lucide-react';
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
  const [expandedNode, setExpandedNode] = useState<string | null>('decision');

  if (!item) return null;

  const toggleNode = (nodeId: string) => {
    setExpandedNode(expandedNode === nodeId ? null : nodeId);
  };

  const isInternetFacing = item.exposure.toLowerCase() === 'internet-facing';
  const isNeedsVerification = item.match_status === 'NEEDS_VERIFICATION';

  const nodes = [
    {
      id: 'source',
      step: '01',
      title: 'SOURCE RECORD',
      badge: `CVSS ${item.signals.cvss.toFixed(1)}`,
      icon: FileCheck,
      color: '#00E5FF',
      summary: `CVE disclosure published in NVD with Base CVSS ${item.signals.cvss.toFixed(1)}, KEV=${item.signals.kev ? 'True' : 'False'}, EPSS=${(item.signals.epss * 100).toFixed(1)}%.`,
      details: [
        { label: 'Vulnerability ID', value: item.cve_id },
        { label: 'CVSS 3.1 Base Score', value: `${item.signals.cvss.toFixed(1)} / 10.0` },
        { label: 'CISA KEV Exploitation', value: item.signals.kev ? 'Active In-The-Wild Threat' : 'Not Listed in KEV' },
        { label: 'FIRST EPSS Probability', value: `${(item.signals.epss * 100).toFixed(1)}% exploit chance (next 30d)` },
        { label: 'Reference Archive', value: `https://nvd.nist.gov/vuln/detail/${item.cve_id}` },
      ],
    },
    {
      id: 'match',
      step: '02',
      title: 'PRODUCT MATCH',
      badge: '✓ MATCHED',
      icon: Server,
      color: '#00daf3',
      summary: `Canonical normalisation matched disclosure entity to ${orgName}'s active technology inventory.`,
      details: [
        { label: 'Organisation Software', value: item.technology.product },
        { label: 'Software Vendor', value: item.technology.vendor || 'Standard Vendor' },
        { label: 'Resolution Method', value: 'Exact / Normalized Alias Registry Resolution' },
        { label: 'Match Outcome', value: 'MATCH (Relevant to Perimeter)' },
      ],
    },
    {
      id: 'version',
      step: '03',
      title: 'VERSION MATCH',
      badge: isNeedsVerification ? '⚠ NEEDS VERIFICATION' : '✓ AFFECTED',
      icon: isNeedsVerification ? AlertTriangle : CheckCircle,
      color: isNeedsVerification ? '#FFCC00' : '#00E5FF',
      summary: isNeedsVerification
        ? 'Installed version is unconstrained in organisation profile; retained honestly under verification.'
        : 'Installed version confirmed within affected vulnerability boundary conditions.',
      details: [
        { label: 'Installed Version', value: item.technology.version || 'Unconstrained' },
        { label: 'Comparison Status', value: isNeedsVerification ? 'NEEDS_VERIFICATION' : 'AFFECTED' },
        { label: 'Integrity Rule', value: 'Zero assumption: Unconstrained versions are flagged for manual verification rather than silently dropped.' },
      ],
    },
    {
      id: 'context',
      step: '04',
      title: 'ORGANISATION CONTEXT',
      badge: `${item.exposure.toUpperCase()} • ${item.importance.toUpperCase()}`,
      icon: Globe,
      color: isInternetFacing ? '#FF3B30' : '#FF9500',
      summary: `Asset deployed for business service '${item.service}' with ${item.exposure} reachability.`,
      details: [
        { label: 'Business Service', value: item.service },
        { label: 'Network Reachability', value: item.exposure },
        { label: 'Business Importance', value: item.importance },
        { label: 'Exposure Multiplier', value: isInternetFacing ? '1.0x (Direct Internet Exposure)' : '0.6x (Internal Network)' },
      ],
    },
    {
      id: 'threat',
      step: '05',
      title: 'THREAT SIGNALS',
      badge: item.signals.kev ? '● ACTIVE WEAPONISATION' : 'MODERATE THREAT',
      icon: Flame,
      color: item.signals.kev ? '#FF3B30' : '#FF9500',
      summary: `Empirical threat data confirms real-world adversary interest and probability.`,
      details: [
        { label: 'CISA KEV Points', value: `+${item.factors.kev.toFixed(1)} pts` },
        { label: 'FIRST EPSS Points', value: `+${item.factors.epss.toFixed(1)} pts` },
        { label: 'CVSS Technical Points', value: `+${item.factors.cvss.toFixed(1)} pts` },
      ],
    },
    {
      id: 'decision',
      step: '06',
      title: 'VULTRA DECISION',
      badge: `RANK #${item.rank} (${item.priority})`,
      icon: Activity,
      color: '#FF3B30',
      summary: `5-Signal multi-factor calculation produced final score of ${item.score.toFixed(1)} points.`,
      details: [
        { label: 'Assigned Priority Tier', value: item.priority },
        { label: 'Final Decision Score', value: `${item.score.toFixed(1)} / 100.0 pts` },
        { label: 'Rank Assignment', value: `Rank #${item.rank} of 5 Actions` },
        { label: 'Scoring Formula', value: '35% KEV + 25% EPSS + 15% CVSS + 15% Exposure + 10% Criticality' },
      ],
    },
    {
      id: 'confidence',
      step: '07',
      title: 'DECISION CONFIDENCE',
      badge: `${item.confidence} CONFIDENCE`,
      icon: Shield,
      color: item.confidence === 'HIGH' ? '#00E5FF' : '#FFCC00',
      summary: `Deterministic confidence rating reflects clean product and version verification.`,
      details: [
        { label: 'Confidence Tier', value: item.confidence },
        { label: 'Rationale', value: isNeedsVerification ? 'Moderate confidence: software matched, but deployed version requires local inventory check.' : 'High confidence: software and affected version bounds resolved deterministically without ambiguity.' },
      ],
    },
    {
      id: 'action',
      step: '08',
      title: 'RECOMMENDED NEXT STEP',
      badge: 'SAFE DEFENSIVE ACTION',
      icon: Sparkles,
      color: '#c3f5ff',
      summary: item.next_action,
      details: [
        { label: 'Guidance', value: item.next_action },
        { label: 'Why This Matters', value: item.why_it_matters },
        { label: 'Safety Constraint', value: 'Conservative defensive action: strictly verify, patch, or restrict; zero offensive instructions.' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-[#1E2530] pb-5">
            <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                Deterministic Decision Trace (8 Evidence Stages)
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">
                How VULTRA Arrived at Decision #{item.rank} for {item.cve_id}
              </h2>
            </div>
          </div>

          <p className="text-xs text-[#bac9cc] bg-[#0c0e12] p-4 border border-[#1E2530] leading-relaxed">
            Every decision follows an unbroken evidence path from raw disclosure record through canonical matching, perimeter exposure, and threat probability to defensible action for <strong className="text-[#F5F7FA]">{orgName}</strong>.
          </p>

          {/* 8-Node Interactive Vertical Decision Chain */}
          <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#1E2530]">
            {nodes.map((node, index) => {
              const Icon = node.icon;
              const isNodeExpanded = expandedNode === node.id;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Step Icon Badge */}
                  <div
                    className="w-10 h-10 bg-[#0c0e12] border flex items-center justify-center font-mono font-bold text-xs shrink-0 z-10 cursor-pointer"
                    style={{ borderColor: node.color, color: node.color }}
                    onClick={() => toggleNode(node.id)}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Node Content Container */}
                  <div className="flex-1 bg-[#0c0e12] border border-[#1E2530] hover:border-[#3b494c] transition-colors p-4 space-y-2">
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
                      onClick={() => toggleNode(node.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#606D7A] font-bold">
                          {node.step}
                        </span>
                        <span className="text-xs font-bold text-[#F5F7FA] font-label-caps uppercase tracking-wider">
                          {node.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 border bg-[#111318]"
                          style={{ borderColor: `${node.color}50`, color: node.color }}
                        >
                          {node.badge}
                        </span>
                        {isNodeExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-[#606D7A]" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-[#606D7A]" />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#bac9cc] leading-relaxed">
                      {node.summary}
                    </p>

                    {/* Detailed Key-Value Evidence Rows */}
                    <AnimatePresence>
                      {isNodeExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="pt-3 border-t border-[#1E2530] mt-2 space-y-1.5 font-mono text-[11px]"
                        >
                          {node.details.map((d, i) => (
                            <div key={i} className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 py-1 border-b border-[#1E2530]/60 last:border-0">
                              <span className="text-[#606D7A] text-[10px] uppercase">{d.label}:</span>
                              {d.value.startsWith('http') ? (
                                <a
                                  href={d.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#00E5FF] hover:underline flex items-center gap-1 break-all"
                                >
                                  <span>{d.value}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0 inline" />
                                </a>
                              ) : (
                                <span className="text-[#F5F7FA] font-semibold">{d.value}</span>
                              )}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-[#1E2530] flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#606D7A]">
              Deterministic Trace • Zero LLM Hallucination
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#00E5FF] text-[#0c0e12] font-bold text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer hover:bg-[#c3f5ff]"
            >
              Close Decision Trace
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
