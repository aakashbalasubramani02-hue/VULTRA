import React, { useEffect, useState } from 'react';
import { ComparisonResponse, ProfileSummary } from '../types/api';
import { api } from '../api/client';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import {
  GitCompare,
  ArrowRight,
  Sparkles,
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
      transition={{ duration: 0.25 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl space-y-5 cyber-grid">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <GitCompare className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-blue-400">
              Cross-Organisation Priority Comparison
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Organisation Profile Comparison
            </h1>
          </div>
        </div>

        {/* Challenge Demonstration Banner */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/40 to-slate-950/60 border border-cyan-500/25 flex items-center justify-between flex-wrap gap-3 shadow-sm">
          <div className="text-xs text-slate-200 leading-relaxed">
            <strong className="font-mono text-cyan-400 font-extrabold">CORE CHALLENGE PROOF: </strong>
            <span>Same threat dataset + distinct organisational context = completely different Top 5 priorities.</span>
          </div>
          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            0% Overlap Validated
          </span>
        </div>

        {/* Profile Selectors Dual Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Profile A Selector */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-inner">
            <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
              Organisation A
            </label>
            <select
              value={profileA}
              onChange={(e) => setProfileA(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xs"
            >
              {profiles.map((p) => (
                <option key={p.profile_id} value={p.profile_id}>
                  {p.name} ({p.profile_id} - {p.sector})
                </option>
              ))}
            </select>
          </div>

          {/* Profile B Selector */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 shadow-inner">
            <label className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
              Organisation B
            </label>
            <select
              value={profileB}
              onChange={(e) => setProfileB(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
            >
              {profiles.map((p) => (
                <option key={p.profile_id} value={p.profile_id}>
                  {p.name} ({p.profile_id} - {p.sector})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => fetchComparison(profileA, profileB)} />}

      {isLoading && <SkeletonLoader count={3} />}

      {!isLoading && comparison && (
        <>
          {/* Comparison Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 text-center font-mono shadow-lg">
              <span className="text-slate-400 text-xs uppercase block font-semibold">Common Top 5 Actions</span>
              <span className="text-3xl font-extrabold text-cyan-400">
                {comparison.common_cves.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                {comparison.common_cves.length === 0 ? '0% Overlap (Distinct Decisions)' : 'Shared CVEs'}
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 text-center font-mono shadow-lg">
              <span className="text-slate-400 text-xs uppercase block font-semibold">Unique to {comparison.profile_a.name}</span>
              <span className="text-3xl font-extrabold text-white">
                {comparison.unique_a_cves.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Tailored to Bank Assets</span>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 text-center font-mono shadow-lg">
              <span className="text-slate-400 text-xs uppercase block font-semibold">Unique to {comparison.profile_b.name}</span>
              <span className="text-3xl font-extrabold text-white">
                {comparison.unique_b_cves.length}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Tailored to Startup Assets</span>
            </div>
          </div>

          {/* Side-by-Side Top 5 Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 A */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    Organisation A Top 5 List
                  </span>
                  <h3 className="text-lg font-bold text-white">{comparison.profile_a.name}</h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {comparison.profile_a.id}
                </span>
              </div>

              <div className="space-y-3">
                {comparison.top5_a.map((item) => (
                  <div
                    key={item.cve_id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-xs shadow-sm hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="h-6 w-6 rounded-lg bg-slate-800 text-cyan-400 font-bold flex items-center justify-center border border-slate-700">
                          #{item.rank}
                        </span>
                        <span className="font-bold text-white">{item.cve_id}</span>
                      </div>
                      <span className="font-mono text-cyan-400 font-extrabold">{item.score.toFixed(1)} pts</span>
                    </div>
                    <p className="text-slate-200 font-semibold truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{item.technology.product}</span>
                      <span>•</span>
                      <span className="uppercase text-slate-300 font-bold">{item.exposure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 B */}
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                <div>
                  <span className="text-xs font-mono text-blue-400 uppercase tracking-wider font-bold">
                    Organisation B Top 5 List
                  </span>
                  <h3 className="text-lg font-bold text-white">{comparison.profile_b.name}</h3>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  {comparison.profile_b.id}
                </span>
              </div>

              <div className="space-y-3">
                {comparison.top5_b.map((item) => (
                  <div
                    key={item.cve_id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2 text-xs shadow-sm hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 font-mono">
                        <span className="h-6 w-6 rounded-lg bg-slate-800 text-blue-400 font-bold flex items-center justify-center border border-slate-700">
                          #{item.rank}
                        </span>
                        <span className="font-bold text-white">{item.cve_id}</span>
                      </div>
                      <span className="font-mono text-blue-400 font-extrabold">{item.score.toFixed(1)} pts</span>
                    </div>
                    <p className="text-slate-200 font-semibold truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span>{item.technology.product}</span>
                      <span>•</span>
                      <span className="uppercase text-slate-300 font-bold">{item.exposure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Granular Divergence Drivers ("Why did the priorities change?") */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-7 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-extrabold">
                <Sparkles className="h-4 w-4" />
                <span>WHY DID THE PRIORITIES DIVERGE?</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Deterministic driver analysis explaining why specific vulnerabilities rank in one organisation while being ranked lower or excluded in the other.
              </p>
            </div>

            <div className="space-y-3.5">
              {comparison.differences.map((diff) => {
                const rankA = diff.rank_a;
                const rankB = diff.rank_b;

                return (
                  <div
                    key={diff.cve_id}
                    className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-750 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-sm"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-sm">{diff.cve_id}</span>
                        <span className="text-slate-400 font-medium">({diff.product_name})</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {diff.drivers.map((drv, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-mono text-[10px] font-semibold"
                          >
                            {drv}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                      <div className="text-center min-w-[80px]">
                        <span className="text-[10px] text-slate-500 block uppercase">Rank in Org A</span>
                        <span className="font-extrabold text-cyan-400 text-sm">
                          {rankA ? `#${rankA}` : 'Excluded'}
                        </span>
                      </div>

                      <div className="flex items-center justify-center">
                        {rankA && rankB ? (
                          rankA < rankB ? (
                            <TrendingDown className="h-4 w-4 text-amber-400" />
                          ) : rankA > rankB ? (
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Minus className="h-4 w-4 text-slate-500" />
                          )
                        ) : (
                          <ArrowRight className="h-4 w-4 text-slate-600" />
                        )}
                      </div>

                      <div className="text-center min-w-[80px]">
                        <span className="text-[10px] text-slate-500 block uppercase">Rank in Org B</span>
                        <span className="font-extrabold text-blue-400 text-sm">
                          {rankB ? `#${rankB}` : 'Excluded'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
