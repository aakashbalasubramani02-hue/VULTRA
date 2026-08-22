import React, { useState } from 'react';
import { ProfileSummary, TriageItem, TriageResponse } from '../types/api';
import { OrganizationSelector } from '../components/OrganizationSelector';
import { VulnerabilityCard } from '../components/VulnerabilityCard';
import { DecisionTraceModal } from '../components/DecisionTraceModal';
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
}

export const TriageView: React.FC<TriageViewProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
  triage,
  isLoading,
  error,
  onRefresh,
}) => {
  const [activeEvidenceCve, setActiveEvidenceCve] = useState<string | null>(null);
  const [traceItem, setTraceItem] = useState<TriageItem | null>(null);
  const [copilotItem, setCopilotItem] = useState<TriageItem | null>(null);
  const [showBrief, setShowBrief] = useState(false);

  const selectedProfile = profiles.find((p) => p.profile_id === selectedOrgId);
  const orgName = selectedProfile ? selectedProfile.name : 'Selected Organisation';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl cyber-grid">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <OrganizationSelector
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={onSelectOrg}
              isLoading={isLoading}
            />
            <span className="text-xs font-mono text-slate-400">
              • Analysis Snapshot: 2026-Q1
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            5 vulnerabilities deserve attention
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Prioritised for <strong className="text-slate-200">{orgName}</strong> based on confirmed threat signals, perimeter exposure, and business service importance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowBrief(true)}
            disabled={!triage || triage.results.length === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50"
          >
            <Clock className="h-4 w-4" />
            <span>60-Second Brief</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-md"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Analysis</span>
          </button>
        </div>
      </div>

      {/* Triage Summary Chips */}
      {triage && !isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between text-xs font-mono shadow-sm">
            <span className="text-slate-400">Total Dataset:</span>
            <span className="font-extrabold text-white">{triage.summary.total_records}</span>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between text-xs font-mono shadow-sm">
            <span className="text-slate-400">Matched Candidates:</span>
            <span className="font-extrabold text-cyan-400">{triage.summary.matched_candidates}</span>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between text-xs font-mono shadow-sm">
            <span className="text-slate-400">Urgent Level:</span>
            <span className="font-extrabold text-rose-400">{triage.summary.urgent}</span>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between text-xs font-mono shadow-sm">
            <span className="text-slate-400">High Level:</span>
            <span className="font-extrabold text-amber-400">{triage.summary.high}</span>
          </div>
        </div>
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
        <div className="space-y-4">
          {triage.results.map((item, idx) => (
            <VulnerabilityCard
              key={item.cve_id}
              item={item}
              index={idx}
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
