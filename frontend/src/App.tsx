import React, { useState, useEffect, useCallback } from 'react';
import { NavView, Navbar } from './components/Navbar';
import { CommandCenterView } from './views/CommandCenterView';
import { TriageView } from './views/TriageView';
import { InventoryView } from './views/InventoryView';
import { RemediationView } from './views/RemediationView';
import { CompareView } from './views/CompareView';
import { WhyNotView } from './views/WhyNotView';
import { MethodologyView } from './views/MethodologyView';
import { RegisterOrganizationModal } from './components/RegisterOrganizationModal';
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
  const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false);

  // 1. Initial Load: Check health and fetch available profiles
  const refreshProfilesList = useCallback(async () => {
    try {
      const res = await api.getProfiles();
      if (res.profiles.length > 0) {
        setProfiles(res.profiles);
        return res.profiles;
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to load organisation profiles.');
    }
    return [];
  }, []);

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
          setApiError('VULTRA FastAPI backend is currently unreachable.');
        }
      });

    refreshProfilesList().then((loadedProfiles) => {
      if (isMounted && loadedProfiles.length > 0) {
        setSelectedOrgId((prev) => prev || loadedProfiles[0].profile_id);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [refreshProfilesList]);

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

  const handleOrganizationRegistered = async (newOrgId: string) => {
    await refreshProfilesList();
    setSelectedOrgId(newOrgId);
    setCurrentView('triage');
    fetchTriageForOrg(newOrgId);
  };

  return (
    <div className="min-h-screen bg-[#111318] text-[#F5F7FA] flex flex-col font-sans selection:bg-[#00E5FF] selection:text-[#0c0e12] overflow-x-hidden">
      {/* Fixed Top Editorial Navigation */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        isBackendConnected={isBackendConnected}
        selectedOrgId={selectedOrgId}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {/* Backend Offline Warning Banner */}
      {!isBackendConnected && (
        <div className="mt-16 bg-[#FF3B30]/15 border-b border-[#FF3B30]/30 px-4 py-2 text-center text-xs text-[#ffb4ab] flex items-center justify-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#FF3B30] shrink-0" />
          <span>
            FastAPI backend is offline. Run <code className="bg-[#0c0e12] px-1.5 py-0.5 font-mono text-[#F5F7FA]">python -m uvicorn backend.main:app --port 8000</code> to connect.
          </span>
        </div>
      )}

      {/* Main Structural Canvas */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 md:px-10 pt-24 pb-16">
        <AnimatePresence mode="wait">
          {currentView === 'command' && (
            <CommandCenterView
              key="command"
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={handleSelectOrg}
              onOpenRegister={() => setIsRegisterOpen(true)}
              profileDetail={profileDetail}
              triageSummary={triageData ? triageData.summary : null}
              onGoToTriage={() => setCurrentView('triage')}
              onGoToWhyNot={() => setCurrentView('whynot')}
              onGoToCompare={() => setCurrentView('compare')}
              onGoToInventory={() => setCurrentView('inventory')}
              onGoToRemediation={() => setCurrentView('remediation')}
              isLoading={isLoading}
            />
          )}

          {currentView === 'triage' && (
            <TriageView
              key="triage"
              profiles={profiles}
              selectedOrgId={selectedOrgId}
              onSelectOrg={handleSelectOrg}
              onOpenRegister={() => setIsRegisterOpen(true)}
              triage={triageData}
              isLoading={isLoading}
              error={apiError}
              onRefresh={() => fetchTriageForOrg(selectedOrgId)}
              onGoToCompare={() => setCurrentView('compare')}
              onNavigateToRemediation={() => setCurrentView('remediation')}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryView
              key="inventory"
              selectedProfileId={selectedOrgId}
              onNavigateToTriage={() => setCurrentView('triage')}
            />
          )}

          {currentView === 'remediation' && (
            <RemediationView
              key="remediation"
              selectedProfileId={selectedOrgId}
              onNavigateToTriage={() => setCurrentView('triage')}
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

      {/* Register Organisation Modal */}
      <RegisterOrganizationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onOrganizationRegistered={handleOrganizationRegistered}
      />

      {/* Editorial Footer */}
      <footer className="border-t border-[#1E2530] bg-[#0c0e12] mt-auto">
        <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#606D7A] font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-[#bac9cc]">VULTRA • Cyber Intelligence Editorial</span>
          </div>
          <div className="flex items-center gap-4 text-[#606D7A]">
            <span>Deterministic Scoring</span>
            <span>•</span>
            <span>Zero External API Dependency</span>
            <span>•</span>
            <span>Level 0 Sharp Geometry</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
