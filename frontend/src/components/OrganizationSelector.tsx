import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, ShieldAlert, Cpu, Plus } from 'lucide-react';
import { ProfileSummary } from '../types/api';
import { motion, AnimatePresence } from 'framer-motion';

interface OrganizationSelectorProps {
  profiles: ProfileSummary[];
  selectedOrgId: string;
  onSelectOrg: (orgId: string) => void;
  onOpenRegister?: () => void;
  isLoading?: boolean;
}

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  profiles,
  selectedOrgId,
  onSelectOrg,
  onOpenRegister,
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
        className="flex items-center gap-3.5 px-4 py-2.5 bg-[#11141B] hover:bg-[#191c20] border border-[#3b494c] hover:border-[#00E5FF] text-[#F5F7FA] transition-all group cursor-pointer focus:border-[#00E5FF]"
      >
        <div className="w-8 h-8 bg-[#191c20] border border-[#3b494c] flex items-center justify-center text-[#00E5FF] group-hover:border-[#00E5FF] transition-colors">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#606D7A]">
            ACTIVE ORGANISATION
          </div>
          <div className="text-sm font-bold text-[#F5F7FA] flex items-center gap-2">
            {selectedProfile ? selectedProfile.name : 'Loading profile...'}
            <span className="text-[10px] px-1.5 py-0.5 bg-[#0c0e12] text-[#00E5FF] font-mono border border-[#3b494c]">
              {selectedProfile ? selectedProfile.profile_id : ''}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#606D7A] group-hover:text-[#00E5FF] transition-transform duration-200 ml-1.5 ${
            isOpen ? 'rotate-180 text-[#00E5FF]' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-96 bg-[#0c0e12] border border-[#3b494c] shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-[#1E2530] bg-[#11141B]">
              <p className="text-[11px] font-bold text-[#F5F7FA] font-label-caps uppercase tracking-widest">
                Select Telemetry Context
              </p>
              <p className="text-[11px] text-[#bac9cc] mt-1 leading-relaxed">
                Triage rankings dynamically reorganize based on each organisation's specific attack perimeter and technology inventory.
              </p>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2530]">
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
                    className={`w-full px-4 py-3.5 text-left flex items-start gap-3.5 hover:bg-[#11141B] transition-colors cursor-pointer border-l-2 ${
                      isSelected ? 'bg-[#11141B] border-l-[#00E5FF]' : 'border-l-transparent'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-6 h-6 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#00E5FF] text-[#0c0e12] font-bold'
                          : 'bg-[#191c20] text-[#606D7A] border border-[#3b494c]'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : (
                        <Building2 className="h-3 w-3" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold truncate ${
                            isSelected ? 'text-[#00E5FF]' : 'text-[#F5F7FA]'
                          }`}
                        >
                          {profile.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#0c0e12] text-[#bac9cc] border border-[#3b494c]">
                          {profile.profile_id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#bac9cc]">
                        <span>{profile.sector}</span>
                        <span className="text-[#3b494c]">•</span>
                        <span className="text-[#00daf3] font-semibold flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {profile.technology_count} technologies
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#606D7A] font-mono">
                        <ShieldAlert className="h-3 w-3 text-[#606D7A]" />
                        <span>Risk Appetite: <strong className="text-[#bac9cc]">{profile.risk_appetite}</strong></span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {onOpenRegister && (
              <div className="p-2.5 bg-[#11141B] border-t border-[#1E2530]">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenRegister();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 border border-[#00E5FF]/40 text-[#00E5FF] font-label-caps text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Register New Organisation</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
