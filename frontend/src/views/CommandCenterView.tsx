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
  HelpCircle,
  Cpu,
  Terminal,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CommandCenterViewProps {
  profiles: ProfileSummary[];
  selectedOrgId: string;
  onSelectOrg: (id: string) => void;
  onOpenRegister?: () => void;
  profileDetail: ProfileDetailResponse | null;
  triageSummary: TriageSummary | null;
  onGoToTriage: () => void;
  onGoToWhyNot: () => void;
  onGoToCompare: () => void;
  onGoToInventory?: () => void;
  isLoading: boolean;
}

export const CommandCenterView: React.FC<CommandCenterViewProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
  onOpenRegister,
  profileDetail,
  triageSummary,
  onGoToTriage,
  onGoToWhyNot,
  onGoToCompare,
  onGoToInventory,
  isLoading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-12"
    >
      {/* Stitch Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border border-[#3b494c] bg-[#11141B] p-6 md:p-12 relative overflow-hidden">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#00E5FF]/40 bg-[#0c0e12] text-[#00E5FF] text-[10px] font-label-caps tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
              <span>PRECISION RISK INTELLIGENCE ENGINE</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F5F7FA] leading-[1.08] tracking-tight">
              Stop chasing every vulnerability.<br />
              <span className="text-[#00E5FF]">Fix what matters.</span>
            </h1>

            <p className="text-[#bac9cc] text-sm md:text-base leading-relaxed max-w-xl border-l-2 border-[#3b494c] pl-4 py-1">
              VULTRA transforms noisy global threat feeds into five defensible, explainable security decisions tailored to your exact tech stack and network perimeter.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 items-stretch sm:items-center">
            <button
              onClick={onGoToTriage}
              className="bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold text-xs px-8 py-3.5 hover:bg-[#c3f5ff] transition-colors whitespace-nowrap cursor-pointer tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <span>Analyse Your Organisation</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onGoToCompare}
              className="border border-[#3b494c] text-[#F5F7FA] font-label-caps font-semibold text-xs px-6 py-3.5 hover:border-[#00E5FF] hover:text-[#00E5FF] transition-colors whitespace-nowrap cursor-pointer tracking-widest uppercase text-center"
            >
              Compare Profiles
            </button>
          </div>
        </div>

        {/* Right Telemetry Visual Box */}
        <div className="lg:col-span-5 cyber-grid border border-[#3b494c] bg-[#0c0e12] p-6 flex flex-col justify-between relative min-h-[300px]">
          <div className="flex items-center justify-between border-b border-[#1E2530] pb-3">
            <div className="font-label-caps text-[10px] text-[#606D7A] tracking-widest uppercase">
              ACTIVE TELEMETRY CONTEXT
            </div>
            <Terminal className="h-4 w-4 text-[#00E5FF]" />
          </div>

          <div className="space-y-4 my-auto py-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-label-caps text-[#606D7A] uppercase tracking-wider block">
                ORGANISATION PROFILE
              </span>
              <OrganizationSelector
                profiles={profiles}
                selectedOrgId={selectedOrgId}
                onSelectOrg={onSelectOrg}
                onOpenRegister={onOpenRegister}
                isLoading={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="p-2.5 bg-[#11141B] border border-[#1E2530]">
                <span className="text-[9px] font-label-caps text-[#606D7A] block">SECTOR</span>
                <span className="text-[#F5F7FA] font-bold text-xs">{profileDetail?.sector || 'Higher Education'}</span>
              </div>
              <div className="p-2.5 bg-[#11141B] border border-[#1E2530]">
                <span className="text-[9px] font-label-caps text-[#606D7A] block">RISK APPETITE</span>
                <span className="text-[#00E5FF] font-bold text-xs">{profileDetail?.risk_appetite || 'Low (Risk Averse)'}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1E2530] flex justify-between items-center text-[10px] font-mono text-[#606D7A]">
            <span>ENGINE: DETERMINISTIC</span>
            <span className="text-[#00daf3]">OFFLINE SECURE ✓</span>
          </div>
        </div>
      </section>

      {/* High-Density KPI Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-[#11141B] border border-[#1E2530] hover:border-[#FF3B30]/50 transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#606D7A] text-[10px] font-label-caps tracking-widest uppercase">
            <span>URGENT ACTIONS</span>
            <ShieldAlert className="h-4 w-4 text-[#FF3B30]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F5F7FA] font-mono">
            {triageSummary ? String(triageSummary.urgent).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-[#ffb4ab]">Active threat on exposed perimeter</p>
        </div>

        <div className="p-5 bg-[#11141B] border border-[#1E2530] hover:border-[#FF9500]/50 transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#606D7A] text-[10px] font-label-caps tracking-widest uppercase">
            <span>HIGH PRIORITY</span>
            <Activity className="h-4 w-4 text-[#FF9500]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F5F7FA] font-mono">
            {triageSummary ? String(triageSummary.high).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-[#ffeac0]">High likelihood / critical assets</p>
        </div>

        <div className="p-5 bg-[#11141B] border border-[#1E2530] hover:border-[#00E5FF]/50 transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#606D7A] text-[10px] font-label-caps tracking-widest uppercase">
            <span>NEEDS VERIFY</span>
            <HelpCircle className="h-4 w-4 text-[#00E5FF]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F5F7FA] font-mono">
            {triageSummary ? String(triageSummary.needs_verification).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-[#c3f5ff]">Unconstrained version retained</p>
        </div>

        <div className="p-5 bg-[#11141B] border border-[#1E2530] hover:border-[#3b494c] transition-colors space-y-2">
          <div className="flex items-center justify-between text-[#606D7A] text-[10px] font-label-caps tracking-widest uppercase">
            <span>MATCHED CANDIDATES</span>
            <Layers className="h-4 w-4 text-[#606D7A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F5F7FA] font-mono">
            {triageSummary ? String(triageSummary.matched_candidates).padStart(2, '0') : '--'}
          </div>
          <p className="text-[11px] text-[#bac9cc]">
            Filtered from {triageSummary?.total_records || 540} dataset records
          </p>
        </div>
      </section>

      {/* Active Organisation Inventory & Scoring Weights */}
      {profileDetail && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Technology Inventory */}
          <div className="lg:col-span-2 bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E2530] pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
                  <Server className="h-4 w-4 text-[#00E5FF]" />
                  <span>{profileDetail.name} — Infrastructure Footprint</span>
                </h3>
                <p className="text-xs text-[#606D7A] mt-1 font-mono">
                  Sector: <strong className="text-[#bac9cc]">{profileDetail.sector}</strong> • Risk Appetite: <strong className="text-[#bac9cc]">{profileDetail.risk_appetite}</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-2.5 py-1 bg-[#0c0e12] text-[#00E5FF] border border-[#3b494c] font-bold">
                  {profileDetail.technologies.length} TECH STACKS
                </span>
                {onGoToInventory && (
                  <button
                    onClick={onGoToInventory}
                    className="text-xs font-mono px-3 py-1 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 font-bold uppercase transition-colors cursor-pointer"
                  >
                    Manage Inventory →
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profileDetail.technologies.map((tech, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-[#0c0e12] border border-[#1E2530] hover:border-[#3b494c] space-y-3 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#F5F7FA] text-sm flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-[#00E5FF]" />
                      <span>{tech.product}</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 uppercase border ${
                        tech.exposure.toLowerCase() === 'internet-facing'
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                          : 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]'
                      }`}
                    >
                      {tech.exposure}
                    </span>
                  </div>

                  <div className="text-xs text-[#bac9cc]">
                    <span className="text-[#606D7A] block text-[9px] font-label-caps">SERVICE</span>
                    <span className="font-medium text-[#F5F7FA]">{tech.service || 'Core Operations'}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#606D7A] pt-2 border-t border-[#1E2530] font-mono">
                    <span>Criticality: <span className="text-[#00daf3] font-semibold">{tech.importance}</span></span>
                    <span>v{tech.version || 'unconstrained'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 1 Col: Active Weight Modifiers */}
          <div className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
            <div className="border-b border-[#1E2530] pb-4">
              <h3 className="text-base sm:text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#00E5FF]" />
                <span>Deterministic Scoring Model</span>
              </h3>
              <p className="text-xs text-[#606D7A] mt-1 font-mono">5-Signal mathematical contribution weights</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-[#1E2530]">
                <span className="text-[#bac9cc] font-medium">CISA KEV Exploitation</span>
                <span className="font-mono font-bold text-[#FF3B30]">
                  {(profileDetail.weights.cisa_kev_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1E2530]">
                <span className="text-[#bac9cc] font-medium">FIRST EPSS Probability</span>
                <span className="font-mono font-bold text-[#FF9500]">
                  {(profileDetail.weights.first_epss_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1E2530]">
                <span className="text-[#bac9cc] font-medium">CVSS Technical Severity</span>
                <span className="font-mono font-bold text-[#FFCC00]">
                  {(profileDetail.weights.cvss_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#1E2530]">
                <span className="text-[#bac9cc] font-medium">Asset Perimeter Exposure</span>
                <span className="font-mono font-bold text-[#00E5FF]">
                  {(profileDetail.weights.exposure_weight * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[#bac9cc] font-medium">Service Criticality</span>
                <span className="font-mono font-bold text-[#c3f5ff]">
                  {(profileDetail.weights.importance_weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E2530] text-center">
              <span className="text-[10px] font-label-caps text-[#00E5FF] tracking-wider uppercase font-bold">
                ✓ Mathematical Weights Sum to 100%
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Feature Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={onGoToTriage}
          className="p-6 bg-[#11141B] border border-[#1E2530] hover:border-[#00E5FF] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center text-[#00E5FF] mb-4 group-hover:border-[#00E5FF]">
            <Activity className="h-5 w-5" />
          </div>
          <h4 className="text-base font-bold text-[#F5F7FA] group-hover:text-[#00E5FF] transition-colors flex items-center justify-between">
            <span>Triage Decisions</span>
            <ArrowRight className="h-4 w-4 text-[#00E5FF] group-hover:translate-x-1 transition-transform" />
          </h4>
          <p className="text-xs text-[#606D7A] mt-2 leading-relaxed">
            View the official Top 5 vulnerability decision list with point share breakdowns and safe next actions.
          </p>
        </div>

        <div
          onClick={onGoToWhyNot}
          className="p-6 bg-[#11141B] border border-[#1E2530] hover:border-[#FF3B30] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center text-[#FF3B30] mb-4 group-hover:border-[#FF3B30]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h4 className="text-base font-bold text-[#F5F7FA] group-hover:text-[#FF3B30] transition-colors flex items-center justify-between">
            <span>Why Not? (Negative Test)</span>
            <ArrowRight className="h-4 w-4 text-[#FF3B30] group-hover:translate-x-1 transition-transform" />
          </h4>
          <p className="text-xs text-[#606D7A] mt-2 leading-relaxed">
            Demonstrate why high-CVSS vulnerabilities (CVSS ≥ 9.0) on unused assets are excluded ("Severity ≠ Priority").
          </p>
        </div>

        <div
          onClick={onGoToCompare}
          className="p-6 bg-[#11141B] border border-[#1E2530] hover:border-[#00daf3] transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-[#0c0e12] border border-[#3b494c] flex items-center justify-center text-[#00daf3] mb-4 group-hover:border-[#00daf3]">
            <Globe className="h-5 w-5" />
          </div>
          <h4 className="text-base font-bold text-[#F5F7FA] group-hover:text-[#00daf3] transition-colors flex items-center justify-between">
            <span>Compare Profiles</span>
            <ArrowRight className="h-4 w-4 text-[#00daf3] group-hover:translate-x-1 transition-transform" />
          </h4>
          <p className="text-xs text-[#606D7A] mt-2 leading-relaxed">
            Compare Global Retail Bank vs Agile Cloud Tech Startup to prove how different profiles alter rankings.
          </p>
        </div>
      </section>
    </motion.div>
  );
};
