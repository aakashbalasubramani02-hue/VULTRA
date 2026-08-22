import React from 'react';
import { Shield, Activity, GitCompare, HelpCircle, BookOpen, Layers, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export type NavView = 'command' | 'triage' | 'compare' | 'whynot' | 'methodology';

interface NavbarProps {
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  isBackendConnected: boolean;
  selectedOrgId: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  isBackendConnected,
}) => {
  const navItems = [
    { id: 'command' as NavView, label: 'Command Center', icon: Layers },
    { id: 'triage' as NavView, label: 'Triage Decisions', icon: Activity },
    { id: 'compare' as NavView, label: 'Compare Profiles', icon: GitCompare },
    { id: 'whynot' as NavView, label: 'Why Not? (Negative Test)', icon: HelpCircle },
    { id: 'methodology' as NavView, label: 'Methodology', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onViewChange('command')} 
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-400 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="h-5 w-5 text-cyan-400 group-hover:scale-105 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-lg text-white font-mono">VULTRA</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                Decision Intelligence
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">From signals to five defensible actions</p>
          </div>
        </div>

        {/* Center Nav Links with Motion */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800/90 shadow-inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? 'text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-cyan-500/15 border border-cyan-500/35 rounded-xl shadow-sm shadow-cyan-500/10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`h-4 w-4 relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Badge Status */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400">
            <Lock className="h-3 w-3 text-cyan-400" />
            <span>OFFLINE SECURE</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono">
            <span
              className={`h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className={isBackendConnected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {isBackendConnected ? 'API Connected' : 'API Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800/60 gap-1.5 bg-slate-950/90">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
