import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, ShieldAlert, Cpu } from 'lucide-react';
import { ProfileSummary } from '../types/api';
import { motion, AnimatePresence } from 'framer-motion';

interface OrganizationSelectorProps {
  profiles: ProfileSummary[];
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
  isLoading?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProfile = profiles.find((p) => p.profile_id === selectedOrgId) || profiles[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || profiles.length === 0}
        className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 hover:border-cyan-500/50 text-white transition-all shadow-xl shadow-black/40 group cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
      >
        <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform duration-200 shadow-inner">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Active Organisation
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            {selectedProfile ? selectedProfile.name : 'Loading profile...'}
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              {selectedProfile ? selectedProfile.profile_id : ''}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ml-1.5 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-88 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/90 z-50 overflow-hidden backdrop-blur-2xl"
          >
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/70">
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Select Organisation Context
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Triage rankings adapt dynamically to each organisation's unique technology assets and perimeter exposure.
              </p>
            </div>

            <div className="py-1.5 max-h-80 overflow-y-auto divide-y divide-slate-800/50">
              {profiles.map((profile) => {
                const isSelected = profile.profile_id === selectedOrgId;
                return (
                  <button
                    key={profile.profile_id}
                    type="button"
                    onClick={() => {
                      onSelectOrg(profile.profile_id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3.5 text-left flex items-start gap-3.5 hover:bg-slate-800/70 transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/10' : ''
                    }`}
                  >
                    <div
                      className={`mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4 stroke-[3]" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            isSelected ? 'text-cyan-300' : 'text-slate-200'
                          }`}
                        >
                          {profile.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {profile.profile_id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>{profile.sector}</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-semibold flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {profile.technology_count} technologies
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <ShieldAlert className="h-3 w-3 text-slate-500" />
                        <span>Risk Appetite: <strong className="text-slate-300">{profile.risk_appetite}</strong></span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
