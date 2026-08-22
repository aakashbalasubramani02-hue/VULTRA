import React, { useEffect, useState } from 'react';
import { ProfileSummary, WhyNotResponse } from '../types/api';
import { api } from '../api/client';
import { OrganizationSelector } from '../components/OrganizationSelector';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  ShieldX,
  ArrowDownRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface WhyNotViewProps {
  profiles: ProfileSummary[];
  selectedOrgId: string;
  onSelectOrg: (id: string) => void;
}

export const WhyNotView: React.FC<WhyNotViewProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
}) => {
  const [whyNotData, setWhyNotData] = useState<WhyNotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWhyNot = (orgId: string) => {
    setIsLoading(true);
    setError(null);
    api
      .getWhyNot(orgId)
      .then((data) => {
        setWhyNotData(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Why-Not negative test analysis');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (selectedOrgId) {
      fetchWhyNot(selectedOrgId);
    }
  }, [selectedOrgId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-5 cyber-grid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <OrganizationSelector
                profiles={profiles}
                selectedOrgId={selectedOrgId}
                onSelectOrg={onSelectOrg}
                isLoading={isLoading}
              />
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Mandatory Negative Test
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              SEVERITY <span className="text-rose-400">≠</span> PRIORITY
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              "High technical severity does not automatically mean high organisational priority." Traditional CVSS dashboards force small teams into alert fatigue by chasing high scores on software they do not run.
            </p>
          </div>
        </div>

        {/* Signature Comparison Graphic Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-rose-400">
              <XCircle className="h-4 w-4" />
              <span>Generic CVSS-Only Dashboard</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ranks all CVSS 9.8–10.0 vulnerabilities as top urgent emergencies regardless of whether the organisation actually operates the technology.
            </p>
            <div className="pt-2 font-mono text-[11px] text-rose-300 font-bold">
              Result: Constant Alert Fatigue & Wasted Effort
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-cyan-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>VULTRA Decision Intelligence</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strictly excludes non-deployed products and prioritises weaponised threats (CISA KEV + FIRST EPSS) on your actual perimeter.
            </p>
            <div className="pt-2 font-mono text-[11px] text-cyan-300 font-bold">
              Result: 5 Defensible Actions You Can Defend
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchWhyNot(selectedOrgId)} />}

      {isLoading && <SkeletonLoader count={3} />}

      {!isLoading && whyNotData && (
        <div className="space-y-8">
          {/* Section 1: Excluded High-CVSS (Product Not Used) */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-7 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ShieldX className="h-5 w-5 text-rose-400" />
                  <span>High Technical Severity (CVSS ≥ 9.0) — Excluded</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Filtered out because target product is not deployed in {whyNotData.profile_name}.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/25">
                {whyNotData.excluded_high_severity.length} Excluded Records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyNotData.excluded_high_severity.map((item) => (
                <div
                  key={item.cve_id}
                  className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-750 transition-colors space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-white text-sm sm:text-base">{item.cve_id}</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        CVSS {item.cvss.toFixed(1)}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-rose-400 border border-slate-700">
                      {item.decision}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    Target Technology: <strong className="text-slate-200">{item.product_name}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                      Reason Code: {item.reason_code}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-300 font-medium">{item.reason}</p>
                  </div>

                  <div className="text-[11px] text-slate-500 italic font-mono flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                    <span>CVSS-only dashboards would treat this as Critical. VULTRA excluded it.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Deprioritised High-CVSS (Lack of Active Threat Signals) */}
          {whyNotData.deprioritised_high_severity.length > 0 && (
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 md:p-7 space-y-5 shadow-xl">
              <div className="border-b border-slate-800 pb-3.5 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-amber-400" />
                    <span>Matched High Severity (CVSS ≥ 9.0) — Deprioritised</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Product is used, but absence of active weaponisation pushed priority below Top 5.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  {whyNotData.deprioritised_high_severity.length} Deprioritised Records
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {whyNotData.deprioritised_high_severity.map((item) => (
                  <div
                    key={item.cve_id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-750 transition-colors space-y-3.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-sm sm:text-base">{item.cve_id}</span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          CVSS {item.cvss.toFixed(1)}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">
                        Rank #{item.rank}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-slate-400">
                      Target Technology: <strong className="text-slate-200">{item.product_name}</strong>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">
                        Reason: {item.reason_code}
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300 font-medium">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
