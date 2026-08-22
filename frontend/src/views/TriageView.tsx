import React, { useState } from 'react';
import { ProfileSummary, TriageItem, TriageResponse } from '../types/api';
import { OrganizationSelector } from '../components/OrganizationSelector';
import { VulnerabilityCard } from '../components/VulnerabilityCard';
import { DecisionTraceModal } from '../components/DecisionTraceModal';
import { DecisionIntelligenceStrip } from '../components/DecisionIntelligenceStrip';
import { EvidenceDrawer } from '../components/EvidenceDrawer';
import { BriefModal } from '../components/BriefModal';
import { CopilotModal } from '../components/CopilotModal';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import { EmptyState } from '../components/EmptyState';
import { Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface TriageViewProps {
  profiles: ProfileSummary[];
  selectedOrgId: string;
  onSelectOrg: (id: string) => void;
  triage: TriageResponse | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGoToCompare?: () => void;
}

export const TriageView: React.FC<TriageViewProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
  triage,
  isLoading,
  error,
  onRefresh,
  onGoToCompare,
}) => {
  const [activeEvidenceCve, setActiveEvidenceCve] = useState<string | null>(null);
  const [traceItem, setTraceItem] = useState<TriageItem | null>(null);
  const [copilotItem, setCopilotItem] = useState<TriageItem | null>(null);
  const [showBrief, setShowBrief] = useState(false);

  const selectedProfile = profiles.find((p) => p.profile_id === selectedOrgId);
  const orgName = selectedProfile ? selectedProfile.name : 'Selected Organisation';
  const topItem = triage && triage.results.length > 0 ? triage.results[0] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Stitch Editorial Header Section */}
      <header className="border-b border-[#1E2530] pb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
              Deterministic Vulnerability Triage
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#00E5FF] tracking-tighter">
              Security Priorities
            </h1>
            <h2 className="font-headline-lg text-xl sm:text-2xl text-[#bac9cc] font-medium">
              5 vulnerabilities deserve your attention.
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowBrief(true)}
              disabled={!triage || triage.results.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold text-xs hover:bg-[#c3f5ff] transition-colors cursor-pointer disabled:opacity-40 uppercase tracking-widest"
            >
              <Clock className="h-4 w-4" />
              <span>60-Second Brief</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps font-semibold transition-colors cursor-pointer disabled:opacity-40 uppercase tracking-wider"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#00E5FF]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Compact Context Bar */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-label-caps text-[#bac9cc] tracking-widest uppercase pt-2">
          <div className="flex items-center gap-3">
            <OrganizationSelector
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={onSelectOrg}
              isLoading={isLoading}
            />
          </div>
          <span className="w-1 h-1 bg-[#3b494c] rounded-full hidden sm:inline-block" />
          <span className="text-[#00daf3]">
            {selectedProfile?.sector || 'Enterprise Profile'}
          </span>
          <span className="w-1 h-1 bg-[#3b494c] rounded-full hidden sm:inline-block" />
          <span>
            {selectedProfile?.technology_count || 4} Technologies Configured
          </span>
          <span className="w-1 h-1 bg-[#3b494c] rounded-full hidden sm:inline-block" />
          <span className="text-[#00E5FF]">
            Snapshot: 2026-Q1
          </span>
        </div>
      </header>

      {/* Triage Summary Chips */}
      {triage && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="px-4 py-3 bg-[#0c0e12] border border-[#1E2530] flex items-center justify-between text-xs font-mono">
            <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-wider">Total Ingested:</span>
            <span className="font-bold text-[#F5F7FA]">{triage.summary.total_records}</span>
          </div>

          <div className="px-4 py-3 bg-[#0c0e12] border border-[#1E2530] flex items-center justify-between text-xs font-mono">
            <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-wider">Candidate Matches:</span>
            <span className="font-bold text-[#00E5FF]">{triage.summary.matched_candidates}</span>
          </div>

          <div className="px-4 py-3 bg-[#0c0e12] border border-[#1E2530] flex items-center justify-between text-xs font-mono">
            <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-wider">Urgent Level:</span>
            <span className="font-bold text-[#FF3B30]">{triage.summary.urgent}</span>
          </div>

          <div className="px-4 py-3 bg-[#0c0e12] border border-[#1E2530] flex items-center justify-between text-xs font-mono">
            <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-wider">High Level:</span>
            <span className="font-bold text-[#FF9500]">{triage.summary.high}</span>
          </div>
        </div>
      )}

      {/* SIGNATURE 3-PANEL DECISION INTELLIGENCE STRIP */}
      {topItem && !isLoading && (
        <DecisionIntelligenceStrip
          topItem={topItem}
          onOpenTrace={() => setTraceItem(topItem)}
          onOpenCompare={() => {
            if (onGoToCompare) onGoToCompare();
          }}
          onOpenStability={() => setActiveEvidenceCve(topItem.cve_id)}
        />
      )}

      {/* Error state */}
      {error && <ErrorBanner message={error} onRetry={onRefresh} />}

      {/* Loading state */}
      {isLoading && <SkeletonLoader count={4} />}

      {/* Empty State */}
      {!isLoading && !error && (!triage || triage.results.length === 0) && (
        <EmptyState
          title="No Matching Vulnerabilities Found"
          message="Nothing matched this profile in the supplied data."
          actionText="Switch Organisation"
          onAction={() => {
            const next = profiles.find((p) => p.profile_id !== selectedOrgId);
            if (next) onSelectOrg(next.profile_id);
          }}
        />
      )}

      {/* Main Top 5 Cards */}
      {!isLoading && !error && triage && triage.results.length > 0 && (
        <div className="space-y-6">
          {triage.results.map((item, idx) => (
            <VulnerabilityCard
              key={item.cve_id}
              item={item}
              index={idx}
              profileId={selectedOrgId}
              onViewEvidence={(cveId) => setActiveEvidenceCve(cveId)}
              onExplainDecision={(itemToTrace) => setTraceItem(itemToTrace)}
              onExplainWithCopilot={(itemToExplain) => setCopilotItem(itemToExplain)}
            />
          ))}
        </div>
      )}

      {/* Modals and Drawers */}
      <EvidenceDrawer
        cveId={activeEvidenceCve}
        profileId={selectedOrgId}
        onClose={() => setActiveEvidenceCve(null)}
      />

      <DecisionTraceModal
        item={traceItem}
        orgName={orgName}
        onClose={() => setTraceItem(null)}
      />

      <CopilotModal
        item={copilotItem}
        profileId={selectedOrgId}
        orgName={orgName}
        onClose={() => setCopilotItem(null)}
        onViewEvidence={(cveId) => {
          setCopilotItem(null);
          setActiveEvidenceCve(cveId);
        }}
      />

      {showBrief && (
        <BriefModal
          triage={triage}
          onClose={() => setShowBrief(false)}
          onViewEvidence={(cveId) => setActiveEvidenceCve(cveId)}
        />
      )}
    </motion.div>
  );
};
