import React, { useEffect, useState } from 'react';
import { EvidenceResponse } from '../types/api';
import { api } from '../api/client';
import {
  X,
  ExternalLink,
  Shield,
  Server,
  Activity,
  Layers,
  Sparkles,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ScoreBreakdown } from './ScoreBreakdown';
import { motion, AnimatePresence } from 'framer-motion';

interface EvidenceDrawerProps {
  cveId: string | null;
  profileId: string;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  cveId,
  profileId,
  onClose,
}) => {
  const [evidence, setEvidence] = useState<EvidenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cveId || !profileId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    api
      .getEvidence(profileId, cveId)
      .then((data) => {
        if (isMounted) setEvidence(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load forensic evidence');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cveId, profileId]);

  if (!cveId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end">
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 overflow-hidden"
        >
          {/* Forensic Sticky Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                    Forensic Evidence Panel
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    Read-Only
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white font-mono">{cveId}</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="space-y-4 py-12 text-center text-slate-400">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <p className="text-xs font-mono">Retrieving deterministic evidence & source facts...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Evidence Unavailable</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {evidence && !isLoading && (
              <>
                {/* Summary Status Box */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">
                      Decision for {evidence.profile_name} ({evidence.profile_id})
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {evidence.priority} ({evidence.score_100.toFixed(1)} / 100)
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white leading-snug">
                    {evidence.explanation.title}
                  </div>
                </div>

                {/* 1. Source Facts */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      <Activity className="h-4 w-4 text-blue-400" />
                      <span>1. Source Technical Facts</span>
                    </div>
                    <span className="badge-source">SOURCE FACT</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono grid grid-cols-2 gap-3.5 shadow-inner">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Product In Disclosure</span>
                      <span className="text-slate-200 font-semibold">{evidence.source_facts.product_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Technical CVSS Base</span>
                      <span className="text-slate-200 font-semibold">{evidence.source_facts.cvss_base_score.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">CISA KEV Status</span>
                      <span className={`font-semibold ${evidence.source_facts.cisa_kev ? 'text-rose-400' : 'text-slate-400'}`}>
                        {evidence.source_facts.cisa_kev ? 'Confirmed Weaponised (YES)' : 'No active flag'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">FIRST EPSS Probability</span>
                      <span className="text-amber-400 font-semibold">
                        {(evidence.source_facts.first_epss * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-span-2 pt-2.5 border-t border-slate-800/80">
                      <span className="text-slate-500 block text-[10px]">Snapshot Origin</span>
                      <span className="text-slate-300">
                        {evidence.source_facts.source_file} • {evidence.source_facts.snapshot_date}
                      </span>
                    </div>
                    {evidence.source_facts.reference_url && (
                      <div className="col-span-2 pt-1">
                        <a
                          href={evidence.source_facts.reference_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-sans"
                        >
                          <span>Open Official NVD Advisory Evidence</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Organisation Context */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      <Server className="h-4 w-4 text-cyan-400" />
                      <span>2. Asset & Exposure Context</span>
                    </div>
                    <span className="badge-decision">CONTEXT FACT</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2.5 shadow-inner">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Deployed Service</span>
                      <span className="font-semibold text-white">
                        {evidence.asset_context.service || 'Not specified in profile'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Perimeter Reachability</span>
                      <span className="font-bold uppercase text-cyan-300 font-mono">
                        {evidence.asset_context.exposure}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Service Criticality</span>
                      <span className="font-bold uppercase text-indigo-300 font-mono">
                        {evidence.asset_context.importance}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Installed Version</span>
                      <span className="font-mono text-slate-300">
                        {evidence.asset_context.installed_version || 'Unspecified in profile'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Decision Rationale */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <span>3. Matching & Relevance Rationale</span>
                    </div>
                    <span className="badge-decision">ENGINE DECISION</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Match Outcome</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                        {evidence.matching.outcome} ({evidence.matching.reason_code})
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed mt-1">
                      {evidence.matching.match_reason}
                    </p>
                  </div>
                </div>

                {/* 4. Score Factors Contribution */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                      <Layers className="h-4 w-4 text-cyan-400" />
                      <span>4. Multi-Signal Score Point Share</span>
                    </div>
                    <span className="badge-provenance">POINT SHARE</span>
                  </div>

                  <ScoreBreakdown
                    factors={{
                      kev: evidence.score_factors.kev_points,
                      epss: evidence.score_factors.epss_points,
                      cvss: evidence.score_factors.cvss_points,
                      exposure: evidence.score_factors.exposure_points,
                      importance: evidence.score_factors.importance_points,
                    }}
                    totalScore={evidence.score_factors.total_score_100}
                  />
                </div>

                {/* 5. Safe Next Action */}
                <div className="p-4.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="h-4 w-4" />
                    <span>Recommended Defensive Action</span>
                  </div>
                  <p className="text-cyan-100 font-semibold leading-relaxed">
                    {evidence.explanation.safe_next_action}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Drawer Sticky Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Close Evidence Drawer
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
