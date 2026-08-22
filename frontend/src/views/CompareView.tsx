import React, { useEffect, useState } from 'react';
import { ComparisonResponse, ProfileSummary } from '../types/api';
import { api } from '../api/client';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CompareViewProps {
  profiles: ProfileSummary[];
}

export const CompareView: React.FC<CompareViewProps> = ({ profiles }) => {
  const [profileA, setProfileA] = useState<string>(profiles[0]?.profile_id || 'ORG-001');
  const [profileB, setProfileB] = useState<string>(
    profiles[1]?.profile_id || (profiles.length > 1 ? profiles[1].profile_id : 'ORG-002')
  );

  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = (pA: string, pB: string) => {
    setIsLoading(true);
    setError(null);
    api
      .getComparison(pA, pB)
      .then((data) => {
        setComparison(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to compare profiles');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (profileA && profileB) {
      fetchComparison(profileA, profileB);
    }
  }, [profileA, profileB]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-12"
    >
      {/* Stitch Editorial Header Section */}
      <header className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] leading-tight">
          Change the context.<br />
          <span className="text-[#00E5FF]">Watch the priorities change.</span>
        </h1>
        <p className="font-body-lg text-[#bac9cc] leading-relaxed">
          Vulnerability scoring is static. True risk is dynamic. Observe how contextual intelligence dramatically reorganizes remediation priorities based on environment and exposure.
        </p>
      </header>

      {/* Context Selectors Side-by-Side */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile A Card */}
        <div className="panel-depth p-6 border border-[#1E2530] hover:border-[#00E5FF]/60 transition-colors relative group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-label-caps text-[10px] text-[#606D7A] uppercase tracking-widest block mb-1">
                PROFILE CONTEXT A
              </span>
              <select
                value={profileA}
                onChange={(e) => setProfileA(e.target.value)}
                className="bg-[#0c0e12] border border-[#3b494c] text-[#F5F7FA] font-bold text-sm px-3 py-2 cursor-pointer focus:border-[#00E5FF] outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.profile_id} value={p.profile_id}>
                    {p.name} ({p.profile_id})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-[#0c0e12] text-[#00E5FF] border border-[#3b494c]">
              {profileA}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-[#1E2530]">
            <div>
              <span className="font-label-caps text-[9px] text-[#606D7A] block">SECTOR</span>
              <span className="text-[#F5F7FA] font-bold">
                {profiles.find((p) => p.profile_id === profileA)?.sector || 'Higher Education'}
              </span>
            </div>
            <div>
              <span className="font-label-caps text-[9px] text-[#606D7A] block">RISK APPETITE</span>
              <span className="text-[#FF3B30] font-bold">
                {profiles.find((p) => p.profile_id === profileA)?.risk_appetite || 'Low'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile B Card */}
        <div className="panel-depth p-6 border border-[#1E2530] hover:border-[#00E5FF]/60 transition-colors relative group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-label-caps text-[10px] text-[#606D7A] uppercase tracking-widest block mb-1">
                PROFILE CONTEXT B
              </span>
              <select
                value={profileB}
                onChange={(e) => setProfileB(e.target.value)}
                className="bg-[#0c0e12] border border-[#3b494c] text-[#F5F7FA] font-bold text-sm px-3 py-2 cursor-pointer focus:border-[#00E5FF] outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.profile_id} value={p.profile_id}>
                    {p.name} ({p.profile_id})
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 bg-[#0c0e12] text-[#00daf3] border border-[#3b494c]">
              {profileB}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-[#1E2530]">
            <div>
              <span className="font-label-caps text-[9px] text-[#606D7A] block">SECTOR</span>
              <span className="text-[#F5F7FA] font-bold">
                {profiles.find((p) => p.profile_id === profileB)?.sector || 'Technology Startup'}
              </span>
            </div>
            <div>
              <span className="font-label-caps text-[9px] text-[#606D7A] block">RISK APPETITE</span>
              <span className="text-[#00daf3] font-bold">
                {profiles.find((p) => p.profile_id === profileB)?.risk_appetite || 'High'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} onRetry={() => fetchComparison(profileA, profileB)} />}

      {isLoading && <SkeletonLoader count={3} />}

      {!isLoading && comparison && (
        <>
          {/* Comparison Metric Overview */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-[#0c0e12] border border-[#1E2530] text-center font-mono">
              <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-widest block">
                Common Top 5 Actions
              </span>
              <span className="text-3xl font-extrabold text-[#00E5FF] my-1 block">
                {comparison.common_cves.length}
              </span>
              <span className="text-[11px] text-[#bac9cc] block font-sans">
                {comparison.common_cves.length === 0 ? '0% Overlap (Distinct Decisions)' : 'Shared CVEs'}
              </span>
            </div>

            <div className="p-6 bg-[#0c0e12] border border-[#1E2530] text-center font-mono">
              <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-widest block truncate">
                Unique to {comparison.profile_a.name}
              </span>
              <span className="text-3xl font-extrabold text-[#F5F7FA] my-1 block">
                {comparison.unique_a_cves.length}
              </span>
              <span className="text-[11px] text-[#bac9cc] block font-sans">Customized to Perimeter A</span>
            </div>

            <div className="p-6 bg-[#0c0e12] border border-[#1E2530] text-center font-mono">
              <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-widest block truncate">
                Unique to {comparison.profile_b.name}
              </span>
              <span className="text-3xl font-extrabold text-[#F5F7FA] my-1 block">
                {comparison.unique_b_cves.length}
              </span>
              <span className="text-[11px] text-[#bac9cc] block font-sans">Customized to Perimeter B</span>
            </div>
          </section>

          {/* Priority Shift Analysis */}
          <section className="space-y-6">
            <h3 className="font-headline-md text-xl font-bold text-[#F5F7FA] border-b border-[#1E2530] pb-3 flex items-center justify-between">
              <span>Priority Shift Analysis</span>
              <span className="text-xs font-mono text-[#00E5FF]">SIDE-BY-SIDE AUDIT</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Ranking A */}
              <div className="space-y-3">
                <div className="font-label-caps text-[11px] text-[#606D7A] tracking-wider uppercase font-bold">
                  {comparison.profile_a.name} RANKING
                </div>
                {comparison.top5_a.map((item) => (
                  <div
                    key={item.cve_id}
                    className="data-row p-4 flex items-center justify-between bg-[#111318]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#606D7A] w-6">
                        #{item.rank}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-xs text-[#F5F7FA] block">
                          {item.cve_id}
                        </span>
                        <span className="font-label-caps text-[10px] text-[#FF3B30] flex items-center gap-1.5 pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30] inline-block" />
                          {item.technology.product}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="font-extrabold text-[#00E5FF]">{item.score.toFixed(1)}</span>
                      <span className="text-[#606D7A] text-[10px]"> pts</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ranking B */}
              <div className="space-y-3">
                <div className="font-label-caps text-[11px] text-[#606D7A] tracking-wider uppercase font-bold">
                  {comparison.profile_b.name} RANKING
                </div>
                {comparison.top5_b.map((item) => (
                  <div
                    key={item.cve_id}
                    className="data-row p-4 flex items-center justify-between bg-[#111318]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[#00daf3] w-6">
                        #{item.rank}
                      </span>
                      <div>
                        <span className="font-mono font-bold text-xs text-[#F5F7FA] block">
                          {item.cve_id}
                        </span>
                        <span className="font-label-caps text-[10px] text-[#00daf3] flex items-center gap-1.5 pt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00daf3] inline-block" />
                          {item.technology.product}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="font-extrabold text-[#00daf3]">{item.score.toFixed(1)}</span>
                      <span className="text-[#606D7A] text-[10px]"> pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Granular Divergence Drivers */}
          <section className="bg-[#11141B] border border-[#1E2530] p-6 md:p-8 space-y-6">
            <div className="border-b border-[#1E2530] pb-4">
              <h3 className="font-headline-md text-lg font-bold text-[#F5F7FA]">
                Why Did the Priorities Diverge?
              </h3>
              <p className="text-xs text-[#606D7A] mt-1 font-mono">
                Deterministic driver analysis explaining why specific vulnerabilities rank in one organisation while being ranked lower or excluded in the other.
              </p>
            </div>

            <div className="space-y-3">
              {comparison.differences.map((diff) => {
                const rankA = diff.rank_a;
                const rankB = diff.rank_b;

                return (
                  <div
                    key={diff.cve_id}
                    className="p-4 bg-[#0c0e12] border border-[#1E2530] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-[#F5F7FA] text-sm">{diff.cve_id}</span>
                        <span className="text-[#606D7A] font-mono">({diff.product_name})</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {diff.drivers.map((drv, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-[#191c20] text-[#00E5FF] border border-[#3b494c] font-mono text-[10px]"
                          >
                            {drv}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                      <div className="text-center min-w-[90px]">
                        <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">Org A Rank</span>
                        <span className="font-bold text-[#00E5FF] text-sm">
                          {rankA ? `#${rankA}` : 'Excluded'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center text-[#606D7A]">
                        {rankA && rankB ? (
                          rankA < rankB ? (
                            <TrendingDown className="h-4 w-4 text-[#FF9500]" />
                          ) : rankA > rankB ? (
                            <TrendingUp className="h-4 w-4 text-[#00E5FF]" />
                          ) : (
                            <Minus className="h-4 w-4 text-[#606D7A]" />
                          )
                        ) : (
                          <ArrowRight className="h-4 w-4 text-[#3b494c]" />
                        )}
                      </div>

                      <div className="text-center min-w-[90px]">
                        <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">Org B Rank</span>
                        <span className="font-bold text-[#00daf3] text-sm">
                          {rankB ? `#${rankB}` : 'Excluded'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
};
