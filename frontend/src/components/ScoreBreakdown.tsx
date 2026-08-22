import React from 'react';
import { ScoreFactors } from '../types/api';
import { ShieldCheck, Crosshair, AlertOctagon, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoreBreakdownProps {
  factors: ScoreFactors;
  totalScore: number;
  compact?: boolean;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  factors,
  totalScore,
  compact = false,
}) => {
  const items = [
    {
      label: 'CISA KEV (Active Threat)',
      key: 'kev',
      points: factors.kev,
      maxWeight: 35,
      color: 'bg-rose-500',
      textColor: 'text-rose-400',
      icon: ShieldCheck,
      desc: 'Active weaponisation & confirmed in-the-wild exploitation',
    },
    {
      label: 'FIRST EPSS (Probability)',
      key: 'epss',
      points: factors.epss,
      maxWeight: 25,
      color: 'bg-amber-500',
      textColor: 'text-amber-400',
      icon: Crosshair,
      desc: 'Empirical statistical probability of exploitation in next 30 days',
    },
    {
      label: 'CVSS (Technical Severity)',
      key: 'cvss',
      points: factors.cvss,
      maxWeight: 15,
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      icon: AlertOctagon,
      desc: 'Technical severity baseline score from disclosure record',
    },
    {
      label: 'Asset Exposure Context',
      key: 'exposure',
      points: factors.exposure,
      maxWeight: 15,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      icon: Globe,
      desc: 'Perimeter reachability multiplier (Internet-facing vs Internal)',
    },
    {
      label: 'Service Criticality Context',
      key: 'importance',
      points: factors.importance,
      maxWeight: 10,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-400',
      icon: Sparkles,
      desc: 'Business service criticality weight (Critical vs High vs Normal)',
    },
  ];

  if (compact) {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex items-center justify-between text-xs font-mono mb-1">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider">Score Point Contribution</span>
          <span className="text-white font-bold text-sm">
            {totalScore.toFixed(1)} <span className="text-slate-500 text-xs">/ 100</span>
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-[10px] font-mono">
          {items.map((it) => (
            <div key={it.key} className="bg-slate-950/80 rounded-lg p-1.5 border border-slate-800 text-center">
              <div className="text-slate-400 truncate text-[9px]">{it.key.toUpperCase()}</div>
              <div className={`font-bold ${it.textColor}`}>+{it.points.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/90 shadow-inner">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Deterministic Signal Contribution Breakdown</span>
        </div>
        <div className="text-xs font-mono font-extrabold text-cyan-400">
          Total Priority: {totalScore.toFixed(1)} / 100 pts
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min(100, (item.points / item.maxWeight) * 100);

          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon className={`h-3.5 w-3.5 ${item.textColor}`} />
                  <span className="text-[11px] font-semibold">{item.label}</span>
                </div>
                <div className="font-mono text-xs font-bold text-white">
                  <span className={item.textColor}>+{item.points.toFixed(1)}</span>
                  <span className="text-slate-500 text-[10px]"> / {item.maxWeight} pts max</span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full ${item.color} rounded-full`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
