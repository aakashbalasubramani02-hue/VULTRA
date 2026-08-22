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
      color: 'bg-[#FF3B30]',
      textColor: 'text-[#FF3B30]',
      icon: ShieldCheck,
      desc: 'Active weaponisation & confirmed in-the-wild exploitation',
    },
    {
      label: 'FIRST EPSS (Probability)',
      key: 'epss',
      points: factors.epss,
      maxWeight: 25,
      color: 'bg-[#FF9500]',
      textColor: 'text-[#FF9500]',
      icon: Crosshair,
      desc: 'Empirical statistical probability of exploitation in next 30 days',
    },
    {
      label: 'CVSS (Technical Severity)',
      key: 'cvss',
      points: factors.cvss,
      maxWeight: 15,
      color: 'bg-[#FFCC00]',
      textColor: 'text-[#FFCC00]',
      icon: AlertOctagon,
      desc: 'Technical severity baseline score from disclosure record',
    },
    {
      label: 'Asset Exposure Context',
      key: 'exposure',
      points: factors.exposure,
      maxWeight: 15,
      color: 'bg-[#00E5FF]',
      textColor: 'text-[#00E5FF]',
      icon: Globe,
      desc: 'Perimeter reachability multiplier (Internet-facing vs Internal)',
    },
    {
      label: 'Service Criticality Context',
      key: 'importance',
      points: factors.importance,
      maxWeight: 10,
      color: 'bg-[#c3f5ff]',
      textColor: 'text-[#c3f5ff]',
      icon: Sparkles,
      desc: 'Business service criticality weight (Critical vs High vs Normal)',
    },
  ];

  if (compact) {
    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between text-xs font-mono mb-1">
          <span className="text-[#606D7A] text-[10px] font-label-caps uppercase tracking-widest">
            Score Signal Contribution
          </span>
          <span className="text-[#F5F7FA] font-bold text-sm">
            {totalScore.toFixed(1)} <span className="text-[#606D7A] text-xs">/ 100</span>
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-[10px] font-mono">
          {items.map((it) => (
            <div key={it.key} className="bg-[#0c0e12] p-1.5 border border-[#1E2530] text-center">
              <div className="text-[#606D7A] truncate text-[9px] font-label-caps">{it.key.toUpperCase()}</div>
              <div className={`font-bold ${it.textColor}`}>+{it.points.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-[#0c0e12] p-5 border border-[#1E2530]">
      <div className="flex items-center justify-between border-b border-[#1E2530] pb-3">
        <div className="text-[11px] font-bold text-[#F5F7FA] uppercase tracking-widest font-label-caps flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#00E5FF]" />
          <span>Deterministic Signal Contribution Breakdown</span>
        </div>
        <div className="text-xs font-mono font-extrabold text-[#00E5FF]">
          Total Priority: {totalScore.toFixed(1)} / 100 pts
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const percentage = Math.min(100, (item.points / item.maxWeight) * 100);

          return (
            <div key={item.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#bac9cc]">
                  <Icon className={`h-3.5 w-3.5 ${item.textColor}`} />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </div>
                <div className="font-mono text-xs font-bold text-[#F5F7FA]">
                  <span className={item.textColor}>+{item.points.toFixed(1)}</span>
                  <span className="text-[#606D7A] text-[10px]"> / {item.maxWeight} max</span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-[#191c20] border border-[#1E2530]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full ${item.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
