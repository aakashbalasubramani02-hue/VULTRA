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
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-10"
    >
      {/* Stitch Editorial Header */}
      <header className="border-b border-[#1E2530] pb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <OrganizationSelector
                profiles={profiles}
                selectedOrgId={selectedOrgId}
                onSelectOrg={onSelectOrg}
                isLoading={isLoading}
              />
              <span className="text-[10px] font-label-caps font-bold px-2.5 py-1 uppercase bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30">
                MANDATORY NEGATIVE TEST
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] tracking-tight">
              SEVERITY <span className="text-[#FF3B30]">≠</span> PRIORITY
            </h1>

            <p className="font-body-lg text-[#bac9cc] leading-relaxed">
              "High technical severity does not automatically mean high organisational priority." Traditional CVSS dashboards force small teams into alert fatigue by chasing high scores on software they do not run.
            </p>
          </div>
        </div>

        {/* Dual Comparison Matrix Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-6 bg-[#0c0e12] border border-[#FF3B30]/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-label-caps font-bold uppercase tracking-widest text-[#FF3B30]">
              <XCircle className="h-4 w-4" />
              <span>Generic CVSS-Only Dashboard</span>
            </div>
            <p className="text-xs text-[#bac9cc] leading-relaxed">
              Ranks all CVSS 9.8–10.0 vulnerabilities as top urgent emergencies regardless of whether the organisation actually operates the technology.
            </p>
            <div className="pt-2 font-mono text-[11px] text-[#ffb4ab] font-bold">
              Result: Alert Fatigue & Misallocated Defense Time
            </div>
          </div>

          <div className="p-6 bg-[#0c0e12] border border-[#00E5FF]/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-label-caps font-bold uppercase tracking-widest text-[#00E5FF]">
              <CheckCircle2 className="h-4 w-4" />
              <span>VULTRA Decision Intelligence</span>
            </div>
            <p className="text-xs text-[#bac9cc] leading-relaxed">
              Strictly excludes non-deployed products and prioritises weaponised threats (CISA KEV + FIRST EPSS) on your actual perimeter.
            </p>
            <div className="pt-2 font-mono text-[11px] text-[#00E5FF] font-bold">
              Result: 5 Defensible Actions You Can Justify
            </div>
          </div>
        </div>
      </header>

      {error && <ErrorBanner message={error} onRetry={() => fetchWhyNot(selectedOrgId)} />}

      {isLoading && <SkeletonLoader count={3} />}

      {!isLoading && whyNotData && (
        <div className="space-y-10">
          {/* Section 1: Excluded High-CVSS (Product Not Used) */}
          <section className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
            <div className="border-b border-[#1E2530] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
                  <ShieldX className="h-5 w-5 text-[#FF3B30]" />
                  <span>High Technical Severity (CVSS ≥ 9.0) — Excluded</span>
                </h3>
                <p className="text-xs text-[#606D7A] mt-1 font-mono">
                  Filtered out because target product is not deployed in {whyNotData.profile_name}.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#0c0e12] text-[#FF3B30] border border-[#FF3B30]/30 self-start sm:self-auto">
                {whyNotData.excluded_high_severity.length} EXCLUDED RECORDS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {whyNotData.excluded_high_severity.map((item) => (
                <div
                  key={item.cve_id}
                  className="p-6 bg-[#0c0e12] border border-[#1E2530] hover:border-[#3b494c] transition-colors space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#F5F7FA] text-base">{item.cve_id}</span>
                      <span className="px-2 py-0.5 text-xs font-mono font-extrabold uppercase bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30">
                        CVSS {item.cvss.toFixed(1)}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#191c20] text-[#FF3B30] border border-[#3b494c]">
                      {item.decision}
                    </span>
                  </div>

                  <div className="text-xs font-mono text-[#606D7A]">
                    Target Entity: <strong className="text-[#F5F7FA]">{item.product_name}</strong>
                  </div>

                  <div className="p-3 bg-[#111318] border border-[#1E2530] text-xs text-[#bac9cc] space-y-1">
                    <div className="text-[10px] font-label-caps uppercase text-[#606D7A] font-bold">
                      REASON CODE: {item.reason_code}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#bac9cc]">{item.reason}</p>
                  </div>

                  <div className="text-[11px] text-[#606D7A] font-mono flex items-center gap-1.5 pt-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#FF3B30] shrink-0" />
                    <span>Traditional scanners flag this as Critical. VULTRA safely excluded it.</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Deprioritised High-CVSS (Lack of Active Threat Signals) */}
          {whyNotData.deprioritised_high_severity.length > 0 && (
            <section className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
              <div className="border-b border-[#1E2530] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#F5F7FA] flex items-center gap-2">
                    <ArrowDownRight className="h-5 w-5 text-[#FF9500]" />
                    <span>Matched High Severity (CVSS ≥ 9.0) — Deprioritised</span>
                  </h3>
                  <p className="text-xs text-[#606D7A] mt-1 font-mono">
                    Product is used, but absence of active weaponisation pushed priority below Top 5.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#0c0e12] text-[#FF9500] border border-[#FF9500]/30 self-start sm:self-auto">
                  {whyNotData.deprioritised_high_severity.length} DEPRIORITISED RECORDS
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {whyNotData.deprioritised_high_severity.map((item) => (
                  <div
                    key={item.cve_id}
                    className="p-6 bg-[#0c0e12] border border-[#1E2530] hover:border-[#3b494c] transition-colors space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#F5F7FA] text-base">{item.cve_id}</span>
                        <span className="px-2 py-0.5 text-xs font-mono font-extrabold uppercase bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/30">
                          CVSS {item.cvss.toFixed(1)}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#191c20] text-[#FF9500] border border-[#3b494c]">
                        Rank #{item.rank}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-[#606D7A]">
                      Target Entity: <strong className="text-[#F5F7FA]">{item.product_name}</strong>
                    </div>

                    <div className="p-3 bg-[#111318] border border-[#1E2530] text-xs text-[#bac9cc] space-y-1">
                      <div className="text-[10px] font-label-caps uppercase text-[#606D7A] font-bold">
                        REASON: {item.reason_code}
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#bac9cc]">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </motion.div>
  );
};
