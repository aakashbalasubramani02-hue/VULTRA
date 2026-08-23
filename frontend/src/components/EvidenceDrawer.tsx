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
      <div className="fixed inset-0 z-50 overflow-hidden bg-[#0c0e12]/80 backdrop-blur-sm flex justify-end">
        <div
          className="fixed inset-0"
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-[#111318] border-l border-[#3b494c] shadow-2xl h-full flex flex-col z-10 overflow-hidden"
        >
          {/* Forensic Sticky Header */}
          <div className="p-6 border-b border-[#3b494c] flex items-center justify-between bg-[#11141B] sticky top-0 z-20">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-[#191c20] border border-[#3b494c] flex items-center justify-center text-[#00E5FF]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-label-caps font-bold uppercase tracking-widest text-[#00E5FF]">
                    FORENSIC EVIDENCE PANEL
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#0c0e12] text-[#bac9cc] border border-[#1E2530]">
                    IMMUTABLE SNAPSHOT
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#F5F7FA] font-mono">{cveId}</h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {isLoading && (
              <div className="space-y-4 py-16 text-center text-[#606D7A]">
                <div className="inline-block h-8 w-8 animate-spin border-2 border-[#00E5FF] border-t-transparent" />
                <p className="text-xs font-mono text-[#bac9cc]">Retrieving deterministic evidence & source facts...</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/30 text-[#ffb4ab] text-xs flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-[#FF3B30] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Evidence Unavailable</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {evidence && !isLoading && (
              <>
                {/* Summary Status Box */}
                <div className="p-5 bg-[#0c0e12] border border-[#1E2530] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#606D7A] font-label-caps uppercase tracking-wider">
                      DECISION FOR {evidence.profile_name} ({evidence.profile_id})
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-bold font-mono bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30">
                      {evidence.priority} ({evidence.score_100.toFixed(1)} / 100 PTS)
                    </span>
                  </div>
                  <div className="text-base font-bold text-[#F5F7FA] leading-snug">
                    {evidence.explanation.title}
                  </div>
                </div>

                {/* 1. Source Facts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FA] uppercase tracking-widest font-label-caps">
                      <Activity className="h-4 w-4 text-[#00E5FF]" />
                      <span>1. Source Technical Facts</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
                      RAW TELEMETRY
                    </span>
                  </div>

                  <div className="p-4 bg-[#0c0e12] border border-[#1E2530] text-xs font-mono grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#606D7A] block text-[10px] font-label-caps">PRODUCT IN DISCLOSURE</span>
                      <span className="text-[#F5F7FA] font-semibold">{evidence.source_facts.product_name}</span>
                    </div>
                    <div>
                      <span className="text-[#606D7A] block text-[10px] font-label-caps">CVSS BASE SEVERITY</span>
                      <span className="text-[#F5F7FA] font-semibold">{evidence.source_facts.cvss_base_score.toFixed(1)} / 10.0</span>
                    </div>
                    <div>
                      <span className="text-[#606D7A] block text-[10px] font-label-caps">CISA KEV WEAPONISATION</span>
                      <span className={`font-semibold ${evidence.source_facts.cisa_kev ? 'text-[#FF3B30]' : 'text-[#606D7A]'}`}>
                        {evidence.source_facts.cisa_kev ? 'CONFIRMED WEAPONISED (YES)' : 'No active flag'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#606D7A] block text-[10px] font-label-caps">FIRST EPSS PROBABILITY</span>
                      <span className="text-[#FF9500] font-semibold">
                        {(evidence.source_facts.first_epss * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="col-span-2 pt-3 border-t border-[#1E2530]">
                      <span className="text-[#606D7A] block text-[10px] font-label-caps">SNAPSHOT PROVENANCE</span>
                      <span className="text-[#bac9cc]">
                        {evidence.source_facts.source_file} • {evidence.source_facts.snapshot_date}
                      </span>
                    </div>
                    {evidence.source_facts.reference_url && /^https?:\/\//i.test(evidence.source_facts.reference_url.trim()) && (
                      <div className="col-span-2 pt-1">
                        <a
                          href={evidence.source_facts.reference_url.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#00E5FF] hover:underline font-label-caps tracking-wider uppercase"
                        >
                          <span>Open Official NVD Advisory Reference</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Organisation Context */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FA] uppercase tracking-widest font-label-caps">
                      <Server className="h-4 w-4 text-[#00E5FF]" />
                      <span>2. Matched Asset & Environmental Context</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00daf3]">
                      DEPLOYMENT
                    </span>
                  </div>

                  <div className="p-4 bg-[#0c0e12] border border-[#1E2530] text-xs space-y-2.5">
                    {evidence.asset_context.asset_id && (
                      <div className="flex justify-between py-1 border-b border-[#1E2530]">
                        <span className="text-[#606D7A] font-label-caps text-[10px]">ASSET IDENTIFIER</span>
                        <span className="font-bold text-[#00E5FF] font-mono">
                          {evidence.asset_context.asset_id}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-[#1E2530]">
                      <span className="text-[#606D7A] font-label-caps text-[10px]">ASSET NAME / SERVICE</span>
                      <span className="font-semibold text-[#F5F7FA]">
                        {evidence.asset_context.asset_name || evidence.asset_context.service || 'Not specified in profile'}
                      </span>
                    </div>
                    {evidence.asset_context.environment && (
                      <div className="flex justify-between py-1 border-b border-[#1E2530]">
                        <span className="text-[#606D7A] font-label-caps text-[10px]">ENVIRONMENT</span>
                        <span className="font-bold uppercase text-[#F5F7FA] font-mono">
                          {evidence.asset_context.environment}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-[#1E2530]">
                      <span className="text-[#606D7A] font-label-caps text-[10px]">PERIMETER EXPOSURE</span>
                      <span className="font-bold uppercase text-[#00E5FF] font-mono">
                        {evidence.asset_context.exposure}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#1E2530]">
                      <span className="text-[#606D7A] font-label-caps text-[10px]">SERVICE CRITICALITY</span>
                      <span className="font-bold uppercase text-[#c3f5ff] font-mono">
                        {evidence.asset_context.importance}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#606D7A] font-label-caps text-[10px]">INSTALLED VERSION</span>
                      <span className="font-mono text-[#bac9cc]">
                        {evidence.asset_context.installed_version || 'Unspecified in profile'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Decision Rationale */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FA] uppercase tracking-widest font-label-caps">
                      <Shield className="h-4 w-4 text-[#00E5FF]" />
                      <span>3. Matching & Relevance Rationale</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFCC00]">
                      ENGINE MATCH
                    </span>
                  </div>

                  <div className="p-4 bg-[#0c0e12] border border-[#1E2530] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#606D7A] font-label-caps text-[10px]">MATCH OUTCOME</span>
                      <span className="font-mono px-2 py-0.5 bg-[#191c20] text-[#00E5FF] font-bold border border-[#3b494c]">
                        {evidence.matching.outcome} ({evidence.matching.reason_code})
                      </span>
                    </div>
                    <p className="text-[#bac9cc] text-xs leading-relaxed mt-1">
                      {evidence.matching.match_reason}
                    </p>
                  </div>
                </div>

                {/* 4. Score Factors Contribution */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1E2530] pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F5F7FA] uppercase tracking-widest font-label-caps">
                      <Layers className="h-4 w-4 text-[#00E5FF]" />
                      <span>4. Multi-Signal Score Point Share</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
                      0–100 POINTS
                    </span>
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
                <div className="p-5 bg-[#0c0e12] border border-[#00E5FF]/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#00E5FF] font-bold uppercase tracking-widest font-label-caps">
                    <Sparkles className="h-4 w-4" />
                    <span>Recommended Defensive Action</span>
                  </div>
                  <p className="text-[#c3f5ff] font-semibold leading-relaxed text-[13px]">
                    {evidence.explanation.safe_next_action}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Drawer Sticky Footer */}
          <div className="p-4 border-t border-[#3b494c] bg-[#11141B] flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps tracking-widest uppercase transition-colors cursor-pointer"
            >
              Close Forensic Panel
            </button>
          </div>
        </motion.aside>
      </div>
    </AnimatePresence>
  );
};
