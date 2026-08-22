import React, { useState, useEffect, useCallback } from 'react';
import { NavView, Navbar } from './components/Navbar';
import { CommandCenterView } from './views/CommandCenterView';
import { TriageView } from './views/TriageView';
import { CompareView } from './views/CompareView';
import { WhyNotView } from './views/WhyNotView';
import { MethodologyView } from './views/MethodologyView';
import { api } from './api/client';
import {
  ProfileDetailResponse,
  ProfileSummary,
  TriageResponse,
} from './types/api';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavView>('command');
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('ORG-001');
  const [profileDetail, setProfileDetail] = useState<ProfileDetailResponse | null>(null);
  const [triageData, setTriageData] = useState<TriageResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // 1. Initial Load: Check health and fetch available profiles
  useEffect(() => {
    let isMounted = true;
    api
      .getHealth()
      .then((health) => {
        if (isMounted && health.status === 'ok') {
          setIsBackendConnected(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsBackendConnected(false);
          setApiError('VULTRA FastAPI backend is currently unreachable at http://127.0.0.1:8000 (or 8001).');
        }
      });

    api
      .getProfiles()
      .then((res) => {
        if (isMounted && res.profiles.length > 0) {
          setProfiles(res.profiles);
          setSelectedOrgId(res.profiles[0].profile_id);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setApiError(err.message || 'Failed to load organisation profiles.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Triage & Profile Detail whenever active profile changes
  const fetchTriageForOrg = useCallback((orgId: string) => {
    setIsLoading(true);
    setApiError(null);

    Promise.all([
      api.getProfileDetail(orgId),
      api.getTriage(orgId),
    ])
      .then(([detail, triage]) => {
        setProfileDetail(detail);
        setTriageData(triage);
        setIsBackendConnected(true);
      })
      .catch((err) => {
        setApiError(err.message || `Failed to fetch analysis for organisation ${orgId}.`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      fetchTriageForOrg(selectedOrgId);
    }
  }, [selectedOrgId, fetchTriageForOrg]);

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Persistent Navigation Shell */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        isBackendConnected={isBackendConnected}
        selectedOrgId={selectedOrgId}
      />

      {/* Backend Offline Warning Banner */}
      {!isBackendConnected && (
        <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2.5 text-center text-xs text-rose-300 flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>
            FastAPI backend is offline. Run <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-white">python -m uvicorn backend.main:app --port 8000</code> to connect.
          </span>
        </div>
      )}

      {/* Main Dynamic Content Area with AnimatePresence */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'command' && (
            <CommandCenterView
              key="command"
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={handleSelectOrg}
              profileDetail={profileDetail}
              triageSummary={triageData ? triageData.summary : null}
              onGoToTriage={() => setCurrentView('triage')}
              onGoToWhyNot={() => setCurrentView('whynot')}
              onGoToCompare={() => setCurrentView('compare')}
              isLoading={isLoading}
            />
          )}

          {currentView === 'triage' && (
            <TriageView
              key="triage"
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={handleSelectOrg}
              triage={triageData}
              isLoading={isLoading}
              error={apiError}
              onRefresh={() => fetchTriageForOrg(selectedOrgId)}
            />
          )}

          {currentView === 'compare' && (
            <CompareView
              key="compare"
              profiles={profiles}
            />
          )}

          {currentView === 'whynot' && (
            <WhyNotView
              key="whynot"
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={handleSelectOrg}
            />
          )}

          {currentView === 'methodology' && (
            <MethodologyView
              key="methodology"
            />
          )}
        </AnimatePresence>
      </main>

      {/* Enterprise Forensic Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span>VULTRA v1.0 • Personalised Vulnerability Decision Intelligence</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Deterministic Scoring</span>
            <span>•</span>
            <span>Zero External API Dependency</span>
            <span>•</span>
            <span>Defensive Cyber Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
