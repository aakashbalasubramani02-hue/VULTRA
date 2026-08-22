import React from 'react';
import { ProfileDetailResponse, ProfileSummary, TriageSummary } from '../types/api';
import { OrganizationSelector } from '../components/OrganizationSelector';
import {
  ShieldAlert,
  Activity,
  ArrowRight,
  Server,
  Globe,
  Lock,
  Layers,
  Sparkles,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CommandCenterViewProps {
  profiles: ProfileSummary[];
  selectedOrgId: string;
  onSelectOrg: (id: string) => void;
  profileDetail: ProfileDetailResponse | null;
  triageSummary: TriageSummary | null;
  onGoToTriage: () => void;
  onGoToWhyNot: () => void;
  onGoToCompare: () => void;
  isLoading: boolean;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
  profileDetail,
  triageSummary,
  onGoToTriage,
  onGoToWhyNot,
  onGoToCompare,
  isLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/90 border border-slate-800 p-6 md:p-10 overflow-hidden shadow-2xl cyber-grid">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-72 h-72 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>VULTRA Decision Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              From vulnerability signals to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400">five defensible decisions</span>.
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
              Standard CVSS dashboards overwhelm small organisations with hundreds of false alarms. VULTRA evaluates live cyber threat signals directly against your technology assets, perimeter exposure, and business service importance.
            </p>
          </div>

          <div className="shrink-0 flex flex-col gap-3.5">
            <OrganizationSelector
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={onSelectOrg}
              isLoading={isLoading}
            />

            <button
              onClick={onGoToTriage}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/25 cursor-pointer group"
            >
              <span>Analyse & Triage Top 5</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Refined KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>URGENT ACTIONS</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {triageSummary ? String(triageSummary.urgent).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-rose-300 font-medium">Immediate threat on critical assets</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>HIGH PRIORITY</span>
            <Activity className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {triageSummary ? String(triageSummary.high).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-amber-300 font-medium">High probability or exposed perimeter</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>NEEDS VERIFY</span>
            <HelpCircle className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {triageSummary ? String(triageSummary.needs_verification).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-cyan-300 font-medium">Installed version unconstrained</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>MATCHED CANDIDATES</span>
            <Layers className="h-4 w-4 text-slate-300" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {triageSummary ? String(triageSummary.matched_candidates).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Filtered from {triageSummary?.total_records || 540} dataset records
          </p>
        </div>
      </div>

      {/* Active Organisation Inventory & Scoring Weights */}
      {profileDetail && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Technology Inventory */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-7 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-cyan-400" />
                  <span>{profileDetail.name} — Asset Inventory</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Sector: <strong className="text-slate-200">{profileDetail.sector}</strong> • Risk Appetite: <strong className="text-slate-200">{profileDetail.risk_appetite}</strong>
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 font-bold">
                {profileDetail.technologies.length} Active Stacks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {profileDetail.technologies.map((tech, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{tech.product}</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        tech.exposure.toLowerCase() === 'internet-facing'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/25'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {tech.exposure}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300">
                    <span className="text-slate-500 block text-[10px] font-mono">BUSINESS SERVICE</span>
                    <span className="font-semibold text-slate-200">{tech.service || 'Core Operations'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60 font-mono">
                    <span>Criticality: <span className="text-cyan-300 font-semibold">{tech.importance}</span></span>
                    <span>Version: {tech.version || 'unknown'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Active Weight Modifiers */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-7 space-y-4 shadow-xl">
            <div className="border-b border-slate-800 pb-3.5">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                <span>Contextual Weights</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">Deterministic 5-factor scoring model</p>
            </div>

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-300 font-medium">CISA KEV Exploitation</span>
                <span className="font-mono font-bold text-rose-400">
                  {(profileDetail.weights.cisa_kev_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-300 font-medium">FIRST EPSS Probability</span>
                <span className="font-mono font-bold text-amber-400">
                  {(profileDetail.weights.first_epss_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-300 font-medium">CVSS Technical Severity</span>
                <span className="font-mono font-bold text-orange-400">
                  {(profileDetail.weights.cvss_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <span className="text-slate-300 font-medium">Asset Exposure</span>
                <span className="font-mono font-bold text-cyan-400">
                  {(profileDetail.weights.exposure_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-300 font-medium">Service Criticality</span>
                <span className="font-mono font-bold text-indigo-400">
                  {(profileDetail.weights.importance_weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-center">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                ✓ Mathematical Weights Sum to 100%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={onGoToTriage}
          className="p-6 rounded-3xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
          <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center justify-between">
            <span>Triage Decisions</span>
            <ArrowRight className="h-4 w-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            View the official Top 5 vulnerability decision list with point share breakdowns and safe next actions.
          </p>
        </div>

        <div
          onClick={onGoToWhyNot}
          className="p-6 rounded-3xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/40 transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-4 group-hover:scale-105 transition-transform">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h4 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors flex items-center justify-between">
            <span>Why Not? (Negative Test)</span>
            <ArrowRight className="h-4 w-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
          </h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Demonstrate why high-CVSS vulnerabilities (CVSS ≥ 9.0) on unused assets are excluded ("Severity ≠ Priority").
          </p>
        </div>

        <div
          onClick={onGoToCompare}
          className="p-6 rounded-3xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group shadow-xl hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 transition-transform">
            <Globe className="h-5 w-5" />
          </div>
          <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors flex items-center justify-between">
            <span>Compare Profiles</span>
            <ArrowRight className="h-4 w-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </h4>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Compare Global Retail Bank vs Agile Cloud Tech Startup to prove how different profiles alter rankings.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
