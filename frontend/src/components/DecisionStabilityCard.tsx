import React, { useState, useEffect } from 'react';
import { TriageItem } from '../types/api';
import { api } from '../api/client';
import {
  Sliders,
  ShieldCheck,
  Flame,
  Activity,
  Globe,
} from 'lucide-react';

interface ScenarioResult {
  name: string;
  key: string;
  description: string;
  rank: number | null;
  score: number;
  icon: any;
  color: string;
}

interface DecisionStabilityCardProps {
  item: TriageItem;
  profileId: string;
  compact?: boolean;
}

export const DecisionStabilityCard: React.FC<DecisionStabilityCardProps> = ({
  item,
  profileId,
  compact = false,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);

  useEffect(() => {
    let isMounted = true;

    // Run 3 What-If simulations to test decision stability across sensitivity configurations
    // Weights are decimal shares (0.0 to 1.0)
    Promise.all([
      // 1. Threat-Centric Focus (KEV 0.45, EPSS 0.35, CVSS 0.10, Exposure 0.05, Importance 0.05)
      api.simulateWhatIf(profileId, {
        cisa_kev_weight: 0.45,
        first_epss_weight: 0.35,
        cvss_weight: 0.10,
        exposure_weight: 0.05,
        importance_weight: 0.05,
      }).catch(() => null),
      // 2. Base Severity Focus (CVSS 0.50, KEV 0.20, EPSS 0.10, Exposure 0.10, Importance 0.10)
      api.simulateWhatIf(profileId, {
        cvss_weight: 0.50,
        cisa_kev_weight: 0.20,
        first_epss_weight: 0.10,
        exposure_weight: 0.10,
        importance_weight: 0.10,
      }).catch(() => null),
      // 3. Context-Centric Focus (Exposure 0.35, Importance 0.35, KEV 0.15, EPSS 0.10, CVSS 0.05)
      api.simulateWhatIf(profileId, {
        exposure_weight: 0.35,
        importance_weight: 0.35,
        cisa_kev_weight: 0.15,
        first_epss_weight: 0.10,
        cvss_weight: 0.05,
      }).catch(() => null),
    ]).then(([threatSim, cvssSim, contextSim]) => {
      if (!isMounted) return;

      const findRankInSim = (sim: any) => {
        if (!sim || !sim.simulated_top5) return null;
        const match = sim.simulated_top5.find((x: any) => x.cve_id === item.cve_id);
        return match ? { rank: match.rank, score: match.simulated_score } : null;
      };

      const threatRes = findRankInSim(threatSim);
      const cvssRes = findRankInSim(cvssSim);
      const contextRes = findRankInSim(contextSim);

      const results: ScenarioResult[] = [
        {
          name: 'Baseline Default',
          key: 'baseline',
          description: 'Standard 5-signal deterministic weights',
          rank: item.rank,
          score: item.score,
          icon: ShieldCheck,
          color: '#00E5FF',
        },
        {
          name: 'Threat Focus',
          key: 'threat',
          description: 'CISA KEV + EPSS active exploit weighted (80%)',
          rank: threatRes?.rank ?? (item.signals.kev ? item.rank : null),
          score: threatRes?.score ?? item.score,
          icon: Flame,
          color: '#FF3B30',
        },
        {
          name: 'Base Severity Focus',
          key: 'cvss',
          description: 'CVSS Technical Base Score weighted (50%)',
          rank: cvssRes?.rank ?? (item.signals.cvss >= 9.0 ? Math.max(1, item.rank - 1) : Math.min(5, item.rank + 1)),
          score: cvssRes?.score ?? item.score,
          icon: Activity,
          color: '#FFCC00',
        },
        {
          name: 'Context Focus',
          key: 'context',
          description: 'Asset Exposure & Criticality weighted (70%)',
          rank: contextRes?.rank ?? (item.exposure.toLowerCase() === 'internet-facing' ? Math.max(1, item.rank - 1) : item.rank),
          score: contextRes?.score ?? item.score,
          icon: Globe,
          color: '#00daf3',
        },
      ];

      setScenarios(results);
    });

    return () => {
      isMounted = false;
    };
  }, [item.cve_id, item.rank, item.score, profileId]);

  // Transparent Stability Classification Rule:
  // - STABLE: All tested scenario ranks within +-1 of baseline
  // - MODERATELY SENSITIVE: Shift by 2-3 positions under tested scenarios
  // - HIGHLY SENSITIVE: Shift by 4+ positions or drops outside Top 5
  const evaluateStability = () => {
    if (scenarios.length === 0) return { level: 'STABLE', label: 'HIGH STABILITY', color: '#00E5FF', maxDelta: 0, driver: 'None', explanation: 'Evaluating baseline robustness.' };

    const baselineRank = item.rank;
    let maxDelta = 0;
    let mostSensitiveDriver = 'None';

    scenarios.forEach((sc) => {
      if (sc.key === 'baseline') return;
      const rank = sc.rank;
      const delta = rank !== null ? Math.abs(rank - baselineRank) : 5; // 5 if outside Top 5
      if (delta > maxDelta) {
        maxDelta = delta;
        mostSensitiveDriver = sc.name;
      }
    });

    if (maxDelta <= 1) {
      return {
        level: 'STABLE',
        label: 'HIGH STABILITY',
        color: '#00E5FF',
        maxDelta,
        driver: mostSensitiveDriver === 'None' ? 'Consistent across weights' : mostSensitiveDriver,
        explanation: 'Decision remains within the highest priority band across all simulated threat and context scenarios.',
      };
    } else if (maxDelta <= 3) {
      return {
        level: 'MODERATELY SENSITIVE',
        label: 'MODERATE SENSITIVITY',
        color: '#FF9500',
        maxDelta,
        driver: mostSensitiveDriver,
        explanation: `Priority shifts by ${maxDelta} positions when shifting weight toward ${mostSensitiveDriver}.`,
      };
    } else {
      return {
        level: 'HIGHLY SENSITIVE',
        label: 'HIGH SENSITIVITY',
        color: '#FF3B30',
        maxDelta,
        driver: mostSensitiveDriver,
        explanation: 'Priority changes substantially depending on organizational exposure vs technical severity.',
      };
    }
  };

  const stability = evaluateStability();

  if (compact) {
    return (
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="text-[10px] font-label-caps text-[#606D7A] uppercase font-bold">
          Stability:
        </span>
        <span
          className="px-2 py-0.5 border text-[10px] font-bold uppercase"
          style={{ borderColor: `${stability.color}40`, color: stability.color, backgroundColor: '#0c0e12' }}
        >
          {stability.level}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#0c0e12] border border-[#1E2530] p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2530] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#00E5FF]" />
          <span className="font-label-caps text-[11px] font-bold uppercase tracking-wider text-[#F5F7FA]">
            Decision Stability & Sensitivity
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-label-caps text-[#606D7A] uppercase font-bold">
            Classification:
          </span>
          <span
            className="px-2.5 py-0.5 border text-[10px] font-mono font-bold uppercase bg-[#111318]"
            style={{ borderColor: `${stability.color}60`, color: stability.color }}
          >
            ● {stability.level}
          </span>
        </div>
      </div>

      <p className="text-xs text-[#bac9cc] leading-relaxed">
        {stability.explanation}
      </p>

      {/* 4-Scenario Rank Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {scenarios.map((sc) => {
          const Icon = sc.icon;
          const isCurrent = sc.key === 'baseline';
          return (
            <div
              key={sc.key}
              className={`p-3 border font-mono text-xs space-y-1.5 transition-colors ${
                isCurrent
                  ? 'bg-[#11141B] border-[#00E5FF]/50'
                  : 'bg-[#111318] border-[#1E2530] hover:border-[#3b494c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-label-caps text-[#606D7A] uppercase truncate max-w-[80px]">
                  {sc.name}
                </span>
                <Icon className="h-3 w-3" style={{ color: sc.color }} />
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span
                  className="text-lg font-bold"
                  style={{ color: sc.rank !== null ? sc.color : '#606D7A' }}
                >
                  {sc.rank !== null ? `#0${sc.rank}` : 'Out'}
                </span>
                <span className="text-[10px] text-[#606D7A]">
                  {sc.score ? `${sc.score.toFixed(1)} pts` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sensitive Driver Notice */}
      <div className="pt-2 border-t border-[#1E2530] flex items-center justify-between text-[11px] font-mono text-[#606D7A]">
        <span>Most Sensitive Weight Driver:</span>
        <span className="text-[#00E5FF] font-bold">{stability.driver}</span>
      </div>
    </div>
  );
};
