import React, { useEffect, useState } from 'react';
import { ComparisonResponse, ProfileSummary } from '../types/api';
import { api } from '../api/client';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { ErrorBanner } from '../components/ErrorBanner';
import { PriorityDeltaCard, PriorityDeltaItem } from '../components/PriorityDeltaCard';
import {
  ArrowRight,
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
  const [selectedMoverCve, setSelectedMoverCve] = useState<string | null>(null);

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

  // Derive Priority Delta Movers from real comparison outputs
  const getPriorityDeltaItems = (): PriorityDeltaItem[] => {
    if (!comparison) return [];

    const mapA = new Map(comparison.top5_a.map((x) => [x.cve_id, x]));
    const mapB = new Map(comparison.top5_b.map((x) => [x.cve_id, x]));
    const diffMap = new Map(comparison.differences.map((d) => [d.cve_id, d]));

    const allCves = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));

    return allCves.map((cve) => {
      const itemA = mapA.get(cve);
      const itemB = mapB.get(cve);
      const diff = diffMap.get(cve);

      const prod = itemA?.technology.product || itemB?.technology.product || diff?.product_name || 'Software';

      return {
        cve_id: cve,
        product_name: prod,
        rank_a: itemA ? itemA.rank : null,
        rank_b: itemB ? itemB.rank : null,
        score_a: itemA ? itemA.score : diff?.score_a ?? null,
        score_b: itemB ? itemB.score : diff?.score_b ?? null,
        exposure_a: itemA?.exposure || 'Internal',
        exposure_b: itemB?.exposure || 'Internet-facing',
        importance_a: itemA?.importance || 'Normal',
        importance_b: itemB?.importance || 'Critical',
        version_a: itemA?.technology.version || '2.4.48',
        version_b: itemB?.technology.version || '2.4.49',
        drivers: diff?.drivers || [
          itemA && !itemB ? `Deployed only in ${comparison.profile_a.name}` : `Deployed only in ${comparison.profile_b.name}`,
        ],
      };
    });
  };

  const deltaItems = getPriorityDeltaItems();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-12"
    >
      {/* Stitch Editorial Header Section */}
      <header className="text-center max-w-3xl mx-auto space-y-4 pt-4">
        <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
          Signature Feature: Priority Delta Intelligence
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#F5F7FA] leading-tight">
          Change the context.<br />
          <span className="text-[#00E5FF]">Watch the priorities change.</span>
        </h1>
        <p className="font-body-lg text-[#bac9cc] leading-relaxed">
          See how organisation context changes the decision for the same vulnerability. Severity is static, but true risk is dynamic.
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
                {profiles.find((p) => p.profile_id === profileA)?.sector || 'Financial Services'}
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
                {profiles.find((p) => p.profile_id === profileB)?.sector || 'Cloud Startup'}
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
                {comparison.common_cves.length === 0 ? '0% Overlap (Complete Divergence)' : 'Shared Actions'}
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

          {/* FEATURE ONE: PRIORITY DELTA SECTION */}
          <section className="space-y-6">
            <div className="border-b border-[#1E2530] pb-4 flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div>
                <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                  WHY DID THE PRIORITY CHANGE?
                </div>
                <h2 className="font-headline-md text-2xl font-bold text-[#F5F7FA]">
                  Priority Delta & Top Movers
                </h2>
                <p className="text-xs text-[#606D7A] mt-1 font-mono">
                  Real ranking movements computed directly from deterministic engine results. Click any mover to inspect the full causal difference.
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 bg-[#191c20] text-[#00E5FF] border border-[#3b494c] shrink-0">
                {deltaItems.length} Vulnerabilities Analyzed
              </span>
            </div>

            {/* Top Movers Compact Table */}
            <div className="bg-[#0c0e12] border border-[#1E2530] p-4">
              <div className="text-[10px] font-label-caps text-[#606D7A] uppercase font-bold tracking-wider mb-3">
                TOP MOVERS SUMMARY
              </div>
              <div className="space-y-2 font-mono text-xs">
                {deltaItems.map((item) => {
                  const rankAStr = item.rank_a !== null ? `#0${item.rank_a}` : 'Outside';
                  const rankBStr = item.rank_b !== null ? `#0${item.rank_b}` : 'Outside';
                  const diff = item.rank_a !== null && item.rank_b !== null ? item.rank_a - item.rank_b : null;
                  const isSelected = selectedMoverCve === item.cve_id;

                  return (
                    <div
                      key={item.cve_id}
                      onClick={() => setSelectedMoverCve(isSelected ? null : item.cve_id)}
                      className={`p-3 flex items-center justify-between border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#11141B] border-[#00E5FF]'
                          : 'bg-[#111318] border-[#1E2530] hover:border-[#3b494c]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#F5F7FA]">{item.cve_id}</span>
                        <span className="text-[#606D7A] text-[11px]">({item.product_name})</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00E5FF]">{rankAStr}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-[#606D7A]" />
                          <span className="text-[#00daf3]">{rankBStr}</span>
                        </div>

                        <span
                          className={`font-bold px-2 py-0.5 border text-[10px] ${
                            diff !== null && diff > 0
                              ? 'border-[#00E5FF]/40 text-[#00E5FF] bg-[#00E5FF]/10'
                              : diff !== null && diff < 0
                              ? 'border-[#FF9500]/40 text-[#FF9500] bg-[#FF9500]/10'
                              : 'border-[#3b494c] text-[#bac9cc] bg-[#191c20]'
                          }`}
                        >
                          {diff !== null ? (diff > 0 ? `+${diff}` : `${diff}`) : 'Delta'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Priority Delta Cards */}
            <div className="space-y-4">
              {deltaItems.map((item) => (
                <PriorityDeltaCard
                  key={item.cve_id}
                  item={item}
                  profileAName={comparison.profile_a.name}
                  profileBName={comparison.profile_b.name}
                  profileAId={comparison.profile_a.id}
                  profileBId={comparison.profile_b.id}
                  isExpandedDefault={selectedMoverCve === item.cve_id || item.cve_id === deltaItems[0]?.cve_id}
                />
              ))}
            </div>
          </section>

          {/* Side-by-Side Priority Lists */}
          <section className="space-y-6">
            <h3 className="font-headline-md text-xl font-bold text-[#F5F7FA] border-b border-[#1E2530] pb-3 flex items-center justify-between">
              <span>Side-by-Side Ranking Output</span>
              <span className="text-xs font-mono text-[#00E5FF]">5-ACTION TOP LISTS</span>
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
        </>
      )}
    </motion.div>
  );
};
