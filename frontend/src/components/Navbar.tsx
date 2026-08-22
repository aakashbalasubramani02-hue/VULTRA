import React from 'react';
import { Shield, Activity, GitCompare, HelpCircle, BookOpen, Layers, Plus, Server, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export type NavView = 'command' | 'triage' | 'inventory' | 'remediation' | 'alerts' | 'compare' | 'whynot' | 'methodology';

interface NavbarProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  isBackendConnected: boolean;
  selectedOrgId: string;
  onOpenRegister?: () => void;
  unreadAlertsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  isBackendConnected,
  onOpenRegister,
  unreadAlertsCount = 0,
}) => {
  const navItems = [
    { id: 'command' as NavView, label: 'Overview', icon: Layers },
    { id: 'triage' as NavView, label: 'Priorities', icon: Activity },
    { id: 'inventory' as NavView, label: 'Asset Inventory', icon: Server },
    { id: 'remediation' as NavView, label: 'Remediation', icon: ShieldCheck },
    { id: 'alerts' as NavView, label: 'Alerts', icon: ShieldAlert, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
    { id: 'compare' as NavView, label: 'Comparison', icon: GitCompare },
    { id: 'whynot' as NavView, label: 'Negative Test', icon: HelpCircle },
    { id: 'methodology' as NavView, label: 'Methodology', icon: BookOpen },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#111318]/90 backdrop-blur-md border-b border-[#3b494c] transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onViewChange('command')} 
          className="flex items-center gap-6 cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00E5FF] text-[#0c0e12] flex items-center justify-center font-bold font-mono">
              <Shield className="w-4 h-4 text-[#0c0e12]" />
            </div>
            <span className="font-display font-extrabold text-2xl tracking-tighter text-[#00E5FF]">
              VULTRA
            </span>
          </div>

          <div className="hidden lg:flex flex-col border-l border-[#3b494c] pl-4">
            <span className="text-[9px] font-label-caps uppercase tracking-widest text-[#bac9cc] font-bold">
              Personalised Intelligence
            </span>
            <span className="text-[8px] font-mono text-[#606D7A]">
              Precision Risk Intelligence
            </span>
          </div>
        </div>

        {/* Center Nav Links with Editorial Precision */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative px-4 py-2 font-label-caps text-[11px] tracking-widest uppercase transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#00E5FF] font-bold'
                    : 'text-[#606D7A] hover:text-[#F5F7FA]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00E5FF]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#FF3B30] text-[#F5F7FA] text-[9px] font-mono font-bold rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          {onOpenRegister && (
            <button
              type="button"
              onClick={onOpenRegister}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#00E5FF]/40 text-[#00E5FF] text-[11px] font-label-caps font-bold tracking-wider uppercase transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Register Org</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 border border-[#3b494c] bg-[#0c0e12] text-[10px] font-label-caps tracking-widest text-[#bac9cc]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendConnected ? 'bg-[#00E5FF] animate-pulse' : 'bg-[#FF3B30]'
              }`}
            />
            <span>{isBackendConnected ? 'LIVE FEED' : 'OFFLINE'}</span>
          </div>

          <button
            onClick={() => onViewChange('triage')}
            className="bg-[#00E5FF] text-[#0c0e12] font-label-caps text-[11px] px-5 py-2 hover:bg-[#c3f5ff] transition-colors font-bold tracking-widest uppercase cursor-pointer"
          >
            Launch Analysis
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-[#3b494c] gap-1 bg-[#0c0e12]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`px-3 py-1 text-xs font-label-caps uppercase tracking-wider shrink-0 cursor-pointer ${
                isActive
                  ? 'text-[#00E5FF] font-bold border-b-2 border-[#00E5FF]'
                  : 'text-[#606D7A]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
